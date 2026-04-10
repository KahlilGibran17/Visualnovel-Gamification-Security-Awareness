const router = require('express').Router()
const pool = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')

// GET /api/admin/overview
router.get('/overview', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const [usersRes, completionRes, avgXpRes] = await Promise.all([
            pool.query('SELECT COUNT(*) as total FROM users'),
            pool.query(`
                WITH chapter_total AS (
                    SELECT COUNT(*)::int AS total_chapters
                    FROM chapters
                ),
                user_completion AS (
                    SELECT
                        cp.user_id,
                        COUNT(DISTINCT cp.chapter_id)::int AS completed_chapters
                    FROM chapter_progress cp
                    WHERE cp.completed = TRUE
                    GROUP BY cp.user_id
                )
                SELECT COUNT(*)::int AS completed
                FROM user_completion uc
                CROSS JOIN chapter_total ct
                WHERE ct.total_chapters > 0
                  AND uc.completed_chapters >= ct.total_chapters
            `),
            pool.query('SELECT ROUND(AVG(xp)) as avg FROM users'),
        ])
        res.json({
            totalUsers: parseInt(usersRes.rows[0].total),
            completedAll: parseInt(completionRes.rows[0].completed),
            avgXp: parseInt(avgXpRes.rows[0].avg) || 0,
        })
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/admin/broadcast
router.post('/broadcast', requireAuth, requireRole('admin'), async (req, res) => {
    const { message, target = 'all' } = req.body
    try {
        await pool.query(
            'INSERT INTO notifications (message, target, created_by) VALUES ($1, $2, $3)',
            [message, target, req.user.userId]
        )
        const io = req.app.get('io')
        if (io) {
            io.emit('notification', { message, target })
        }
        res.json({ message: 'Notification sent!' })
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// GET /api/admin/compliance
router.get('/compliance', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        u.id, u.nik, COALESCE(u.display_name, u.name) as name, u.department, u.xp,
        COUNT(cp.id) FILTER (WHERE cp.completed) as chapters_completed
      FROM users u
      LEFT JOIN chapter_progress cp ON cp.user_id = u.id
      GROUP BY u.id
      ORDER BY chapters_completed DESC, u.xp DESC
    `)
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

module.exports = router
