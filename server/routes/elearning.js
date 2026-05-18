const router = require('express').Router()
const path   = require('path')
const fs     = require('fs')
const multer = require('multer')
const pool   = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')

// ─── Config Upload ─────────────────────────────────────────────────────────

const VIDEO_DIR = path.resolve(process.env.VIDEO_UPLOAD_DIR || './uploads/videos')
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true })

const isExternalUrl = (value) => /^https?:\/\//i.test(value || '')
const mimeFromPath = (p = '') => {
    const ext = path.extname(p).toLowerCase()
    if (ext === '.webm') return 'video/webm'
    if (ext === '.ogg' || ext === '.ogv') return 'video/ogg'
    if (ext === '.mov') return 'video/quicktime'
    return 'video/mp4'
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, VIDEO_DIR),
    filename:    (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        cb(null, `${unique}${path.extname(file.originalname)}`)
    },
})

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
    fileFilter: (_req, file, cb) => {
        const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
        cb(null, allowed.includes(file.mimetype))
    },
})

// Public/User lessons list
router.get('/lessons', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                l.id, l.chapter_id, l.title, l.description, l.duration,
                l.xp_reward, l.is_active, l.video_url,
                COALESCE(q.total_questions, 0) AS total_questions,
                COALESCE(p.completed, FALSE) AS completed,
                COALESCE(p.xp_earned, 0) AS xp_earned,
                COALESCE(p.watch_time_seconds, 0) AS watch_time_seconds
            FROM elearning_lessons l
            LEFT JOIN (
                SELECT lesson_id, COUNT(*)::int AS total_questions
                FROM elearning_questions
                GROUP BY lesson_id
            ) q ON q.lesson_id = l.id
            LEFT JOIN elearning_progress p
                ON p.lesson_id = l.id AND p.user_id = $1
            WHERE l.is_active = TRUE
            ORDER BY l.chapter_id ASC, l.id ASC
        `, [req.user.userId])
        return res.json(result.rows)
    } catch (err) {
        console.error('[elearning] GET /lessons failed:', err)
        return res.status(500).json({ message: err.message })
    }
})

// Lesson detail
router.get('/lessons/:id', requireAuth, async (req, res) => {
    const lessonId = parseInt(req.params.id)
    if (isNaN(lessonId)) return res.status(400).json({ message: 'Invalid lesson id' })

    try {
        const lessonRes = await pool.query(
            `SELECT id, chapter_id, title, description,
                    duration, xp_reward, is_active, video_url
             FROM elearning_lessons
             WHERE id = $1 AND is_active = TRUE`,
            [lessonId]
        )
        if (!lessonRes.rows.length) {
            return res.status(404).json({ message: 'Lesson tidak ditemukan' })
        }
        const lesson = lessonRes.rows[0]

        // ✅ ambil progress user
        const progressRes = await pool.query(
            `SELECT completed, xp_earned, watch_time_seconds
             FROM elearning_progress
             WHERE user_id = $1 AND lesson_id = $2`,
            [req.user.userId, lessonId]
        )
        const progress = progressRes.rows[0] || {
            completed: false,
            xp_earned: 0,
            watch_time_seconds: 0,
        }

        const questionsRes = await pool.query(
            `SELECT id, question_text, timestamp_seconds, xp_reward, order_index
             FROM elearning_questions
             WHERE lesson_id = $1
             ORDER BY order_index ASC, timestamp_seconds ASC`,
            [lessonId]
        )

        const questionIds = questionsRes.rows.map(q => q.id)

        let optionsMap = {}
        if (questionIds.length > 0) {
            const optionsRes = await pool.query(
                `SELECT id, question_id, option_text, is_correct
                 FROM elearning_options
                 WHERE question_id = ANY($1)
                 ORDER BY id ASC`,
                [questionIds]
            )

            optionsRes.rows.forEach(opt => {
                if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = []
                optionsMap[opt.question_id].push({
                    id: opt.id,
                    option_text: opt.option_text,
                    is_correct: opt.is_correct,
                })
            })
        }

        // ✅ ambil jawaban user
        let answersMap = {}
        if (questionIds.length > 0) {
            const answersRes = await pool.query(
                `SELECT question_id, selected_option_id, is_correct
                 FROM elearning_answers
                 WHERE user_id = $1 AND question_id = ANY($2)`,
                [req.user.userId, questionIds]
            )
            answersRes.rows.forEach(a => {
                answersMap[a.question_id] = {
                    answered: true,
                    answered_correctly: a.is_correct,
                    selected_option_id: a.selected_option_id,
                }
            })
        }

        const questions = questionsRes.rows.map(q => ({
            ...q,
            answered: answersMap[q.id]?.answered || false,
            answered_correctly: answersMap[q.id]?.answered_correctly ?? null,
            selected_option_id: answersMap[q.id]?.selected_option_id ?? null,
            options: optionsMap[q.id] || [],
        }))

        return res.json({
            ...lesson,
            video_url: lesson.video_url,
            stream_url: `/api/elearning/lessons/${lessonId}/stream`,
            questions,
            progress,
        })
    } catch (err) {
        console.error('GET /lessons/:id error:', err)
        return res.status(500).json({ message: err.message })
    }
})

// Streaming
router.get('/lessons/:id/stream', async (req, res) => {
    const lessonId = parseInt(req.params.id)
    if (isNaN(lessonId)) return res.status(400).json({ message: 'Invalid lesson id' })

    try {
        const result = await pool.query(
            `SELECT video_url
             FROM elearning_lessons
             WHERE id = $1 AND is_active = TRUE`,
            [lessonId]
        )
        if (!result.rows.length) return res.status(404).json({ message: 'Lesson tidak ditemukan' })

        const { video_url } = result.rows[0]
        if (!video_url) return res.status(404).json({ message: 'Video belum diupload' })

        if (isExternalUrl(video_url)) {
            return res.redirect(video_url)
        }

        const filePath = path.isAbsolute(video_url)
            ? video_url
            : path.join(VIDEO_DIR, video_url)

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File video tidak ditemukan di server' })
        }

        const stat     = fs.statSync(filePath)
        const fileSize = stat.size
        const mimeType = mimeFromPath(video_url)
        const range    = req.headers.range

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-')
            const start = parseInt(parts[0], 10)
            const end   = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

            // ✅ Validasi range
            if (
                isNaN(start)    ||
                isNaN(end)      ||
                start < 0       ||
                start >= fileSize ||
                end >= fileSize ||
                start > end
            ) {
                return res.status(416).set({
                    'Content-Range': `bytes */${fileSize}`
                }).end()
            }

            const chunkSize = end - start + 1

            res.writeHead(206, {
                'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges':  'bytes',
                'Content-Length': chunkSize,
                'Content-Type':   mimeType,
                'Cache-Control':  'no-cache',
            })

            // ✅ Error handling saat stream
            const stream = fs.createReadStream(filePath, { start, end })
            stream.on('error', (err) => {
                console.error('Stream error:', err)
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Gagal membaca file video' })
                } else {
                    res.destroy()
                }
            })
            stream.pipe(res)

        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type':   mimeType,
                'Accept-Ranges':  'bytes',
                'Cache-Control':  'no-cache',
            })

            // ✅ Error handling saat stream full
            const stream = fs.createReadStream(filePath)
            stream.on('error', (err) => {
                console.error('Stream error (full):', err)
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Gagal membaca file video' })
                } else {
                    res.destroy()
                }
            })
            stream.pipe(res)
        }
    } catch (err) {
        console.error('GET /lessons/:id/stream error:', err)
        return res.status(500).json({ message: err.message })
    }
})

// Upload video
router.post('/admin/lessons/:id/upload-video', requireAuth, requireRole('admin'), upload.single('video'), async (req, res) => {
    const lessonId = parseInt(req.params.id)
    if (isNaN(lessonId)) return res.status(400).json({ message: 'Invalid lesson id' })
    if (!req.file)       return res.status(400).json({ message: 'Tidak ada file video' })

    try {
        const old = await pool.query(
            'SELECT video_url FROM elearning_lessons WHERE id=$1', [lessonId]
        )
        const oldVideoUrl = old.rows[0]?.video_url
        if (oldVideoUrl && !isExternalUrl(oldVideoUrl)) {
            const oldPath = path.isAbsolute(oldVideoUrl)
                ? oldVideoUrl
                : path.join(VIDEO_DIR, oldVideoUrl)
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
        }

        await pool.query(
            `UPDATE elearning_lessons
             SET video_url=$1, updated_at=NOW()
             WHERE id=$2`,
            [req.file.filename, lessonId]
        )

        return res.json({
            message: 'Video berhasil diupload',
            video_url: req.file.filename,
        })
    } catch (err) {
        if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
        console.error('POST /admin/lessons/:id/upload-video error:', err)
        return res.status(500).json({ message: err.message })
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
// ========================================================
router.post('/lessons/:id/complete', requireAuth, async (req, res) => {
    const lessonId = parseInt(req.params.id)
    const userId = req.user.userId

    const { quizXpEarned = 0 } = req.body

    if (isNaN(lessonId)) {
        return res.status(400).json({ message: 'Invalid lesson id' })
    }

    const safeQuizXpEarned = Math.max(0, Number(quizXpEarned) || 0)

    const syncChapterProgressIfChapterDone = async (client, chapterId) => {
        if (!Number.isFinite(chapterId)) return false

        const summaryRes = await client.query(
            `SELECT
                COUNT(*)::int AS total_lessons,
                COUNT(*) FILTER (WHERE ep.completed = TRUE)::int AS completed_lessons,
                COALESCE(SUM(ep.xp_earned) FILTER (WHERE ep.completed = TRUE), 0)::int AS chapter_xp
             FROM elearning_lessons l
             LEFT JOIN elearning_progress ep
                ON ep.lesson_id = l.id
               AND ep.user_id = $1
             WHERE l.chapter_id = $2
               AND l.is_active = TRUE`,
            [userId, chapterId]
        )

        const summary = summaryRes.rows[0] || {}
        const totalLessons = Number(summary.total_lessons) || 0
        const completedLessons = Number(summary.completed_lessons) || 0
        const chapterXp = Number(summary.chapter_xp) || 0

        if (totalLessons === 0 || completedLessons < totalLessons) {
            return false
        }

        await client.query(
            `INSERT INTO chapter_progress
                (user_id, chapter_id, completed, ending, score, xp_earned, wrong_choices, completed_at)
             VALUES ($1, $2, TRUE, NULL, 0, $3, 0, NOW())
             ON CONFLICT (user_id, chapter_id) DO UPDATE
             SET completed = TRUE,
                 xp_earned = GREATEST(chapter_progress.xp_earned, EXCLUDED.xp_earned),
                 completed_at = COALESCE(chapter_progress.completed_at, NOW())`,
            [userId, chapterId, chapterXp]
        )

        // Otomatis berikan lencana/badge reward chapter ini jika ada
        const chapterRes = await client.query(
            `SELECT badge_id FROM game_chapters WHERE id = $1`,
            [chapterId]
        )
        const badgeId = chapterRes.rows[0]?.badge_id
        if (badgeId) {
            await client.query(
                `INSERT INTO user_badges (user_id, badge_id, earned_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (user_id, badge_id) DO NOTHING`,
                [userId, badgeId]
            )
        }

        return true
    }

    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        const lessonRes = await client.query(
            `SELECT chapter_id, xp_reward
             FROM elearning_lessons
             WHERE id = $1`,
            [lessonId]
        )

        if (!lessonRes.rows.length) {
            await client.query('ROLLBACK')
            return res.status(404).json({ message: 'Lesson tidak ditemukan' })
        }

        const chapterId = Number(lessonRes.rows[0].chapter_id)
        const completionXp = Number(lessonRes.rows[0].xp_reward) || 0

        // Cegah double-award XP saat endpoint complete dipanggil berulang.
        const existingRes = await client.query(
            `SELECT xp_earned
             FROM elearning_progress
             WHERE user_id = $1 AND lesson_id = $2 AND completed = TRUE`,
            [userId, lessonId]
        )

        if (existingRes.rows.length > 0) {
            const chapterCompleted = await syncChapterProgressIfChapterDone(client, chapterId)
            await client.query('COMMIT')

            return res.json({
                xpAwarded: 0,
                alreadyCompleted: true,
                chapterCompleted,
            })
        }

        const totalXp = completionXp + safeQuizXpEarned

        await client.query(
            `INSERT INTO elearning_progress (user_id, lesson_id, completed, xp_earned, completed_at, updated_at)
             VALUES ($1, $2, TRUE, $3, NOW(), NOW())
             ON CONFLICT (user_id, lesson_id) DO UPDATE
             SET completed = TRUE,
                 xp_earned = $3,
                 completed_at = NOW(),
                 updated_at = NOW()`,
            [userId, lessonId, totalXp]
        )

        const chapterCompleted = await syncChapterProgressIfChapterDone(client, chapterId)

        await client.query(
            `UPDATE users
             SET xp = COALESCE(xp, 0) + $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [totalXp, userId]
        )

        await client.query('COMMIT')

        const io = req.app.get('io')
        if (io) {
            io.to('admin-activity').emit('admin-activity-updated', {
                source: 'elearning-complete',
                userId,
                lessonId,
                at: new Date().toISOString(),
            })
        }

        return res.json({ xpAwarded: totalXp, chapterCompleted })
    } catch (err) {
        try {
            await client.query('ROLLBACK')
        } catch (rollbackErr) {
            console.error('ROLLBACK /lessons/:id/complete error:', rollbackErr)
        }
        console.error('POST /lessons/:id/complete error:', err)
        res.status(500).json({ message: 'Server error' })
    } finally {
        client.release()
    }
})

