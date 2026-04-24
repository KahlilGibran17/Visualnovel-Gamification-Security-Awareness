const router = require('express').Router()
const pool = require('../db/pool')
const { requireAuth } = require('../middleware/auth')

// GET /api/leaderboard
router.get('/', requireAuth, async (req, res) => {
  const { filter = 'all', dept = 'all' } = req.query
  const includeZeroXp = String(req.query.includeZeroXp).toLowerCase() === 'true'
  const whereConditions = []
  const values = []

  if (!includeZeroXp) {
    whereConditions.push('COALESCE(u.xp, 0) > 0')
  }

  if (filter === 'weekly') {
    whereConditions.push("u.last_login >= NOW() - INTERVAL '7 days'")
  } else if (filter === 'monthly') {
    whereConditions.push("u.last_login >= NOW() - INTERVAL '30 days'")
  }

  if (dept && dept !== 'all') {
    values.push(dept)
    whereConditions.push(`u.department = $${values.length}`)
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : ''

    try {
        const result = await pool.query(`
      SELECT
        u.id,
        u.nik,
        COALESCE(u.display_name, u.name) as name,
        u.department,
        COALESCE(u.xp, 0)::int as xp,
        u.avatar_id as "avatarId",
        r.name as role,
        (SELECT COUNT(*)::int FROM chapter_progress cp WHERE cp.user_id = u.id AND cp.completed = TRUE) as "chaptersCompleted",
        (RANK() OVER (ORDER BY COALESCE(u.xp, 0) DESC, u.id ASC))::int as rank,
        CASE
          WHEN COALESCE(u.xp, 0) >= 6000 THEN 5
          WHEN COALESCE(u.xp, 0) >= 3000 THEN 4
          WHEN COALESCE(u.xp, 0) >= 1500 THEN 3
          WHEN COALESCE(u.xp, 0) >= 500 THEN 2
          ELSE 1
        END as level
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY COALESCE(u.xp, 0) DESC, u.id ASC
      LIMIT 100
    `, values)
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
        COUNT(*)::int as members,
        COALESCE(ROUND(AVG(COALESCE(u.xp, 0)))::int, 0) as "avgXp"
      FROM users u
      WHERE u.department IS NOT NULL AND u.department != ''
      GROUP BY u.department
      ORDER BY "avgXp" DESC
    `)
        res.json(result.rows)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

module.exports = router
