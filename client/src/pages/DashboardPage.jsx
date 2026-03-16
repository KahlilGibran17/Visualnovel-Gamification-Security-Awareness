import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, BookOpen, Award, Flame, Lock, CheckCircle, PlayCircle, ChevronRight, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useGame } from '../contexts/GameContext.jsx'
import Layout from '../components/Layout.jsx'
import AvatarDisplay from '../components/AvatarDisplay.jsx'

function XPBar({ xp, level, nextLevel }) {
    const xpIntoLevel = xp - level.xpRequired
    const xpForNext = nextLevel ? nextLevel.xpRequired - level.xpRequired : 1
    const pct = nextLevel ? Math.min(100, (xpIntoLevel / xpForNext) * 100) : 100

    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="text-white/50">{level.title}</span>
                {nextLevel && <span className="text-white/50">{nextLevel.title}</span>}
            </div>
            <div className="xp-bar">
                <motion.div
                    className="xp-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                />
            </div>
            <div className="flex justify-between text-xs mt-1">
                <span className="text-accent font-semibold">{xp.toLocaleString()} XP</span>
                {nextLevel && <span className="text-white/30">{nextLevel.xpRequired.toLocaleString()} needed</span>}
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
                <span className="text-white/50 text-xs font-medium uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
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
                    <div className="absolute inset-0 bg-dark/50 rounded-full flex items-center justify-center">
                        <Lock className="w-5 h-5 text-white/30" />
                    </div>
                )}
                <span>{chapter.icon}</span>
            </motion.button>

            <div className="text-center max-w-[80px]">
                <p className="text-xs font-semibold text-white/80 leading-tight">{chapter.title}</p>
                <p className="text-xs text-white/40">{chapter.subtitle}</p>
                {isComplete && (
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
                    <p className="text-xs font-semibold text-white/90 max-w-[60px] text-center leading-tight truncate">{user.name.split(' ')[0]}</p>
                    <p className="text-xs text-accent font-bold">{user.xp.toLocaleString()}</p>
                    <div className={`${height} w-14 rounded-t-lg border ${color} flex items-center justify-center`}>
                        <span className="font-bold text-white/80 text-sm">#{place}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

function StreakCalendar({ streak = 0 }) {
    const today = new Date()
    const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - (13 - i))
        const isActive = i >= (14 - streak)
        return { date: d, active: isActive && i < 14 }
    })

    return (
        <div className="flex gap-1 flex-wrap">
            {days.map((d, i) => (
                <div
                    key={i}
                    title={d.date.toLocaleDateString()}
                    className={`w-7 h-7 rounded-md transition-all ${d.active ? 'bg-primary/70' : 'bg-white/5 border border-white/10'
                        }`}
                />
            ))}
        </div>
    )
}

