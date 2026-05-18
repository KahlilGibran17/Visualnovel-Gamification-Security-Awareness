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

// GET /api/progress/chapters/total
router.get('/chapters/total', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*)::int as total FROM game_chapters')
        res.json({ total: result.rows[0].total })
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/progress/xp
router.post('/xp', requireAuth, async (req, res) => {
    const { amount, reason, chapterId } = req.body
    try {
        let checkChapterId = chapterId ? parseInt(chapterId) : null
        if (!checkChapterId && reason) {
            const match = reason.match(/Chapter\s+(\d+)/i)
            if (match) {
                checkChapterId = parseInt(match[1])
            }
        }

        if (checkChapterId) {
            const prevProgress = await pool.query(
                `SELECT completed FROM chapter_progress WHERE user_id = $1 AND chapter_id = $2`,
                [req.user.userId, checkChapterId]
            )
            const alreadyCompleted = prevProgress.rows.length > 0 && prevProgress.rows[0].completed

            if (alreadyCompleted) {
                return res.json({ message: 'XP ignored (chapter already completed)', amount: 0 })
            }
        }

        await pool.query(
            `UPDATE users
             SET xp = COALESCE(xp, 0) + $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [amount, req.user.userId]
        )
        res.json({ message: 'XP awarded', amount })
    } catch (err) {
        console.error('[progress] POST /xp error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/progress/chapter/:id/complete
router.post('/chapter/:id/complete', requireAuth, async (req, res) => {
    const chapterId = parseInt(req.params.id)
    const { ending, xpEarned, perfect, score, wrongChoices = 0, badgeId } = req.body

    try {
        // Check if already completed before
        const prevProgress = await pool.query(
            `SELECT completed FROM chapter_progress WHERE user_id = $1 AND chapter_id = $2`,
            [req.user.userId, chapterId]
        )
        const alreadyCompleted = prevProgress.rows.length > 0 && prevProgress.rows[0].completed

        // Upsert progress
        await pool.query(
            `INSERT INTO chapter_progress (user_id, chapter_id, completed, ending, score, xp_earned, wrong_choices, completed_at)
       VALUES ($1, $2, TRUE, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, chapter_id) DO UPDATE
       SET completed = TRUE, ending = $3, score = $4, xp_earned = GREATEST(chapter_progress.xp_earned, $5),
           wrong_choices = $6, completed_at = NOW()`,
            [req.user.userId, chapterId, ending, score, xpEarned, wrongChoices]
        )

        // Award XP only if this is the FIRST completion
        let xpToAward = 0
        if (!alreadyCompleted) {
            xpToAward = xpEarned
            await pool.query(
                `UPDATE users
                 SET xp = COALESCE(xp, 0) + $1,
                     updated_at = NOW()
                 WHERE id = $2`,
                [xpToAward, req.user.userId]
            )
        }

        // Check badges
        const badgeRule = BADGE_RULES[chapterId]
        if (badgeRule) {
            const shouldAward = ending === 'good' && (!badgeRule.perfect || perfect)
            if (shouldAward && badgeRule.good) {
                const badge = await pool.query('SELECT id FROM badges WHERE badge_key = $1', [badgeRule.good])
                if (badge.rows.length > 0) {
                    await pool.query(
                        `INSERT INTO user_badges (user_id, badge_id, earned_at)
                         VALUES ($1, $2, NOW())
                         ON CONFLICT DO NOTHING`,
                        [req.user.userId, badge.rows[0].id]
                    )
                }
            }
        }

        // Dynamic Ending-Specific Badge Award
        // Automatically checks if a badge key matching 'ch{chapterId}-{ending}' or '{ending}' exists, and unlocks it
        if (ending) {
            const specificBadge = await pool.query(
                'SELECT id FROM badges WHERE badge_key = $1 OR badge_key = $2',
                [`ch${chapterId}-${ending}`, ending]
            )
            if (specificBadge.rows.length > 0) {
                await pool.query(
                    `INSERT INTO user_badges (user_id, badge_id, earned_at)
                     VALUES ($1, $2, NOW())
                     ON CONFLICT DO NOTHING`,
                    [req.user.userId, specificBadge.rows[0].id]
                )
            }
        }

        // Award dynamic dynamic ending-specific badge assigned via CMS ending scene
        if (badgeId) {
            await pool.query(
                `INSERT INTO user_badges (user_id, badge_id, earned_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT DO NOTHING`,
                [req.user.userId, badgeId]
            )
        }

        // Dynamic DB Badge Award (fallback or custom badge assigned through cms)
        const chapterRes = await pool.query('SELECT badge_id FROM game_chapters WHERE id = $1', [chapterId])
        const dbBadgeId = chapterRes.rows[0]?.badge_id
        if (dbBadgeId) {
            if (ending === 'good') {
                await pool.query(
                    `INSERT INTO user_badges (user_id, badge_id, earned_at)
                     VALUES ($1, $2, NOW())
                     ON CONFLICT DO NOTHING`,
                    [req.user.userId, dbBadgeId]
                )
            }
        }

        // Check streak badge (7 days)
        const streakResult = await pool.query(
            'SELECT COALESCE(streak, 1)::int AS streak FROM users WHERE id = $1',
            [req.user.userId]
        )
        if (streakResult.rows[0]?.streak >= 7) {
            const streakBadge = await pool.query("SELECT id FROM badges WHERE badge_key = '7-day-streak'")
            if (streakBadge.rows.length > 0) {
                await pool.query(
                    `INSERT INTO user_badges (user_id, badge_id, earned_at)
                     VALUES ($1, $2, NOW())
                     ON CONFLICT DO NOTHING`,
                    [req.user.userId, streakBadge.rows[0].id]
                )
            }
        }

        // Emit leaderboard update via socket
        const io = req.app.get('io')
        if (io) {
            const userResult = await pool.query(
                'SELECT COALESCE(xp, 0)::int AS xp FROM users WHERE id = $1',
                [req.user.userId]
            )
            io.to('leaderboard').emit('rank-update', {
                userId: req.user.userId,
                xp: userResult.rows[0]?.xp,
            })
            io.to('admin-activity').emit('admin-activity-updated', {
                source: 'chapter-progress',
                userId: req.user.userId,
                chapterId,
                at: new Date().toISOString(),
            })
        }

        res.json({ message: 'Chapter completed', xpAwarded: alreadyCompleted ? 0 : xpEarned })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

module.exports = router
