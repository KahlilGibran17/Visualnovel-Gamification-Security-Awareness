import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, BookOpen, Award, Flame, Lock, CheckCircle, ChevronRight, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useGame } from '../contexts/GameContext.jsx'
import Layout from '../components/Layout.jsx'
import AvatarDisplay from '../components/AvatarDisplay.jsx'
import axios from 'axios'

function XPBar({ xp, level, nextLevel }) {
    const safeXp = Math.max(0, Number(xp) || 0)
    const nextLevelXp = nextLevel?.xpRequired ?? safeXp
    const xpPct = nextLevel ? Math.min(100, (safeXp / nextLevelXp) * 100) : 100

    return (
        <div>
            <div className="flex justify-between text-[10px] mb-1">
                <span className="text-dim">{level?.title || 'Pemula'}</span>
                {nextLevel && <span className="text-dim">{nextLevel.title}</span>}
            </div>
            <div className="xp-bar">
                <motion.div
                    className="xp-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                />
            </div>
            <div className="flex justify-between text-[10px] mt-1">
                <span className="text-accent font-semibold">{safeXp.toLocaleString()} XP</span>
                {nextLevel && (
                    <span className="text-dim">
                        Butuh {Math.max(0, nextLevelXp - safeXp).toLocaleString()} XP lagi
                    </span>
                )}
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
                <span className="text-dim text-[10px] font-medium uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-xl font-bold text-main">{value}</p>
        </motion.div>
    )
}

function ChapterMapNode({ chapter, progress, locked, onPlay, index }) {
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
                <p className="text-[10px] font-semibold text-main leading-tight">{chapter.title}</p>
                <p className="text-[9px] text-dim">{chapter.subtitle}</p>
                {isComplete && (
                    <p className="text-[9px] text-accent font-bold mt-0.5">+{progress.xpEarned} XP</p>
                )}
            </div>
        </motion.div>
    )
}

