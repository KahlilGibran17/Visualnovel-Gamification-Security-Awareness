import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Table, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import AvatarDisplay from '../../components/AvatarDisplay.jsx'
import toast from '../../utils/toast.js'
import axios from 'axios'
import { exportToExcel } from '../../utils/exportExcel.js'
import { exportToPdf } from '../../utils/exportPdf.js'

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
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10

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
            const dept = user.department || 'Tidak Diketahui'
            if (!acc[dept]) {
                acc[dept] = { dept, completedChapters: 0, totalTargetChapters: 0 }
            }

            acc[dept].completedChapters += (user.chaptersCompleted || 0)
            acc[dept].totalTargetChapters += totalChapters

            return acc
        }, {})

        return Object.values(grouped)
            .map((dept) => ({
                ...dept,
                pct: dept.totalTargetChapters > 0 ? Math.round((dept.completedChapters / dept.totalTargetChapters) * 100) : 0,
            }))
            .sort((a, b) => b.pct - a.pct)
    }, [complianceRows, totalChapters])

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
        } else if (type === 'PDF') {
            exportToPdf(leaderboardRows, 'Compliance_Report');
        } else {
            toast.success(`Exporting ${type} report... (Demo mode — connect backend for real export)`)
        }
    }

    const totalPages = Math.ceil(complianceRows.length / ITEMS_PER_PAGE) || 1
    const paginatedRows = complianceRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                <motion.div className="flex flex-col md:flex-row md:items-center gap-4"
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div>
                        <h1 className="text-3xl font-bold font-display text-main">📊 Laporan & Ekspor</h1>
                        <p className="text-muted mt-1">Pelacakan kepatuhan dan analitik progres karyawan</p>
                    </div>
                    <div className="md:ml-auto flex gap-2">
                        <button id="export-excel-btn" onClick={() => handleExport('Excel')}
                            className="btn-secondary text-sm flex items-center gap-2 bg-green-600 text-white hover:bg-green-700">
                            <Table className="w-4 h-4" /> Ekspor Excel
                        </button>
                        <button id="export-pdf-btn" onClick={() => handleExport('PDF')}
                            className="btn-primary text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Ekspor PDF
                        </button>
                    </div>
                </motion.div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Tingkat Penyelesaian', value: loading ? '...' : `${pct}%`, color: '#22c55e', icon: '✅' },
                        { label: 'Selesai Semua Chapter', value: loading ? '...' : totalComplete, color: '#60a5fa', icon: '🏆' },
                        { label: 'Sedang Berjalan', value: loading ? '...' : inProgressCount, color: '#ff9100', icon: '📚' },
                        { label: 'Belum Dimulai', value: loading ? '...' : notStartedCount, color: '#E63946', icon: '⚠️' },
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
                    <h2 className="font-bold text-main mb-4">🏢 Tingkat Penyelesaian Departemen</h2>
                    {loading && (
                        <p className="text-white/40 text-sm mb-3">Memuat grafik departemen...</p>
                    )}
                    {!loading && departmentSummary.length === 0 && (
                        <p className="text-white/40 text-sm mb-3">Data departemen tidak tersedia.</p>
                    )}
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={departmentSummary} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                            <XAxis dataKey="dept" stroke="var(--text-dim)" tick={{ fontSize: 12 }} />
                            <YAxis stroke="var(--text-dim)" opacity={0.5} tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                contentStyle={{ background: '#f97316', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(val) => [`${val}%`, 'Penyelesaian']}
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
                    <div className="p-5 border-b border-card-border">
                        <h2 className="font-bold text-main text-lg">Status Kepatuhan — Seluruh Karyawan</h2>
                        <p className="text-muted text-sm mt-1">
                            Karyawan yang telah menyelesaikan seluruh {loading ? '...' : totalChapters} chapter
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="admin-table w-full">
                            <thead>
                                <tr className="border-b border-card-border">
                                    <th>Karyawan</th>
                                    <th>Departemen</th>
                                    <th>XP</th>
                                    <th>Chapter</th>
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
                                        <td colSpan={tableColumnCount} className="text-center text-white/40 py-8">Memuat laporan kepatuhan...</td>
                                    </tr>
                                )}

                                {!loading && complianceRows.length === 0 && (
                                    <tr>
                                        <td colSpan={tableColumnCount} className="text-center text-white/40 py-8">Data kepatuhan tidak tersedia.</td>
                                    </tr>
                                )}

                                {!loading && paginatedRows.map((u, i) => (
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
                                        <td>{u.chaptersCompleted}/{totalChapters}</td>
                                        {Array.from({ length: totalChapters }).map((_, idx) => {
                                            const chapterNumber = idx + 1
                                            return (
                                                <td key={chapterNumber} className="text-center">
                                                    {chapterNumber <= u.chaptersCompleted
                                                        ? <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                                                        : <XCircle className="w-4 h-4 text-dim opacity-30 mx-auto" />
                                                    }
                                                </td>
                                            )
                                        })}
                                        <td>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.allDone ? 'bg-green-500/20 text-green-400' : u.chaptersCompleted > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {u.allDone ? '✅ Selesai' : u.chaptersCompleted > 0 ? '🔄 Berjalan' : '❌ Belum Mulai'}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {!loading && complianceRows.length > 0 && (
                        <div className="p-4 border-t border-card-border flex items-center justify-between">
                            <span className="text-sm text-muted">
                                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, complianceRows.length)} dari {complianceRows.length} data
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg bg-card-bg hover:bg-input-bg disabled:opacity-50 disabled:cursor-not-allowed border border-card-border transition-colors text-main"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-medium px-4 text-main">
                                    Halaman {currentPage} dari {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg bg-card-bg hover:bg-input-bg disabled:opacity-50 disabled:cursor-not-allowed border border-card-border transition-colors text-main"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </Layout>
    )
}
