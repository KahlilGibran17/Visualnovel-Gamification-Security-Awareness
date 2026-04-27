import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from '../utils/toast.js'
import Layout from '../components/Layout.jsx'
import {
    ArrowLeft, Star, CheckCircle, XCircle, Play, Pause,
    Clock, Zap, HelpCircle, Trophy, BookOpen, Loader2,
    Volume2, VolumeX, Maximize, SkipForward
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useGame } from '../contexts/GameContext.jsx'
import { useAudio } from '../contexts/AudioContext.jsx'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(seconds) {
    if (!seconds && seconds !== 0) return '--:--'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function parseDurationToSeconds(value) {
    if (value == null) return null
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
        const parts = value.split(':')
        if (parts.length === 2) {
            const m = Number(parts[0])
            const s = Number(parts[1])
            if (Number.isFinite(m) && Number.isFinite(s)) return m * 60 + s
        }
        const n = Number(value)
        if (Number.isFinite(n)) return n
    }
    return null
}

// ── Question Overlay ───────────────────────────────────────────────────────

function QuestionOverlay({ question, onSubmit, onDismiss, submitting, onUiClick }) {
    const [selected, setSelected] = useState(null)
    const [showResult, setShowResult] = useState(false)
    const [resultData, setResultData] = useState(null)

    const handleSubmit = async () => {
        if (!selected || submitting) return
        onUiClick?.('click')
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
            className="fixed inset-0 z-50 flex items-center justify-center px-5 -mt-20 pt-20"
            style={{ backdropFilter: 'blur(12px)' }}
        >
            <motion.div
                initial={{ scale: 0.85, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 30 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="w-full max-w-lg bg-black rounded-2xl pt-8" 
            >
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
                                        onClick={() => {
                                            onUiClick?.('click')
                                            setSelected(opt.id)
                                        }}
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
                                    <><Loader2 className="w-4 h-4 animate-spin" />Memeriksa...</>
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
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}>
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
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}>
                                        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-3" />
                                    </motion.div>
                                    <p className="text-2xl font-bold text-red-400 mb-1">Kurang tepat</p>
                                    <p className="text-white/60 text-sm mb-2">Jawaban yang benar:</p>
                                    <p className="text-white font-semibold text-sm bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2 mb-5">
                                        {correctOption?.option_text}
                                    </p>
                                </>
                            )}
                            <button
                                onClick={() => {
                                    onUiClick?.('click')
                                    onDismiss()
                                }}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
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

// ── Custom Video Controls ──────────────────────────────────────────────────

