import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Star, RotateCcw, ArrowRight, CheckCircle, XCircle, Award } from 'lucide-react'
import { useGame } from '../contexts/GameContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import AvatarDisplay from '../components/AvatarDisplay.jsx'

function Confetti() {
    const colors = ['#E63946', '#FFD60A', '#60a5fa', '#a78bfa', '#22c55e']
    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-3 rounded-sm"
                    style={{
                        background: colors[i % colors.length],
                        left: `${Math.random() * 100}%`,
                        top: '-20px',
                    }}
                    animate={{
                        y: ['0vh', '110vh'],
                        rotate: [0, Math.random() * 720 - 360],
                        opacity: [1, 0.8, 0],
                    }}
                    transition={{
                        duration: 2 + Math.random() * 2,
                        delay: Math.random() * 1,
                        ease: 'easeIn',
                    }}
                />
            ))}
        </div>
    )
}

export default function ChapterResultPage() {
    const { chapterId } = useParams()
    const { state } = useLocation()
    const navigate = useNavigate()
    const { BADGES, CHAPTERS } = useGame()
    const { user } = useAuth()

    const result = state?.result || { ending: 'good', xpEarned: 250, perfect: false, score: 75 }
    const chapterData = state?.chapterData
    const chapter = CHAPTERS.find(c => c.id === parseInt(chapterId))
    const isGood = result.ending === 'good'

    // Badge awarded for this chapter
    const badgeIds = {
        1: 'phishing-hunter',
        2: 'tidy-desk',
        3: 'social-shield',
        4: 'password-master',
        5: 'first-responder',
        6: 'cyber-hero',
    }
    const earnedBadgeId = isGood ? badgeIds[parseInt(chapterId)] : null
    const earnedBadge = earnedBadgeId ? BADGES.find(b => b.id === earnedBadgeId) : null

    const xpBreakdown = [
        { label: 'Pilihan Benar', value: result.xpEarned - (isGood ? 200 : 100) - (result.perfect ? 100 : 0), color: '#60a5fa' },
        { label: isGood ? 'Bonus Akhir Baik' : 'Penyelesaian Modul', value: isGood ? 200 : 100, color: '#22c55e' },
        ...(result.perfect ? [{ label: 'Bonus Skor Sempurna!', value: 100, color: '#FFD60A' }] : []),
    ].filter(x => x.value > 0)

    return (
        <div className="min-h-screen bg-main flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            {isGood && <Confetti />}

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className={`absolute inset-0 ${isGood ? 'bg-green-900/10' : 'bg-red-900/10'}`} />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 opacity-20 rounded-full blur-3xl"
                    style={{ background: isGood ? '#22c55e' : '#E63946' }} />
            </div>

            <div className="relative z-10 w-full max-w-2xl">
                {/* Result header */}
                <motion.div
                    className="text-center mb-6"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    <div className="text-8xl mb-3">{isGood ? '🎉' : '💥'}</div>
                    <h1 className={`text-3xl font-bold font-display ${isGood ? 'text-accent' : 'text-primary'}`}>
                        {isGood ? 'Misi Selesai!' : 'Misi Gagal'}
                    </h1>
                    <p className="text-muted mt-1">{chapter?.title} — {chapter?.subtitle}</p>
                </motion.div>

                {/* Stats row */}
                <motion.div
                    className="glass-card p-5 mb-4"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-3xl font-bold text-accent">{result.score}%</p>
                            <p className="text-xs text-dim mt-1">Skor</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-main">{result.xpEarned}</p>
                            <p className="text-xs text-dim mt-1">XP Diperoleh</p>
                        </div>
                        <div>
                            <p className={`text-3xl font-bold ${isGood ? 'text-green-400' : 'text-yellow-400'}`}>
                                {isGood ? '🏆' : '⚠️'}
                            </p>
                            <p className="text-xs text-dim mt-1">{isGood ? 'Akhir Baik' : 'Akhir Buruk'}</p>
                        </div>
                    </div>
                </motion.div>

                {/* XP Breakdown */}
                <motion.div
                    className="glass-card p-5 mb-4"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2 className="font-bold text-main mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4 text-accent" /> Rincian XP
                    </h2>
                    <div className="space-y-2">
                        {xpBreakdown.map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-muted text-sm">{item.label}</span>
                                <motion.span
                                    className="font-bold text-sm"
                                    style={{ color: item.color }}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                >
                                    +{item.value} XP
                                </motion.span>
                            </div>
                        ))}
                        <div className="border-t border-card-border pt-2 flex justify-between">
                            <span className="font-bold text-main">Total</span>
                            <span className="font-bold text-accent text-lg">+{result.xpEarned} XP</span>
                        </div>
                    </div>
                </motion.div>

                {/* Badge awarded */}
                {earnedBadge && (
                    <motion.div
                        className="glass-card p-5 mb-4 border border-accent/30"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                    >
                        <h2 className="font-bold text-accent mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4" /> Lencana Terbuka!
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="badge-earned w-16 h-16">
                                <span className="text-3xl">{earnedBadge.icon}</span>
                            </div>
                            <div>
                                <p className="font-bold text-main">{earnedBadge.name}</p>
                                <p className="text-muted text-sm">{earnedBadge.desc}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Action buttons */}
                <motion.div
                    className="flex gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <button
                        id="retry-result-btn"
                        onClick={() => navigate(`/play/${chapterId}`)}
                        className="btn-secondary flex-1 flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" /> Main Lagi
                    </button>
                    <button
                        id="next-chapter-btn"
                        onClick={() => navigate('/chapters')}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                        {isGood ? 'Modul Selanjutnya' : 'Kembali ke Peta'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </motion.div>
            </div>
        </div>
    )
}
