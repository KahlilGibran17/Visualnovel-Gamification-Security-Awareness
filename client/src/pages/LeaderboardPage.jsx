import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Filter, ChevronDown, Users, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import Layout from '../components/Layout.jsx'
import AvatarDisplay from '../components/AvatarDisplay.jsx'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import axios from 'axios'

const FILTERS = ['Sepanjang Waktu', 'Minggu Ini', 'Bulan Ini']
const FILTER_QUERY_MAP = {
    'Sepanjang Waktu': 'all',
    'Minggu Ini': 'weekly',
    'Bulan Ini': 'monthly',
}

const normalizeLeaderboardRows = (rows) => {
    if (!Array.isArray(rows)) return []
    return rows.map((row, index) => ({
        ...row,
        rank: Number(row?.rank) || index + 1,
        xp: Number(row?.xp) || 0,
        level: Number(row?.level) || 1,
        chaptersCompleted: Number(row?.chapters_completed || row?.chaptersCompleted) || 0,
        avatarId: Number(row?.avatar_id || row?.avatarId) || 1,
    }))
}

const normalizeDeptStats = (rows) => {
    if (!Array.isArray(rows)) return []
    return rows.map((row) => ({
        ...row,
        members: Number(row?.members) || 0,
        avgXp: Number(row?.avgXp || row?.avg_xp) || 0,
    }))
}

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
            <motion.span
                className="text-2xl"
                animate={place === 1 ? { rotate: [-5, 5, -5], y: [0, -3, 0] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
                {crowns[place]}
            </motion.span>

            <div className={`relative ${isOwn ? 'ring-2 ring-accent rounded-full' : ''}`}>
                <AvatarDisplay avatarId={user.avatarId} size={place === 1 ? 'lg' : 'md'} showRing={isOwn} ringColor="#FFD60A" />
                {isOwn && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] bg-accent text-dark px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                        ANDA
                    </div>
                )}
            </div>

            <div className="text-center">
                <p className="font-semibold text-main text-xs max-w-[80px] truncate">{user.name.split(' ')[0]}</p>
                <p className="text-dim text-[10px]">{user.department}</p>
                <p className="text-accent font-bold text-xs">{user.xp.toLocaleString()} XP</p>
            </div>

            <div className={`${heights[place]} w-16 ${crownColors[place]} rounded-t-xl border flex items-center justify-center`}>
                <span className="text-xl font-black text-main opacity-50">#{place}</span>
            </div>
        </motion.div>
    )
}

function LevelBadge({ badge }) {
    if (!badge) return <span className="text-[10px] text-dim">-</span>
    return (
        <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap"
            style={{
                color: badge.color,
                borderColor: `${badge.color}50`,
                background: `${badge.color}15`,
            }}
        >
            {badge.icon} {badge.title}
        </span>
    )
}

