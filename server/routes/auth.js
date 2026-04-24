const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db/pool')
const { isSunfishEnabled, validateLogin, fetchEmployee } = require('../services/sunfish')

const SECRET = process.env.JWT_SECRET || 'akebono_dev_secret'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const buildUserPayload = (user, badgeKeys, streak) => ({
    id:               user.id,
    nik:              user.nik,
    name:             user.display_name || user.name,
    department:       user.department,
    position:         user.position,
    role:             user.role,
    xp:               user.xp,
    avatarId:         user.avatar_id,
    setupDone:        user.setup_done,
    streak:           streak,
    badges:           badgeKeys,
    chaptersCompleted: 0,
})

const updateLoginMeta = async (userId, currentStreak, lastLogin) => {
    const today     = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const lastStr   = lastLogin ? new Date(lastLogin).toDateString() : null

    const newStreak = lastStr === yesterday ? currentStreak + 1
        : lastStr === today ? currentStreak
        : 1

    await pool.query('UPDATE users SET last_login = NOW(), streak = $1 WHERE id = $2', [newStreak, userId])

    // XP harian login (hanya jika belum login hari ini)
    if (lastStr !== today) {
        await pool.query('UPDATE users SET xp = xp + 25 WHERE id = $1', [userId])
    }

    return newStreak
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    let { nik, password } = req.body
    if (!nik || !password) {
        return res.status(400).json({ message: 'NPK dan kata sandi wajib diisi' })
    }

    nik = nik.trim()

    try {
        // ══════════════════════════════════════════════════════════════════════
        // MODE SUNFISH — diaktifkan jika SUNFISH_AUTH_URL diisi di .env
        // ══════════════════════════════════════════════════════════════════════
        if (isSunfishEnabled()) {
            console.log(`[Auth] Attempting Sunfish login for NPK: ${nik}`)

            // ── STEP 1: Validasi login ke Sunfish ──────────────────────────
            let authResult
            try {
                authResult = await validateLogin(nik, password)
            } catch (sunfishErr) {
                console.error(`[Auth] Sunfish connection error for NPK ${nik}:`, sunfishErr.message)
                return res.status(503).json({ message: sunfishErr.message })
            }

            if (!authResult.valid) {
                console.warn(`[Auth] Sunfish login rejected for NPK: ${nik} - Reason: ${authResult.message}`)
                return res.status(401).json({ message: authResult.message || 'NPK atau kata sandi salah' })
            }

            console.log(`[Auth] Sunfish login successful for NPK: ${nik}`)

            // ── STEP 2: Ambil data karyawan dari Sunfish ───────────────────
            const employeeData = await fetchEmployee(nik)
            const sunfishName  = employeeData?.name       || nik
            const sunfishDept  = employeeData?.department || 'Umum'
            const sunfishPos   = employeeData?.position   || 'Karyawan'

            // ── Cari / buat user di database lokal ────────────────────────
            let userRow
            const existing = await pool.query(
                `SELECT u.*, r.name as role FROM users u
                 JOIN roles r ON u.role_id = r.id
                 WHERE u.nik = $1`,
                [nik]
            )

            if (existing.rows.length > 0) {
                userRow = existing.rows[0]
                await pool.query(
                    `UPDATE users SET name = $1, department = $2, position = $3 WHERE nik = $4`,
                    [sunfishName, sunfishDept, sunfishPos, nik]
                )
                userRow.name       = sunfishName
                userRow.department = sunfishDept
                userRow.position   = sunfishPos
            } else {
                console.log(`[Auth] Auto-registering new Sunfish user: ${nik}`)
                const defaultRoleRes = await pool.query(`SELECT id FROM roles WHERE name = 'employee' LIMIT 1`)
                const roleId = defaultRoleRes.rows[0]?.id || 1

                const crypto = require('crypto')
                const placeholderHash = '$2a$12$' + crypto.randomBytes(22).toString('base64').slice(0, 53)

                const inserted = await pool.query(
                    `INSERT INTO users (nik, name, department, position, role_id, xp, setup_done, password_hash, created_at)
                     VALUES ($1, $2, $3, $4, $5, 0, false, $6, NOW())
                     RETURNING *`,
                    [nik, sunfishName, sunfishDept, sunfishPos, roleId, placeholderHash]
                )
                userRow = { ...inserted.rows[0], role: 'employee' }
            }

            const streak = await updateLoginMeta(userRow.id, userRow.streak || 0, userRow.last_login)
            const badgesRes = await pool.query(
                `SELECT b.badge_key FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.user_id = $1`,
                [userRow.id]
            )

            const token = jwt.sign(
                { userId: userRow.id, nik: userRow.nik, role: userRow.role },
                SECRET,
                { expiresIn: '7d' }
            )

            return res.json({
                token,
                user: buildUserPayload(userRow, badgesRes.rows.map(b => b.badge_key), streak),
            })
        }

        // ══════════════════════════════════════════════════════════════════════
        // MODE LOKAL — fallback jika Sunfish tidak dikonfigurasi
        // ══════════════════════════════════════════════════════════════════════
        console.log(`[Auth] Attempting local login for NPK: ${nik}`)

        const result = await pool.query(
            `SELECT u.*, r.name as role FROM users u
             JOIN roles r ON u.role_id = r.id
             WHERE u.nik = $1`,
            [nik]
        )

        if (result.rows.length === 0) {
            console.warn(`[Auth] Local login failed: NPK ${nik} not found`)
            return res.status(401).json({ message: 'NPK atau kata sandi salah' })
        }

        const user  = result.rows[0]
        const match = await bcrypt.compare(password, user.password_hash)
        if (!match) {
            console.warn(`[Auth] Local login failed: Password mismatch for NPK ${nik}`)
            return res.status(401).json({ message: 'NPK atau kata sandi salah' })
        }

        console.log(`[Auth] Local login successful for NPK: ${nik}`)

        const streak = await updateLoginMeta(user.id, user.streak || 0, user.last_login)
        const badgesRes = await pool.query(
            `SELECT b.badge_key FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.user_id = $1`,
            [user.id]
        )

        const token = jwt.sign(
            { userId: user.id, nik: user.nik, role: user.role },
            SECRET,
            { expiresIn: '7d' }
        )

        return res.json({
            token,
            user: buildUserPayload(user, badgesRes.rows.map(b => b.badge_key), streak),
        })

    } catch (err) {
        console.error('[Auth] Unexpected login error:', err)
        res.status(500).json({ message: 'Terjadi kesalahan pada server. Silakan coba lagi.' })
    }
})

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    const { nik } = req.body
    try {
        const result = await pool.query('SELECT email, name FROM users WHERE nik = $1', [nik])
        if (result.rows.length === 0) {
            return res.json({ message: 'Jika NPK ini terdaftar, tautan reset telah dikirimkan.' })
        }
        // In production: send email via nodemailer
        res.json({ message: 'Tautan reset telah dikirimkan ke email perusahaan Anda.' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' })
    }
})

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body
    try {
        const payload = jwt.verify(token, SECRET)
        const hash    = await bcrypt.hash(newPassword, 12)
        await pool.query('UPDATE users SET password_hash = $1 WHERE nik = $2', [hash, payload.nik])
        res.json({ message: 'Kata sandi berhasil diatur ulang.' })
    } catch (err) {
        res.status(400).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' })
    }
})

module.exports = router
