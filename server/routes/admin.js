const router = require('express').Router()
const pool = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')

// GET /api/admin/overview
router.get('/overview', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const [usersRes, completionRes, avgXpRes, notStartedRes, deptRes, activityRes] = await Promise.all([
            pool.query('SELECT COUNT(*) as total FROM users'),
            pool.query('SELECT COUNT(DISTINCT user_id) as completed FROM chapter_progress WHERE chapter_id = 6 AND completed = TRUE'),
            pool.query('SELECT ROUND(AVG(xp)) as avg FROM users'),
            pool.query('SELECT COUNT(*) as total FROM users u WHERE NOT EXISTS (SELECT 1 FROM chapter_progress cp WHERE cp.user_id = u.id)'),
            pool.query(`
                SELECT 
                    department as dept, 
                    COUNT(*) as total,
                    COUNT(DISTINCT u.id) FILTER (WHERE EXISTS (SELECT 1 FROM chapter_progress cp WHERE cp.user_id = u.id AND cp.completed = TRUE)) as completed_count,
                    ROUND(AVG(xp)) as avg_xp
                FROM users u
                WHERE department IS NOT NULL
                GROUP BY department
            `),
            pool.query(`
                SELECT * FROM (
                    (SELECT u.name as user_name, 'Completed Chapter ' || chapter_id as action, completed_at as time, '✅' as icon
                     FROM chapter_progress cp JOIN users u ON cp.user_id = u.id
                     WHERE completed = TRUE ORDER BY completed_at DESC LIMIT 10)
                    UNION ALL
                    (SELECT u.name as user_name, 'Earned badge: ' || b.name as action, earned_at as time, b.icon as icon
                     FROM user_badges ub JOIN users u ON ub.user_id = u.id JOIN badges b ON ub.badge_id = b.id
                     ORDER BY earned_at DESC LIMIT 10)
                ) as combined
                ORDER BY time DESC LIMIT 10
            `)
        ])

        res.json({
            totalUsers: parseInt(usersRes.rows[0].total),
            completedAll: parseInt(completionRes.rows[0].completed),
            avgXp: parseInt(avgXpRes.rows[0].avg) || 0,
            notStarted: parseInt(notStartedRes.rows[0].total),
            deptStats: deptRes.rows.map(d => ({
                dept: d.dept,
                total: parseInt(d.total),
                completed: parseInt(d.completed_count),
                avgXp: parseInt(d.avg_xp)
            })),
            recentActivity: activityRes.rows.map(a => ({
                user: a.user_name,
                action: a.action,
                time: a.time,
                icon: a.icon
            }))
        })
    } catch (err) {
        console.error('[Admin Overview Error]', err)
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

// GET /api/admin/users
router.get('/users', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id, u.nik, u.name, u.email, u.department, u.position, u.role_id, 
                u.avatar_id, u.xp,
                (SELECT level FROM game_levels WHERE xp_required <= u.xp ORDER BY level DESC LIMIT 1) as level,
                (SELECT COUNT(*) FROM chapter_progress cp WHERE cp.user_id = u.id AND cp.completed = TRUE) as chapters_completed
            FROM users u
            ORDER BY u.id DESC
        `)
        res.json(result.rows)
    } catch (err) {
        console.error('[Admin Users Error]', err)
        res.status(500).json({ message: 'Server error' })
    }
})

module.exports = router