// ========================================================
// POST /api/elearning/questions/:id/answer
// ========================================================
router.post('/questions/:id/answer', requireAuth, async (req, res) => {
    const { selectedOptionId } = req.body
    const userId = req.user.userId
    const questionId = req.params.id

    try {
        // Cek opsi yang dipilih
        const optionRes = await pool.query(
            `SELECT is_correct FROM elearning_options WHERE id = $1`,
            [selectedOptionId]
        )
        const isCorrect = optionRes.rows[0]?.is_correct === true

        // Ambil xp_reward soal
        const questionRes = await pool.query(
            `SELECT xp_reward FROM elearning_questions WHERE id = $1`,
            [questionId]
        )
        const xpReward = questionRes.rows[0]?.xp_reward || 0

        // Catat riwayat jawaban (tanpa simpan XP ke user)
        await pool.query(`
            INSERT INTO elearning_answers (user_id, question_id, selected_option_id, is_correct)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, question_id) DO UPDATE
            SET selected_option_id = $3,
                is_correct = $4
        `, [userId, questionId, selectedOptionId, isCorrect])

        return res.json({
            isCorrect,
            xpAwarded: isCorrect ? xpReward : 0,
        })
    } catch (err) {
        console.error('POST /questions/:id/answer error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})

// ========================================================
// ADMIN — GET /api/elearning/admin/lessons
// Daftar semua lesson untuk admin (tanpa filter is_active)
// ========================================================
router.get('/admin/lessons', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                l.*,
                COALESCE(q.question_count, 0) AS question_count,
                0 AS completions
            FROM elearning_lessons l
            LEFT JOIN (
                SELECT lesson_id, COUNT(*)::int AS question_count
                FROM elearning_questions
                GROUP BY lesson_id
            ) q ON q.lesson_id = l.id
            ORDER BY l.chapter_id ASC, l.id ASC
        `)
        return res.json(result.rows)
    } catch (err) {
        console.error('[elearning] GET /admin/lessons failed:', err)
        return res.status(500).json({ message: err.message })
    }
})

// ========================================================
// GET /api/elearning/admin/chapters (User & Admin shared headers list)
// ========================================================
router.get('/admin/chapters', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                gc.id, gc.title, gc.description, 
                b.badge_key, b.name as badge_name, b.category_id
            FROM game_chapters gc
            LEFT JOIN badges b ON b.id = gc.badge_id
            WHERE gc.type = 'E-Learning'
            ORDER BY gc.id ASC
        `)
        res.json(result.rows)
    } catch (err) {
        console.error('GET /admin/chapters error:', err)
        res.status(500).json({ message: err.message })
    }
})

// ========================================================
// ADMIN — GET /api/elearning/admin/lessons/:id
// Detail lesson + pertanyaan + opsi (is_correct ikut serta untuk form edit)
// ========================================================
router.get('/admin/lessons/:id', requireAuth, requireRole('admin'), async (req, res) => {
    const lessonId = parseInt(req.params.id)
    if (isNaN(lessonId)) return res.status(400).json({ message: 'Invalid lesson id' })

    try {
        const lessonRes = await pool.query(
            `SELECT 
                id, chapter_id, title, description, duration,
                xp_reward, is_active, video_url, created_at, updated_at
             FROM elearning_lessons 
             WHERE id = $1`,  // ← hindari SELECT * , eksplisit kolom yang dibutuhkan
            [lessonId]
        )
        if (!lessonRes.rows.length) return res.status(404).json({ message: 'Lesson tidak ditemukan' })

        const qRes = await pool.query(
            `SELECT 
                id, lesson_id, question_text, 
                timestamp_seconds, xp_reward, order_index
             FROM elearning_questions 
             WHERE lesson_id = $1 
             ORDER BY order_index ASC, timestamp_seconds ASC`,  // ← tambah secondary sort
            [lessonId]
        )

        const questionIds = qRes.rows.map(q => q.id)

        // ← Ambil options hanya kalau ada questions
        const options = questionIds.length > 0
            ? (await pool.query(
                `SELECT 
                    id, question_id, option_text, 
                    is_correct, order_index
                 FROM elearning_options
                 WHERE question_id = ANY($1)
                 ORDER BY question_id ASC, order_index ASC`,
                [questionIds]
            )).rows
            : []

        const questions = qRes.rows.map(q => ({
            ...q,
            options: options.filter(o => o.question_id === q.id),
        }))

        // ← Pastikan selalu ada array questions meski kosong
        return res.json({ 
            ...lessonRes.rows[0], 
            questions: questions ?? [],
        })

    } catch (err) {
        console.error('GET /admin/lessons/:id error:', err.message)
        console.error(err.stack)
        return res.status(500).json({ message: err.message })  // ← kirim pesan asli bukan 'Server error'
    }
})



// ========================================================
// ADMIN — POST /api/elearning/admin/lessons
// Buat lesson baru beserta pertanyaan & opsi sekaligus
// Body: { chapterId, title, description, duration,
//         xpReward, isActive, questions[] }
// questions[]: { questionText, timestampSeconds, xpReward,
//                orderIndex, options[{ optionText, isCorrect, orderIndex }] }
// ========================================================
// POST /admin/lessons — tambah insert options
router.post('/admin/lessons', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const {
            chapter_id, chapterId,
            title, description, duration,
            xp_reward, xpReward,
            is_active, isActive,
            video_url,
            questions = [],
        } = req.body

        const parsedChapterId = parseInt(chapterId || chapter_id, 10)
        if (isNaN(parsedChapterId)) {
            return res.status(400).json({ message: 'Chapter ID must be a valid number' })
        }

        const insert = await pool.query(
            `INSERT INTO elearning_lessons
             (chapter_id, title, description, duration, xp_reward, is_active, video_url, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
             RETURNING id, chapter_id, title, description, duration, xp_reward, is_active, video_url`,
            [
                parsedChapterId,
                title || '',
                description || '',
                duration || 0,
                xpReward || xp_reward || 0,
                isActive ?? is_active ?? true,
                video_url || null,
            ]
        )

        const lessonId = insert.rows[0].id

        for (const [i, q] of questions.entries()) {
            const parsedTimestamp = parseInt(q.timestampSeconds ?? q.timestamp_seconds, 10) || 0
            const parsedQXp = parseInt(q.xpReward ?? q.xp_reward, 10) || 0
            const parsedQOrder = parseInt(q.orderIndex, 10) || (i + 1)

            const qRes = await pool.query(
                `INSERT INTO elearning_questions
                 (lesson_id, question_text, question_explains, timestamp_seconds, xp_reward, order_index, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,NOW())
                 RETURNING id`,
                [
                    lessonId,
                    q.questionText || q.question_text || '',
                    q.questionExplains || q.question_explains || '',
                    parsedTimestamp,
                    parsedQXp,
                    parsedQOrder
                ]
            )

            const questionId = qRes.rows[0].id
            const options = q.options || []
            for (const [oi, opt] of options.entries()) {
                await pool.query(
                    `INSERT INTO elearning_options (question_id, option_text, is_correct, order_index)
                     VALUES ($1,$2,$3,$4)`,
                    [questionId, opt.optionText || opt.option_text || '', opt.isCorrect ?? opt.is_correct ?? false, opt.orderIndex ?? oi + 1]
                )
            }
        }

        return res.json({ lesson: insert.rows[0] })
    } catch (err) {
        console.error('POST /admin/lessons error:', err)
        return res.status(500).json({ message: err.message })
    }
})

