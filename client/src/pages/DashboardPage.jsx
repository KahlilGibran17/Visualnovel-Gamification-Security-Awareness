import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, BookOpen, Award, Flame, Lock, CheckCircle, PlayCircle, ChevronRight, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useGame } from '../contexts/GameContext.jsx'
import Layout from '../components/Layout.jsx'
import AvatarDisplay from '../components/AvatarDisplay.jsx'
import axios from 'axios'

function XPBar({ xp, level, nextLevel }) {
    const safeXp = Math.max(0, Number(xp) || 0)
    const nextLevelXp = nextLevel?.xpRequired ?? safeXp
    const xpForNext = Math.max(1, nextLevelXp)
    const pct = nextLevel ? Math.min(100, (safeXp / xpForNext) * 100) : 100

    return (
        <div>
            <div className="flex justify-between text-xs mb-1 text-muted">
                <span>{safeXp.toLocaleString()} XP</span>
                {nextLevel && <span>{nextLevelXp.toLocaleString()} XP untuk {nextLevel.title}</span>}
            </div>
            <div className="xp-bar">
                <motion.div
                    className="xp-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                />
            </div>
        </div>
    )
}

function StatWidget({ icon: Icon, label, value, color = '#E63946', delay = 0 }) {
    return (
        <motion.div
            className="stat-widget"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
        >
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-muted text-xs font-medium uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-2xl font-bold text-main">{value}</p>
        </motion.div>
    )
}

