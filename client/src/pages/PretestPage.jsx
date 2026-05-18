import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from '../utils/toast.js'
import Layout from '../components/Layout.jsx'
import {
    ArrowLeft, CheckCircle, XCircle, HelpCircle,
    Loader2, ChevronRight, Award, AlertTriangle
} from 'lucide-react'

// ── Question Card (User) ───────────────────────────────────────────────────

function PretestQuestionCard({ question, index, selectedOption, onSelect }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="glass-card p-5"
        >
            <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                </div>
                <p className="text-sm font-semibold text-main leading-relaxed pt-1">
                    {question.question_text}
                </p>
            </div>

            <div className="space-y-2 ml-11">
                {question.options.map((opt, oi) => {
                    const letter = String.fromCharCode(65 + oi)
                    return (
                        <button
                            key={opt.id}
                            onClick={() => onSelect(question.id, opt.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 text-sm leading-snug flex items-center gap-3 ${
                                selectedOption === opt.id
                                    ? 'border-primary bg-primary/15 text-main shadow-md shadow-primary/10 ring-1 ring-primary/30'
                                    : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-main/70 hover:border-primary/40 hover:bg-primary/5'
                            }`}
                        >
                            <span className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                                selectedOption === opt.id
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-gray-300 dark:border-white/20 text-gray-400 dark:text-main/40'
                            }`}>
                                {letter}
                            </span>
                            {opt.option_text}
                        </button>
                    )
                })}
            </div>
        </motion.div>
    )
}

// ── Review Card ────────────────────────────────────────────────────────────