router.post('/admin/chapters', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { 
            title, description, 
            badge_name, badge_icon, badge_description, badge_color, badge_key, 
            category_id, badge_id
        } = req.body

        let finalBadgeId = badge_id ? parseInt(badge_id) : null

        // 1. Jika tidak ada badge_id terpilih, buat badge baru (Quick Create)
        if (!finalBadgeId && badge_key && badge_name) {
            const badgeInsert = await pool.query(
                `INSERT INTO badges (badge_key, name, description, icon, color, category_id)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id`,
                [badge_key, badge_name, badge_description || '', badge_icon || '🏆', badge_color || '#FFD60A', category_id || null]
            )
            finalBadgeId = badgeInsert.rows[0].id
        }

        // 2. Insert Chapter (pointing to game_chapters)
        const chapterInsert = await pool.query(
            `INSERT INTO game_chapters (title, description, created_at, badge_id, type)
             VALUES ($1, $2, NOW(), $3, 'E-Learning')
             RETURNING id, title, description, badge_id`,
            [title || '', description || '', finalBadgeId]
        )

        return res.json({ 
            chapter: {
                ...chapterInsert.rows[0],
                badge_key: badge_key || null,
                category_id: category_id || null
            } 
        })
    } catch (err) {
        console.error('POST /admin/chapters error:', err.message)
        return res.status(500).json({ message: err.message })
    }
})

