const router = require('express').Router()
const pool = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')

// GET /api/admin/overview
router.get('/overview', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const [usersRes, completionRes, avgXpRes, notStartedRes, deptRes, activityRes] = await Promise.all([
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
            pool.query(`
                SELECT ROUND(AVG(COALESCE(u.xp, 0))) as avg
                FROM users u
            `),
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
        res.status(500).json({ message: 'Server error' })
    }
})

// GET /api/admin/recent-activity
router.get('/recent-activity', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
    const parsedLimit = Number(req.query.limit)
    const limit = Number.isInteger(parsedLimit)
        ? Math.min(Math.max(parsedLimit, 1), 50)
        : 8

    try {
        const result = await pool.query(
            `SELECT
                ROW_NUMBER() OVER (ORDER BY activity.created_at DESC)::int AS id,
                activity.type,
                activity.icon,
                activity.user_name AS "userName",
                activity.action,
                activity.created_at AS "createdAt"
             FROM (
                SELECT
                    cp.completed_at AS created_at,
                    'chapter'::text AS type,
                    CASE
                        WHEN cp.ending = 'good' THEN '🏆'
                        WHEN cp.ending = 'bad' THEN '⚠️'
                        ELSE '✅'
                    END AS icon,
                    COALESCE(u.display_name, u.name, 'Unknown User') AS user_name,
                    CASE
                        WHEN cp.ending = 'good' THEN 'Completed chapter ' || cp.chapter_id || ' with good ending'
                        WHEN cp.ending = 'bad' THEN 'Completed chapter ' || cp.chapter_id || ' (bad ending)'
                        ELSE 'Completed chapter ' || cp.chapter_id
                    END AS action
                FROM chapter_progress cp
                JOIN users u ON u.id = cp.user_id
                WHERE cp.completed = TRUE
                  AND cp.completed_at IS NOT NULL

                UNION ALL

                SELECT
                    ep.completed_at AS created_at,
                    'elearning'::text AS type,
                    '🎓'::text AS icon,
                    COALESCE(u.display_name, u.name, 'Unknown User') AS user_name,
                    'Completed e-learning: ' || COALESCE(el.title, 'Lesson ' || ep.lesson_id::text) AS action
                FROM elearning_progress ep
                JOIN users u ON u.id = ep.user_id
                LEFT JOIN elearning_lessons el ON el.id = ep.lesson_id
                WHERE ep.completed = TRUE
                  AND ep.completed_at IS NOT NULL

                UNION ALL

                SELECT
                    ub.earned_at AS created_at,
                    'badge'::text AS type,
                    COALESCE(b.icon, '🏅') AS icon,
                    COALESCE(u.display_name, u.name, 'Unknown User') AS user_name,
                    'Earned badge: ' || COALESCE(b.name, 'Unknown badge') AS action
                FROM user_badges ub
                JOIN users u ON u.id = ub.user_id
                JOIN badges b ON b.id = ub.badge_id
                WHERE ub.badge_id IS NOT NULL
                  AND ub.earned_at IS NOT NULL

                UNION ALL

                SELECT
                    n.created_at AS created_at,
                    'broadcast'::text AS type,
                    '📣'::text AS icon,
                    COALESCE(creator.display_name, creator.name, 'Admin') AS user_name,
                    'Broadcast: ' ||
                        CASE
                            WHEN LENGTH(COALESCE(n.message, '')) > 100 THEN LEFT(n.message, 100) || '...'
                            ELSE COALESCE(n.message, '')
                        END AS action
                FROM notifications n
                LEFT JOIN users creator ON creator.id = n.created_by
                WHERE n.created_at IS NOT NULL
             ) activity
             ORDER BY activity.created_at DESC
             LIMIT $1`,
            [limit]
        )

        res.json(result.rows)
    } catch (err) {
        console.error('GET /api/admin/recent-activity error:', err)
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
            io.to('admin-activity').emit('admin-activity-updated', {
                source: 'broadcast',
                at: new Date().toISOString(),
            })
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
                u.id,
                u.nik,
                COALESCE(u.display_name, u.name) as name,
                u.department,
                COALESCE(u.xp, 0)::int as xp,
        COUNT(cp.id) FILTER (WHERE cp.completed) as chapters_completed
      FROM users u
      LEFT JOIN chapter_progress cp ON cp.user_id = u.id
            GROUP BY u.id
            ORDER BY chapters_completed DESC, COALESCE(u.xp, 0) DESC
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

router.put('/deleteLesson', requireAuth, requireRole('admin'), async (req, res) => {
    const { lessonId, isActive } = req.body
    const parsedLessonId = Number(lessonId)

    if (!Number.isInteger(parsedLessonId) || parsedLessonId <= 0) {
        return res.status(400).json({ message: 'Invalid lessonId' })
    }

    try {
        const explicitActive = typeof isActive === 'boolean' ? isActive : null
        const result = await pool.query(
            `UPDATE elearning_lessons
             SET is_active = COALESCE($2::boolean, NOT is_active),
                 updated_at = NOW()
             WHERE id = $1
             RETURNING id, is_active`,
            [parsedLessonId, explicitActive]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Lesson not found' })
        }

        res.json({
            message: `Lesson berhasil ${result.rows[0].is_active ? 'diaktifkan' : 'dinonaktifkan'}`,
            lesson: result.rows[0],
        })
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

router.put('/deleteChapter', requireAuth, requireRole('admin'), async (req, res) => {
    const { chapterId } = req.body
    try {
        await pool.query('UPDATE chapters SET is_active = FALSE WHERE id = $1', [chapterId])
        res.json({ message: 'Chapter deleted successfully.' })
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})
module.exports = router
