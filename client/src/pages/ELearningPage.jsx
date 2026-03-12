import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import Layout from '../components/Layout.jsx'
import {
    BookOpen, Play, Clock, Star, CheckCircle,
    HelpCircle, Trophy, Zap, GraduationCap
} from 'lucide-react'

function formatDuration(seconds) {
    if (!seconds) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
}

// Data demo saat backend offline
const DEMO_LESSONS = [
    {
        id: 1, chapter_id: 1,
        title: 'Mengenal dan Menghindari Phishing',
        description: 'Pelajari cara mengenali email phishing, link berbahaya, dan teknik social engineering yang sering digunakan penyerang untuk mencuri data pribadi.',
        video_url: 'https://www.youtube.com/watch?v=XBkzBrXlle0',
        thumbnail_url: null, duration_seconds: 600, xp_reward: 150,
        completed: false, xp_earned: 0, watch_time_seconds: 0, total_questions: 3,
    },
    {
        id: 2, chapter_id: 2,
        title: 'Keamanan Meja Kerja & Dokumen Fisik',
        description: 'Pentingnya menjaga keamanan fisik dokumen dan perangkat kerja Anda dari akses pihak yang tidak berwenang di lingkungan kantor.',
        video_url: 'https://www.youtube.com/watch?v=aO858HyFbKI',
        thumbnail_url: null, duration_seconds: 480, xp_reward: 120,
        completed: false, xp_earned: 0, watch_time_seconds: 0, total_questions: 2,
    },
    {
        id: 3, chapter_id: 3,
        title: 'Social Engineering & Manipulasi Psikologis',
        description: 'Kenali berbagai teknik manipulasi psikologis yang digunakan oleh penyerang siber untuk mendapatkan akses ke sistem dan informasi sensitif.',
        video_url: 'https://www.youtube.com/watch?v=lc7scxvKQOo',
        thumbnail_url: null, duration_seconds: 720, xp_reward: 175,
        completed: false, xp_earned: 0, watch_time_seconds: 0, total_questions: 4,
    },
    {
        id: 4, chapter_id: 4,
        title: 'Password yang Kuat & Manajemen Kata Sandi',
        description: 'Panduan membuat password yang kuat, menggunakan password manager, dan menerapkan autentikasi dua faktor (2FA) untuk melindungi akun Anda.',
        video_url: 'https://www.youtube.com/watch?v=aEmXHBFDFRI',
        thumbnail_url: null, duration_seconds: 540, xp_reward: 140,
        completed: false, xp_earned: 0, watch_time_seconds: 0, total_questions: 3,
    },
    {
        id: 5, chapter_id: 5,
        title: 'Respons Insiden Keamanan Siber',
        description: 'Langkah-langkah yang harus diambil saat terjadi insiden keamanan siber, dari deteksi awal hingga pelaporan dan pemulihan sistem.',
        video_url: 'https://www.youtube.com/watch?v=DZ2vsLWBETA',
        thumbnail_url: null, duration_seconds: 660, xp_reward: 160,
        completed: false, xp_earned: 0, watch_time_seconds: 0, total_questions: 3,
    },
    {
        id: 6, chapter_id: 6,
        title: 'Keamanan Data & Privasi Digital',
        description: 'Memahami regulasi perlindungan data, prinsip privasi by design, enkripsi, dan cara melindungi data sensitif perusahaan dari kebocoran.',
        video_url: 'https://www.youtube.com/watch?v=AkqiX5eywe4',
        thumbnail_url: null, duration_seconds: 780, xp_reward: 200,
        completed: false, xp_earned: 0, watch_time_seconds: 0, total_questions: 5,
    },
]

