import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from '../utils/toast.js'
import axios from 'axios'
import Layout from '../components/Layout.jsx'
import { useGame } from '../contexts/GameContext.jsx'
import {
    BookOpen, Play, Clock, Star, CheckCircle,
    HelpCircle, Zap, GraduationCap, ChevronDown, Lock, Loader2
} from 'lucide-react'

function LessonRow({ lesson, index, onClick }) {
    const progress = lesson.duration > 0
        ? Math.min(100, (lesson.watch_time_seconds / lesson.duration) * 100)
        : 0
    const isInProgress = progress > 0 && !lesson.completed
    
    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
            onClick={onClick}
            className="group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/5 border border-transparent hover:border-white/10"
        >
            <div className="relative w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                {lesson.thumbnail_url ? (
                    <img src={lesson.thumbnail_url} alt={lesson.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-card-bg">
                        <Play className="w-4 h-4 text-dim/20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                        <Play className="w-3 h-3 text-white ml-0.5" />
                    </div>
                </div>
                {isInProgress && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-main leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                        {lesson.title}
                    </h4>
                    {lesson.completed && (
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    )}
                    {isInProgress && (
                        <span className="text-[10px] text-primary font-semibold flex-shrink-0 mt-0.5">
                            {Math.round(progress)}%
                        </span>
                    )}
                </div>
                <p className="text-xs text-dim line-clamp-1 mt-0.5">{lesson.description}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-dim">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.duration} detik
                    </span>
                    {lesson.total_questions > 0 && (
                        <span className="flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-primary/60" />
                            {lesson.total_questions} kuis
                        </span>
                    )}
                    <span className="flex items-center gap-1 ml-auto">
                        <Star className="w-3 h-3 text-accent" />
                        <span className="text-accent font-semibold">+{lesson.xp_reward} XP</span>
                    </span>
                </div>
            </div>
        </motion.div>
    )
}

function ChapterCard({ chapter, chapterIndex, onLessonClick, isLocked }) {
    const [isOpen, setIsOpen] = useState(false)
    const [badgeAwarded, setBadgeAwarded] = useState(false)
    const hasCalled = useRef(false)

    const completedCount = chapter.lessons.filter(l => l.completed).length
    const totalLessons = chapter.lessons.length
    const progressPercent = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0
    const isChapterDone = completedCount === totalLessons && totalLessons > 0
    const totalXp = chapter.lessons.reduce((s, l) => s + (parseInt(l.xp_reward) || 0), 0)

    const awardBadge = async (badge_key) => {
        try {
            const response = await axios.post('/api/badges/postBadgeUser', { badge_key })
            setBadgeAwarded(true)
            if (!response.data?.alreadyEarned) {
                toast.success(`Lencana "${badge_key}" berhasil didapat!`)
            }
        } catch (err) {
            console.error('Gagal award badge:', err)
        }
    }

    useEffect(() => {
        if (!isChapterDone || !chapter.badge_key || badgeAwarded || hasCalled.current) return
        hasCalled.current = true
        awardBadge(chapter.badge_key)
    }, [isChapterDone, chapter.badge_key, badgeAwarded])

    const handleToggle = () => {
        if (isLocked) {
            toast.error('Selesaikan chapter sebelumnya terlebih dahulu!')
            return
        }
        setIsOpen(v => !v)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: chapterIndex * 0.1 }}
            className={`glass-card overflow-hidden ${isLocked ? 'opacity-60' : ''}`}
        >
            <button
                onClick={handleToggle}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${isLocked ? 'cursor-not-allowed' : 'hover:bg-white/5'}`}
            >
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all"
                    style={{
                        background: isLocked
                            ? 'rgba(255,255,255,0.05)'
                            : isChapterDone
                                ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))'
                                : 'linear-gradient(135deg, rgba(230,57,70,0.2), rgba(230,57,70,0.1))',
                        border: `1px solid ${isLocked ? 'rgba(255,255,255,0.1)' : isChapterDone ? 'rgba(34,197,94,0.3)' : 'rgba(230,57,70,0.2)'}`,
                        color: isLocked ? 'rgba(255,255,255,0.3)' : isChapterDone ? '#22c55e' : '#E63946',
                    }}
                >
                    {isLocked ? <Lock className="w-4 h-4" /> : isChapterDone ? <CheckCircle className="w-5 h-5" /> : chapter.id}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-main text-sm md:text-base">{chapter.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                        <div className="flex-1 max-w-32 bg-input-bg rounded-full h-1.5 overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: isChapterDone ? '#22c55e' : '#E63946' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.8, delay: chapterIndex * 0.1 + 0.3 }}
                            />
                        </div>
                        <span className="text-[10px] text-dim">
                            {completedCount}/{totalLessons} selesai
                        </span>
                        <span className="text-[10px] text-accent hidden sm:flex items-center gap-0.5">
                            <Star className="w-3 h-3" />
                            {totalXp.toLocaleString()} XP
                        </span>
                    </div>
                </div>

                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-dim flex-shrink-0"
                >
                    <ChevronDown className="w-5 h-5" />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3 border-t border-card-border pt-2 space-y-1">
                            {chapter.lessons.map((lesson, i) => (
                                <LessonRow
                                    key={lesson.id}
                                    lesson={lesson}
                                    index={i}
                                    onClick={() => onLessonClick(lesson.id)}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default function ELearningPage() {
    const { elearningCompleted, completeElearning } = useGame()
    const [lessons, setLessons] = useState([])
    const [loading, setLoading] = useState(true)
    const [chaptersData, setChaptersData] = useState([])
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetchLessons()
    }, [])

    const fetchLessons = async () => {
        try {
            const [lessonsRes, chaptersRes] = await Promise.all([
                axios.get('/api/elearning/lessons'),
                axios.get('/api/elearning/admin/chapters'), 
            ])
            setLessons(lessonsRes.data)
            setChaptersData(chaptersRes.data)
        } catch (err) {
            setError('Gagal memuat data pembelajaran.')
        } finally {
            setLoading(false)
        }
    }

    const chaptersMap = lessons.reduce((acc, lesson) => {
        const chId = lesson.chapter_id
        if (!acc[chId]) {
            const chapterInfo = chaptersData.find(c => c.id === chId)
            acc[chId] = {
                id: chId,
                title: lesson.chapter_title || `Chapter ${chId}`,
                badge_key: chapterInfo?.badge_key ?? null,
                lessons: [],
            }
        }
        acc[chId].lessons.push(lesson)
        return acc
    }, {})
    
    const chapterList = Object.values(chaptersMap).sort((a, b) => a.id - b.id)
    const completedCount = lessons.filter(l => l.completed).length
    const totalXpEarned = lessons.reduce((sum, l) => sum + (parseInt(l.xp_earned) || 0), 0)

    const isChapterCompleted = (chapter) => {
        if (!chapter?.lessons?.length) return false
        return chapter.lessons.every((lesson) => Boolean(lesson?.completed))
    }

    const allFinished = lessons.length > 0 && completedCount === lessons.length

    return (
        <Layout>
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-main">E-Learning</h1>
                            <p className="text-dim text-xs md:text-sm">Materi pembelajaran siber interaktif untuk membekali Anda di misi utama.</p>
                        </div>
                    </div>

                    {lessons.length > 0 && (
                        <div className="glass-card p-4">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-muted">Progres Keseluruhan</span>
                                <span className="text-main font-semibold">{completedCount}/{lessons.length} video selesai</span>
                            </div>
                            <div className="xp-bar h-2.5">
                                <motion.div
                                    className="xp-bar-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(completedCount / lessons.length) * 100}%` }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                />
                            </div>
                        </div>
                    )}
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-dim uppercase tracking-wide">Video Selesai</p>
                            <p className="font-bold text-main text-sm">{completedCount}/{lessons.length}</p>
                        </div>
                    </div>
                    <div className="glass-card p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                            <Star className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                            <p className="text-[10px] text-dim uppercase tracking-wide">Total XP Diraih</p>
                            <p className="font-bold text-main text-sm">{totalXpEarned.toLocaleString()} XP</p>
                        </div>
                    </div>
                </div>

                <motion.div
                    className="glass-card p-4 border-accent/20"
                    style={{ background: 'linear-gradient(135deg, rgba(255,214,10,0.06), rgba(230,57,70,0.04))' }}
                >
                    <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-main mb-1">Misi E-Learning</p>
                            <p className="text-[11px] text-dim leading-relaxed">
                                Tonton video hingga selesai dan jawab <span className="text-primary font-semibold">Kuis Interaktif</span> yang muncul otomatis untuk mendapatkan skor maksimal dan membuka tantangan berikutnya!
                            </p>
                        </div>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-dim text-sm italic">Memuat materi...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-primary italic text-sm">{error}</div>
                ) : (
                    <div className="space-y-4">
                        {chapterList.map((chapter, i) => {
                            const previousChapters = chapterList.slice(0, i)
                            const isLocked = i > 0 && previousChapters.some((prev) => !isChapterCompleted(prev))
                            return (
                                <ChapterCard
                                    key={chapter.id}
                                    chapter={chapter}
                                    chapterIndex={i}
                                    isLocked={isLocked}
                                    onLessonClick={(id) => navigate(`/elearning/${id}`)}
                                />
                            )
                        })}
                    </div>
                )}

                {allFinished && (
                    <motion.div 
                        className="mt-8 flex justify-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="glass-card p-6 border-accent/30 text-center w-full bg-gradient-to-br from-accent/5 to-primary/5">
                            <h3 className="text-lg font-bold text-main mb-2">Pengetahuan Dasar Selesai!</h3>
                            <p className="text-dim text-xs mb-6">Anda telah mempelajari dasar-dasar keamanan. Sekarang saatnya membuktikannya di lapangan!</p>
                            
                            <button 
                                onClick={async () => {
                                    if (!elearningCompleted) await completeElearning()
                                    navigate('/chapters')
                                }}
                                className="px-8 py-3 bg-accent text-dark font-bold rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,214,10,0.2)]"
                            >
                                Buka Misi Simulasi
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </Layout>
    )
}
