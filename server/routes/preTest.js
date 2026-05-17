const router = require('express').Router()
const pool   = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: GET /api/preTest/admin/chapters/:chapterId
// Ambil semua soal + pilihan untuk chapter tertentu (admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.get(
    '/admin/chapters/:chapterId',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
        const { chapterId } = req.params
        try {
            const chapterCheck = await pool.query(
                'SELECT ch_id FROM chapters WHERE ch_id = $1', [chapterId]
            )
            if (chapterCheck.rowCount === 0) {
                return res.status(404).json({ message: 'Chapter tidak ditemukan' })
            }

            const questionsResult = await pool.query(
                `SELECT pq_id, ch_id, pq_number, pq_text, created_at
                 FROM pretest_questions WHERE ch_id = $1 ORDER BY pq_number ASC`,
                [chapterId]
            )

            const questionIds = questionsResult.rows.map(q => q.pq_id)
            let optionsMap = {}
            if (questionIds.length > 0) {
                const optionsResult = await pool.query(
                    `SELECT po_id, pq_id, po_text, is_correct
                     FROM pretest_options WHERE pq_id = ANY($1::int[]) ORDER BY po_id ASC`,
                    [questionIds]
                )
                for (const opt of optionsResult.rows) {
                    if (!optionsMap[opt.pq_id]) optionsMap[opt.pq_id] = []
                    optionsMap[opt.pq_id].push({
                        id: opt.po_id, option_text: opt.po_text, is_correct: opt.is_correct,
                    })
                }
            }

            const questions = questionsResult.rows.map(q => ({
                id: q.pq_id, ch_id: q.ch_id, question_text: q.pq_text,
                order_index: q.pq_number, created_at: q.created_at,
                options: optionsMap[q.pq_id] || [],
            }))

            return res.json({ questions })
        } catch (err) {
            console.error('[GET preTest] Error:', err)
            return res.status(500).json({ message: 'Server error' })
        }
    }
)

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: POST /api/preTest/admin/chapters/:chapterId/questions
// Tambah SATU soal baru (dipakai modal di AdminElearningPage)
// ─────────────────────────────────────────────────────────────────────────────
router.post(
    '/admin/chapters/:chapterId/questions',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
        const { chapterId } = req.params
        const { questionText, options } = req.body

        if (!questionText || !questionText.trim()) {
            return res.status(400).json({ message: 'Teks pertanyaan tidak boleh kosong' })
        }
        const filledOptions = (options || []).filter(o => o?.optionText?.trim())
        if (filledOptions.length < 2) {
            return res.status(400).json({ message: 'Minimal 2 pilihan jawaban harus diisi' })
        }
        if (!filledOptions.some(o => o.isCorrect === true)) {
            return res.status(400).json({ message: 'Harus ada minimal satu jawaban yang benar' })
        }

        const client = await pool.connect()
        try {
            await client.query('BEGIN')
            const chapterCheck = await client.query(
                'SELECT ch_id FROM chapters WHERE ch_id = $1', [chapterId]
            )
            if (chapterCheck.rowCount === 0) {
                await client.query('ROLLBACK')
                return res.status(404).json({ message: 'Chapter tidak ditemukan' })
            }

            const countResult = await client.query(
                'SELECT COALESCE(MAX(pq_number), 0) + 1 AS next_number FROM pretest_questions WHERE ch_id = $1',
                [chapterId]
            )
            const nextNumber = countResult.rows[0].next_number

            const questionResult = await client.query(
                `INSERT INTO pretest_questions (ch_id, pq_number, pq_text, created_at)
                 VALUES ($1, $2, $3, CURRENT_DATE) RETURNING pq_id, ch_id, pq_number, pq_text, created_at`,
                [chapterId, nextNumber, questionText.trim()]
            )
            const newQuestion = questionResult.rows[0]

            const insertedOptions = []
            for (const opt of filledOptions) {
                const optResult = await client.query(
                    `INSERT INTO pretest_options (pq_id, po_text, is_correct)
                     VALUES ($1, $2, $3) RETURNING po_id, po_text, is_correct`,
                    [newQuestion.pq_id, opt.optionText.trim(), opt.isCorrect === true]
                )
                insertedOptions.push({
                    id: optResult.rows[0].po_id,
                    option_text: optResult.rows[0].po_text,
                    is_correct: optResult.rows[0].is_correct,
                })
            }

            await client.query('COMMIT')
            return res.status(201).json({
                message: 'Soal berhasil ditambahkan',
                question: {
                    id: newQuestion.pq_id, ch_id: newQuestion.ch_id,
                    question_text: newQuestion.pq_text, order_index: newQuestion.pq_number,
                    created_at: newQuestion.created_at, options: insertedOptions,
                },
            })
        } catch (err) {
            await client.query('ROLLBACK')
            console.error('[POST preTest question] Error:', err)
            return res.status(500).json({ message: 'Server error' })
        } finally {
            client.release()
        }
    }
)

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: PUT /api/preTest/admin/chapters/:chapterId
// Replace SEMUA soal chapter (bulk save dari AdminPretestPage)
// ─────────────────────────────────────────────────────────────────────────────
router.put(
    '/admin/chapters/:chapterId',
    requireAuth,
    requireRole('admin'),
    async (req, res) => {
        const { chapterId } = req.params
        const { questions } = req.body

        if (!Array.isArray(questions)) {
            return res.status(400).json({ message: 'Format data tidak valid' })
        }
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i]
            if (!q.questionText || !q.questionText.trim()) {
                return res.status(400).json({ message: `Pertanyaan ke-${i + 1}: teks tidak boleh kosong` })
            }
            const filled = (q.options || []).filter(o => o?.optionText?.trim())
            if (filled.length < 2) {
                return res.status(400).json({ message: `Pertanyaan ke-${i + 1}: minimal 2 pilihan harus diisi` })
            }
            if (!filled.some(o => o.isCorrect === true)) {
                return res.status(400).json({ message: `Pertanyaan ke-${i + 1}: harus ada jawaban yang benar` })
            }
        }

        const client = await pool.connect()
        try {
            await client.query('BEGIN')
            const chapterCheck = await client.query(
                'SELECT ch_id FROM chapters WHERE ch_id = $1', [chapterId]
            )
            if (chapterCheck.rowCount === 0) {
                await client.query('ROLLBACK')
                return res.status(404).json({ message: 'Chapter tidak ditemukan' })
            }

            // Delete old user answers first
            await client.query(
                `DELETE FROM pretest_user_answers WHERE pq_id IN (
                    SELECT pq_id FROM pretest_questions WHERE ch_id = $1
                )`, [chapterId]
            )
            // Delete old attempts
            await client.query('DELETE FROM pretest_attempts WHERE ch_id = $1', [chapterId])
            // Delete old options
            await client.query(
                `DELETE FROM pretest_options WHERE pq_id IN (
                    SELECT pq_id FROM pretest_questions WHERE ch_id = $1
                )`, [chapterId]
            )
            // Delete old questions
            await client.query('DELETE FROM pretest_questions WHERE ch_id = $1', [chapterId])

            const savedQuestions = []
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i]
                const orderIndex = q.orderIndex ?? i + 1
                const questionResult = await client.query(
                    `INSERT INTO pretest_questions (ch_id, pq_number, pq_text, created_at)
                     VALUES ($1, $2, $3, CURRENT_DATE) RETURNING pq_id, ch_id, pq_number, pq_text, created_at`,
                    [chapterId, orderIndex, q.questionText.trim()]
                )
                const newQ = questionResult.rows[0]
                const filled = (q.options || []).filter(o => o?.optionText?.trim())
                const savedOptions = []
                for (const opt of filled) {
                    const optResult = await client.query(
                        `INSERT INTO pretest_options (pq_id, po_text, is_correct)
                         VALUES ($1, $2, $3) RETURNING po_id, po_text, is_correct`,
                        [newQ.pq_id, opt.optionText.trim(), opt.isCorrect === true]
                    )
                    savedOptions.push({
                        id: optResult.rows[0].po_id,
                        option_text: optResult.rows[0].po_text,
                        is_correct: optResult.rows[0].is_correct,
                    })
                }
                savedQuestions.push({
                    id: newQ.pq_id, ch_id: newQ.ch_id, question_text: newQ.pq_text,
                    order_index: newQ.pq_number, created_at: newQ.created_at, options: savedOptions,
                })
            }

            await client.query('COMMIT')
            return res.json({ message: 'Pre-test berhasil disimpan', questions: savedQuestions })
        } catch (err) {
            await client.query('ROLLBACK')
            console.error('[PUT preTest] Error:', err)
            return res.status(500).json({ message: 'Server error' })
        } finally {
            client.release()
        }
    }
)