function VideoControls({
    videoRef,
    duration,
    muted,
    setMuted,
    onFullscreen,
    paused,
    setPaused,
    showTimeline = true,
    onUiClick,
}) {
    const [currentTime, setCurrentTime] = useState(0)
    const [buffered, setBuffered] = useState(0)
    const [showControls, setShowControls] = useState(true)
    const hideTimer = useRef(null)

    // Poll video time
    useEffect(() => {
        const v = videoRef.current
        if (!v) return

        const onTimeUpdate = () => setCurrentTime(v.currentTime)
        const onProgress = () => {
            if (v.buffered.length > 0) {
                setBuffered(v.buffered.end(v.buffered.length - 1))
            }
        }

        v.addEventListener('timeupdate', onTimeUpdate)
        v.addEventListener('progress', onProgress)
        return () => {
            v.removeEventListener('timeupdate', onTimeUpdate)
            v.removeEventListener('progress', onProgress)
        }
    }, [videoRef])

    const resetHideTimer = () => {
        setShowControls(true)
        clearTimeout(hideTimer.current)
        hideTimer.current = setTimeout(() => setShowControls(false), 3000)
    }

    useEffect(() => {
        resetHideTimer()
        return () => clearTimeout(hideTimer.current)
    }, [])

    const handleSeek = (e) => {
        if (!showTimeline) return
        const rect = e.currentTarget.getBoundingClientRect()
        const ratio = (e.clientX - rect.left) / rect.width
        const newTime = ratio * (duration || 0)
        if (videoRef.current) videoRef.current.currentTime = newTime
        setCurrentTime(newTime)
    }

    const togglePlay = () => {
        const v = videoRef.current
        if (!v) return
        onUiClick?.('click')
        if (v.paused) { v.play(); setPaused(false) }
        else { v.pause(); setPaused(true) }
    }

    const progressPct   = duration ? (currentTime / duration) * 100 : 0
    const bufferedPct   = duration ? (buffered / duration) * 100 : 0

    return (
        <div
            className="absolute inset-0 flex flex-col justify-end"
            onMouseMove={resetHideTimer}
            onClick={togglePlay}
        >
            {/* Gradient overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.3) 100%)',
                    opacity: showControls ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                }}
            />

            {/* Center play/pause indicator */}
            <AnimatePresence>
                {paused && (
                    <motion.div
                        key="play-icon"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.4, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            <Play className="w-9 h-9 text-white ml-1" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom controls bar */}
            <div
                className="relative z-10 px-4 pb-3 pt-8"
                style={{
                    opacity: showControls ? 1 : 0,
                    transform: showControls ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                    pointerEvents: showControls ? 'auto' : 'none',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Progress bar */}
                {showTimeline && (
                    <div
                        className="w-full h-1.5 rounded-full bg-white/20 mb-3 cursor-pointer relative group"
                        onClick={handleSeek}
                    >
                        {/* Buffered */}
                        <div
                            className="absolute top-0 left-0 h-full rounded-full bg-white/30 transition-all"
                            style={{ width: `${bufferedPct}%` }}
                        />
                        {/* Played */}
                        <div
                            className="absolute top-0 left-0 h-full rounded-full bg-primary transition-all"
                            style={{ width: `${progressPct}%` }}
                        />
                        {/* Thumb */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ left: `calc(${progressPct}% - 7px)` }}
                        />
                    </div>
                )}

                {/* Buttons row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={togglePlay}
                            className="text-white hover:text-primary transition-colors"
                        >
                            {paused
                                ? <Play className="w-5 h-5" />
                                : <Pause className="w-5 h-5" />
                            }
                        </button>

                        <button
                            onClick={() => {
                                onUiClick?.('click')
                                setMuted(m => !m)
                                if (videoRef.current) videoRef.current.muted = !muted
                            }}
                            className="text-white hover:text-primary transition-colors"
                        >
                            {muted
                                ? <VolumeX className="w-4 h-4" />
                                : <Volume2 className="w-4 h-4" />
                            }
                        </button>

                        <span className="text-white/60 text-xs font-mono">
                            {formatDuration(currentTime)} / {formatDuration(duration)}
                        </span>
                    </div>

                    <button
                        onClick={() => {
                            onUiClick?.('click')
                            onFullscreen()
                        }}
                        className="text-white hover:text-primary transition-colors"
                    >
                        <Maximize className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ElearningPlayerPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user, updateUser } = useAuth()
    const { getLevelFromXP } = useGame()
    const { playSfx, unlockAudio, suppressBgm, unsuppressBgm } = useAudio()

    const [lesson, setLesson] = useState(null)
    const [loading, setLoading] = useState(true)
    const [videoLoading, setVideoLoading] = useState(true)
    const [paused, setPaused] = useState(true)
    const [muted, setMuted] = useState(false)
    const [fallbackFullscreen, setFallbackFullscreen] = useState(false)

    // Quiz state
    const [activeQuestion, setActiveQuestion] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [answeredMap, setAnsweredMap] = useState({})

    // XP & completion
    const [videoCompleted, setVideoCompleted] = useState(
        lesson?.progress?.completed === true
    )   
    const [totalXpEarned, setTotalXpEarned] = useState(0)

    // Refs
    const videoRef = useRef(null)
    const containerRef = useRef(null)
    const pollRef = useRef(null)
    const lessonRef = useRef(null)
    const triggeredRef = useRef(new Set())
    const answeredRef = useRef(new Set())
    const videoCompletedRef = useRef(false)
    const saveProgressRef = useRef(null)
    const isPollingRef = useRef(false)
    const activeQuestionRef = useRef(null)
    const allowFullscreenExitRef = useRef(false)
    const bgmSuppressedByVideoRef = useRef(false)
    const pausingForQuestionRef = useRef(false)

    const answeredMapRef = useRef({})

    useEffect(() => {
        answeredMapRef.current = answeredMap
    }, [answeredMap])

    const suppressBgmForVideo = useCallback(() => {
        if (bgmSuppressedByVideoRef.current) return
        suppressBgm('elearning-video')
        bgmSuppressedByVideoRef.current = true
    }, [suppressBgm])

    const restoreBgmAfterVideo = useCallback(() => {
        if (!bgmSuppressedByVideoRef.current) return
        unsuppressBgm('elearning-video')
        bgmSuppressedByVideoRef.current = false
    }, [unsuppressBgm])

    const saveProgress = useCallback(async (watchTime) => {
        try {
            await axios.post(`/api/elearning/lessons/${id}/progress`, {
                watchTimeSeconds: Math.round(watchTime),
            })
        } catch { /* ignore */ }
    }, [id])

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
        }
        if (saveProgressRef.current) {
            clearInterval(saveProgressRef.current)
            saveProgressRef.current = null
        }
        isPollingRef.current = false
    }, [])

    // ── Polling: check quiz timestamps ─────────────────────────────────────
    const startPolling = useCallback(() => {
        if (isPollingRef.current) return
        isPollingRef.current = true

        if (pollRef.current) clearInterval(pollRef.current)
        if (saveProgressRef.current) clearInterval(saveProgressRef.current)

        pollRef.current = setInterval(() => {
            const v = videoRef.current
            if (!v || v.paused) return

            const currentTime = v.currentTime
            const questions = lessonRef.current?.questions || []

            const nextQ = questions.find(q =>
                !triggeredRef.current.has(q.id) &&
                !answeredRef.current.has(q.id) &&
                currentTime >= q.timestamp_seconds
            )

            if (nextQ) {
                console.log('Trigger soal:', nextQ.id, 'di detik:', currentTime)
                triggeredRef.current.add(nextQ.id)
                pausingForQuestionRef.current = true
                v.pause()
                setActiveQuestion(nextQ)
                console.log('activeQuestion set:', nextQ.id)
            }
        }, 500)

        saveProgressRef.current = setInterval(() => {
            const v = videoRef.current
            if (v && !v.paused && !videoCompletedRef.current) {
                saveProgress(v.currentTime)
            }
        }, 15000)
    }, [saveProgress])

    // Update setiap kali activeQuestion berubah
    useEffect(() => {
        activeQuestionRef.current = activeQuestion
    }, [activeQuestion])

    useEffect(() => {
        if (lesson?.progress?.completed === true) {
            setVideoCompleted(true)
            videoCompletedRef.current = true
        }
    }, [lesson])

    useEffect(() => { lessonRef.current = lesson }, [lesson])
    useEffect(() => { videoCompletedRef.current = videoCompleted }, [videoCompleted])

    // ── Fetch lesson ───────────────────────────────────────────────────────
    useEffect(() => {
        fetchLesson()
        return () => {
            stopPolling()
            clearInterval(saveProgressRef.current)
            restoreBgmAfterVideo()
        }
    }, [id, stopPolling, restoreBgmAfterVideo])

    const fetchLesson = async () => {
        try {
            const res = await axios.get(`/api/elearning/lessons/${id}`)
            const data = res.data
            setLesson(data)

            const answered = {}
                data.questions.forEach(q => {
                    if (q.answered) {
                        answered[q.id] = { 
                            isCorrect: q.answered_correctly, 
                            xpAwarded: q.answered_correctly ? (q.xp_reward || 0) : 0  // ← ambil dari soal
                        }
                        if (q.answered_correctly) {
                            answeredRef.current.add(q.id)
                            triggeredRef.current.add(q.id)
                        }
                    }
                })
            setAnsweredMap(answered)

            if (data.progress?.completed) {
                setVideoCompleted(true)
                videoCompletedRef.current = true
                setTotalXpEarned(data.progress.xp_earned || 0)
            }
        } catch (err) {
            toast.error('Gagal memuat video pembelajaran')
        } finally {
            setLoading(false)
        }
    }

    // ── Video event listeners ──────────────────────────────────────────────
    useEffect(() => {
        const v = videoRef.current
        if (!v || !lesson) return

       const onCanPlay = () => {
            setVideoLoading(false)
            // requestFullscreen()
            v.play()
                .then(() => {
                    setPaused(false)
                    requestFullscreen()
                })
                .catch(() => setPaused(true))
        }

        const onPlaying = () => {
            setVideoLoading(false)
            setPaused(false)
            suppressBgmForVideo()
            startPolling()
        }

        const onWaiting  = () => {
            setVideoLoading(true)
            stopPolling()
        }
        //const onPlaying  = () => { setVideoLoading(false); setPaused(false); startPolling() }
        const onPause    = () => {
            setPaused(true)
            const pausedForQuestion = pausingForQuestionRef.current || Boolean(activeQuestionRef.current)
            pausingForQuestionRef.current = false
            stopPolling()
            if (!pausedForQuestion) {
                restoreBgmAfterVideo()
            }
        }
        const onEnded    = () => {
            restoreBgmAfterVideo()
            handleVideoEnd()
        }
        const onError    = () => {
            restoreBgmAfterVideo()
            toast.error('Gagal memuat file video')
        }

        v.addEventListener('canplay', onCanPlay)
        v.addEventListener('waiting', onWaiting)
        v.addEventListener('playing', onPlaying)
        v.addEventListener('pause', onPause)
        v.addEventListener('ended', onEnded)
        v.addEventListener('error', onError)

        return () => {
            v.removeEventListener('canplay', onCanPlay)
            v.removeEventListener('waiting', onWaiting)
            v.removeEventListener('playing', onPlaying)
            v.removeEventListener('pause', onPause)
            v.removeEventListener('ended', onEnded)
            v.removeEventListener('error', onError)
            restoreBgmAfterVideo()
        }
    }, [lesson, restoreBgmAfterVideo, startPolling, suppressBgmForVideo])

    useEffect(() => {
        const onFullscreenChange = () => {
            if (document.fullscreenElement) {
                setFallbackFullscreen(false)
                return
            }

            if (allowFullscreenExitRef.current || videoCompletedRef.current) {
                allowFullscreenExitRef.current = false
                setFallbackFullscreen(false)
                return
            }

            const el = containerRef.current
            if (!el) return

            const req = el.requestFullscreen
                || el.webkitRequestFullscreen
                || el.mozRequestFullScreen
                || el.msRequestFullscreen

            if (!req) {
                setFallbackFullscreen(true)
                return
            }

            Promise.resolve(req.call(el))
                .then(() => setFallbackFullscreen(false))
                .catch(() => setFallbackFullscreen(true))
        }

        document.addEventListener('fullscreenchange', onFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
    }, [])

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key !== 'Escape' || videoCompletedRef.current) return

            e.preventDefault()
            e.stopPropagation()
            if (typeof e.stopImmediatePropagation === 'function') {
                e.stopImmediatePropagation()
            }
        }

        window.addEventListener('keydown', onKeyDown, true)
        return () => window.removeEventListener('keydown', onKeyDown, true)
    }, [])

    // ── Video ended ────────────────────────────────────────────────────────
   const handleVideoEnd = async () => {
        if (videoCompletedRef.current) return
        stopPolling()

       exitFullscreen()

        const quizXpEarned = Object.values(answeredMapRef.current)
            .reduce((sum, a) => sum + (a.isCorrect ? (a.xpAwarded || 0) : 0), 0)

        try {
            const res = await axios.post(`/api/elearning/lessons/${id}/complete`, {
                quizXpEarned
            })
            const totalXp = res.data.xpAwarded || 0

            setVideoCompleted(true)
            videoCompletedRef.current = true
            setTotalXpEarned(totalXp)

            // ✅ UPDATE USER XP LANGSUNG
            if (user && totalXp > 0) {
                updateUser({
                    xp: (user.xp || 0) + totalXp
                })
            }

            if (totalXp > 0) {
                playSfx('success')
                toast.success(`🎉 Video selesai! +${totalXp} XP Total!`, { duration: 5000 })
            } else {
                toast.success('Video selesai ditonton!', { duration: 3000 })
            }
        } catch {
            setVideoCompleted(true)
            videoCompletedRef.current = true
        }
    }

    // ── Submit answer ──────────────────────────────────────────────────────
   const submitAnswer = async (selectedOptionId) => {
        if (submitting) return null
        if (answeredMap[activeQuestion.id]?.isCorrect) {
            return { isCorrect: true, xpAwarded: 0 }
        }
        setSubmitting(true)
        try {
            const res = await axios.post(
                `/api/elearning/questions/${activeQuestion.id}/answer`,
                { selectedOptionId }
            )
            const { isCorrect, xpAwarded } = res.data

            playSfx(isCorrect ? 'correct' : 'wrong')

            if (isCorrect) answeredRef.current.add(activeQuestion.id)

            setAnsweredMap(prev => ({
                ...prev,
                [activeQuestion.id]: { isCorrect, xpAwarded: xpAwarded || 0 }
            }))

            return { isCorrect, xpAwarded: xpAwarded || 0 }
        } catch (err) {
            toast.error('Gagal mengirim jawaban, coba lagi.')
            return null
        } finally {
            setSubmitting(false)
        }
    }

    const dismissQuestion = () => {
        setActiveQuestion(null)
        // ✅ Reset polling flag dulu sebelum play ulang
        isPollingRef.current = false
        setTimeout(() => {
            if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play()
                    .then(() => setPaused(false))
                    .catch(() => setPaused(true))
            }
        }, 150)
    }

    // ── Fullscreen helper ──────────────────────────────────────────────────
    const requestFullscreen = useCallback(async () => {
        if (document.fullscreenElement) return

        const el = containerRef.current
        if (!el) return
        const req = el.requestFullscreen
            || el.webkitRequestFullscreen
            || el.mozRequestFullScreen
            || el.msRequestFullscreen
        if (!req) {
            setFallbackFullscreen(true)
            return
        }

        try {
            const maybePromise = req.call(el)
            if (maybePromise && typeof maybePromise.then === 'function') {
                await maybePromise
            }
            setFallbackFullscreen(false)
        } catch {
            // Some browsers block programmatic fullscreen without a gesture.
            setFallbackFullscreen(true)
        }
    }, [])

    const exitFullscreen = useCallback(() => {
        if (document.fullscreenElement) {
            allowFullscreenExitRef.current = true
        } else {
            allowFullscreenExitRef.current = false
        }

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {
                allowFullscreenExitRef.current = false
            })
        }
        setFallbackFullscreen(false)
    }, [])

    // ── Derived ────────────────────────────────────────────────────────────
    const totalQuestions = lesson?.questions?.length || 0
    const correctCount   = Object.values(answeredMap).filter(a => a.isCorrect).length
    const answeredCount  = Object.keys(answeredMap).length

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

    const lessonDurationSeconds = parseDurationToSeconds(lesson?.duration)
    const showTimeline = lesson?.progress?.completed === true || videoCompleted

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <Layout>
            <div className="p-6 max-w-7xl mx-auto">

                {/* Top Bar */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => {
                            unlockAudio()
                            playSfx('click')
                            navigate('/elearning')
                        }}
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
                    <div className="glass-card px-4 py-2 flex items-center gap-2 flex-shrink-0">
                        <Star className="w-4 h-4 text-accent" />
                        <span className="text-accent font-bold text-sm">+{totalXpEarned} XP</span>
                    </div>
                </div>

                {/* Two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Video + Info */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* ── Video Player ── */}
                        <div
                            ref={containerRef}
                            className={`${fallbackFullscreen ? 'fixed inset-0 z-[90] w-screen h-screen bg-black' : 'glass-card'} overflow-hidden relative`}
                            style={{ aspectRatio: fallbackFullscreen ? undefined : '16/9' }}
                        >
                            {lesson.stream_url ? (
                                <>
                                    {/* Native HTML5 video — no controls, we handle them ourselves */}
                                    <video
                                        ref={videoRef}
                                        src={lesson.stream_url}
                                        className="w-full h-full object-contain bg-black"
                                        preload="metadata"
                                        playsInline
                                        muted={muted}
                                        onEnded={handleVideoEnd}
                                    />

                                    {/* Buffering spinner overlay */}
                                    <AnimatePresence>
                                        {videoLoading && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 flex flex-col items-center justify-center bg-dark-surface/80 backdrop-blur-sm"
                                            >
                                                <div className="relative mb-4">
                                                    <div className="w-14 h-14 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Play className="w-5 h-5 text-primary" />
                                                    </div>
                                                </div>
                                                <p className="text-white/50 text-sm">Memuat video...</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Custom controls (hidden during quiz overlay) */}
                                    {!activeQuestion && (
                                        <VideoControls
                                            videoRef={videoRef}
                                            duration={lessonDurationSeconds}
                                            muted={muted}
                                            setMuted={setMuted}
                                            onFullscreen={requestFullscreen}
                                            paused={paused}
                                            setPaused={setPaused}
                                            showTimeline={showTimeline}
                                            onUiClick={playSfx}
                                        />
                                    )}

                                     {/* Question Overlay */}
                                    <AnimatePresence>
                                        {activeQuestion && (
                                            <QuestionOverlay
                                                key={activeQuestion.id}
                                                question={activeQuestion}
                                                onSubmit={submitAnswer}
                                                onDismiss={dismissQuestion}
                                                submitting={submitting}
                                                onUiClick={playSfx}
                                            />
                                        )}
                                    </AnimatePresence>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                    <Zap className="w-12 h-12 text-white/10" />
                                    <p className="text-white/40 text-sm">Video belum tersedia untuk lesson ini</p>
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
                                    {formatDuration(lessonDurationSeconds)}
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

                    {/* Right: Quiz list + Completion */}
                    <div className="space-y-4">

                        {/* Quiz list */}
                        <div className="glass-card p-4">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-white text-sm">Kuis Interaktif</h3>
                                {answeredCount > 0 && (
                                    <span className="text-xs text-white/40">{answeredCount}/{totalQuestions} dijawab</span>
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
                                                            ? ans.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                                            : 'bg-white/10 text-white/50'
                                                    }`}>
                                                        {ans ? (ans.isCorrect ? '✓' : '✗') : i + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-white/70 leading-snug line-clamp-2">{q.question_text}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-xs text-white/30">{formatDuration(q.timestamp_seconds)}</span>
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

                            {answeredCount > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="flex justify-between text-xs mb-2">
                                        <span className="text-white/50">Skor Kuis</span>
                                        <span className="font-bold text-white">{correctCount}/{totalQuestions} benar</span>
                                    </div>
                                    <div className="xp-bar h-2">
                                        <div className="xp-bar-fill" style={{ width: `${totalQuestions ? (correctCount / totalQuestions) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Completion card */}
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
                                        <p className="text-xs text-white/50 mt-1 mb-3">Total XP dari sesi ini:</p>
                                        <p className="text-3xl font-bold text-accent mb-4">+{totalXpEarned} XP</p>
                                        {totalQuestions > 0 && (
                                            <div className="glass-card p-3 mb-4 text-xs text-white/60">
                                                Kuis: <span className="text-white font-bold">{correctCount}/{totalQuestions}</span> benar
                                            </div>
                                        )}
                                        <button
                                            onClick={() => {
                                                unlockAudio()
                                                playSfx('click')
                                                navigate('/elearning')
                                            }}
                                            className="btn-primary w-full text-sm"
                                        >
                                            Kembali ke E-Learning
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Tips card */}
                        {!videoCompleted && (
                            <div className="glass-card p-4">
                                <p className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-accent" />
                                    Tips Menonton
                                </p>
                                <ul className="text-xs text-white/50 space-y-1.5 leading-relaxed">
                                    <li>• Tonton hingga akhir untuk mendapat <span className="text-accent font-semibold">+{lesson.xp_reward} XP bonus</span></li>
                                    <li>• Jawab kuis yang muncul untuk XP tambahan per soal</li>
                                    <li>• Video akan otomatis fullscreen saat dimuat</li>
                                    <li>• Klik video untuk play/pause</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

           
        </Layout>
    )
}