import { useEffect, useState,useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from '../utils/toast.js'
import axios from 'axios'
import Layout from '../components/Layout.jsx'
import {
    BookOpen, Play, Clock, Star, CheckCircle,
    HelpCircle, Trophy, Zap, GraduationCap, ChevronDown, ChevronRight, Lock
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
            {/* Thumbnail kecil */}
            <div className="relative w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-dark-surface">
                {lesson.thumbnail_url ? (
                    <img src={lesson.thumbnail_url} alt={lesson.title} className="w-full h-full object-cover" />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #0F3460 0%, #1A1A2E 100%)' }}
                    >
                        <Play className="w-4 h-4 text-white/20" />
                    </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                        <Play className="w-3 h-3 text-white ml-0.5" />
                    </div>
                </div>
                {/* Progress bar on thumbnail */}
                {isInProgress && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white leading-snug line-clamp-1 group-hover:text-primary transition-colors">
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
                <p className="text-xs text-white/40 line-clamp-1 mt-0.5">{lesson.description}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/30">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.duration}
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

function ChapterCard({ chapter, chapterIndex, onLessonClick,isLocked }) {
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

            if (response.data?.alreadyEarned) {
                return
            }

            toast.success(`Badge "${badge_key}" berhasil didapat!`)
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
            {/* Chapter Header */}
            <button
                onClick={handleToggle}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${isLocked ? 'cursor-not-allowed' : 'hover:bg-white/5'}`}
            >
                {/* Chapter icon/number */}
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
                    {isLocked
                        ? <Lock className="w-4 h-4" />
                        : isChapterDone
                            ? <CheckCircle className="w-5 h-5" />
                            : chapter.id
                    }
                </div>

                {/* Chapter info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm md:text-base">
                          {chapter.title}
                        </h3>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        {/* Mini progress bar */}
                        <div className="flex-1 max-w-32 bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: isChapterDone ? '#22c55e' : '#E63946' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.8, delay: chapterIndex * 0.1 + 0.3 }}
                            />
                        </div>
                        <span className="text-[11px] text-white/40">
                            {completedCount}/{totalLessons} selesai
                        </span>
                        <span className="text-[11px] text-white/30 hidden sm:block">
                            · {totalLessons} video
                        </span>
                        <span className="text-[11px] text-accent hidden sm:flex items-center gap-0.5">
                            <Star className="w-3 h-3" />
                            {totalXp.toLocaleString()} XP
                        </span>
                    </div>
                </div>

                {/* Chevron */}
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-white/30 flex-shrink-0"
                >
                    <ChevronDown className="w-5 h-5" />
                </motion.div>
            </button>

            {/* Lessons list */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="lessons"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3 border-t border-white/5 pt-2 space-y-1">
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

export default function ElearningPage() {
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
            const status = err.response?.status
            if (!err.response) {
                setError('Tidak dapat terhubung ke server.')
            } else if (status === 500) {
                setError('Terjadi kesalahan pada server.')
            } else {
                setError('Gagal memuat data pembelajaran.')
            }
        } finally {
            setLoading(false)
        }
    }

    // Group lessons by chapter_id
    const chapters = lessons.reduce((acc, lesson) => {
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
    const chapterList = Object.values(chapters).sort((a, b) => a.id - b.id)

    // Stats
    const completedCount = lessons.filter(l => l.completed).length
    const totalXpEarned = lessons.reduce((sum, l) => sum + (parseInt(l.xp_earned) || 0), 0)

    const isChapterCompleted = (chapter) => {
        if (!chapter?.lessons?.length) return false
        return chapter.lessons.every((lesson) => Boolean(lesson?.completed))
    }

    

    return (
        <Layout>
            <div className="p-4 md:p-6 max-w-4xl mx-auto">

                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 md:mb-8"
                >
                    <div className="flex items-center gap-3 md:gap-4 mb-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
                            <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-white">E-Learning</h1>
                            <p className="text-white/50 text-xs md:text-sm">Video pembelajaran keamanan siber interaktif dengan kuis</p>
                        </div>
                    </div>

                    {/* Overall progress bar */}
                    {lessons.length > 0 && (
                        <div className="glass-card p-3 md:p-4">
                            <div className="flex justify-between text-xs md:text-sm mb-2">
                                <span className="text-white/60">Progress keseluruhan</span>
                                <span className="text-white font-semibold">{completedCount}/{lessons.length} video selesai</span>
                            </div>
                            <div className="xp-bar h-3">
                                <motion.div
                                    className="xp-bar-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0}%` }}
                                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                                />
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                    {[
                        { label: 'Video Selesai', value: `${completedCount}/${lessons.length}`, icon: CheckCircle, color: '#22c55e' },
                        { label: 'Total XP Diraih', value: `${totalXpEarned.toLocaleString()} XP`, icon: Star, color: '#FFD60A' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.08 + 0.1 }}
                            className="glass-card p-3 md:p-4"
                        >
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${stat.color}22` }}>
                                    <stat.icon className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: stat.color }} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] md:text-xs text-white/40 uppercase tracking-wide leading-none mb-1 truncate">{stat.label}</p>
                                    <p className="font-bold text-white text-xs md:text-sm truncate">{stat.value}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Info banner */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-3 md:p-4 mb-5 md:mb-6 border-accent/20"
                    style={{ background: 'linear-gradient(135deg, rgba(255,214,10,0.06), rgba(230,57,70,0.04))' }}
                >
                    <div className="flex items-start gap-2 md:gap-3">
                        <Zap className="w-4 h-4 md:w-5 md:h-5 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs md:text-sm font-semibold text-white mb-1">Cara Kerja E-Learning</p>
                            <p className="text-[11px] md:text-xs text-white/50 leading-relaxed">
                                Tonton setiap video hingga selesai untuk mendapatkan <span className="text-accent font-semibold">XP bonus</span>&nbsp;
                                di akhir video. Di tengah video, akan muncul <span className="text-primary font-semibold">kuis interaktif</span>&nbsp;
                                otomatis — jawab dengan benar untuk mendapatkan XP tambahan!
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Chapters */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 md:py-24 gap-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-white/40 text-sm">Memuat daftar video...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-16 md:py-20">
                        <BookOpen className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                ) : chapterList.length === 0 ? (
                    <div className="text-center py-16 md:py-20">
                        <BookOpen className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40">Belum ada video pembelajaran tersedia.</p>
                    </div>
                ) : (
                    <div className="space-y-3 md:space-y-4">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-white/40 uppercase tracking-wider">
                                {chapterList.length} Chapter · {lessons.length} Video
                            </p>
                        </div>
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
            </div>
        </Layout>
    )
}