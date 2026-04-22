const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db/pool')

const SECRET = process.env.JWT_SECRET || 'akebono_dev_secret'

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { nik, password } = req.body
    if (!nik || !password) return res.status(400).json({ message: 'NIK and password required' })

    try {
        const result = await pool.query(
            `SELECT
                u.*, 
                r.name as role,
                COALESCE(ub_stats.xp, 0)::int as xp,
                COALESCE(ub_stats.streak, 1)::int as streak
             FROM users u
             JOIN roles r ON u.role_id = r.id
             LEFT JOIN (
                SELECT user_id, MAX(xp) AS xp, MAX(streak) AS streak
                FROM user_badges
                GROUP BY user_id
             ) ub_stats ON ub_stats.user_id = u.id
             WHERE u.nik = $1`,
            [nik]
        )

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid NIK or password' })
        }

        const user = result.rows[0]
        const match = await bcrypt.compare(password, user.password_hash)
        if (!match) return res.status(401).json({ message: 'Invalid NIK or password' })

        // Update last login & streak
        const today = new Date().toDateString()
        const lastLogin = user.last_login ? new Date(user.last_login).toDateString() : null
        const yesterday = new Date(Date.now() - 86400000).toDateString()
        const newStreak =
            lastLogin === today
                ? user.streak
                : lastLogin === yesterday
                    ? user.streak + 1
                    : 1

         await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])

        await pool.query(
            `WITH updated AS (
                UPDATE user_badges
                SET streak = $1,
                    xp = COALESCE(xp, 0)
                WHERE user_id = $2
                RETURNING id
            )
            INSERT INTO user_badges (user_id, badge_id, xp, streak, earned_at)
            SELECT $2, NULL, 0, $1, NOW()
            WHERE NOT EXISTS (SELECT 1 FROM updated)`,
            [newStreak, user.id]
        )


        // Get badges
        const badgesResult = await pool.query(
            `SELECT b.badge_key FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.user_id = $1`,
            [user.id]
        )

        const token = jwt.sign(
            { userId: user.id, nik: user.nik, role: user.role },
            SECRET,
            { expiresIn: '7d' }
        )

        res.json({
            token,
            user: {
                id: user.id,
                nik: user.nik,
                name: user.display_name || user.name,
                department: user.department,
                position: user.position,
                role: user.role,
                xp: user.xp,
                avatarId: user.avatar_id,
                setupDone: user.setup_done,
                streak: newStreak,
                badges: badgesResult.rows.map(b => b.badge_key),
                chaptersCompleted: 0,
            }
        })
    } catch (err) {
        console.error('Login error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { nik } = req.body
    try {
        const result = await pool.query('SELECT email, name FROM users WHERE nik = $1', [nik])
        if (result.rows.length === 0) {
            // Don't reveal whether user exists
            return res.json({ message: 'If this NIK exists, a reset link has been sent.' })
        }
        // In production: send email with nodemailer
        // const resetToken = jwt.sign({ nik }, SECRET, { expiresIn: '24h' })
        // await sendResetEmail(result.rows[0].email, resetToken)
        res.json({ message: 'Reset link sent to your company email.' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body
    try {
        const payload = jwt.verify(token, SECRET)
        const hash = await bcrypt.hash(newPassword, 12)
        await pool.query('UPDATE users SET password_hash = $1 WHERE nik = $2', [hash, payload.nik])
        res.json({ message: 'Password reset successfully.' })
    } catch (err) {
        res.status(400).json({ message: 'Invalid or expired reset token.' })
    }
})

module.exports = router