router.put('/admin/lessons/:id', requireAuth, requireRole('admin', 'manager'), async (req, res) => {
    const lessonId = Number(req.params.id)
    console.log('📦 req.body:', JSON.stringify(req.body, null, 2))
    const {
        chapterId, chapter_id,
        title, description, duration,
        xpReward, xp_reward,
        isActive, is_active,
        questions = [],
    } = req.body

    const parsedChapterId = parseInt(chapterId || chapter_id, 10)
    if (isNaN(parsedChapterId)) {
        return res.status(400).json({ message: 'Chapter ID must be a valid number' })
    }

    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        await client.query(
            `UPDATE elearning_lessons
             SET chapter_id=$1, title=$2, description=$3, duration=$4,
                 xp_reward=$5, is_active=$6, updated_at=NOW()
             WHERE id=$7`,
            [
                parsedChapterId,
                title ?? '',
                description ?? '',
                duration || 0,
                xpReward ?? xp_reward ?? 0,
                isActive ?? is_active ?? true,
                lessonId
            ]
        )

        // Hapus semua questions & options lama
        const oldQs = await client.query(
            'SELECT id FROM elearning_questions WHERE lesson_id=$1', [lessonId]
        )
        if (oldQs.rows.length) {
            const oldQIds = oldQs.rows.map(q => q.id)
            // hapus answers dulu baru options
            await client.query('DELETE FROM elearning_answers WHERE question_id = ANY($1::int[])', [oldQIds])
            await client.query('DELETE FROM elearning_options WHERE question_id = ANY($1::int[])', [oldQIds])
        }
        await client.query('DELETE FROM elearning_questions WHERE lesson_id=$1', [lessonId])

        for (const [i, q] of questions.entries()) {
            const parsedTimestamp = parseInt(q.timestampSeconds ?? q.timestamp_seconds, 10) || 0
            const parsedQXp = parseInt(q.xpReward ?? q.xp_reward, 10) || 0
            const parsedQOrder = parseInt(q.orderIndex, 10) || (i + 1)

            const qRes = await client.query(
                `INSERT INTO elearning_questions
                 (lesson_id, question_text, question_explains, timestamp_seconds, xp_reward, order_index, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,NOW())
                 RETURNING id`,
                [
                    lessonId,
                    q.questionText || '',
                    q.questionExplains || '',
                    parsedTimestamp,
                    parsedQXp,
                    parsedQOrder
                ]
            )

            const questionId = qRes.rows[0].id
            const options = q.options || []
            for (const [oi, opt] of options.entries()) {
                await client.query(
                    `INSERT INTO elearning_options (question_id, option_text, is_correct, order_index)
                     VALUES ($1,$2,$3,$4)`,
                    [questionId, opt.optionText || opt.option_text || '', opt.isCorrect ?? opt.is_correct ?? false, opt.orderIndex ?? oi + 1]
                )
            }
        }

        await client.query('COMMIT')
        return res.json({ ok: true })
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('PUT error detail:', err.message)
        console.error('PUT error stack:', err.stack)
        return res.status(500).json({ message: err.message })
    } finally {
        client.release()
    }
})

