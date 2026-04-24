import { motion } from 'framer-motion'
import { Download, FileText, Table, CheckCircle, XCircle } from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import { DEMO_LEADERBOARD } from '../../contexts/GameContext.jsx'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import AvatarDisplay from '../../components/AvatarDisplay.jsx'
import toast from 'react-hot-toast'

const COMPLIANCE = DEMO_LEADERBOARD.map(u => ({
    ...u,
    allDone: u.chaptersCompleted === 6,
}))

const DEPT_SUMMARY = [
    { dept: 'IT', complete: 2, total: 3, pct: 67 },
    { dept: 'Engineering', complete: 3, total: 4, pct: 75 },
    { dept: 'Marketing', complete: 1, total: 3, pct: 33 },
    { dept: 'Finance', complete: 1, total: 4, pct: 25 },
    { dept: 'HR', complete: 1, total: 3, pct: 33 },
    { dept: 'Operations', complete: 0, total: 3, pct: 0 },
]

export default function AdminReportsPage() {
    const totalComplete = COMPLIANCE.filter(u => u.allDone).length
    const pct = Math.round((totalComplete / COMPLIANCE.length) * 100)

    const handleExport = (type) => {
        toast.success(`Exporting ${type} report... (Demo mode — connect backend for real export)`)
    }

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                <motion.div className="flex flex-col md:flex-row md:items-center gap-4"
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div>
                        <h1 className="text-3xl font-bold font-display text-main">📊 Reports & Export</h1>
                        <p className="text-muted mt-1">Compliance tracking and progress analytics</p>
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
                        { label: 'Completion Rate', value: `${pct}%`, color: '#22c55e', icon: '✅' },
                        { label: 'All Chapters Done', value: totalComplete, color: '#60a5fa', icon: '🏆' },
                        { label: 'In Progress', value: COMPLIANCE.filter(u => u.chaptersCompleted > 0 && !u.allDone).length, color: '#FFD60A', icon: '📚' },
                        { label: 'Not Started', value: COMPLIANCE.filter(u => u.chaptersCompleted === 0).length, color: '#E63946', icon: '⚠️' },
                    ].map((s, i) => (
                        <motion.div key={s.label} className="stat-widget text-center"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                            <div className="text-3xl mb-1">{s.icon}</div>
                            <p className="text-2xl font-bold text-main">{s.value}</p>
                            <p className="text-xs text-dim">{s.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Department compliance chart */}
                <motion.div className="glass-card p-5"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h2 className="font-bold text-main mb-4">🏢 Department Completion Rate</h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={DEPT_SUMMARY} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                            <XAxis dataKey="dept" stroke="var(--text-dim)" tick={{ fontSize: 12 }} />
                            <YAxis stroke="var(--text-dim)" opacity={0.5} tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                            <Tooltip
                                contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-main)' }}
                                formatter={(val) => [`${val}%`, 'Completion']}
                            />
                            <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                                {DEPT_SUMMARY.map((entry, i) => (
                                    <Cell key={i} fill={entry.pct >= 50 ? '#22c55e' : entry.pct > 0 ? '#FFD60A' : '#E63946'} opacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Compliance table */}
                <motion.div className="glass-card overflow-hidden"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div className="p-5 border-b border-card-border">
                        <h2 className="font-bold text-main text-lg">Compliance Status — All Employees</h2>
                        <p className="text-muted text-sm mt-1">Employees who have completed all 6 chapters</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="admin-table w-full">
                            <thead>
                                <tr className="border-b border-card-border">
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th>XP</th>
                                    <th>Chapters</th>
                                    {[1, 2, 3, 4, 5, 6].map(n => <th key={n} className="text-center">Ch.{n}</th>)}
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {COMPLIANCE.map((u, i) => (
                                    <motion.tr key={u.id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <AvatarDisplay avatarId={u.avatarId} size="xs" />
                                                <span className="text-main font-medium">{u.name}</span>
                                            </div>
                                        </td>
                                        <td>{u.department}</td>
                                        <td className="font-bold text-accent">{u.xp.toLocaleString()}</td>
                                        <td>{u.chaptersCompleted}/6</td>
                                        {[1, 2, 3, 4, 5, 6].map(n => (
                                            <td key={n} className="text-center">
                                                {n <= u.chaptersCompleted
                                                    ? <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                                                    : <XCircle className="w-4 h-4 text-dim opacity-30 mx-auto" />
                                                }
                                            </td>
                                        ))}
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
