const router = require('express').Router()
const pool = require('../db/pool')
const { requireAuth } = require('../middleware/auth')

// XP thresholds
const LEVELS = [
    { level: 1, xp: 0 },
    { level: 2, xp: 500 },
    { level: 3, xp: 1500 },
    { level: 4, xp: 3000 },
    { level: 5, xp: 6000 },
]

function getLevelFromXP(xp) {
    let level = 1
    for (const l of LEVELS) {
        if (xp >= l.xp) level = l.level
    }
    return level
}

// Badge unlock rules
const BADGE_RULES = {
    1: { good: 'phishing-hunter', perfect: true, bad: null },
    2: { good: 'tidy-desk', perfect: false, bad: null },
    3: { good: 'social-shield', perfect: false, bad: null },
    4: { good: 'password-master', perfect: true, bad: null },
    5: { good: 'first-responder', perfect: false, bad: null },
    6: { good: 'cyber-hero', perfect: false, bad: null },
}

// GET /api/progress
router.get('/', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM chapter_progress WHERE user_id = $1`,
            [req.user.userId]
        )
        const progress = {}
        result.rows.forEach(r => {
            progress[r.chapter_id] = {
                completed: r.completed,
                ending: r.ending,
                score: r.score,
                xpEarned: r.xp_earned,
                wrongChoices: r.wrong_choices,
            }
        })
        res.json(progress)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/progress/xp
router.post('/xp', requireAuth, async (req, res) => {
    const { amount, reason } = req.body
    try {
        await pool.query(
            `WITH updated AS (
                UPDATE user_badges
                SET xp = COALESCE(xp, 0) + $1,
                    streak = COALESCE(streak, 1)
                WHERE user_id = $2
                RETURNING id
            )
            INSERT INTO user_badges (user_id, badge_id, xp, streak, earned_at)
            SELECT $2, NULL, $1, 1, NOW()
            WHERE NOT EXISTS (SELECT 1 FROM updated)`,
            [amount, req.user.userId]
        )
        res.json({ message: 'XP awarded', amount })
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/progress/chapter/:id/complete
router.post('/chapter/:id/complete', requireAuth, async (req, res) => {
    const chapterId = parseInt(req.params.id)
    const { ending, xpEarned, perfect, score, wrongChoices = 0 } = req.body

    try {
        // Upsert progress
        await pool.query(
            `INSERT INTO chapter_progress (user_id, chapter_id, completed, ending, score, xp_earned, wrong_choices, completed_at)
       VALUES ($1, $2, TRUE, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, chapter_id) DO UPDATE
       SET completed = TRUE, ending = $3, score = $4, xp_earned = GREATEST(chapter_progress.xp_earned, $5),
           wrong_choices = $6, completed_at = NOW()`,
            [req.user.userId, chapterId, ending, score, xpEarned, wrongChoices]
        )

        // Award XP
        await pool.query(
            `WITH updated AS (
                UPDATE user_badges
                SET xp = COALESCE(xp, 0) + $1,
                    streak = COALESCE(streak, 1)
                WHERE user_id = $2
                RETURNING id
            )
            INSERT INTO user_badges (user_id, badge_id, xp, streak, earned_at)
            SELECT $2, NULL, $1, 1, NOW()
            WHERE NOT EXISTS (SELECT 1 FROM updated)`,
            [xpEarned, req.user.userId]
        )

        // Check badges
        const badgeRule = BADGE_RULES[chapterId]
        if (badgeRule) {
            const shouldAward = ending === 'good' && (!badgeRule.perfect || perfect)
            if (shouldAward && badgeRule.good) {
                const badge = await pool.query('SELECT id FROM badges WHERE badge_key = $1', [badgeRule.good])
                if (badge.rows.length > 0) {
                    await pool.query(
                        `INSERT INTO user_badges (user_id, badge_id, xp, streak)
                         VALUES (
                            $1,
                            $2,
                            (SELECT COALESCE(MAX(xp), 0) FROM user_badges WHERE user_id = $1),
                            (SELECT COALESCE(MAX(streak), 1) FROM user_badges WHERE user_id = $1)
                         )
                         ON CONFLICT DO NOTHING`,
                        [req.user.userId, badge.rows[0].id]
                    )
                }
            }
        }

        // Check streak badge (7 days)
        const streakResult = await pool.query(
            'SELECT COALESCE(MAX(streak), 1)::int AS streak FROM user_badges WHERE user_id = $1',
            [req.user.userId]
        )
        if (streakResult.rows[0]?.streak >= 7) {
            const streakBadge = await pool.query("SELECT id FROM badges WHERE badge_key = '7-day-streak'")
            if (streakBadge.rows.length > 0) {
                await pool.query(
                    `INSERT INTO user_badges (user_id, badge_id, xp, streak)
                     VALUES (
                        $1,
                        $2,
                        (SELECT COALESCE(MAX(xp), 0) FROM user_badges WHERE user_id = $1),
                        (SELECT COALESCE(MAX(streak), 1) FROM user_badges WHERE user_id = $1)
                     )
                     ON CONFLICT DO NOTHING`,
                    [req.user.userId, streakBadge.rows[0].id]
                )
            }
        }

        // Emit leaderboard update via socket
        const io = req.app.get('io')
        if (io) {
            const userResult = await pool.query(
                'SELECT COALESCE(MAX(xp), 0)::int AS xp FROM user_badges WHERE user_id = $1',
                [req.user.userId]
            )
            io.to('leaderboard').emit('rank-update', {
                userId: req.user.userId,
                xp: userResult.rows[0]?.xp,
            })
        }

        res.json({ message: 'Chapter completed', xpAwarded: xpEarned })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

module.exports = router