function LessonCard({ lesson, index, onClick }) {
    const progress = lesson.duration_seconds > 0
        ? Math.min(100, (lesson.watch_time_seconds / lesson.duration_seconds) * 100)
        : 0
    const isInProgress = progress > 0 && !lesson.completed

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 + 0.2 }}
            onClick={onClick}
            className="glass-card overflow-hidden group cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 flex flex-col"
        >
            {/* Thumbnail */}
            <div className="relative w-full aspect-video bg-dark-surface overflow-hidden flex-shrink-0">
                {lesson.thumbnail_url ? (
                    <img
                        src={lesson.thumbnail_url}
                        alt={lesson.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className="w-full h-full flex flex-col items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #0F3460 0%, #16213E 50%, #1A1A2E 100%)' }}
                    >
                        <GraduationCap className="w-10 h-10 text-white/20" />
                        <span className="text-xs text-white/20 font-medium">Chapter {lesson.chapter_id}</span>
                    </div>
                )}

                {/* Hover play overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/40">
                        <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                </div>

                {/* Status badge */}
                <div className="absolute top-3 right-3">
                    {lesson.completed ? (
                        <span className="flex items-center gap-1 bg-green-500/90 backdrop-blur text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow">
                            <CheckCircle className="w-3 h-3" /> Selesai
                        </span>
                    ) : isInProgress ? (
                        <span className="flex items-center gap-1 bg-primary/90 backdrop-blur text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow">
                            <Play className="w-3 h-3" /> Lanjutkan
                        </span>
                    ) : null}
                </div>

                {/* Chapter tag */}
                <div className="absolute top-3 left-3">
                    <span className="bg-black/60 backdrop-blur text-white/80 text-xs px-2 py-1 rounded-md font-medium">
                        Ch. {lesson.chapter_id}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-white leading-snug mb-1 line-clamp-2">{lesson.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed mb-3 line-clamp-2 flex-1">{lesson.description}</p>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-white/40 mb-3">
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(lesson.duration_seconds)}
                    </span>
                    <span className="flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-primary/70" />
                        {lesson.total_questions || 0} kuis
                    </span>
                    <span className="flex items-center gap-1 ml-auto">
                        <Star className="w-3 h-3 text-accent" />
                        <span className="text-accent font-semibold">+{lesson.xp_reward} XP</span>
                    </span>
                </div>

                {/* Progress or completed info */}
                {isInProgress && (
                    <div>
                        <div className="flex justify-between text-xs text-white/30 mb-1">
                            <span>Progress menonton</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="xp-bar h-1.5">
                            <div className="xp-bar-fill" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}

                {lesson.completed && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <span className="text-xs text-green-400 flex items-center gap-1 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Selesai ditonton
                        </span>
                        <span className="text-xs text-accent font-bold">
                            +{lesson.xp_earned} XP diraih
                        </span>
                    </div>
                )}

                {!isInProgress && !lesson.completed && (
                    <div className="pt-2 border-t border-white/10">
                        <span className="text-xs text-white/30">Belum ditonton</span>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

export default function ElearningPage() {
    const [lessons, setLessons] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchLessons()
    }, [])

    const fetchLessons = async () => {
        try {
            const res = await axios.get('/api/elearning/lessons')
            setLessons(res.data)
        } catch {
            setLessons(DEMO_LESSONS)
        } finally {
            setLoading(false)
        }
    }

    const completedCount = lessons.filter(l => l.completed).length
    const totalXpEarned = lessons.reduce((sum, l) => sum + (parseInt(l.xp_earned) || 0), 0)
    const totalQuestions = lessons.reduce((sum, l) => sum + (parseInt(l.total_questions) || 0), 0)
    const inProgressCount = lessons.filter(l => !l.completed && l.watch_time_seconds > 0).length

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto">

                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
                            <GraduationCap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">E-Learning</h1>
                            <p className="text-white/50 text-sm">Video pembelajaran keamanan siber interaktif dengan kuis</p>
                        </div>
                    </div>

                    {/* Overall progress bar */}
                    {lessons.length > 0 && (
                        <div className="glass-card p-4">
                            <div className="flex justify-between text-sm mb-2">
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Video Selesai', value: `${completedCount}/${lessons.length}`, icon: CheckCircle, color: '#22c55e' },
                        { label: 'Sedang Ditonton', value: inProgressCount, icon: Play, color: '#E63946' },
                        { label: 'Total XP Diraih', value: `${totalXpEarned.toLocaleString()} XP`, icon: Star, color: '#FFD60A' },
                        { label: 'Kuis Tersedia', value: `${totalQuestions} soal`, icon: HelpCircle, color: '#8b5cf6' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.08 + 0.1 }}
                            className="glass-card p-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${stat.color}22` }}>
                                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                                </div>
                                <div>
                                    <p className="text-xs text-white/40 uppercase tracking-wide leading-none mb-1">{stat.label}</p>
                                    <p className="font-bold text-white text-sm">{stat.value}</p>
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
                    className="glass-card p-4 mb-6 border-accent/20"
                    style={{ background: 'linear-gradient(135deg, rgba(255,214,10,0.06), rgba(230,57,70,0.04))' }}
                >
                    <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-white mb-1">Cara Kerja E-Learning</p>
                            <p className="text-xs text-white/50 leading-relaxed">
                                Tonton setiap video hingga selesai untuk mendapatkan <span className="text-accent font-semibold">XP bonus</span>&nbsp;
                                di akhir video. Di tengah video, akan muncul <span className="text-primary font-semibold">kuis interaktif</span>&nbsp;
                                otomatis — jawab dengan benar untuk mendapatkan XP tambahan!
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Lessons Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-white/40 text-sm">Memuat daftar video...</p>
                    </div>
                ) : lessons.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40">Belum ada video pembelajaran tersedia.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {lessons.map((lesson, i) => (
                            <LessonCard
                                key={lesson.id}
                                lesson={lesson}
                                index={i}
                                onClick={() => navigate(`/elearning/${lesson.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    )
}