function MiniPodium({ entries, ownNik }) {
    if (!entries || entries.length < 3) return null
    const [second, first, third] = [entries[1], entries[0], entries[2]]
    const podiumData = [
        { user: second, place: 2, height: 'h-16', color: 'podium-silver', crown: '🥈' },
        { user: first, place: 1, height: 'h-24', color: 'podium-gold', crown: '👑' },
        { user: third, place: 3, height: 'h-12', color: 'podium-bronze', crown: '🥉' },
    ]

    return (
        <div className="flex items-end justify-center gap-3 p-2">
            {podiumData.map(({ user, place, height, color, crown }) => (
                <div key={place} className="flex flex-col items-center gap-1">
                    <span className="text-sm">{crown}</span>
                    <AvatarDisplay avatarId={user.avatarId} size="xs" showRing={user.nik === ownNik} />
                    <p className="text-[9px] font-semibold text-main max-w-[50px] text-center leading-tight truncate">{user.name.split(' ')[0]}</p>
                    <p className="text-[9px] text-accent font-bold">{user.xp.toLocaleString()}</p>
                    <div className={`${height} w-10 rounded-t-lg border ${color} flex items-center justify-center`}>
                        <span className="font-bold text-main text-[10px]">#{place}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

function StreakSummary({ streak = 1, monthLabel = '' }) {
    return (
        <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                <motion.div
                    className="absolute inset-0 rounded-full bg-orange-500/30 blur-xl"
                    animate={{ scale: [0.8, 1.15, 0.8], opacity: [0.35, 0.75, 0.35] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.span
                    className="text-3xl leading-none"
                    animate={{ scale: [1, 1.12, 1], y: [0, -3, 0], rotate: [-2, 2, -2] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                >
                    🔥
                </motion.span>
            </div>

            <div className="leading-tight">
                <p className="text-2xl font-extrabold text-main">{streak}</p>
                <p className="text-accent text-sm font-semibold">Hari Beruntun</p>
                <p className="text-dim text-xs">di bulan {monthLabel}</p>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    const { user, refreshUser } = useAuth()
    const { 
        chapterProgress, getLevelFromXP, getNextLevel, 
        CHAPTERS, BADGES, leaderboard, getUserRank, 
        getNextRankGap, elearningCompleted, loadBadges, badges 
    } = useGame()
    const navigate = useNavigate()
    const [showWelcome, setShowWelcome] = useState(true)
    const [userBadges, setUserBadges] = useState([]) 

    const level = getLevelFromXP(user?.xp || 0)
    const nextLevel = getNextLevel(user?.xp || 0)

    useEffect(() => {
        const timer = setTimeout(() => setShowWelcome(false), 4000)
        return () => clearTimeout(timer)
    }, [])

    const loadUserBadges = async () => {
        try {
            const res = await axios.get('/api/badges/getUserBadges')
            setUserBadges(res.data.badges || [])
        } catch (error) {
            console.error('Error loading user badges:', error)
        }
    }

    useEffect(() => {
        if (user) {
            refreshUser()
            loadUserBadges()
        }
    }, [])

    const myRank = getUserRank()
    const rankGap = getNextRankGap()

    const normalizeBadgeKey = (value) => {
        if (typeof value === 'string' || typeof value === 'number') {
            return String(value).trim().toLowerCase()
        }
        if (!value || typeof value !== 'object') return ''
        return String(value.id ?? value.badge_key ?? value.badgeId ?? value.badge_id ?? '').trim().toLowerCase()
    }

    const normalizeBadgeColor = (badge) => {
        const rawColor = typeof badge?.color === 'string' ? badge.color.trim() : ''
        const prefixed = rawColor && !rawColor.startsWith('#') ? `#${rawColor}` : rawColor
        return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(prefixed) ? prefixed : '#FFD60A'
    }

    const withAlpha = (hexColor, alphaHex) => {
        const clean = hexColor.replace('#', '')
        const sixDigit = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
        return `#${sixDigit}${alphaHex}`
    }

    const earnedBadgeSet = new Set([...userBadges, ...(user?.badges || [])].map(normalizeBadgeKey).filter(Boolean))
    const displayedBadges = [...(badges || [])]
        .sort((a, b) => {
            const aEarned = earnedBadgeSet.has(normalizeBadgeKey(a))
            const bEarned = earnedBadgeSet.has(normalizeBadgeKey(b))
            if (aEarned === bEarned) return 0
            return aEarned ? -1 : 1
        })
        .slice(0, 6)

    const completedChapters = Object.values(chapterProgress).filter(p => p.completed).length
    const totalXP = user?.xp || 0
    const safeStreak = Math.max(1, Number(user?.streak) || 1)
    const monthRaw = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date())
    const currentMonthLabel = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1)

    if (!level) return null

    return (
        <Layout>
            <AnimatePresence>
                {showWelcome && (
                    <motion.div
                        className="fixed top-4 right-4 z-50 glass-card p-4 flex items-center gap-3 max-w-xs"
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                    >
                        <span className="text-2xl">🤖</span>
                        <div>
                            <p className="text-accent font-bold text-xs uppercase">AKE-BOT</p>
                            <p className="text-dim text-[10px]">Selamat datang kembali, {user?.name?.split(' ')[0]}! Siap naik level hari ini?</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Profile Header */}
                <motion.div
                    className="glass-card p-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <AvatarDisplay avatarId={user?.avatarId || 1} size="xl" showRing ringColor={level.color} />

                        <div className="flex-1 w-full">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-main font-display">{user?.name}</h1>
                                <span
                                    className="px-3 py-0.5 rounded-full text-xs font-bold border"
                                    style={{ color: level.color, borderColor: `${level.color}60`, background: `${level.color}15` }}
                                >
                                    {level.icon} {level.title}
                                </span>
                            </div>
                            <p className="text-dim text-xs mb-3">NPK: {user?.nik} • {user?.department} • {user?.position}</p>
                            <div className="max-w-md">
                                <XPBar xp={totalXP} level={level} nextLevel={nextLevel} />
                            </div>
                        </div>

                        <motion.div
                            className="glass-card p-4 text-center flex-shrink-0"
                            animate={{ boxShadow: ['0 0 20px rgba(255,214,10,0.1)', '0 0 35px rgba(255,214,10,0.3)', '0 0 20px rgba(255,214,10,0.1)'] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <Trophy className="w-6 h-6 text-accent mx-auto mb-1" />
                            <p className="text-3xl font-bold text-accent">#{myRank || '—'}</p>
                            <p className="text-[10px] text-dim uppercase tracking-wider">Peringkat Global</p>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Rank nudge bar */}
                {rankGap && (
                    <motion.div
                        className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 rounded-xl p-3 flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <TrendingUp className="w-4 h-4 text-accent flex-shrink-0" />
                        <p className="text-dim text-xs">
                            <span className="text-accent font-bold">Peringkat Anda #{myRank}</span> — hanya butuh{' '}
                            <span className="text-main font-bold">{rankGap.gap} XP</span> lagi untuk menyusul #{rankGap.rank} ({rankGap.name.split(' ')[0]})! 🔥
                        </p>
                        <button onClick={() => navigate('/leaderboard')} className="text-accent text-[10px] font-bold hover:underline ml-auto flex-shrink-0">
                            Lihat Papan Peringkat
                        </button>
                    </motion.div>
                )}

                {/* Stat Widgets */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatWidget icon={Star} label="Total XP" value={totalXP.toLocaleString()} color="#FFD60A" delay={0.1} />
                    <StatWidget icon={Trophy} label="Peringkat Global" value={`#${myRank || '—'}`} color="#E63946" delay={0.15} />
                    <StatWidget icon={BookOpen} label="Modul Selesai" value={`${completedChapters}/6`} color="#60a5fa" delay={0.2} />
                    <StatWidget icon={Award} label="Lencana" value={`${earnedBadgeSet.size}/${badges?.length || 0}`} color="#a78bfa" delay={0.25} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chapter Map */}
                    <motion.div
                        className="glass-card p-6 lg:col-span-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-main font-display flex items-center gap-2">
                                    📚 Tantangan Keamanan Siber
                                </h2>
                                <p className="text-xs text-dim mt-1">Selesaikan semua modul tantangan untuk meraih skor tertinggi!</p>
                            </div>
                            <button onClick={() => navigate('/chapters')} className="text-accent text-xs hover:underline flex items-center gap-1 font-bold">
                                Lihat Semua <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Reward Motivation Banner */}
                        <div className="mb-10 p-5 rounded-2xl bg-gradient-to-br from-accent/20 via-primary/5 to-transparent border border-accent/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl -mr-10 -mt-10 group-hover:bg-accent/20 transition-all duration-700" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-dark/60 flex items-center justify-center border border-white/10 shadow-2xl transform group-hover:scale-110 transition-transform duration-500 overflow-hidden relative">
                                        <img src="/airpods_reward_3d.png" alt="AirPods" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <span className="absolute bottom-1 text-[7px] font-black text-accent uppercase tracking-tighter">AirPods</span>
                                    </div>
                                    <div className="w-16 h-16 rounded-xl bg-dark/60 flex items-center justify-center border border-white/10 shadow-2xl transform group-hover:scale-110 transition-transform duration-500 delay-75 overflow-hidden relative">
                                        <img src="/smartwatch_reward_3d.png" alt="Smartwatch" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <span className="absolute bottom-1 text-[7px] font-black text-accent uppercase tracking-tighter">Watch</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-accent font-black text-[10px] uppercase tracking-wider mb-1">Hadiah Eksklusif!</p>
                                    <p className="text-main font-bold text-base leading-tight">Kejar peringkat tertinggi dan dapatkan hadiah spesial!</p>
                                    <p className="text-dim text-[10px] mt-1">Top 3 Global akan mendapatkan reward eksklusif setiap periode kompetisi.</p>
                                </div>
                                <button onClick={() => navigate('/leaderboard')} className="md:ml-auto btn-accent px-5 py-2 rounded-xl font-bold text-xs shadow-lg shadow-accent/20">
                                    Cek Peringkat
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 place-items-center py-4">
                            {CHAPTERS.slice(0, 6).map((ch, idx) => {
                                const locked = !elearningCompleted || (idx > 0 && !chapterProgress[CHAPTERS[idx - 1].id]?.completed)
                                return (
                                    <ChapterMapNode
                                        key={ch.id}
                                        chapter={ch}
                                        progress={chapterProgress[ch.id]}
                                        locked={locked}
                                        onPlay={(id) => navigate(`/play/${id}`)}
                                        index={idx}
                                    />
                                )
                            })}
                        </div>
                    </motion.div>

                    {/* Right column */}
                    <div className="space-y-4">
                        {/* Leaderboard Preview */}
                        <motion.div
                            className="glass-card p-5"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold text-main font-display flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-accent" />
                                    Papan Peringkat
                                </h2>
                                <button onClick={() => navigate('/leaderboard')} className="text-accent text-[10px] hover:underline">
                                    Lihat Semua →
                                </button>
                            </div>
                            <MiniPodium entries={leaderboard.slice(0, 3)} ownNik={user?.nik} />
                            {myRank && myRank > 3 && (
                                <div className="rank-row-own mt-3 p-2 rounded-lg bg-primary/5 border border-primary/10 text-xs flex items-center gap-2">
                                    <span className="text-accent font-bold">#{myRank}</span>
                                    <span className="text-main truncate flex-1">{user?.name}</span>
                                    <span className="text-accent font-bold">{(user?.xp || 0).toLocaleString()} XP</span>
                                </div>
                            )}
                        </motion.div>

                        {/* Streak Summary */}
                        <motion.div
                            className="glass-card p-5 bg-gradient-to-r from-orange-500/10 via-red-500/5 to-transparent border border-orange-400/20"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <StreakSummary streak={safeStreak} monthLabel={currentMonthLabel} />
                        </motion.div>
                    </div>
                </div>

                {/* Badge Showcase */}
                <motion.div
                    className="glass-card p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-main font-display flex items-center gap-2">
                            🏆 Koleksi Lencana
                        </h2>
                        <button onClick={() => navigate('/profile')} className="text-accent text-xs hover:underline flex items-center gap-1 font-bold">
                            Semua Lencana <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {displayedBadges.map((badge, i) => {
                            const earned = earnedBadgeSet.has(normalizeBadgeKey(badge))
                            const badgeColor = normalizeBadgeColor(badge)
                            const earnedStyle = earned
                                ? {
                                    borderColor: withAlpha(badgeColor, '88'),
                                    background: `linear-gradient(135deg, ${withAlpha(badgeColor, '30')}, ${withAlpha(badgeColor, '14')})`,
                                    boxShadow: `0 0 15px ${withAlpha(badgeColor, '40')}`,
                                }
                                : undefined
                            return (
                                <motion.div
                                    key={badge?.id ?? `${badge?.name ?? 'badge'}-${i}`}
                                    className={`${earned ? 'badge-earned' : 'badge-locked'} aspect-square p-4 flex flex-col items-center justify-center text-center gap-2`}
                                    whileHover={earned ? { scale: 1.1 } : {}}
                                    title={badge.name}
                                    style={earnedStyle}
                                >
                                    <span className="text-3xl">{badge.icon}</span>
                                    <span className="text-[10px] font-bold text-main line-clamp-1">{badge.name}</span>
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>
            </div>
        </Layout>
    )
}