// ═════════════════════════════════════════════════════════════════════════════
// USER ENDPOINTS
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// USER: GET /api/preTest/chapters/:chapterId/status
// Cek apakah chapter punya pre-test dan apakah user sudah selesai
// ─────────────────────────────────────────────────────────────────────────────
router.get('/chapters/:chapterId/status', requireAuth, async (req, res) => {
    const { chapterId } = req.params
    const userId = req.user.userId
    try {
        const countRes = await pool.query(
            'SELECT COUNT(*)::int AS total FROM pretest_questions WHERE ch_id = $1', [chapterId]
        )
        const total = countRes.rows[0].total
        if (total === 0) {
            return res.json({ hasPretest: false, completed: false, total: 0 })
        }

        const attemptRes = await pool.query(
            'SELECT pa_id, correct_count, wrong_count FROM pretest_attempts WHERE user_id = $1 AND ch_id = $2',
            [userId, chapterId]
        )
        const completed = attemptRes.rowCount > 0
        return res.json({
            hasPretest: true, completed, total,
            correctCount: attemptRes.rows[0]?.correct_count || 0,
            wrongCount: attemptRes.rows[0]?.wrong_count || 0,
        })
    } catch (err) {
        console.error('[GET preTest status] Error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// ─────────────────────────────────────────────────────────────────────────────
// USER: GET /api/preTest/chapters/:chapterId/questions
// Ambil soal pre-test untuk user (tanpa is_correct, acak opsi)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/chapters/:chapterId/questions', requireAuth, async (req, res) => {
    const { chapterId } = req.params
    try {
        const questionsResult = await pool.query(
            `SELECT pq_id, pq_number, pq_text FROM pretest_questions
             WHERE ch_id = $1 ORDER BY pq_number ASC`, [chapterId]
        )
        if (questionsResult.rowCount === 0) {
            return res.json({ questions: [] })
        }

        const questionIds = questionsResult.rows.map(q => q.pq_id)
        const optionsResult = await pool.query(
            `SELECT po_id, pq_id, po_text FROM pretest_options
             WHERE pq_id = ANY($1::int[]) ORDER BY RANDOM()`, [questionIds]
        )

        const optionsMap = {}
        for (const opt of optionsResult.rows) {
            if (!optionsMap[opt.pq_id]) optionsMap[opt.pq_id] = []
            optionsMap[opt.pq_id].push({ id: opt.po_id, option_text: opt.po_text })
        }

        const questions = questionsResult.rows.map(q => ({
            id: q.pq_id, question_text: q.pq_text, order_index: q.pq_number,
            options: optionsMap[q.pq_id] || [],
        }))

        return res.json({ questions })
    } catch (err) {
        console.error('[GET preTest questions user] Error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

// ─────────────────────────────────────────────────────────────────────────────
// USER: POST /api/preTest/chapters/:chapterId/submit
// Submit jawaban pre-test → simpan hasil, return review
// Body: { answers: [{ questionId, selectedOptionId }] }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/chapters/:chapterId/submit', requireAuth, async (req, res) => {
    const { chapterId } = req.params
    const userId = req.user.userId
    const { answers } = req.body

    if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ message: 'Jawaban tidak boleh kosong' })
    }

    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        // Get all questions + correct options for this chapter
        const questionsRes = await client.query(
            `SELECT pq.pq_id, pq.pq_text, pq.pq_number FROM pretest_questions pq
             WHERE pq.ch_id = $1 ORDER BY pq.pq_number ASC`, [chapterId]
        )
        const questionIds = questionsRes.rows.map(q => q.pq_id)

        const optionsRes = await client.query(
            `SELECT po_id, pq_id, po_text, is_correct FROM pretest_options
             WHERE pq_id = ANY($1::int[]) ORDER BY po_id ASC`, [questionIds]
        )
        const optionsMap = {}
        for (const opt of optionsRes.rows) {
            if (!optionsMap[opt.pq_id]) optionsMap[opt.pq_id] = []
            optionsMap[opt.pq_id].push(opt)
        }

        let correctCount = 0
        let wrongCount = 0
        const review = []

        // Delete old user answers for this chapter
        await client.query(
            `DELETE FROM pretest_user_answers WHERE user_id = $1 AND pq_id = ANY($2::int[])`,
            [userId, questionIds]
        )

        for (const q of questionsRes.rows) {
            const answer = answers.find(a => a.questionId === q.pq_id)
            const selectedOptionId = answer?.selectedOptionId || null
            const allOptions = optionsMap[q.pq_id] || []
            const correctOption = allOptions.find(o => o.is_correct)
            const selectedOption = allOptions.find(o => o.po_id === selectedOptionId)
            const isCorrect = selectedOption?.is_correct === true

            if (isCorrect) correctCount++
            else wrongCount++

            // Save user answer
            if (selectedOptionId) {
                await client.query(
                    `INSERT INTO pretest_user_answers (user_id, pq_id, selected_po_id, is_correct, answered_at)
                     VALUES ($1, $2, $3, $4, NOW())
                     ON CONFLICT (user_id, pq_id) DO UPDATE
                     SET selected_po_id = $3, is_correct = $4, answered_at = NOW()`,
                    [userId, q.pq_id, selectedOptionId, isCorrect]
                )
            }

            review.push({
                questionId: q.pq_id,
                questionText: q.pq_text,
                orderIndex: q.pq_number,
                isCorrect,
                selectedOptionId,
                selectedOptionText: selectedOption?.po_text || null,
                correctOptionId: correctOption?.po_id || null,
                correctOptionText: correctOption?.po_text || null,
                options: allOptions.map(o => ({
                    id: o.po_id, text: o.po_text, isCorrect: o.is_correct,
                })),
            })
        }

        // Save attempt (upsert)
        await client.query(
            `INSERT INTO pretest_attempts (user_id, ch_id, total_questions, correct_count, wrong_count, completed_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (user_id, ch_id) DO UPDATE
             SET total_questions = $3, correct_count = $4, wrong_count = $5, completed_at = NOW()`,
            [userId, chapterId, questionsRes.rowCount, correctCount, wrongCount]
        )

        await client.query('COMMIT')

        return res.json({
            message: 'Pre-test selesai',
            totalQuestions: questionsRes.rowCount,
            correctCount,
            wrongCount,
            review,
        })
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('[POST preTest submit] Error:', err)
        return res.status(500).json({ message: 'Server error' })
    } finally {
        client.release()
    }
})

