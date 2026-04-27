const router = require('express').Router()
const bcrypt = require('bcryptjs')
const pool = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')

const SUPER_ADMIN_ROLE = 'super-admin'
const ADMIN_ROLE = 'admin'

const normalizeText = (value) => String(value ?? '').trim()

// GET /api/superAdmin/dashboard
router.get('/dashboard', requireAuth, requireRole(SUPER_ADMIN_ROLE), async (_req, res) => {
    try {
        const [totalRes, recentRes] = await Promise.all([
            pool.query(`
                SELECT COUNT(*)::int AS total
                FROM users u
                JOIN roles r ON r.id = u.role_id
                WHERE r.name = $1
            `, [ADMIN_ROLE]),
            pool.query(`
                SELECT
                    u.id,
                    u.nik,
                    COALESCE(u.display_name, u.name) AS name,
                    u.email,
                    u.department,
                    u.position,
                    u.created_at AS "createdAt"
                FROM users u
                JOIN roles r ON r.id = u.role_id
                WHERE r.name = $1
                ORDER BY u.created_at DESC
                LIMIT 10
            `, [ADMIN_ROLE]),
        ])

        res.json({
            totalAdmins: Number(totalRes.rows[0]?.total) || 0,
            recentAdmins: recentRes.rows,
        })
    } catch (err) {
        console.error('GET /api/superAdmin/dashboard error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/superAdmin/admins
router.post('/admins', requireAuth, requireRole(SUPER_ADMIN_ROLE), async (req, res) => {
    const nik = normalizeText(req.body?.nik)
    const name = normalizeText(req.body?.name)
    const password = normalizeText(req.body?.password)
    const email = normalizeText(req.body?.email)
    const department = normalizeText(req.body?.department)
    const position = normalizeText(req.body?.position)

    if (!nik || !name || !password) {
        return res.status(400).json({ message: 'NIK, name, and password are required' })
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    try {
        const roleRes = await pool.query(
            'SELECT id FROM roles WHERE name = $1 LIMIT 1',
            [ADMIN_ROLE]
        )

        if (roleRes.rows.length === 0) {
            return res.status(500).json({ message: 'Admin role is not configured in roles table' })
        }

        const adminRoleId = roleRes.rows[0].id
        const hash = await bcrypt.hash(password, 12)

        const createRes = await pool.query(
            `INSERT INTO users (
                nik,
                name,
                email,
                department,
                position,
                password_hash,
                role_id,
                avatar_id,
                display_name,
                setup_done,
                last_login,
                xp,
                streak,
                created_at,
                updated_at
            )
            VALUES (
                $1,
                $2,
                NULLIF($3, ''),
                NULLIF($4, ''),
                NULLIF($5, ''),
                $6,
                $7,
                1,
                $2,
                TRUE,
                NOW(),
                0,
                1,
                NOW(),
                NOW()
            )
            ON CONFLICT (nik) DO NOTHING
            RETURNING
                id,
                nik,
                name,
                email,
                department,
                position,
                created_at AS "createdAt"`,
            [nik, name, email, department, position, hash, adminRoleId]
        )

        if (createRes.rows.length === 0) {
            return res.status(409).json({ message: 'NIK already exists' })
        }

        res.status(201).json({
            message: 'Admin created successfully',
            admin: createRes.rows[0],
        })
    } catch (err) {
        console.error('POST /api/superAdmin/admins error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

module.exports = router
