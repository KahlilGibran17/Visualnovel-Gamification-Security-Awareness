const router = require('express').Router()
const pool = require('../db/pool')
const { requireAuth } = require('../middleware/auth')

// GET /api/leaderboard
router.get('/', requireAuth, async (req, res) => {
    const { filter, dept, chapter } = req.query

    let dateFilter = ''
    if (filter === 'weekly') dateFilter = "AND last_login >= NOW() - INTERVAL '7 days'"
    else if (filter === 'monthly') dateFilter = "AND last_login >= NOW() - INTERVAL '30 days'"

    let deptFilter = ''
    if (dept && dept !== 'all') deptFilter = `AND u.department = '${dept.replace(/'/g, "''")}'`

    try {
        const result = await pool.query(`
      SELECT
        u.id,
        u.nik,
        COALESCE(u.display_name, u.name) as name,
        u.department,
        u.xp,
        u.avatar_id as "avatarId",
        r.name as role,
        (SELECT COUNT(*) FROM chapter_progress cp WHERE cp.user_id = u.id AND cp.completed = TRUE) as "chaptersCompleted",
        RANK() OVER (ORDER BY u.xp DESC) as rank,
        CASE
          WHEN u.xp >= 6000 THEN 5
          WHEN u.xp >= 3000 THEN 4
          WHEN u.xp >= 1500 THEN 3
          WHEN u.xp >= 500 THEN 2
          ELSE 1
        END as level
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE 1=1 ${dateFilter} ${deptFilter}
      ORDER BY u.xp DESC
      LIMIT 100
    `)
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

// GET /api/leaderboard/departments
router.get('/departments', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        department as dept,
        COUNT(*) as members,
        ROUND(AVG(xp)) as "avgXp"
      FROM users
      WHERE department IS NOT NULL AND department != ''
      GROUP BY department
      ORDER BY "avgXp" DESC
    `)
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

module.exports = router
