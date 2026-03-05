const router = require('express').Router()
const pool = require('../db/pool')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const xlsx = require('xlsx')
const { requireAuth, requireRole } = require('../middleware/auth')

const upload = multer({ storage: multer.memoryStorage() })

// GET /api/users/me
router.get('/me', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.*, r.name as role FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
            [req.user.userId]
        )
        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' })

        const user = result.rows[0]
        const badgesResult = await pool.query(
            `SELECT b.badge_key FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.user_id = $1`,
            [user.id]
        )
        const progressResult = await pool.query(
            `SELECT chapter_id FROM chapter_progress WHERE user_id = $1 AND completed = TRUE`,
            [user.id]
        )

        res.json({
            id: user.id,
            nik: user.nik,
            name: user.display_name || user.name,
            department: user.department,
            position: user.position,
            role: user.role,
            xp: user.xp,
            avatarId: user.avatar_id,
            setupDone: user.setup_done,
            streak: user.streak,
            badges: badgesResult.rows.map(b => b.badge_key),
            chaptersCompleted: progressResult.rows.length,
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

// PUT /api/users/me
router.put('/me', requireAuth, async (req, res) => {
    const { displayName, avatarId } = req.body
    try {
        await pool.query(
            'UPDATE users SET display_name = $1, avatar_id = $2, setup_done = TRUE, updated_at = NOW() WHERE id = $3',
            [displayName, avatarId, req.user.userId]
        )
        res.json({ message: 'Profile updated' })
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// GET /api/admin/users (admin/manager only)
router.get('/admin', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.id, u.nik, u.name, u.display_name, u.department, u.position, u.xp, u.streak,
              r.name as role,
              COUNT(cp.id) FILTER (WHERE cp.completed) as chapters_completed
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN chapter_progress cp ON cp.user_id = u.id
       GROUP BY u.id, r.name
       ORDER BY u.xp DESC`
        )
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/admin/users/import — bulk CSV/Excel import
router.post('/admin/import', requireAuth, requireRole('admin'), upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    try {
        const wb = xlsx.read(req.file.buffer, { type: 'buffer' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = xlsx.utils.sheet_to_json(ws)

        let imported = 0
        const errors = []

        for (const row of rows) {
            const nik = String(row.NIK || row.nik || '').trim()
            const name = row['Full Name'] || row.name || ''
            const dept = row.Department || row.department || ''
            const position = row.Position || row.position || ''
            const email = row.Email || row.email || ''
            const initPass = row['Initial Password'] || row.password || 'Welcome@2026'

            if (!nik || !name) {
                errors.push({ nik, error: 'Missing NIK or name' })
                continue
            }

            try {
                const hash = await bcrypt.hash(initPass, 10)
                await pool.query(
                    `INSERT INTO users (nik, name, email, department, position, password_hash, role_id)
           VALUES ($1, $2, $3, $4, $5, $6, 1)
           ON CONFLICT (nik) DO UPDATE SET name = $2, department = $4, position = $5`,
                    [nik, name, email, dept, position, hash]
                )
                imported++
            } catch (innerErr) {
                errors.push({ nik, error: innerErr.message })
            }
        }

        res.json({ message: `Imported ${imported} employees`, imported, errors })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Failed to process file', error: err.message })
    }
})

// PUT /api/admin/users/:id/reset-password
router.put('/admin/:id/reset-password', requireAuth, requireRole('admin'), async (req, res) => {
    const { newPassword } = req.body
    if (!newPassword) return res.status(400).json({ message: 'New password required' })
    try {
        const hash = await bcrypt.hash(newPassword, 12)
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id])
        res.json({ message: 'Password reset successfully' })
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

module.exports = router
