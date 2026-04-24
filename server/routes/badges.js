const router = require('express').Router()
const path   = require('path')
const fs     = require('fs')
const multer = require('multer')
const pool   = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')


router.get('/getBadges',requireAuth, async (req, res) => {
    try {
        const badgesResult = await pool.query(
            `SELECT badge_key AS id, name, icon, description AS desc, color FROM badges`,
        )
        res.json({ badges: badgesResult.rows })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

router.post('/postBadgeUser', requireAuth, async (req, res) => {
    const { badge_key } = req.body
    const user_id = req.user?.userId ?? req.user?.id

    if (!user_id) {
        return res.status(401).json({ message: 'Unauthorized user context' })
    }

    try {
        // 1. Cari badge_id dari badge_key
        const badgeResult = await pool.query(
            `SELECT id FROM badges WHERE badge_key = $1`,
            [badge_key]
        )

        if (badgeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Badge not found' })
        }

        const badge_id = badgeResult.rows[0].id

        // 2. Insert idempotent (aman dari request ganda/race condition)
        const result = await pool.query(
            `INSERT INTO user_badges (user_id, badge_id, xp, streak, earned_at)
             VALUES (
                $1,
                $2,
                (SELECT COALESCE(MAX(xp), 0) FROM user_badges WHERE user_id = $1),
                (SELECT COALESCE(MAX(streak), 1) FROM user_badges WHERE user_id = $1),
                NOW()
             )
             ON CONFLICT (user_id, badge_id) DO NOTHING
             RETURNING *`,
            [user_id, badge_id]
        )

        if (result.rows.length === 0) {
            return res.json({ message: 'Badge already awarded', alreadyEarned: true })
        }

        const io = req.app.get('io')
        if (io) {
            io.to('admin-activity').emit('admin-activity-updated', {
                source: 'badge-earned',
                userId: user_id,
                badgeKey: badge_key,
                at: new Date().toISOString(),
            })
        }

        res.json({ message: 'Badge awarded successfully', userBadge: result.rows[0] })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

router.get('/getBadgesByCategory', requireAuth, async (req, res) => {
    try {
        const badgesResult = await pool.query(
            `SELECT 
                b.badge_key AS id,
                b.name, 
                b.icon, 
                b.description AS desc,
                b.color,
                c.category_name
             FROM badges b
             LEFT JOIN category_badge c ON b.category_id = c.category_id
             ORDER BY b.category_id, b.id`
        )
        res.json({ badges: badgesResult.rows })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

router.get('/getLevelBadges', requireAuth, async (req, res) => {
    try {
        const levelResult = await pool.query(
            `SELECT * FROM level_badge`
        )
        res.json({ levelBadges: levelResult.rows })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})
router.get('/getLeaderBoard', requireAuth, async (req, res) => {
    try {
        const leaderboardResult = await pool.query()
        
    }catch(err){
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
    
})

router.get('/getUserBadges', requireAuth, async (req, res) => {
    try {
        console.log('req.user:', req.user) // <-- tambah ini
        
        const userId = req.user.id
        const result = await pool.query(
            `SELECT b.badge_key AS id, b.name, b.icon, b.description AS desc, b.color
             FROM user_badges ub
             JOIN badges b ON b.id = ub.badge_id
             WHERE ub.user_id = $1`,
            [userId]
        )
        res.json({ badges: result.rows })
    } catch (err) {
        console.error('Error detail:', err.message) // <-- dan ini
        res.status(500).json({ message: 'Server error' })
    }
})

router.get('/getChapterProgress', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const completed = await pool.query(
            `SELECT COUNT(*) FROM chapter_progress WHERE user_id = $1 AND completed = true`,
            [userId]
        )
        const total = await pool.query(
            `SELECT COUNT(*) FROM chapters`
        )
        res.json({ 
            completed: parseInt(completed.rows[0].count),
            total: parseInt(total.rows[0].count)
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

module.exports = router