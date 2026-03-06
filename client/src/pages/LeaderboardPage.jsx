import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Filter, ChevronDown, Users, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useGame } from '../contexts/GameContext.jsx'
import Layout from '../components/Layout.jsx'
import AvatarDisplay from '../components/AvatarDisplay.jsx'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const FILTERS = ['All Time', 'This Week', 'This Month']
const DEPARTMENTS = ['All Departments', 'Engineering', 'IT', 'Marketing', 'HR', 'Finance', 'Operations']
const LEVEL_COLORS = ['#94a3b8', '#60a5fa', '#a78bfa', '#f59e0b', '#E63946']

function PodiumBlock({ user, place, isOwn }) {
    const heights = { 1: 'h-32', 2: 'h-24', 3: 'h-16' }
    const crownColors = { 1: 'podium-gold', 2: 'podium-silver', 3: 'podium-bronze' }
    const crowns = { 1: '👑', 2: '🥈', 3: '🥉' }
    const order = { 1: 'order-2', 2: 'order-1', 3: 'order-3' }

    return (
        <motion.div
            className={`flex flex-col items-center gap-2 ${order[place]}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: place === 1 ? 0.1 : place === 2 ? 0.2 : 0.3, type: 'spring', stiffness: 200 }}
        >
            {/* Crown */}
            <motion.span
                className="text-2xl"
                animate={place === 1 ? { rotate: [-5, 5, -5], y: [0, -3, 0] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
                {crowns[place]}
            </motion.span>

            {/* Avatar */}
            <div className={`relative ${isOwn ? 'ring-2 ring-accent rounded-full' : ''}`}>
                <AvatarDisplay avatarId={user.avatarId} size={place === 1 ? 'lg' : 'md'} showRing={isOwn} ringColor="#FFD60A" />
                {isOwn && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs bg-accent text-dark px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                        YOU
                    </div>
                )}
            </div>

            {/* Name */}
            <div className="text-center">
                <p className="font-semibold text-white text-sm max-w-[90px] truncate">{user.name.split(' ')[0]}</p>
                <p className="text-white/40 text-xs">{user.department}</p>
                <p className="text-accent font-bold text-sm">{user.xp.toLocaleString()} XP</p>
            </div>

            {/* Podium block */}
            <div className={`${heights[place]} w-20 ${crownColors[place]} rounded-t-xl border flex items-center justify-center`}>
                <span className="text-2xl font-black text-white/70">#{place}</span>
            </div>
        </motion.div>
    )
}

function LevelBadge({ level }) {
    const colors = ['#94a3b8', '#60a5fa', '#a78bfa', '#f59e0b', '#E63946']
    const icons = ['🛡️', '👁️', '🛡️', '⚡', '🦸']
    const titles = ['Rookie', 'Aware', 'Guardian', 'Expert', 'Cyber Hero']
    const color = colors[level - 1] || colors[0]
    return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border" style={{ color, borderColor: `${color}50`, background: `${color}15` }}>
            {icons[level - 1]} {titles[level - 1]}
        </span>
    )
}

function ChapterDots({ count }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6].map(n => (
                <div
                    key={n}
                    className={`w-2.5 h-2.5 rounded-full ${n <= count ? 'bg-accent' : 'bg-white/10'}`}
                />
            ))}
        </div>
    )
}

export default function LeaderboardPage() {
    const { user } = useAuth()
    const { leaderboard, deptStats, getUserRank, getNextRankGap } = useGame()
    const [filter, setFilter] = useState('All Time')
    const [dept, setDept] = useState('All Departments')
    const [showDeptFilter, setShowDeptFilter] = useState(false)
    const [showDeptChart, setShowDeptChart] = useState(false)

    const myRank = getUserRank()
    const rankGap = getNextRankGap()

    // Filter results based on selected filters
    const filtered = leaderboard.filter(u =>
        dept === 'All Departments' || u.department === dept
    ).map((u, i) => ({ ...u, rank: i + 1 }))

    const top3 = filtered.slice(0, 3)
    const rest = filtered.slice(3)
    const ownEntry = leaderboard.find(u => u.nik === user?.nik)

    return (
        <Layout>
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-bold font-display text-white flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-accent" />
                            Leaderboard
                        </h1>
                        <p className="text-white/50 mt-1">Who's the top Cyber Hero at Akebono this week? 🔥</p>
                    </div>

                    {/* Department chart toggle */}
                    <div className="md:ml-auto flex gap-2">
                        <button
                            id="dept-chart-toggle"
                            onClick={() => setShowDeptChart(!showDeptChart)}
                            className={`btn-secondary text-sm flex items-center gap-2 ${showDeptChart ? 'bg-white/20' : ''}`}
                        >
                            <Users className="w-4 h-4" /> Dept. View
                        </button>
                    </div>
                </motion.div>

                {/* Rank nudge */}
                {rankGap && (
                    <motion.div
                        className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 rounded-xl p-4 flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <TrendingUp className="w-5 h-5 text-accent flex-shrink-0" />
                        <p className="text-white/80 text-sm">
                            You're ranked <span className="text-accent font-bold">#{myRank}</span> — only{' '}
                            <span className="text-white font-bold">{rankGap.gap} XP</span> away from #{rankGap.rank} ({rankGap.name.split(' ')[0]})!
                        </p>
                    </motion.div>
                )}

                {/* Department chart */}
                <AnimatePresence>
                    {showDeptChart && (
                        <motion.div
                            className="glass-card p-6"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-white text-lg">🏢 Department Rankings</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-white/40">by Average XP</span>
                                    {deptStats && deptStats.length > 0 && (
                                        <span className="text-xs bg-accent/20 text-accent border border-accent/30 px-2 py-1 rounded-full font-bold">
                                            ⭐ Top: {deptStats[0].dept}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={deptStats || []} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                                    <XAxis dataKey="dept" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ background: '#16213E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                        formatter={(val) => [`${val.toLocaleString()} avg XP`]}
                                    />
                                    <Bar dataKey="avgXp" radius={[4, 4, 0, 0]}>
                                        {(deptStats || []).map((entry, idx) => (
                                            <Cell key={idx} fill={idx === 0 ? '#FFD60A' : '#E63946'} opacity={idx === 0 ? 1 : 0.6} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filters */}
                <motion.div
                    className="flex flex-wrap items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <Filter className="w-4 h-4 text-white/40" />
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            id={`filter-${f.replace(' ', '-').toLowerCase()}`}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${filter === f
                                ? 'bg-primary text-white'
                                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                                }`}
                        >
                            {f}
                        </button>
                    ))}

                    {/* Department dropdown */}
                    <div className="relative">
                        <button
                            id="dept-filter-btn"
                            onClick={() => setShowDeptFilter(!showDeptFilter)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all duration-200"
                        >
                            {dept} <ChevronDown className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                            {showDeptFilter && (
                                <motion.div
                                    className="absolute top-full mt-1 left-0 glass-card py-1 min-w-[180px] z-20"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    {DEPARTMENTS.map(d => (
                                        <button
                                            key={d}
                                            onClick={() => { setDept(d); setShowDeptFilter(false) }}
                                            className={`block w-full text-left px-4 py-2 text-sm transition-colors ${dept === d ? 'text-accent bg-white/5' : 'text-white/70 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Podium */}
                <motion.div
                    className="glass-card p-6 overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    {/* Background glow */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
                    </div>
                    <h2 className="text-center font-bold text-white text-lg mb-6">🏆 Top 3 Champions</h2>
                    <div className="flex items-end justify-center gap-4 relative z-10">
                        {top3.length >= 3 && [
                            { user: top3[1], place: 2 },
                            { user: top3[0], place: 1 },
                            { user: top3[2], place: 3 },
                        ].map(({ user: u, place }) => (
                            <PodiumBlock
                                key={place}
                                user={u}
                                place={place}
                                isOwn={u.nik === user?.nik}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Full Rank Table */}
                <motion.div
                    className="glass-card overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="p-5 border-b border-white/10">
                        <h2 className="font-bold text-white text-lg">Full Rankings</h2>
                    </div>

                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/10 text-xs text-white/40 font-semibold uppercase tracking-wider">
                        <span className="col-span-1">Rank</span>
                        <span className="col-span-4">Player</span>
                        <span className="col-span-2 text-center hidden md:block">Level</span>
                        <span className="col-span-2 text-center">XP</span>
                        <span className="col-span-3 hidden lg:block">Chapters</span>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-white/5">
                        {filtered.map((entry, idx) => {
                            const isOwn = entry.nik === user?.nik
                            return (
                                <motion.div
                                    key={entry.id}
                                    className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center transition-all duration-200 ${isOwn
                                        ? 'bg-gradient-to-r from-accent/10 to-primary/10 border-l-2 border-accent'
                                        : 'hover:bg-white/5'
                                        }`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.02 * idx }}
                                >
                                    {/* Rank */}
                                    <div className="col-span-1">
                                        {entry.rank <= 3 ? (
                                            <span className="text-xl">{['👑', '🥈', '🥉'][entry.rank - 1]}</span>
                                        ) : (
                                            <span className={`font-bold text-sm ${isOwn ? 'text-accent' : 'text-white/60'}`}>#{entry.rank}</span>
                                        )}
                                    </div>

                                    {/* Player */}
                                    <div className="col-span-4 flex items-center gap-2 min-w-0">
                                        <AvatarDisplay avatarId={entry.avatarId} size="sm" />
                                        <div className="min-w-0">
                                            <p className={`font-semibold text-sm truncate ${isOwn ? 'text-accent' : 'text-white'}`}>
                                                {entry.name} {isOwn && '(You)'}
                                            </p>
                                            <p className="text-white/40 text-xs truncate">{entry.department}</p>
                                        </div>
                                    </div>

                                    {/* Level */}
                                    <div className="col-span-2 hidden md:flex justify-center">
                                        <LevelBadge level={entry.level} />
                                    </div>

                                    {/* XP */}
                                    <div className="col-span-2 text-center">
                                        <span className={`font-bold text-sm ${isOwn ? 'text-accent' : 'text-white/80'}`}>
                                            {entry.xp.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Chapters */}
                                    <div className="col-span-3 hidden lg:block">
                                        <ChapterDots count={entry.chaptersCompleted} />
                                        <p className="text-xs text-white/30 mt-1">{entry.chaptersCompleted}/6 done</p>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Own row sticky at bottom if not visible */}
                    {ownEntry && myRank > 10 && dept === 'All Departments' && (
                        <div className="border-t-2 border-accent/30 bg-gradient-to-r from-accent/10 to-primary/10 p-4">
                            <p className="text-xs text-accent font-semibold mb-2">📍 Your Position</p>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-accent">#{myRank}</span>
                                <AvatarDisplay avatarId={user?.avatarId || 1} size="sm" />
                                <span className="font-semibold text-white">{user?.name} (You)</span>
                                <span className="text-accent font-bold ml-auto">{ownEntry.xp.toLocaleString()} XP</span>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </Layout>
    )
}
