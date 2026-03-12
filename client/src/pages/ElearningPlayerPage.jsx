import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import Layout from '../components/Layout.jsx'
import {
    ArrowLeft, Star, CheckCircle, XCircle, Play,
    Clock, Zap, HelpCircle, Trophy, BookOpen, Loader2
} from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────────────

function extractYouTubeId(url) {
    if (!url) return null
    const match = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([^&\n?#]{11})/
    )
    return match ? match[1] : null
}

function formatDuration(seconds) {
    if (!seconds && seconds !== 0) return '--:--'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${String(s).padStart(2, '0')}`
}

// ── Demo fallback data (saat backend offline) ──────────────────────────────

// const DEMO_LESSON = {
//     id: 1,
//     chapter_id: 1,
//     title: 'Mengenal dan Menghindari Phishing',
//     description: 'Pelajari cara mengenali email phishing, link berbahaya, dan teknik social engineering yang sering digunakan penyerang.',
//     video_url: 'https://www.youtube.com/watch?v=XBkzBrXlle0',
//     duration_seconds: 600,
//     xp_reward: 150,
//     questions: [
//         {
//             id: 101,
//             question_text: 'Apa yang harus Anda lakukan jika menerima email dari alamat yang mencurigakan dan meminta data pribadi?',
//             timestamp_seconds: 30,
//             xp_reward: 25,
//             order_index: 1,
//             answered: false,
//             answered_correctly: null,
//             selected_option_id: null,
//             options: [
//                 { id: 1001, option_text: 'Langsung membalas email dan memberikan data yang diminta', is_correct: false, order_index: 1 },
//                 { id: 1002, option_text: 'Tidak mengklik link apapun dan segera melaporkan ke tim IT', is_correct: true, order_index: 2 },
//                 { id: 1003, option_text: 'Meneruskan email ke rekan kerja untuk dikonfirmasi bersama', is_correct: false, order_index: 3 },
//                 { id: 1004, option_text: 'Mengabaikan email tanpa perlu melaporkannya ke siapapun', is_correct: false, order_index: 4 },
//             ],
//         },
//         {
//             id: 102,
//             question_text: 'Mana dari berikut ini yang merupakan tanda-tanda khas dari email phishing?',
//             timestamp_seconds: 80,
//             xp_reward: 25,
//             order_index: 2,
//             answered: false,
//             answered_correctly: null,
//             selected_option_id: null,
//             options: [
//                 { id: 1005, option_text: 'Email dari domain resmi perusahaan dengan format yang benar', is_correct: false, order_index: 1 },
//                 { id: 1006, option_text: 'Alamat email mencurigakan dan ejaan yang buruk', is_correct: true, order_index: 2 },
//                 { id: 1007, option_text: 'Email tanpa lampiran dari pengirim yang sudah dikenal', is_correct: false, order_index: 3 },
//                 { id: 1008, option_text: 'Notifikasi rutin dari sistem internal', is_correct: false, order_index: 4 },
//             ],
//         },
//     ],
//     progress: null,
// }

// ── Question Overlay Component ─────────────────────────────────────────────

function QuestionOverlay({ question, onSubmit, onDismiss, submitting }) {
    const [selected, setSelected] = useState(null)
    const [showResult, setShowResult] = useState(false)
    const [resultData, setResultData] = useState(null)

    const handleSubmit = async () => {
        if (!selected || submitting) return
        const result = await onSubmit(selected)
        if (result) {
            setResultData(result)
            setShowResult(true)
        }
    }

    const correctOption = question.options.find(o => o.is_correct)

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
        >
            <motion.div
                initial={{ scale: 0.85, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 30 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                className="w-full max-w-lg"
            >
                {/* Kuis badge */}
                <div className="text-center mb-5">
                    <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary mx-auto flex items-center justify-center mb-3 shadow-lg shadow-primary/30">
                        <HelpCircle className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
                        ⚡ Kuis Interaktif
                    </p>
                    <p className="text-xs text-white/40">Video dijeda — jawab pertanyaan ini untuk melanjutkan</p>
                </div>

                <div className="glass-card p-6">
                    {!showResult ? (
                        <>
                            <p className="font-semibold text-white text-center leading-relaxed mb-6">
                                {question.question_text}
                            </p>

                            <div className="space-y-3 mb-6">
                                {question.options.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSelected(opt.id)}
                                        className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 text-sm leading-snug ${
                                            selected === opt.id
                                                ? 'border-primary bg-primary/20 text-white shadow-lg shadow-primary/20'
                                                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        {opt.option_text}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!selected || submitting}
                                className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Memeriksa...
                                    </>
                                ) : 'Kirim Jawaban'}
                            </button>

                            <p className="text-center text-xs text-accent mt-3">
                                +{question.xp_reward} XP jika menjawab benar
                            </p>
                        </>
                    ) : (
                        <div className="text-center py-2">
                            {resultData?.isCorrect ? (
                                <>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', damping: 15 }}
                                    >
                                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-3" />
                                    </motion.div>
                                    <p className="text-2xl font-bold text-green-400 mb-1">Benar! 🎉</p>
                                    <p className="text-white/60 text-sm mb-4">Jawaban kamu tepat sasaran.</p>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="inline-flex items-center gap-2 bg-accent/20 border border-accent/40 text-accent px-5 py-2.5 rounded-xl font-bold text-lg mb-5"
                                    >
                                        <Star className="w-5 h-5" />
                                        +{resultData.xpAwarded} XP
                                    </motion.div>
                                </>
                            ) : (
                                <>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', damping: 15 }}
                                    >
                                        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-3" />
                                    </motion.div>
                                    <p className="text-2xl font-bold text-red-400 mb-1">Kurang tepat</p>
                                    <p className="text-white/60 text-sm mb-2">Jawaban yang benar:</p>
                                    <p className="text-white font-semibold text-sm bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2 mb-5">
                                        {correctOption?.option_text}
                                    </p>
                                </>
                            )}

                            <button onClick={onDismiss} className="btn-primary w-full flex items-center justify-center gap-2">
                                <Play className="w-4 h-4" />
                                Lanjutkan Video
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ElearningPlayerPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [lesson, setLesson] = useState(null)
    const [loading, setLoading] = useState(true)
    const [ytReady, setYtReady] = useState(false)
    const [playerReady, setPlayerReady] = useState(false)

    // Quiz state
    const [activeQuestion, setActiveQuestion] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    // answeredMap: { [questionId]: { isCorrect, xpAwarded } }
    const [answeredMap, setAnsweredMap] = useState({})

    // XP & completion
    const [videoCompleted, setVideoCompleted] = useState(false)
    const [totalXpEarned, setTotalXpEarned] = useState(0)

    // Refs — do NOT trigger re-renders
    const ytPlayer = useRef(null)
    const pollRef = useRef(null)
    const lessonRef = useRef(null)
    const triggeredRef = useRef(new Set())  // question IDs already shown
    const answeredRef = useRef(new Set())   // question IDs already answered
    const videoCompletedRef = useRef(false)

    // Keep refs in sync
    useEffect(() => { lessonRef.current = lesson }, [lesson])
    useEffect(() => { videoCompletedRef.current = videoCompleted }, [videoCompleted])

    // ── Mount: fetch lesson + load YouTube API ──────────────────────────────
    useEffect(() => {
        fetchLesson()
        loadYouTubeAPI()
        return () => {
            stopPolling()
            if (ytPlayer.current?.destroy) ytPlayer.current.destroy()
        }
    }, [id])

    // ── Create player once both lesson data AND YT API are ready ───────────
    useEffect(() => {
        if (lesson && ytReady) {
            // Short delay to ensure #yt-player div is in the DOM
            const t = setTimeout(createPlayer, 150)
            return () => clearTimeout(t)
        }
    }, [lesson, ytReady])

    // ── Fetch lesson from API ───────────────────────────────────────────────
    const fetchLesson = async () => {
        try {
            const res = await axios.get(`/api/elearning/lessons/${id}`)
            const data = res.data
            setLesson(data)

            // Restore previously answered questions
            const answered = {}
            data.questions.forEach(q => {
                if (q.answered) {
                    answered[q.id] = { isCorrect: q.answered_correctly, xpAwarded: 0 }
                    answeredRef.current.add(q.id)
                    triggeredRef.current.add(q.id)
                }
            })
            setAnsweredMap(answered)

            if (data.progress?.completed) {
                setVideoCompleted(true)
                videoCompletedRef.current = true
                setTotalXpEarned(data.progress.xp_earned || 0)
            }
        } catch {
            // Demo mode
            setLesson({ ...DEMO_LESSON, id: parseInt(id) })
        } finally {
            setLoading(false)
        }
    }

    // ── YouTube IFrame API loader ───────────────────────────────────────────
    const loadYouTubeAPI = () => {
        if (window.YT && window.YT.Player) {
            setYtReady(true)
            return
        }
        // Set global callback — YouTube calls this when its script loads
        window.onYouTubeIframeAPIReady = () => setYtReady(true)

        if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
            const script = document.createElement('script')
            script.src = 'https://www.youtube.com/iframe_api'
            document.head.appendChild(script)
        }
    }

    // ── Create YouTube player ───────────────────────────────────────────────
    const createPlayer = () => {
        const el = document.getElementById('yt-player')
        if (!el || !window.YT?.Player) return

        const videoId = extractYouTubeId(lessonRef.current?.video_url)
        if (!videoId) return

        if (ytPlayer.current?.destroy) ytPlayer.current.destroy()

        ytPlayer.current = new window.YT.Player('yt-player', {
            videoId,
            playerVars: {
                rel: 0,
                modestbranding: 1,
                fs: 1,
                enablejsapi: 1,
            },
            events: {
                onReady: () => setPlayerReady(true),
                onStateChange: handleStateChange,
            },
        })
    }

    // ── Player state change handler ─────────────────────────────────────────
    const handleStateChange = (event) => {
        const { PlayerState } = window.YT
        if (event.data === PlayerState.PLAYING) {
            startPolling()
        } else {
            stopPolling()
            if (event.data === PlayerState.ENDED) {
                handleVideoEnd()
            }
        }
    }

    // ── Poll every second while video plays ────────────────────────────────
    const startPolling = () => {
        stopPolling()
        pollRef.current = setInterval(() => {
            if (!ytPlayer.current?.getCurrentTime) return
            const currentTime = ytPlayer.current.getCurrentTime()

            // Check if any untriggered question's timestamp has been reached
            const questions = lessonRef.current?.questions || []
            const nextQ = questions.find(
                q => !triggeredRef.current.has(q.id) && currentTime >= q.timestamp_seconds
            )

            if (nextQ) {
                ytPlayer.current.pauseVideo()
                triggeredRef.current.add(nextQ.id)
                setActiveQuestion(nextQ)
            }

            // Save progress every 15 s
            if (Math.round(currentTime) > 0 && Math.round(currentTime) % 15 === 0) {
                saveProgress(currentTime)
            }
        }, 1000)
    }

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
        }
    }

    const saveProgress = async (watchTime) => {
        try {
            await axios.post(`/api/elearning/lessons/${id}/progress`, {
                watchTimeSeconds: Math.round(watchTime),
            })
        } catch { /* ignore in demo / offline */ }
    }

    // ── Video ended ────────────────────────────────────────────────────────
    const handleVideoEnd = async () => {
        if (videoCompletedRef.current) return
        stopPolling()

        try {
            const res = await axios.post(`/api/elearning/lessons/${id}/complete`)
            setVideoCompleted(true)
            videoCompletedRef.current = true
            if (res.data.xpAwarded > 0) {
                setTotalXpEarned(prev => prev + res.data.xpAwarded)
                toast.success(`🎉 Video selesai! +${res.data.xpAwarded} XP Bonus!`, { duration: 5000 })
            } else {
                toast.success('Video selesai ditonton!', { duration: 3000 })
            }
        } catch {
            setVideoCompleted(true)
            videoCompletedRef.current = true
            toast.success('Video selesai ditonton!', { duration: 3000 })
        }
    }

    // ── Submit answer (called from QuestionOverlay) ────────────────────────
    const submitAnswer = async (selectedOptionId) => {
        if (submitting) return null
        setSubmitting(true)

        try {
            const res = await axios.post(
                `/api/elearning/questions/${activeQuestion.id}/answer`,
                { selectedOptionId }
            )
            const { isCorrect, xpAwarded } = res.data

            answeredRef.current.add(activeQuestion.id)
            setAnsweredMap(prev => ({
                ...prev,
                [activeQuestion.id]: { isCorrect, xpAwarded: xpAwarded || 0 },
            }))

            if (xpAwarded > 0) {
                setTotalXpEarned(prev => prev + xpAwarded)
            }

            return { isCorrect, xpAwarded: xpAwarded || 0 }
        } catch {
            // Demo mode — evaluate locally
            const option = activeQuestion.options.find(o => o.id === selectedOptionId)
            const isCorrect = option?.is_correct || false
            const xpAwarded = isCorrect ? activeQuestion.xp_reward : 0

            answeredRef.current.add(activeQuestion.id)
            setAnsweredMap(prev => ({
                ...prev,
                [activeQuestion.id]: { isCorrect, xpAwarded },
            }))

            if (xpAwarded > 0) setTotalXpEarned(prev => prev + xpAwarded)

            return { isCorrect, xpAwarded }
        } finally {
            setSubmitting(false)
        }
    }

    // ── Dismiss question and resume video ──────────────────────────────────
    const dismissQuestion = () => {
        setActiveQuestion(null)
        if (ytPlayer.current?.playVideo) ytPlayer.current.playVideo()
    }

    // ── Derived values ─────────────────────────────────────────────────────
    const videoId = lesson ? extractYouTubeId(lesson.video_url) : null
    const totalQuestions = lesson?.questions?.length || 0
    const correctCount = Object.values(answeredMap).filter(a => a.isCorrect).length
    const answeredCount = Object.keys(answeredMap).length

    // ── Loading screen ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-white/50">Memuat video pembelajaran...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!lesson) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-full">
                    <p className="text-white/50">Video tidak ditemukan.</p>
                </div>
            </Layout>
        )
    }

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <Layout>
            <div className="p-6 max-w-7xl mx-auto">

                {/* ── Top Bar ── */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/elearning')}
                        className="nav-item p-2 flex-shrink-0"
                        title="Kembali ke E-Learning"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-white/40 mb-0.5">
                            <BookOpen className="w-3 h-3" />
                            <span>Chapter {lesson.chapter_id}</span>
                        </div>
                        <h1 className="text-lg font-bold text-white truncate">{lesson.title}</h1>
                    </div>

                    {/* XP earned pill */}
                    <div className="glass-card px-4 py-2 flex items-center gap-2 flex-shrink-0">
                        <Star className="w-4 h-4 text-accent" />
                        <span className="text-accent font-bold text-sm">+{totalXpEarned} XP</span>
                    </div>
                </div>

                {/* ── Two-column layout ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left: Video + Info ── */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Video player */}
                        <div className="glass-card overflow-hidden">
                            {videoId ? (
                                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                    {/* The yt-player div will be REPLACED by YouTube's iframe */}
                                    <div
                                        id="yt-player"
                                        className="absolute inset-0 w-full h-full bg-dark-surface"
                                    />
                                    {/* Show spinner until player is ready */}
                                    {!playerReady && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-dark-surface">
                                            <div className="text-center">
                                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                                <p className="text-xs text-white/40">Memuat player YouTube...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="aspect-video bg-dark-surface flex flex-col items-center justify-center gap-3">
                                    <Zap className="w-12 h-12 text-white/10" />
                                    <p className="text-white/40 text-sm">Format URL video tidak didukung</p>
                                    <p className="text-white/20 text-xs">{lesson.video_url}</p>
                                </div>
                            )}
                        </div>

                        {/* Lesson info */}
                        <div className="glass-card p-5">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <h2 className="font-bold text-white leading-snug">{lesson.title}</h2>
                                {videoCompleted && (
                                    <span className="flex-shrink-0 flex items-center gap-1 bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg text-xs font-bold">
                                        <CheckCircle className="w-3.5 h-3.5" /> Selesai
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-white/60 leading-relaxed mb-4">{lesson.description}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-white/40">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    {formatDuration(lesson.duration_seconds)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Star className="w-4 h-4 text-accent" />
                                    <span className="text-accent font-semibold">+{lesson.xp_reward} XP</span>
                                    setelah selesai
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <HelpCircle className="w-4 h-4 text-primary" />
                                    {totalQuestions} kuis interaktif
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Quiz list + Completion ── */}
                    <div className="space-y-4">

                        {/* Quiz list card */}
                        <div className="glass-card p-4">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-white text-sm">Kuis Interaktif</h3>
                                {answeredCount > 0 && (
                                    <span className="text-xs text-white/40">
                                        {answeredCount}/{totalQuestions} dijawab
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-white/40 mb-4 leading-relaxed">
                                Kuis muncul otomatis saat video mencapai timestamp tertentu
                            </p>

                            {totalQuestions === 0 ? (
                                <p className="text-xs text-white/30 italic">Belum ada kuis untuk video ini.</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {lesson.questions.map((q, i) => {
                                        const ans = answeredMap[q.id]
                                        return (
                                            <div
                                                key={q.id}
                                                className={`p-3 rounded-xl border transition-colors ${
                                                    ans
                                                        ? ans.isCorrect
                                                            ? 'bg-green-500/10 border-green-500/30'
                                                            : 'bg-red-500/10 border-red-500/30'
                                                        : 'bg-white/5 border-white/10'
                                                }`}
                                            >
                                                <div className="flex items-start gap-2.5">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                                        ans
                                                            ? ans.isCorrect
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-red-500 text-white'
                                                            : 'bg-white/10 text-white/50'
                                                    }`}>
                                                        {ans ? (ans.isCorrect ? '✓' : '✗') : i + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-white/70 leading-snug line-clamp-2">
                                                            {q.question_text}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-xs text-white/30">
                                                                @{formatDuration(q.timestamp_seconds)}
                                                            </span>
                                                            {ans ? (
                                                                <span className={`text-xs font-semibold ${ans.isCorrect ? 'text-accent' : 'text-white/30'}`}>
                                                                    {ans.isCorrect ? `+${ans.xpAwarded} XP` : '0 XP'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-white/30">+{q.xp_reward} XP</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Score summary */}
                            {answeredCount > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="text-white/50">Skor Kuis</span>
                                        <span className="font-bold text-white">
                                            {correctCount}/{totalQuestions} benar
                                        </span>
                                    </div>
                                    <div className="xp-bar h-2">
                                        <div
                                            className="xp-bar-fill"
                                            style={{ width: `${totalQuestions ? (correctCount / totalQuestions) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Completion card — appears when video is done */}
                        <AnimatePresence>
                            {videoCompleted && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="glass-card p-5 border-accent/30"
                                    style={{ background: 'linear-gradient(135deg, rgba(255,214,10,0.1), rgba(230,57,70,0.08))' }}
                                >
                                    <div className="text-center">
                                        <Trophy className="w-12 h-12 text-accent mx-auto mb-3" />
                                        <p className="font-bold text-white text-lg">Video Selesai!</p>
                                        <p className="text-xs text-white/50 mt-1 mb-3">
                                            Total XP dari sesi ini:
                                        </p>
                                        <p className="text-3xl font-bold text-accent mb-4">
                                            +{totalXpEarned} XP
                                        </p>

                                        {totalQuestions > 0 && (
                                            <div className="glass-card p-3 mb-4 text-xs text-white/60">
                                                Kuis: <span className="text-white font-bold">{correctCount}/{totalQuestions}</span> benar
                                            </div>
                                        )}

                                        <button
                                            onClick={() => navigate('/elearning')}
                                            className="btn-primary w-full text-sm"
                                        >
                                            Kembali ke E-Learning
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Instruction card — visible before video ends */}
                        {!videoCompleted && (
                            <div className="glass-card p-4">
                                <p className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-accent" />
                                    Tips Menonton
                                </p>
                                <ul className="text-xs text-white/50 space-y-1.5 leading-relaxed">
                                    <li>• Tonton hingga akhir untuk mendapat <span className="text-accent font-semibold">+{lesson.xp_reward} XP bonus</span></li>
                                    <li>• Jawab kuis yang muncul untuk XP tambahan per soal</li>
                                    <li>• Progress tersimpan otomatis saat menonton</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Question Overlay (modal) ── */}
            <AnimatePresence>
                {activeQuestion && (
                    <QuestionOverlay
                        key={activeQuestion.id}
                        question={activeQuestion}
                        onSubmit={submitAnswer}
                        onDismiss={dismissQuestion}
                        submitting={submitting}
                    />
                )}
            </AnimatePresence>
        </Layout>
    )
}