export default function DashboardPage() {
    const { user } = useAuth()
    const { chapterProgress, getLevelFromXP, getNextLevel, CHAPTERS, BADGES, leaderboard, getUserRank, getNextRankGap } = useGame()
    const navigate = useNavigate()
    const [showWelcome, setShowWelcome] = useState(true)

    const level = getLevelFromXP(user?.xp || 0)
    const nextLevel = getNextLevel(user?.xp || 0)
    const myRank = getUserRank()
    const rankGap = getNextRankGap()
    const earnedBadges = user?.badges || []

    const completedChapters = Object.values(chapterProgress).filter(p => p.completed).length
    const totalXP = user?.xp || 0

    useEffect(() => {
        const timer = setTimeout(() => setShowWelcome(false), 4000)
        return () => clearTimeout(timer)
    }, [])

    return (
        <Layout>
            {/* Welcome toast */}
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
                            <p className="text-accent font-bold text-sm">AKE-BOT</p>
                            <p className="text-white/70 text-xs">Welcome back, {user?.name?.split(' ')[0]}! Ready to level up today?</p>
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
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <AvatarDisplay avatarId={user?.avatarId || 1} size="xl" showRing ringColor={level.color} />

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-white font-display">{user?.name}</h1>
                                <span
                                    className="px-3 py-1 rounded-full text-xs font-bold border"
                                    style={{ color: level.color, borderColor: `${level.color}60`, background: `${level.color}15` }}
                                >
                                    {level.icon} {level.title}
                                </span>
                            </div>
                            <p className="text-white/50 text-sm mb-1">NIK: {user?.nik} • {user?.department} • {user?.position}</p>
                            <div className="max-w-md">
                                <XPBar xp={totalXP} level={level} nextLevel={nextLevel} />
                            </div>
                        </div>

                        {/* Rank badge */}
                        <motion.div
                            className="glass-card p-4 text-center flex-shrink-0"
                            animate={{ boxShadow: ['0 0 20px rgba(255,214,10,0.2)', '0 0 40px rgba(255,214,10,0.5)', '0 0 20px rgba(255,214,10,0.2)'] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <Trophy className="w-8 h-8 text-accent mx-auto mb-1" />
                            <p className="text-3xl font-bold text-accent">#{myRank || '—'}</p>
                            <p className="text-xs text-white/40">Global Rank</p>
                            {rankGap && (
                                <p className="text-xs text-white/60 mt-1 max-w-[100px] leading-tight">
                                    {rankGap.gap} XP to #{rankGap.rank}
                                </p>
                            )}
                        </motion.div>
                    </div>
                </motion.div>

                {/* Rank nudge bar */}
                {rankGap && (
                    <motion.div
                        className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 rounded-xl p-4 flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <TrendingUp className="w-5 h-5 text-accent flex-shrink-0" />
                        <p className="text-white/80 text-sm">
                            <span className="text-accent font-bold">You're ranked #{myRank}</span> — only{' '}
                            <span className="text-white font-bold">{rankGap.gap} XP</span> away from #{rankGap.rank} ({rankGap.name.split(' ')[0]})! 🔥
                        </p>
                        <button onClick={() => navigate('/leaderboard')} className="btn-accent text-xs px-3 py-1.5 ml-auto flex-shrink-0">
                            View Leaderboard
                        </button>
                    </motion.div>
                )}

                {/* Stat Widgets */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatWidget icon={Star} label="Total XP" value={totalXP.toLocaleString()} color="#FFD60A" delay={0.1} />
                    <StatWidget icon={Trophy} label="Global Rank" value={`#${myRank || '—'}`} color="#E63946" delay={0.15} />
                    <StatWidget icon={BookOpen} label="Chapters Done" value={`${completedChapters}/6`} color="#60a5fa" delay={0.2} />
                    <StatWidget icon={Award} label="Badges" value={`${earnedBadges.length}/${BADGES.length}`} color="#a78bfa" delay={0.25} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chapter Map */}
                    <motion.div
                        className="glass-card p-6 lg:col-span-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white font-display">📚 Chapter Map</h2>
                            <button onClick={() => navigate('/chapters')} className="text-accent text-sm hover:underline flex items-center gap-1">
                                View All <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-6 place-items-center py-2">
                            {CHAPTERS.map((ch, idx) => {
                                const locked = idx > 0 && !chapterProgress[CHAPTERS[idx - 1].id]?.completed
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
                            className="glass-card p-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-accent" />
                                    Leaderboard
                                </h2>
                                <button onClick={() => navigate('/leaderboard')} className="text-accent text-xs hover:underline">
                                    Full View →
                                </button>
                            </div>
                            <MiniPodium entries={leaderboard.slice(0, 3)} ownNik={user?.nik} />
                            {myRank && myRank > 3 && (
                                <div className="rank-row-own mt-2 text-sm">
                                    <span className="text-accent font-bold">#{myRank}</span>
                                    <span className="text-white">{user?.name?.split(' ')[0]}</span>
                                    <span className="text-white/50 ml-auto">{totalXP.toLocaleString()} XP</span>
                                </div>
                            )}
                        </motion.div>

                        {/* Streak Calendar */}
                        <motion.div
                            className="glass-card p-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Flame className="w-4 h-4 text-orange-400" />
                                <h2 className="text-base font-bold text-white">Login Streak</h2>
                                <span className="ml-auto text-orange-400 font-bold">{user?.streak || 1} 🔥</span>
                            </div>
                            <StreakCalendar streak={user?.streak || 1} />
                            <p className="text-xs text-white/40 mt-2">Last 14 days</p>
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
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                            🏆 Badge Collection
                        </h2>
                        <button onClick={() => navigate('/profile')} className="text-accent text-sm hover:underline flex items-center gap-1">
                            View All <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                        {BADGES.map(badge => {
                            const earned = earnedBadges.includes(badge.id)
                            return (
                                <motion.div
                                    key={badge.id}
                                    className={`${earned ? 'badge-earned' : 'badge-locked'} w-full aspect-square p-2`}
                                    whileHover={earned ? { scale: 1.1 } : {}}
                                    title={badge.name}
                                >
                                    <div className="flex flex-col items-center justify-center gap-1 h-full">
                                        <span className="text-2xl">{badge.icon}</span>
                                        <span className="text-xs text-center font-medium leading-tight text-white/70" style={{ fontSize: '10px' }}>
                                            {badge.name}
                                        </span>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>
            </div>
        </Layout>
    )
}
