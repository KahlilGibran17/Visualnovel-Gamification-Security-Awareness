const router = require('express').Router()
const pool = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')

const SUPER_ADMIN_ROLE = 'super-admin'
const ADMIN_ROLE = 'admin'
const EMPLOYEE_ROLE = 'employee'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/superAdmin/dashboard — statistik ringkas
// ─────────────────────────────────────────────────────────────────────────────
router.get('/dashboard', requireAuth, requireRole(SUPER_ADMIN_ROLE), async (_req, res) => {
    try {
        const [totalAdminRes, totalEmployeeRes] = await Promise.all([
            pool.query(`
                SELECT COUNT(*)::int AS total
                FROM users u JOIN roles r ON r.id = u.role_id
                WHERE r.name = $1
            `, [ADMIN_ROLE]),
            pool.query(`
                SELECT COUNT(*)::int AS total
                FROM users u JOIN roles r ON r.id = u.role_id
                WHERE r.name = $1
            `, [EMPLOYEE_ROLE]),
        ])

        res.json({
            totalAdmins: Number(totalAdminRes.rows[0]?.total) || 0,
            totalEmployees: Number(totalEmployeeRes.rows[0]?.total) || 0,
        })
    } catch (err) {
        console.error('GET /api/superAdmin/dashboard error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/superAdmin/admins — daftar semua admin
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admins', requireAuth, requireRole(SUPER_ADMIN_ROLE), async (_req, res) => {
    try {
        const result = await pool.query(`
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
        `, [ADMIN_ROLE])

        res.json({ admins: result.rows })
    } catch (err) {
        console.error('GET /api/superAdmin/admins error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/superAdmin/employees — daftar karyawan (non-admin) untuk dropdown
// ─────────────────────────────────────────────────────────────────────────────
router.get('/employees', requireAuth, requireRole(SUPER_ADMIN_ROLE), async (_req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                u.id,
                u.nik,
                COALESCE(u.display_name, u.name) AS name,
                u.department,
                u.position
            FROM users u
            JOIN roles r ON r.id = u.role_id
            WHERE r.name = $1
            ORDER BY u.name ASC
        `, [EMPLOYEE_ROLE])

        res.json({ employees: result.rows })
    } catch (err) {
        console.error('GET /api/superAdmin/employees error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/superAdmin/admins/promote — ubah role karyawan → admin
// Body: { userId: number }
// ─────────────────────────────────────────────────────────────────────────────
router.put('/admins/promote', requireAuth, requireRole(SUPER_ADMIN_ROLE), async (req, res) => {
    const userId = parseInt(req.body?.userId)
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: 'userId wajib diisi' })
    }

    try {
        // Cari role_id admin
        const roleRes = await pool.query(
            'SELECT id FROM roles WHERE name = $1 LIMIT 1', [ADMIN_ROLE]
        )
        if (roleRes.rows.length === 0) {
            return res.status(500).json({ message: 'Role admin belum dikonfigurasi' })
        }
        const adminRoleId = roleRes.rows[0].id

        // Cek user ada dan bukan super-admin
        const userRes = await pool.query(`
            SELECT u.id, u.nik, COALESCE(u.display_name, u.name) AS name, r.name AS role
            FROM users u JOIN roles r ON r.id = u.role_id
            WHERE u.id = $1
        `, [userId])

        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan' })
        }

        const user = userRes.rows[0]
        if (user.role === SUPER_ADMIN_ROLE) {
            return res.status(400).json({ message: 'Tidak bisa mengubah role super-admin' })
        }
        if (user.role === ADMIN_ROLE) {
            return res.status(400).json({ message: 'User sudah menjadi admin' })
        }

        // Update role
        await pool.query('UPDATE users SET role_id = $1, updated_at = NOW() WHERE id = $2', [adminRoleId, userId])

        res.json({
            message: `${user.name} berhasil dijadikan admin`,
            admin: { id: user.id, nik: user.nik, name: user.name },
        })
    } catch (err) {
        console.error('PUT /api/superAdmin/admins/promote error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/superAdmin/admins/:id/demote — ubah role admin → employee
// ─────────────────────────────────────────────────────────────────────────────
router.put('/admins/:id/demote', requireAuth, requireRole(SUPER_ADMIN_ROLE), async (req, res) => {
    const userId = parseInt(req.params.id)
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: 'ID tidak valid' })
    }

    try {
        const roleRes = await pool.query(
            'SELECT id FROM roles WHERE name = $1 LIMIT 1', [EMPLOYEE_ROLE]
        )
        if (roleRes.rows.length === 0) {
            return res.status(500).json({ message: 'Role employee belum dikonfigurasi' })
        }
        const employeeRoleId = roleRes.rows[0].id

        const userRes = await pool.query(`
            SELECT u.id, COALESCE(u.display_name, u.name) AS name, r.name AS role
            FROM users u JOIN roles r ON r.id = u.role_id
            WHERE u.id = $1
        `, [userId])

        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan' })
        }

        const user = userRes.rows[0]
        if (user.role !== ADMIN_ROLE) {
            return res.status(400).json({ message: 'User bukan admin' })
        }

        await pool.query('UPDATE users SET role_id = $1, updated_at = NOW() WHERE id = $2', [employeeRoleId, userId])

        res.json({ message: `${user.name} dikembalikan ke role employee` })
    } catch (err) {
        console.error('PUT /api/superAdmin/admins/:id/demote error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

module.exports = router