// ─────────────────────────────────────────────────────────────────────────────
// USER: GET /api/preTest/chapters/:chapterId/review
// Mengambil review hasil pre-test yang sudah dikerjakan
// ─────────────────────────────────────────────────────────────────────────────
router.get('/chapters/:chapterId/review', requireAuth, async (req, res) => {
    const { chapterId } = req.params
    const userId = req.user.userId

    try {
        const attemptRes = await pool.query(
            'SELECT total_questions, correct_count, wrong_count FROM pretest_attempts WHERE user_id = $1 AND ch_id = $2',
            [userId, chapterId]
        )
        if (attemptRes.rowCount === 0) {
            return res.status(404).json({ message: 'Belum ada data pre-test' })
        }
        const attempt = attemptRes.rows[0]

        const questionsRes = await pool.query(
            `SELECT pq.pq_id, pq.pq_text, pq.pq_number FROM pretest_questions pq
             WHERE pq.ch_id = $1 ORDER BY pq.pq_number ASC`, [chapterId]
        )
        const questionIds = questionsRes.rows.map(q => q.pq_id)

        const optionsRes = await pool.query(
            `SELECT po_id, pq_id, po_text, is_correct FROM pretest_options
             WHERE pq_id = ANY($1::int[]) ORDER BY po_id ASC`, [questionIds]
        )
        const optionsMap = {}
        for (const opt of optionsRes.rows) {
            if (!optionsMap[opt.pq_id]) optionsMap[opt.pq_id] = []
            optionsMap[opt.pq_id].push(opt)
        }

        const userAnswersRes = await pool.query(
            `SELECT pq_id, selected_po_id, is_correct FROM pretest_user_answers
             WHERE user_id = $1 AND pq_id = ANY($2::int[])`,
            [userId, questionIds]
        )
        const answersMap = {}
        for (const ans of userAnswersRes.rows) {
            answersMap[ans.pq_id] = ans
        }

        const review = []
        for (const q of questionsRes.rows) {
            const ans = answersMap[q.pq_id]
            const selectedOptionId = ans?.selected_po_id || null
            const allOptions = optionsMap[q.pq_id] || []
            const correctOption = allOptions.find(o => o.is_correct)
            const selectedOption = allOptions.find(o => o.po_id === selectedOptionId)
            
            review.push({
                questionId: q.pq_id,
                questionText: q.pq_text,
                orderIndex: q.pq_number,
                isCorrect: ans?.is_correct === true,
                selectedOptionId,
                selectedOptionText: selectedOption?.po_text || null,
                correctOptionId: correctOption?.po_id || null,
                correctOptionText: correctOption?.po_text || null,
                options: allOptions.map(o => ({
                    id: o.po_id, text: o.po_text, isCorrect: o.is_correct,
                })),
            })
        }

        return res.json({
            totalQuestions: attempt.total_questions,
            correctCount: attempt.correct_count,
            wrongCount: attempt.wrong_count,
            review,
        })
    } catch (err) {
        console.error('[GET preTest review] Error:', err)
        return res.status(500).json({ message: 'Server error' })
    }
})

module.exports = router