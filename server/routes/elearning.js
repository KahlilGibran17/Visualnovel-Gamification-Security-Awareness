const router = require('express').Router()
const pool = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')

// ========================================================
// GET /api/elearning/lessons
// Daftar semua lesson aktif beserta progress user yang login
// ========================================================
router.get('/lessons', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                l.id,
                l.chapter_id,
                l.title,
                l.description,
                l.thumbnail_url,
                l.duration_seconds,
                l.xp_reward,
                l.is_active,
                COALESCE(ep.completed, FALSE)          AS completed,
                COALESCE(ep.xp_earned, 0)              AS xp_earned,
                COALESCE(ep.watch_time_seconds, 0)     AS watch_time_seconds,
                ep.completed_at,
                (
                    SELECT COUNT(*)
                    FROM elearning_questions eq
                    WHERE eq.lesson_id = l.id
                ) AS total_questions
            FROM elearning_lessons l
            LEFT JOIN elearning_progress ep
                ON ep.lesson_id = l.id
                AND ep.user_id = $1
            WHERE l.is_active = TRUE
            ORDER BY l.chapter_id ASC
        `, [req.user.userId])

        res.json(result.rows)
    } catch (err) {
        console.error('GET /lessons error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// ========================================================
// GET /api/elearning/lessons/:id
// Detail satu lesson: info video, daftar pertanyaan + opsi,
// dan status jawaban user untuk setiap pertanyaan
// ========================================================
router.get('/lessons/:id', requireAuth, async (req, res) => {
    const lessonId = parseInt(req.params.id)
    if (isNaN(lessonId)) return res.status(400).json({ message: 'Invalid lesson id' })

    try {
        // Ambil data lesson
        const lessonRes = await pool.query(
            'SELECT * FROM elearning_lessons WHERE id = $1 AND is_active = TRUE',
            [lessonId]
        )
        if (!lessonRes.rows.length) {
            return res.status(404).json({ message: 'Lesson tidak ditemukan' })
        }
        const lesson = lessonRes.rows[0]

        // Ambil pertanyaan + status jawaban user (LEFT JOIN ke elearning_answers)
        const questionsRes = await pool.query(`
            SELECT
                q.id,
                q.question_text,
                q.timestamp_seconds,
                q.xp_reward,
                q.order_index,
                ea.is_correct          AS answered_correctly,
                ea.selected_option_id,
                CASE WHEN ea.id IS NOT NULL THEN TRUE ELSE FALSE END AS answered
            FROM elearning_questions q
            LEFT JOIN elearning_answers ea
                ON ea.question_id = q.id
                AND ea.user_id = $2
            WHERE q.lesson_id = $1
            ORDER BY q.order_index ASC, q.timestamp_seconds ASC
        `, [lessonId, req.user.userId])

        // Ambil semua opsi jawaban untuk pertanyaan-pertanyaan di atas
        const questionIds = questionsRes.rows.map(q => q.id)
        let options = []
        if (questionIds.length > 0) {
            const optionsRes = await pool.query(
                `SELECT id, question_id, option_text, order_index
                 FROM elearning_options
                 WHERE question_id = ANY($1)
                 ORDER BY order_index ASC`,
                [questionIds]
            )
            options = optionsRes.rows
        }

        // Ambil progress user untuk lesson ini
        const progressRes = await pool.query(
            'SELECT * FROM elearning_progress WHERE lesson_id = $1 AND user_id = $2',
            [lessonId, req.user.userId]
        )

        const questions = questionsRes.rows.map(q => ({
            ...q,
            options: options.filter(o => o.question_id === q.id)
        }))

        res.json({
            ...lesson,
            questions,
            progress: progressRes.rows[0] || null
        })
    } catch (err) {
        console.error('GET /lessons/:id error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// ========================================================
// POST /api/elearning/lessons/:id/progress
// Update waktu tonton (dipanggil periodik dari player)
// ========================================================
router.post('/lessons/:id/progress', requireAuth, async (req, res) => {
    const lessonId = parseInt(req.params.id)
    const { watchTimeSeconds } = req.body
    if (isNaN(lessonId) || typeof watchTimeSeconds !== 'number') {
        return res.status(400).json({ message: 'Data tidak valid' })
    }

    try {
        await pool.query(`
            INSERT INTO elearning_progress (user_id, lesson_id, watch_time_seconds, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (user_id, lesson_id) DO UPDATE
            SET
                watch_time_seconds = GREATEST(elearning_progress.watch_time_seconds, $3),
                updated_at = NOW()
        `, [req.user.userId, lessonId, watchTimeSeconds])

        res.json({ message: 'Progress tersimpan' })
    } catch (err) {
        console.error('POST /lessons/:id/progress error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// ========================================================
// POST /api/elearning/lessons/:id/complete
// Tandai lesson selesai + beri XP bonus kepada user
// ========================================================
router.post('/lessons/:id/complete', requireAuth, async (req, res) => {
    const lessonId = parseInt(req.params.id)
    if (isNaN(lessonId)) return res.status(400).json({ message: 'Invalid lesson id' })

    try {
        // Ambil XP reward lesson
        const lessonRes = await pool.query(
            'SELECT xp_reward FROM elearning_lessons WHERE id = $1 AND is_active = TRUE',
            [lessonId]
        )
        if (!lessonRes.rows.length) {
            return res.status(404).json({ message: 'Lesson tidak ditemukan' })
        }
        const xpReward = lessonRes.rows[0].xp_reward

        // Cek apakah sudah pernah diselesaikan (hindari double XP)
        const existingRes = await pool.query(
            'SELECT id, completed FROM elearning_progress WHERE user_id = $1 AND lesson_id = $2',
            [req.user.userId, lessonId]
        )
        const alreadyCompleted = existingRes.rows[0]?.completed === true

        // Update progress jadi completed
        await pool.query(`
            INSERT INTO elearning_progress (user_id, lesson_id, completed, xp_earned, completed_at, updated_at)
            VALUES ($1, $2, TRUE, $3, NOW(), NOW())
            ON CONFLICT (user_id, lesson_id) DO UPDATE
            SET
                completed    = TRUE,
                xp_earned    = GREATEST(elearning_progress.xp_earned, $3),
                completed_at = COALESCE(elearning_progress.completed_at, NOW()),
                updated_at   = NOW()
        `, [req.user.userId, lessonId, xpReward])

        let xpAwarded = 0
        if (!alreadyCompleted) {
            // Berikan XP ke user jika belum pernah complete
            await pool.query(
                'UPDATE users SET xp = xp + $1 WHERE id = $2',
                [xpReward, req.user.userId]
            )
            xpAwarded = xpReward
        }

        res.json({ message: 'Lesson selesai!', xpAwarded })
    } catch (err) {
        console.error('POST /lessons/:id/complete error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// ========================================================
// POST /api/elearning/questions/:qid/answer
// Simpan jawaban user untuk kuis interaktif di video
// + beri XP jika benar (hanya sekali per soal)
// ========================================================
router.post('/questions/:qid/answer', requireAuth, async (req, res) => {
    const questionId = parseInt(req.params.qid)
    const { selectedOptionId } = req.body

    if (isNaN(questionId) || !selectedOptionId) {
        return res.status(400).json({ message: 'Data tidak valid' })
    }

    try {
        // Cegah jawab ulang
        const alreadyRes = await pool.query(
            'SELECT id FROM elearning_answers WHERE user_id = $1 AND question_id = $2',
            [req.user.userId, questionId]
        )
        if (alreadyRes.rows.length) {
            return res.json({ message: 'Sudah dijawab', xpAwarded: 0, isCorrect: null })
        }

        // Validasi opsi dan cek kebenaran
        const optionRes = await pool.query(
            'SELECT is_correct FROM elearning_options WHERE id = $1 AND question_id = $2',
            [selectedOptionId, questionId]
        )
        if (!optionRes.rows.length) {
            return res.status(400).json({ message: 'Pilihan tidak valid' })
        }
        const isCorrect = optionRes.rows[0].is_correct

        // Ambil XP reward pertanyaan
        const questionRes = await pool.query(
            'SELECT xp_reward, lesson_id FROM elearning_questions WHERE id = $1',
            [questionId]
        )
        if (!questionRes.rows.length) {
            return res.status(404).json({ message: 'Pertanyaan tidak ditemukan' })
        }
        const { xp_reward: xpReward, lesson_id: lessonId } = questionRes.rows[0]
        const xpAwarded = isCorrect ? xpReward : 0

        // Simpan jawaban
        await pool.query(
            `INSERT INTO elearning_answers (user_id, question_id, selected_option_id, is_correct)
             VALUES ($1, $2, $3, $4)`,
            [req.user.userId, questionId, selectedOptionId, isCorrect]
        )

        // Beri XP ke user jika benar
        if (xpAwarded > 0) {
            await pool.query(
                'UPDATE users SET xp = xp + $1 WHERE id = $2',
                [xpAwarded, req.user.userId]
            )
        }

        // Update xp_earned di elearning_progress
        if (xpAwarded > 0) {
            await pool.query(`
                INSERT INTO elearning_progress (user_id, lesson_id, xp_earned, updated_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (user_id, lesson_id) DO UPDATE
                SET
                    xp_earned  = elearning_progress.xp_earned + $3,
                    updated_at = NOW()
            `, [req.user.userId, lessonId, xpAwarded])
        }

        res.json({
            isCorrect,
            xpAwarded,
            message: isCorrect
                ? 'Benar! Jawaban tepat sasaran.'
                : 'Kurang tepat. Tetap semangat belajar!'
        })
    } catch (err) {
        console.error('POST /questions/:qid/answer error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// ========================================================
// ADMIN ROUTES
// ========================================================

// GET /api/elearning/admin/lessons — daftar semua lesson untuk admin
router.get('/admin/lessons', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                l.*,
                (SELECT COUNT(*) FROM elearning_questions WHERE lesson_id = l.id) AS question_count,
                (SELECT COUNT(*) FROM elearning_progress WHERE lesson_id = l.id AND completed = TRUE) AS completions
            FROM elearning_lessons l
            ORDER BY l.chapter_id ASC
        `)
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/elearning/admin/lessons — tambah lesson baru
router.post('/admin/lessons', requireAuth, requireRole('admin'), async (req, res) => {
    const { chapterId, title, description, videoUrl, thumbnailUrl, durationSeconds, xpReward } = req.body
    if (!chapterId || !title || !videoUrl) {
        return res.status(400).json({ message: 'chapterId, title, dan videoUrl wajib diisi' })
    }
    try {
        const result = await pool.query(`
            INSERT INTO elearning_lessons
                (chapter_id, title, description, video_url, thumbnail_url, duration_seconds, xp_reward)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [chapterId, title, description, videoUrl, thumbnailUrl, durationSeconds || 0, xpReward || 100])
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error', detail: err.message })
    }
})

// PUT /api/elearning/admin/lessons/:id — update lesson
router.put('/admin/lessons/:id', requireAuth, requireRole('admin'), async (req, res) => {
    const lessonId = parseInt(req.params.id)
    const { title, description, videoUrl, thumbnailUrl, durationSeconds, xpReward, isActive } = req.body
    try {
        const result = await pool.query(`
            UPDATE elearning_lessons
            SET
                title            = COALESCE($1, title),
                description      = COALESCE($2, description),
                video_url        = COALESCE($3, video_url),
                thumbnail_url    = $4,
                duration_seconds = COALESCE($5, duration_seconds),
                xp_reward        = COALESCE($6, xp_reward),
                is_active        = COALESCE($7, is_active),
                updated_at       = NOW()
            WHERE id = $8
            RETURNING *
        `, [title, description, videoUrl, thumbnailUrl, durationSeconds, xpReward, isActive, lessonId])
        if (!result.rows.length) return res.status(404).json({ message: 'Lesson tidak ditemukan' })
        res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

// POST /api/elearning/admin/lessons/:id/questions — tambah pertanyaan ke lesson
router.post('/admin/lessons/:id/questions', requireAuth, requireRole('admin'), async (req, res) => {
    const lessonId = parseInt(req.params.id)
    const { questionText, timestampSeconds, xpReward, orderIndex, options } = req.body
    if (!questionText || timestampSeconds === undefined || !options?.length) {
        return res.status(400).json({ message: 'questionText, timestampSeconds, dan options wajib diisi' })
    }
    try {
        const qRes = await pool.query(`
            INSERT INTO elearning_questions (lesson_id, question_text, timestamp_seconds, xp_reward, order_index)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [lessonId, questionText, timestampSeconds, xpReward || 25, orderIndex || 0])

        const question = qRes.rows[0]

        // Insert semua opsi
        for (const opt of options) {
            await pool.query(
                'INSERT INTO elearning_options (question_id, option_text, is_correct, order_index) VALUES ($1, $2, $3, $4)',
                [question.id, opt.optionText, opt.isCorrect || false, opt.orderIndex || 0]
            )
        }
        res.status(201).json({ message: 'Pertanyaan berhasil ditambahkan', question })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

module.exports = router