// ADMIN — DELETE /api/elearning/admin/chapters/:id (Permanent Delete)
router.delete('/admin/chapters/:id', requireAuth, requireRole('admin'), async (req, res) => {
    const chapterId = Number(req.params.id)
    if (!Number.isInteger(chapterId) || chapterId <= 0) {
        return res.status(400).json({ message: 'Invalid chapter ID' })
    }

    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        // 1. Dapatkan semua lessons di chapter ini
        const lessonsRes = await client.query(
            'SELECT id FROM elearning_lessons WHERE chapter_id = $1',
            [chapterId]
        )
        const lessonIds = lessonsRes.rows.map(r => r.id)

        if (lessonIds.length > 0) {
            // Hapus answers untuk seluruh lesson questions
            const oldQs = await client.query(
                'SELECT id FROM elearning_questions WHERE lesson_id = ANY($1::int[])',
                [lessonIds]
            )
            if (oldQs.rows.length > 0) {
                const oldQIds = oldQs.rows.map(q => q.id)
                await client.query('DELETE FROM elearning_answers WHERE question_id = ANY($1::int[])', [oldQIds])
                await client.query('DELETE FROM elearning_options WHERE question_id = ANY($1::int[])', [oldQIds])
            }
            await client.query('DELETE FROM elearning_questions WHERE lesson_id = ANY($1::int[])', [lessonIds])
            await client.query('DELETE FROM elearning_progress WHERE lesson_id = ANY($1::int[])', [lessonIds])
            await client.query('DELETE FROM elearning_lessons WHERE chapter_id = $1', [chapterId])
        }

        // 2. Hapus pretest answers, options, attempts, questions
        // Hapus pretest_user_answers
        await client.query(
            `DELETE FROM pretest_user_answers 
             WHERE pq_id IN (SELECT pq_id FROM pretest_questions WHERE ch_id = $1)`,
            [chapterId]
        )
        // Hapus pretest_options
        await client.query(
            `DELETE FROM pretest_options 
             WHERE pq_id IN (SELECT pq_id FROM pretest_questions WHERE ch_id = $1)`,
            [chapterId]
        )
        // Hapus pretest_questions
        await client.query('DELETE FROM pretest_questions WHERE ch_id = $1', [chapterId])
        
        // Hapus pretest_attempts
        await client.query('DELETE FROM pretest_attempts WHERE ch_id = $1', [chapterId])

        // 3. Hapus roadmap nodes referencing this chapter
        await client.query('DELETE FROM roadmap_nodes WHERE chapter_id = $1', [chapterId])

        // 4. Hapus chapter_progress referencing this chapter
        await client.query('DELETE FROM chapter_progress WHERE chapter_id = $1', [chapterId])

        // 5. Terakhir, dapatkan badge_id chapter untuk di-delete agar tidak ada badge sampah
        const badgeRes = await client.query(
            'SELECT badge_id FROM game_chapters WHERE id = $1',
            [chapterId]
        )

        // Hapus chapter
        const deleteChRes = await client.query(
            'DELETE FROM game_chapters WHERE id = $1 RETURNING id',
            [chapterId]
        )

        if (deleteChRes.rows.length === 0) {
            await client.query('ROLLBACK')
            return res.status(404).json({ message: 'Chapter tidak ditemukan' })
        }

        // Hapus badge jika ada
        const badgeId = badgeRes.rows[0]?.badge_id
        if (badgeId) {
            await client.query('DELETE FROM user_badges WHERE badge_id = $1', [badgeId])
            await client.query('DELETE FROM badges WHERE id = $1', [badgeId])
        }

        await client.query('COMMIT')
        res.json({
            message: 'Chapter beserta seluruh modul dan pre-test di dalamnya berhasil dihapus secara permanen',
            deletedId: chapterId
        })
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('DELETE /api/elearning/admin/chapters/:id error:', err)
        res.status(500).json({ message: 'Server error: ' + err.message })
    } finally {
        client.release()
    }
})

module.exports = router