function ReviewCard({ item, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`glass-card p-5 border-l-4 ${
                item.isCorrect ? 'border-l-green-400' : 'border-l-red-400'
            }`}
        >
            <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 mt-0.5">
                    {item.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-main leading-relaxed">
                        {item.orderIndex}. {item.questionText}
                    </p>
                </div>
            </div>

            <div className="ml-8 space-y-2">
                {item.options.map((opt) => {
                    let classes = 'px-4 py-2.5 rounded-xl border text-sm w-full text-left '
                    if (opt.isCorrect) {
                        classes += 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300'
                    } else if (opt.id === item.selectedOptionId && !item.isCorrect) {
                        classes += 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 line-through'
                    } else {
                        classes += 'border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/3 text-gray-400 dark:text-main/40'
                    }

                    return (
                        <div key={opt.id} className={classes}>
                            <span className="flex items-center gap-2">
                                {opt.isCorrect && <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                                {opt.id === item.selectedOptionId && !item.isCorrect && (
                                    <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                                )}
                                {opt.text}
                            </span>
                        </div>
                    )
                })}

                {!item.isCorrect && (
                    <div className="mt-2 text-xs text-green-400/80 flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3" />
                        Jawaban benar: <span className="font-semibold">{item.correctOptionText}</span>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function PretestPage() {
    const { chapterId } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [questions, setQuestions] = useState([])
    const [answers, setAnswers] = useState({}) // { questionId: selectedOptionId }
    const [submitting, setSubmitting] = useState(false)
    const [chapterTitle, setChapterTitle] = useState('')

    // Result state
    const [result, setResult] = useState(null) // { totalQuestions, correctCount, wrongCount, review }
    const [nextLessonId, setNextLessonId] = useState(null)

    useEffect(() => {
        fetchData()
    }, [chapterId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [statusRes, lessonsRes] = await Promise.all([
                axios.get(`/api/preTest/chapters/${chapterId}/status`),
                axios.get('/api/elearning/lessons'),
            ])

            const allLessons = Array.isArray(lessonsRes.data) ? lessonsRes.data : []

            // Build ordered list of unique chapter IDs (sorted by chapter_id asc, same as ELearningPage)
            const uniqueChapterIds = [...new Set(allLessons.map(l => l.chapter_id))]
                .sort((a, b) => Number(a) - Number(b))

            const chapterIndex = uniqueChapterIds.indexOf(Number(chapterId))
            const chapterNum = chapterIndex >= 0 ? chapterIndex + 1 : chapterId
            setChapterTitle(`Chapter ${chapterNum}`)

            // Get first lesson of this chapter
            const chapterLessons = allLessons
                .filter(l => String(l.chapter_id) === String(chapterId))
                .sort((a, b) => Number(a.id) - Number(b.id))

            if (chapterLessons.length > 0) {
                setNextLessonId(chapterLessons[0].id)
            }

            if (statusRes.data.completed) {
                const reviewRes = await axios.get(`/api/preTest/chapters/${chapterId}/review`)
                setResult(reviewRes.data)
            } else {
                const questionsRes = await axios.get(`/api/preTest/chapters/${chapterId}/questions`)
                setQuestions(questionsRes.data.questions || [])
            }
        } catch {
            toast.error('Gagal memuat data pre-test')
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (questionId, optionId) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }))
    }

    const allAnswered = questions.length > 0 && questions.every(q => answers[q.id])

    const handleSubmit = async () => {
        if (!allAnswered || submitting) return
        setSubmitting(true)
        try {
            const payload = {
                answers: questions.map(q => ({
                    questionId: q.id,
                    selectedOptionId: answers[q.id],
                })),
            }
            const res = await axios.post(`/api/preTest/chapters/${chapterId}/submit`, payload)
            setResult(res.data)
        } catch {
            toast.error('Gagal mengirim jawaban pre-test')
        } finally {
            setSubmitting(false)
        }
    }

    // ── Loading ────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                        <p className="text-main/40 text-sm">Memuat soal pre-test...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    // ── No Questions ───────────────────────────────────────────────────────
    if (questions.length === 0 && !result) {
        return (
            <Layout>
                <div className="p-4 md:p-6 max-w-3xl mx-auto">
                    <div className="text-center py-20">
                        <HelpCircle className="w-16 h-16 text-main/10 mx-auto mb-4" />
                        <p className="text-main/40 mb-4">Tidak ada soal pre-test untuk chapter ini.</p>
                        <button onClick={() => navigate('/elearning')} className="btn-primary text-sm">
                            Kembali ke E-Learning
                        </button>
                    </div>
                </div>
            </Layout>
        )
    }

    // ── Result Screen ──────────────────────────────────────────────────────
    if (result) {
        const percentage = result.totalQuestions > 0
            ? Math.round((result.correctCount / result.totalQuestions) * 100)
            : 0

        return (
            <Layout>
                <div className="p-4 md:p-6 max-w-3xl mx-auto">
                    {/* Result Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                            style={{
                                background: percentage >= 70
                                    ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))'
                                    : 'linear-gradient(135deg, rgba(251,146,60,0.2), rgba(251,146,60,0.1))',
                                border: `2px solid ${percentage >= 70 ? 'rgba(34,197,94,0.4)' : 'rgba(251,146,60,0.4)'}`,
                            }}
                        >
                            <Award className="w-10 h-10" style={{ color: percentage >= 70 ? '#22c55e' : '#fb923c' }} />
                        </motion.div>

                        <h1 className="text-2xl font-bold text-main mb-1">Hasil Pre-Test</h1>
                        <p className="text-sm text-main/50">{chapterTitle}</p>

                        {/* Score Summary */}
                        <div className="grid grid-cols-3 gap-3 mt-6 max-w-md mx-auto">
                            <div className="glass-card p-3 text-center">
                                <p className="text-2xl font-bold text-main">{result.totalQuestions}</p>
                                <p className="text-[10px] text-main/40 uppercase tracking-wider">Total Soal</p>
                            </div>
                            <div className="glass-card p-3 text-center">
                                <p className="text-2xl font-bold text-green-400">{result.correctCount}</p>
                                <p className="text-[10px] text-main/40 uppercase tracking-wider">Benar</p>
                            </div>
                            <div className="glass-card p-3 text-center">
                                <p className="text-2xl font-bold text-red-400">{result.wrongCount}</p>
                                <p className="text-[10px] text-main/40 uppercase tracking-wider">Salah</p>
                            </div>
                        </div>

                        <div className="mt-4 glass-card p-3 max-w-xs mx-auto flex items-center justify-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-accent" />
                            <p className="text-xs text-main/60">
                                Pre-test tidak memiliki skor. Tujuannya untuk mengukur pemahaman awal Anda.
                            </p>
                        </div>
                    </motion.div>

                    {/* Review */}
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-main/70 mb-4 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-primary" />
                            Review Jawaban
                        </h2>
                        <div className="space-y-3">
                            {result.review.map((item, i) => (
                                <ReviewCard key={item.questionId} item={item} index={i} />
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/elearning')}
                            className="flex-1 nav-item py-3 text-sm font-semibold justify-center"
                        >
                            <ArrowLeft className="w-4 h-4" /> Kembali
                        </button>
                        <button
                            onClick={() => {
                                if (nextLessonId) navigate(`/elearning/${nextLessonId}`)
                                else navigate('/elearning')
                            }}
                            className="flex-1 btn-primary text-sm py-3 flex items-center justify-center gap-2"
                        >
                            Lanjut ke E-Learning <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </Layout>
        )
    }

    // ── Question Form ──────────────────────────────────────────────────────
    return (
        <Layout>
            <div className="p-4 md:p-6 max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate('/elearning')}
                        className="nav-item p-2 flex-shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl md:text-2xl font-bold text-main">Pre-Test</h1>
                        <p className="text-xs md:text-sm text-main/50">{chapterTitle}</p>
                    </div>
                    <div className="glass-card px-3 py-1.5 text-xs text-main/60">
                        {Object.keys(answers).length}/{questions.length} dijawab
                    </div>
                </div>

                {/* Info Banner */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-3 mb-5 border-accent/20"
                    style={{ background: 'linear-gradient(135deg, rgba(255, 214, 10,0.06), rgba(230,57,70,0.04))' }}
                >
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-main mb-0.5">Tentang Pre-Test</p>
                            <p className="text-[11px] text-main/50 leading-relaxed">
                                Pre-test ini tidak memberikan skor. Tujuannya untuk mengukur pemahaman awal Anda
                                sebelum mengikuti e-learning. Setelah selesai, Anda akan melihat jawaban yang benar dan salah.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Questions */}
                <div className="space-y-3 mb-6">
                    {questions.map((q, i) => (
                        <PretestQuestionCard
                            key={q.id}
                            question={q}
                            index={i}
                            selectedOption={answers[q.id] || null}
                            onSelect={handleSelect}
                        />
                    ))}
                </div>

                {/* Submit */}
                <div className="sticky bottom-4">
                    <button
                        onClick={handleSubmit}
                        disabled={!allAnswered || submitting}
                        className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />Mengirim...</>
                        ) : (
                            <>Kirim Jawaban ({Object.keys(answers).length}/{questions.length})</>
                        )}
                    </button>
                </div>
            </div>
        </Layout>
    )
}