function ChapterMapNode({ chapter, progress, locked, onPlay, index, isNoXpRole }) {
    const isComplete = progress?.completed
    const isUnlocked = !locked

    return (
        <motion.div
            className="chapter-node"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * index + 0.4 }}
        >
            <motion.button
                id={`chapter-${chapter.id}-btn`}
                onClick={() => isUnlocked && onPlay(chapter.id)}
                disabled={!isUnlocked}
                whileHover={isUnlocked ? { scale: 1.1 } : {}}
                whileTap={isUnlocked ? { scale: 0.95 } : {}}
                className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl transition-all duration-300 ${isComplete ? 'chapter-node-completed' :
                    isUnlocked ? 'chapter-node-unlocked' : 'chapter-node-locked'
                    }`}
            >
                {isComplete && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center"
                    >
                        <CheckCircle className="w-3 h-3 text-dark" />
                    </motion.div>
                )}
                {locked && (
                    <div className="absolute inset-0 bg-dark/40 rounded-full flex items-center justify-center">
                        <Lock className="w-5 h-5 text-dim/50" />
                    </div>
                )}
                <span>{chapter.icon}</span>
            </motion.button>

            <div className="text-center max-w-[80px]">
                <p className="text-xs font-semibold text-main leading-tight">{chapter.title}</p>
                <p className="text-xs text-dim">{chapter.subtitle}</p>
                {isComplete && !isNoXpRole && (
                    <p className="text-xs text-accent font-bold mt-0.5">+{progress.xpEarned} XP</p>
                )}
            </div>
        </motion.div>
    )
}

function MiniPodium({ entries, ownNik }) {
    if (!entries || entries.length < 3) return null
    const [second, first, third] = [entries[1], entries[0], entries[2]]
    const podiumData = [
        { user: second, place: 2, height: 'h-20', color: 'podium-silver', crown: '🥈' },
        { user: first, place: 1, height: 'h-28', color: 'podium-gold', crown: '👑' },
        { user: third, place: 3, height: 'h-14', color: 'podium-bronze', crown: '🥉' },
    ]

    return (
        <div className="flex items-end justify-center gap-3 p-4">
            {podiumData.map(({ user, place, height, color, crown }) => (
                <div key={place} className="flex flex-col items-center gap-1">
                    <span className="text-lg">{crown}</span>
                    <AvatarDisplay avatarId={user.avatarId} size="sm" showRing={user.nik === ownNik} />
                    <p className="text-xs font-semibold text-main max-w-[60px] text-center leading-tight truncate">{user.name.split(' ')[0]}</p>
                    <p className="text-xs text-accent font-bold">{user.xp.toLocaleString()}</p>
                    <div className={`${height} w-14 rounded-t-lg border ${color} flex items-center justify-center`}>
                        <span className="font-bold text-main text-sm">#{place}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

function StreakSummary({ streak = 1, monthLabel = '' }) {
    return (
        <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                <motion.div
                    className="absolute inset-0 rounded-full bg-orange-500/30 blur-xl"
                    animate={{ scale: [0.8, 1.15, 0.8], opacity: [0.35, 0.75, 0.35] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.span
                    className="text-5xl leading-none"
                    animate={{ scale: [1, 1.12, 1], y: [0, -3, 0], rotate: [-2, 2, -2] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                >
                    🔥
                </motion.span>
                <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ opacity: [0.2, 1, 0.2], y: [2, -3, 2], scale: [0.8, 1.1, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                >
                    <Flame className="w-4 h-4 text-yellow-300" />
                </motion.div>
            </div>

            <div className="leading-tight">
                <p className="text-4xl font-extrabold text-main">{streak}</p>
                <p className="text-orange-300 text-2xl font-semibold">Hari Berturut-turut</p>
                <p className="text-main/70 text-xl mt-0.5">di bulan {monthLabel}</p>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    const { user, refreshUser } = useAuth()
    const isNoXpRole = user?.role === 'admin' || user?.role === 'super-admin'
    const { chapterProgress, getLevelFromXP, getNextLevel, CHAPTERS, BADGES, LEVELS, loading, error, leaderboard, getUserRank, getNextRankGap, elearningCompleted, loadBadges } = useGame()
    const navigate = useNavigate()
    const [showWelcome, setShowWelcome] = useState(true)
    const [allBadges, setAllBadges] = useState([])

    const level = getLevelFromXP(user?.xp || 0)
    const nextLevel = getNextLevel(user?.xp || 0)

    const loadAllBadges = async () => {
        try {
            const res = await axios.get('/api/badges/getBadgesByCategory')
            setAllBadges(res.data.badges || [])
        } catch (error) {
            console.error('Error loading all badges:', error)
        }
    }
    
    useEffect(() => {
        refreshUser()
        loadAllBadges()
        loadBadges()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => setShowWelcome(false), 4000)
        return () => clearTimeout(timer)
    }, [])
    
    if (!level) {
        return (
            <Layout>
                <div className="p-6 text-center text-white/50">
                    Loading profile...
                </div>
            </Layout>
        )
    }

    const myRank = getUserRank()
    const rankGap = getNextRankGap()
    const normalizeBadgeKey = (value) => {
        if (typeof value === 'string' || typeof value === 'number') {
            return String(value).trim().toLowerCase()
        }
        if (!value || typeof value !== 'object') return ''
        return String(value.id ?? value.badge_key ?? value.badgeKey ?? value.badge_id ?? value.key ?? '').trim().toLowerCase()
    }

    const normalizeBadgeColor = (badge) => {
        const rawColor = typeof badge?.color === 'string' ? badge.color.trim() : ''
        const prefixed = rawColor && !rawColor.startsWith('#') ? `#${rawColor}` : rawColor
        return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(prefixed) ? prefixed : '#FFD60A'
    }

    const withAlpha = (hexColor, alphaHex) => {
        const clean = hexColor.replace('#', '')
        const sixDigit = clean.length === 3
            ? clean.split('').map((c) => c + c).join('')
            : clean
        return `#${sixDigit}${alphaHex}`
    }

    // Badge earned = badge_key ada di user.badges (dari auth context)
    const earnedBadgeKeys = new Set((user?.badges || []).map(normalizeBadgeKey).filter(Boolean))

    // Ambil semua badge dari DB, sort earned dulu, ambil 6 saja
    const displayedBadges = [...allBadges]
        .sort((a, b) => {
            const aEarned = earnedBadgeKeys.has(normalizeBadgeKey(a))
            const bEarned = earnedBadgeKeys.has(normalizeBadgeKey(b))
            if (aEarned === bEarned) return 0
            return aEarned ? -1 : 1
        })
        .slice(0, 6)

    const completedChapters = Object.values(chapterProgress).filter(p => p.completed).length
    const totalXP = user?.xp || 0
    const safeStreak = Math.max(1, Number(user?.streak) || 1)
    const monthRaw = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date())
    const currentMonthLabel = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1)



    return (
        <Layout>
           
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Profile Header */}
                <motion.div
                    id="dashboard-profile"
                    className="glass-card p-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <AvatarDisplay avatarId={user?.avatarId || 1} size="xl" showRing ringColor={level.color} />

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-main font-display">{user?.name}</h1>
                                <span
                                    className="px-3 py-1 rounded-full text-xs font-bold border"
                                    style={{ color: level.color, borderColor: `${level.color}60`, background: `${level.color}15` }}
                                >
                                    {level.icon} {level.title}
                                </span>
                            </div>
                            <p className="text-muted text-sm mb-1">NIK: {user?.nik} • {user?.department} • {user?.position}</p>
                            {!isNoXpRole && (
                                <div className="max-w-md">
                                    <XPBar xp={totalXP} level={level} nextLevel={nextLevel} />
                                </div>
                            )}
                            <p className="text-dim text-xs mt-3 italic">Di sini Anda bisa melihat progres Anda</p>
                        </div>

                        {/* Rank badge */}
                        {!isNoXpRole && (
                            <motion.div
                                className="glass-card p-4 text-center flex-shrink-0"
                                animate={{ boxShadow: ['0 0 20px rgba(255, 214, 10,0.2)', '0 0 40px rgba(255, 214, 10,0.5)', '0 0 20px rgba(255, 214, 10,0.2)'] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Trophy className="w-8 h-8 text-accent mx-auto mb-1" />
                                <p className="text-3xl font-bold text-accent">#{myRank || '-'}</p>
                                <p className="text-xs text-dim">Peringkat Global</p>
                                {rankGap && (
                                    <p className="text-xs text-muted mt-1 max-w-[100px] leading-tight">
                                        Butuh {rankGap.gap} XP ke #{rankGap.rank}
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Rank nudge bar */}
                {rankGap && !isNoXpRole && (
                    <motion.div
                        className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 rounded-xl p-4 flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <TrendingUp className="w-5 h-5 text-accent flex-shrink-0" />
                        <p className="text-muted text-sm">
                            <span className="text-accent font-bold">Peringkat Anda #{myRank}</span> — hanya butuh{' '}
                            <span className="text-main font-bold">{rankGap.gap} XP</span> lagi untuk menyusul #{rankGap.rank} ({rankGap.name.split(' ')[0]})! 🔥
                        </p>
                        <button onClick={() => navigate('/leaderboard')} className="btn-accent text-xs px-3 py-1.5 ml-auto flex-shrink-0">
                            Lihat Papan Peringkat
                        </button>
                    </motion.div>
                )}

                {/* Stat Widgets */}
                <div className={`grid grid-cols-2 ${isNoXpRole ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4`}>
                    {!isNoXpRole && <StatWidget icon={Star} label="Total XP" value={totalXP.toLocaleString()} color="#FFD60A" delay={0.1} />}
                    {!isNoXpRole && <StatWidget icon={Trophy} label="Peringkat Global" value={`#${myRank || '-'}`} color="#E63946" delay={0.15} />}
                    <StatWidget icon={BookOpen} label="Modul Selesai" value={`${completedChapters}/6`} color="#60a5fa" delay={0.2} />
                    {!isNoXpRole && <StatWidget icon={Award} label="Lencana" value={`${earnedBadgeKeys.size}/${allBadges.length}`} color="#a78bfa" delay={0.25} />}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chapter Map */}
                    <motion.div
                        className="glass-card p-6 lg:col-span-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-main font-display flex items-center gap-2">
                                    📚 Peta Modul Tantangan
                                    <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full border border-primary/30 animate-pulse uppercase tracking-tighter font-black">Kompetisi Aktif</span>
                                </h2>
                                <p className="text-xs text-muted mt-1">Selesaikan semua tantangan dan raih skor sempurna!</p>
                            </div>
                            <button onClick={() => navigate('/chapters')} className="text-accent text-sm hover:underline flex items-center gap-1 font-bold">
                                Lihat Semua <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Reward Motivation Banner */}
                        <div className="mb-8 p-4 rounded-2xl bg-gradient-to-br from-accent/20 via-primary/5 to-transparent border border-accent/30 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl -mr-10 -mt-10 group-hover:bg-accent/20 transition-all duration-700" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 rounded-2xl bg-dark/60 flex items-center justify-center border border-white/10 shadow-2xl transform group-hover:scale-110 transition-transform duration-500 overflow-hidden relative">
                                        <img src="/airpods_reward_3d.png" alt="AirPods" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <span className="absolute bottom-1 text-[8px] font-black text-accent uppercase tracking-tighter">AirPods</span>
                                    </div>
                                    <div className="w-20 h-20 rounded-2xl bg-dark/60 flex items-center justify-center border border-white/10 shadow-2xl transform group-hover:scale-110 transition-transform duration-500 delay-75 overflow-hidden relative">
                                        <img src="/smartwatch_reward_3d.png" alt="Smartwatch" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <span className="absolute bottom-1 text-[8px] font-black text-accent uppercase tracking-tighter">Watch</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-accent font-black text-sm uppercase tracking-wider mb-1">Hadiah Eksklusif Menanti!</p>
                                    <p className="text-main font-bold text-lg leading-tight">Selesaikan semua tantangan dan raih hadiah untuk 3 peringkat tertinggi!</p>
                                    <p className="text-muted text-xs mt-1">Top 3 Global akan mendapatkan reward spesial setiap bulannya.</p>
                                </div>
                                <button onClick={() => navigate('/leaderboard')} className="md:ml-auto btn-accent px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-accent/20">
                                    Cek Peringkat
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 place-items-center py-2">
                            {CHAPTERS.map((ch, idx) => {
                                const locked = !elearningCompleted || (idx > 0 && !chapterProgress[CHAPTERS[idx - 1].id]?.completed)
                                return (
                                    <ChapterMapNode
                                        key={ch.id}
                                        chapter={ch}
                                        progress={chapterProgress[ch.id]}
                                        locked={locked}
                                        onPlay={(id) => navigate(`/play/${id}`)}
                                        index={idx}
                                        isNoXpRole={isNoXpRole}
                                    />
                                )
                            })}
                        </div>
                    </motion.div>

                    {/* Right column */}
                    <div className="space-y-4">
                        {/* Leaderboard Preview */}
                        <motion.div
                            className="glass-card p-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-base font-bold text-main font-display flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-accent" />
                                    Papan Peringkat
                                </h2>
                                <button onClick={() => navigate('/leaderboard')} className="flex items-center gap-1 text-accent text-xs hover:underline font-bold">
                                    Lihat Penuh <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <MiniPodium entries={leaderboard.slice(0, 3)} ownNik={user?.nik} />
                            {myRank && myRank > 3 && (
                                <div className="rank-row-own mt-2 text-sm">
                                    <span className="text-accent font-bold">#{myRank}</span>
                                    <span className="text-main">{user?.name?.split(' ')[0]}</span>
                                    <span className="text-dim ml-auto">{totalXP.toLocaleString()} XP</span>
                                </div>
                            )}
                        </motion.div>

                        {/* Streak Summary */}
                        <motion.div
                            className="glass-card p-4 bg-gradient-to-r from-orange-500/10 via-red-500/5 to-transparent border border-orange-400/25"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <StreakSummary streak={safeStreak} monthLabel={currentMonthLabel} />
                        </motion.div>
                    </div>
                </div>

                {/* Badge Showcase */}
                {!isNoXpRole && (
                    <motion.div
                        className="glass-card p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                    >
                   <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-main font-display flex items-center gap-2">
                            🏆 Koleksi Lencana
                        </h2>
                        <button onClick={() => navigate('/profile')} className="text-accent text-sm hover:underline flex items-center gap-1">
                            View All <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {displayedBadges.slice(0, 6).map((badge, i) => {
                            const earned = earnedBadgeKeys.has(normalizeBadgeKey(badge))
                            const badgeColor = normalizeBadgeColor(badge)
                            const earnedStyle = earned
                                ? {
                                    borderColor: withAlpha(badgeColor, '88'),
                                    background: `linear-gradient(135deg, ${withAlpha(badgeColor, '30')}, ${withAlpha(badgeColor, '14')})`,
                                    boxShadow: `0 0 18px ${withAlpha(badgeColor, '5A')}`,
                                }
                                : {
                                    borderColor: 'var(--card-border)',
                                    background: 'var(--input-bg)',
                                    filter: 'grayscale(1)',
                                    opacity: 0.7,
                                }
                            return (
                                        <motion.div
                                            key={badge.id}
                                            className={`${earned ? 'badge-earned' : 'badge-locked'} relative p-4 flex flex-col items-center gap-2`}
                                            whileHover={earned ? { scale: 1.05 } : {}}
                                            style={earnedStyle}
                                        >
                                            {earned && (
                                                <span className="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 border border-green-400/50">
                                                    <CheckCircle className="w-3 h-3 text-green-300" />
                                                </span>
                                            )}
                                            <span className="text-3xl">{badge.icon}</span>
                                            <p className="text-xs font-bold text-main text-center">{badge.name}</p>
                                            <p className="text-xs text-main/40 text-center">{badge.description}</p>
                                        </motion.div>
                            )
                        })}
                        </div>
                    </motion.div>
                )}
            </div>
        </Layout>
    )
}
