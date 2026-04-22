import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Table, CheckCircle, XCircle } from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import AvatarDisplay from '../../components/AvatarDisplay.jsx'
import toast from '../../utils/toast.js'
import axios from 'axios'
import { exportToExcel } from '../../utils/exportExcel.js'

const normalizeLeaderboardRows = (rows) => {
    if (!Array.isArray(rows)) return []

    return rows.map((row, index) => ({
        ...row,
        id: Number(row?.id) || index + 1,
        xp: Number(row?.xp) || 0,
        chaptersCompleted: Number(row?.chaptersCompleted) || 0,
        avatarId: Number(row?.avatarId) || 1,
    }))
}

export default function AdminReportsPage() {
    const [leaderboardRows, setLeaderboardRows] = useState([])
    const [totalChapters, setTotalChapters] = useState(0)
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState([])

    useEffect(() => {
        let isMounted = true

        const loadComplianceData = async () => {
            setLoading(true)
            try {
                const [leaderboardRes, chaptersRes] = await Promise.all([
                    axios.get('/api/leaderboard', {
                        params: { filter: 'all', dept: 'all', includeZeroXp: 'true' }
                    }),
                    axios.get('/api/elearning/getChapters'),
                ])

                if (isMounted) {
                    setLeaderboardRows(normalizeLeaderboardRows(leaderboardRes.data))
                    setTotalChapters(Array.isArray(chaptersRes.data) ? chaptersRes.data.length : 0)
                }
            } catch (err) {
                console.error('Failed to load compliance data:', err)
                if (isMounted) {
                    setLeaderboardRows([])
                    setTotalChapters(0)
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        loadComplianceData()

        return () => {
            isMounted = false
        }
    }, [])

    const complianceRows = useMemo(
        () => leaderboardRows.map((user) => ({
            ...user,
            allDone: totalChapters > 0 && user.chaptersCompleted >= totalChapters,
        })),
        [leaderboardRows, totalChapters]
    )

    const departmentSummary = useMemo(() => {
        const grouped = complianceRows.reduce((acc, user) => {
            const dept = user.department || 'Unknown'
            if (!acc[dept]) {
                acc[dept] = { dept, complete: 0, total: 0 }
            }

            acc[dept].total += 1
            if (user.allDone) {
                acc[dept].complete += 1
            }

            return acc
        }, {})

        return Object.values(grouped)
            .map((dept) => ({
                ...dept,
                pct: dept.total > 0 ? Math.round((dept.complete / dept.total) * 100) : 0,
            }))
            .sort((a, b) => b.pct - a.pct)
    }, [complianceRows])

    const totalComplete = complianceRows.filter(u => u.allDone).length
    const pct = complianceRows.length > 0
        ? Math.round((totalComplete / complianceRows.length) * 100)
        : 0
    const inProgressCount = complianceRows.filter(u => u.chaptersCompleted > 0 && !u.allDone).length
    const notStartedCount = complianceRows.filter(u => u.chaptersCompleted === 0).length
    const tableColumnCount = 5 + totalChapters

    const handleExport = (type) => {
        if (type === 'Excel') {
            exportToExcel(leaderboardRows, 'Compliance_Report');
        } else {
            toast.success(`Exporting ${type} report... (Demo mode — connect backend for real export)`)
        }
    }

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                <motion.div className="flex flex-col md:flex-row md:items-center gap-4"
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div>
                        <h1 className="text-3xl font-bold font-display text-white">📊 Reports & Export</h1>
                        <p className="text-white/50 mt-1">Compliance tracking and progress analytics</p>
                    </div>
                    <div className="md:ml-auto flex gap-2">
                        <button id="export-excel-btn" onClick={() => handleExport('Excel')}
                            className="btn-secondary text-sm flex items-center gap-2">
                            <Table className="w-4 h-4" /> Export Excel
                        </button>
                        <button id="export-pdf-btn" onClick={() => handleExport('PDF')}
                            className="btn-primary text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Export PDF
                        </button>
                    </div>
                </motion.div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Completion Rate', value: loading ? '...' : `${pct}%`, color: '#22c55e', icon: '✅' },
                        { label: 'All Chapters Done', value: loading ? '...' : totalComplete, color: '#60a5fa', icon: '🏆' },
                        { label: 'In Progress', value: loading ? '...' : inProgressCount, color: '#FFD60A', icon: '📚' },
                        { label: 'Not Started', value: loading ? '...' : notStartedCount, color: '#E63946', icon: '⚠️' },
                    ].map((s, i) => (
                        <motion.div key={s.label} className="stat-widget text-center"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                            <div className="text-3xl mb-1">{s.icon}</div>
                            <p className="text-2xl font-bold text-white">{s.value}</p>
                            <p className="text-xs text-white/40">{s.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Department compliance chart */}
                <motion.div className="glass-card p-5"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h2 className="font-bold text-white mb-4">🏢 Department Completion Rate</h2>
                    {loading && (
                        <p className="text-white/40 text-sm mb-3">Loading department chart...</p>
                    )}
                    {!loading && departmentSummary.length === 0 && (
                        <p className="text-white/40 text-sm mb-3">No department summary available.</p>
                    )}
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={departmentSummary} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                            <XAxis dataKey="dept" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} />
                            <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                            <Tooltip
                                contentStyle={{ background: '#16213E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                formatter={(val) => [`${val}%`, 'Completion']}
                            />
                            <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                                {departmentSummary.map((entry, i) => (
                                    <Cell key={i} fill={entry.pct >= 50 ? '#22c55e' : entry.pct > 0 ? '#FFD60A' : '#E63946'} opacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Compliance table */}
                <motion.div className="glass-card overflow-hidden"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div className="p-5 border-b border-white/10">
                        <h2 className="font-bold text-white text-lg">Compliance Status — All Employees</h2>
                        <p className="text-white/50 text-sm mt-1">
                            Employees who have completed all {loading ? '...' : totalChapters} chapters
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="admin-table w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th>XP</th>
                                    <th>Chapters</th>
                                    {Array.from({ length: totalChapters }).map((_, idx) => {
                                        const chapterNumber = idx + 1
                                        return <th key={chapterNumber} className="text-center">Ch.{chapterNumber}</th>
                                    })}
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={tableColumnCount} className="text-center text-white/40 py-8">Loading compliance report...</td>
                                    </tr>
                                )}

                                {!loading && complianceRows.length === 0 && (
                                    <tr>
                                        <td colSpan={tableColumnCount} className="text-center text-white/40 py-8">No compliance data available.</td>
                                    </tr>
                                )}

                                {!loading && complianceRows.map((u, i) => (
                                    <motion.tr key={u.id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <AvatarDisplay avatarId={u.avatarId} size="xs" />
                                                <span className="text-white font-medium">{u.name}</span>
                                            </div>
                                        </td>
                                        <td>{u.department}</td>
                                        <td className="font-bold text-accent">{u.xp.toLocaleString()}</td>
                                        <td>{u.chaptersCompleted}/{totalChapters}</td>
                                        {Array.from({ length: totalChapters }).map((_, idx) => {
                                            const chapterNumber = idx + 1
                                            return (
                                                <td key={chapterNumber} className="text-center">
                                                    {chapterNumber <= u.chaptersCompleted
                                                        ? <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                                                        : <XCircle className="w-4 h-4 text-white/20 mx-auto" />
                                                    }
                                                </td>
                                            )
                                        })}
                                        <td>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.allDone ? 'bg-green-500/20 text-green-400' : u.chaptersCompleted > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {u.allDone ? '✅ Complete' : u.chaptersCompleted > 0 ? '🔄 In Progress' : '❌ Not Started'}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </Layout>
    )
}