function ChapterDots({ completed = 0, total = 0, loading = false }) {
    const safeTotal = Math.max(1, Number(total) || 6)
    const safeCompleted = Math.min(safeTotal, Math.max(0, Number(completed) || 0))

    if (loading) {
        return (
            <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-input-bg animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: safeTotal }).map((_, i) => (
                <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i < safeCompleted ? 'bg-accent' : 'bg-input-bg'}`}
                />
            ))}
        </div>
    )
}

export default function LeaderboardPage() {
    const { user } = useAuth()
    const [filter, setFilter] = useState('Sepanjang Waktu')
    const [dept, setDept] = useState('Semua Departemen')
    const [showDeptFilter, setShowDeptFilter] = useState(false)
    const [showDeptChart, setShowDeptChart] = useState(false)
    const [leaderboardRows, setLeaderboardRows] = useState([])
    const [deptStats, setDeptStats] = useState([])
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(true)
    const [totalChapters, setTotalChapters] = useState(0)
    const [loadingTotalChapters, setLoadingTotalChapters] = useState(true)
    const [levelMap, setLevelMap] = useState({})

    useEffect(() => {
        const load = async () => {
            setLoadingLeaderboard(true)
            try {
                const res = await axios.get('/api/leaderboard', {
                    params: {
                        filter: FILTER_QUERY_MAP[filter] || 'all',
                        dept: dept === 'Semua Departemen' ? 'all' : dept,
                        includeZeroXp: 'false',
                    },
                })
                setLeaderboardRows(normalizeLeaderboardRows(res.data))
            } catch (e) {
                console.error('Failed to load leaderboard data', e)
                setLeaderboardRows([])
            } finally {
                setLoadingLeaderboard(false)
            }
        }
        load()
    }, [filter, dept])

    useEffect(() => {
        const loadDepartmentStats = async () => {
            try {
                const res = await axios.get('/api/leaderboard/departments')
                setDeptStats(normalizeDeptStats(res.data))
            } catch (e) {
                console.error('Failed to load department stats', e)
            }
        }
        loadDepartmentStats()
    }, [])

    useEffect(() => {
        const loadTotalChapters = async () => {
            setLoadingTotalChapters(true)
            try {
                const res = await axios.get('/api/progress/chapters/total')
                setTotalChapters(res.data?.total || 6)
            } catch (e) {
                console.error('Failed to load chapters total', e)
                setTotalChapters(6)
            } finally {
                setLoadingTotalChapters(false)
            }
        }
        loadTotalChapters()
    }, [])

    useEffect(() => {
        const loadLevels = async () => {
            try {
                const res = await axios.get('/api/badges/getLevelBadges')
                const rows = Array.isArray(res.data) ? res.data : (res.data?.levelBadges || [])
                const map = Object.fromEntries(
                    rows.filter(l => l.level).map(l => [Number(l.level), l])
                )
                setLevelMap(map)
            } catch (e) {
                console.error('Failed to load levels', e)
            }
        }
        loadLevels()
    }, [])

    const departmentOptions = useMemo(() => {
        const opts = ['Semua Departemen']
        deptStats.forEach(d => { if (d.dept) opts.push(d.dept) })
        return Array.from(new Set(opts))
    }, [deptStats])

    const myEntry = leaderboardRows.find(u => u.nik === user?.nik)
    const myRank = myEntry?.rank
    const aboveEntry = myRank && myRank > 1 ? leaderboardRows.find(u => u.rank === myRank - 1) : null
    const rankGap = aboveEntry ? {
        rank: aboveEntry.rank,
        name: aboveEntry.name,
        gap: Math.max(0, aboveEntry.xp - (myEntry?.xp || 0)),
    } : null

    const top3 = leaderboardRows.slice(0, 3)

    return (
        <Layout>
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-display text-main flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-accent" /> Papan Peringkat
                        </h1>
                        <p className="text-muted mt-1 text-sm">Siapa Pahlawan Siber terbaik di Akebono minggu ini? 🔥</p>
                    </div>
                    <div className="md:ml-auto flex gap-2">
                        <button onClick={() => setShowDeptChart(!showDeptChart)} className={`btn-secondary text-xs flex items-center gap-2 ${showDeptChart ? 'bg-primary/20' : ''}`}>
                            <Users className="w-4 h-4" /> Per Departemen
                        </button>
                    </div>
                </motion.div>

                {/* Rank nudge */}
                {rankGap && (
                    <motion.div className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 rounded-xl p-4 flex items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <TrendingUp className="w-5 h-5 text-accent flex-shrink-0" />
                        <p className="text-muted text-sm">
                            Anda di peringkat <span className="text-accent font-bold">#{myRank}</span> — hanya butuh{' '}
                            <span className="text-main font-bold">{rankGap.gap} XP</span> lagi untuk menyusul #{rankGap.rank} ({rankGap.name.split(' ')[0]})!
                        </p>
                    </motion.div>
                )}

                {/* Dept Chart */}
                <AnimatePresence>
                    {showDeptChart && (
                        <motion.div className="glass-card p-6" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-main text-sm uppercase tracking-wider">🏢 Peringkat Departemen</h2>
                                <span className="text-[10px] text-dim">Rata-rata XP</span>
                            </div>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={deptStats}>
                                    <XAxis dataKey="dept" stroke="var(--text-dim)" tick={{ fontSize: 10 }} />
                                    <YAxis stroke="var(--text-dim)" tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '12px' }} />
                                    <Bar dataKey="avgXp" radius={[4, 4, 0, 0]}>
                                        {deptStats.map((entry, idx) => <Cell key={idx} fill={idx === 0 ? 'var(--accent)' : 'var(--primary)'} opacity={idx === 0 ? 1 : 0.6} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-4 h-4 text-dim mr-2" />
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === f ? 'bg-primary text-white' : 'bg-card-bg text-dim hover:text-main'}`}>
                            {f}
                        </button>
                    ))}
                    <div className="relative ml-auto">
                        <button onClick={() => setShowDeptFilter(!showDeptFilter)} className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-card-bg border border-card-border text-dim hover:text-main transition-all">
                            {dept} <ChevronDown className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                            {showDeptFilter && (
                                <motion.div className="absolute top-full mt-1 right-0 glass-card py-1 min-w-[160px] z-20" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    {departmentOptions.map(d => (
                                        <button key={d} onClick={() => { setDept(d); setShowDeptFilter(false) }} className={`block w-full text-left px-4 py-2 text-xs transition-colors ${dept === d ? 'text-accent bg-input-bg' : 'text-dim hover:text-main hover:bg-input-bg'}`}>
                                            {d}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Podium */}
                <motion.div className="glass-card p-6 relative overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
                    </div>
                    <h2 className="text-center font-bold text-main text-base mb-8 uppercase tracking-widest">🏆 3 Juara Teratas</h2>
                    <div className="flex items-end justify-center gap-4 relative z-10">
                        {top3.length >= 1 && <PodiumBlock user={top3[1] || top3[0]} place={top3[1] ? 2 : 1} isOwn={(top3[1] || top3[0]).nik === user?.nik} />}
                        {top3.length >= 1 && <PodiumBlock user={top3[0]} place={1} isOwn={top3[0].nik === user?.nik} />}
                        {top3.length >= 3 && <PodiumBlock user={top3[2]} place={3} isOwn={top3[2].nik === user?.nik} />}
                    </div>
                </motion.div>

                {/* Table */}
                <motion.div className="glass-card overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="p-4 border-b border-card-border bg-card-bg/50">
                        <h2 className="font-bold text-main text-sm uppercase tracking-wider">Peringkat Lengkap</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-card-border text-[10px] text-dim uppercase tracking-wider">
                                    <th className="px-5 py-3 font-semibold">Rank</th>
                                    <th className="px-5 py-3 font-semibold">Pemain</th>
                                    <th className="px-5 py-3 font-semibold text-center">Tingkat</th>
                                    <th className="px-5 py-3 font-semibold text-center">XP</th>
                                    <th className="px-5 py-3 font-semibold">Progres Misi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-card-border">
                                {loadingLeaderboard ? (
                                    <tr><td colSpan="5" className="px-5 py-10 text-center text-dim italic">Memuat data...</td></tr>
                                ) : leaderboardRows.length === 0 ? (
                                    <tr><td colSpan="5" className="px-5 py-10 text-center text-dim italic">Tidak ada data.</td></tr>
                                ) : leaderboardRows.map((entry, idx) => {
                                    const isOwn = entry.nik === user?.nik
                                    return (
                                        <motion.tr key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.01 * idx }} className={`${isOwn ? 'bg-accent/5' : 'hover:bg-input-bg'} transition-colors`}>
                                            <td className="px-5 py-3">
                                                {entry.rank <= 3 ? (
                                                    <span className="text-lg">{['👑', '🥈', '🥉'][entry.rank - 1]}</span>
                                                ) : (
                                                    <span className={`font-bold text-xs ${isOwn ? 'text-accent' : 'text-dim'}`}>#{entry.rank}</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <AvatarDisplay avatarId={entry.avatarId} size="xs" />
                                                    <div className="min-w-0">
                                                        <p className={`font-bold text-xs truncate ${isOwn ? 'text-accent' : 'text-main'}`}>{entry.name} {isOwn && '(Anda)'}</p>
                                                        <p className="text-[10px] text-dim truncate">{entry.department}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex justify-center">
                                                    <LevelBadge badge={levelMap[Number(entry.level)]} />
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`font-bold text-xs ${isOwn ? 'text-accent' : 'text-main'}`}>{entry.xp.toLocaleString()}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <ChapterDots completed={entry.chaptersCompleted} total={totalChapters} loading={loadingTotalChapters} />
                                                <p className="text-[9px] text-dim mt-1">{entry.chaptersCompleted}/{totalChapters} misi</p>
                                            </td>
                                        </motion.tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Sticky My Rank */}
                {myRank > 10 && dept === 'Semua Departemen' && (
                    <motion.div className="sticky bottom-4 glass-card p-4 border-accent/30 shadow-2xl bg-card-bg/95 backdrop-blur-md" initial={{ y: 50 }} animate={{ y: 0 }}>
                        <div className="flex items-center gap-4">
                            <span className="font-black text-accent text-lg">#{myRank}</span>
                            <AvatarDisplay avatarId={user?.avatarId || 1} size="xs" />
                            <div className="flex-1">
                                <p className="font-bold text-main text-xs">{user?.name} (Anda)</p>
                                <p className="text-[10px] text-dim">{user?.department}</p>
                            </div>
                            <span className="font-black text-accent">{myEntry?.xp.toLocaleString()} XP</span>
                        </div>
                    </motion.div>
                )}
            </div>
        </Layout>
    )
}
