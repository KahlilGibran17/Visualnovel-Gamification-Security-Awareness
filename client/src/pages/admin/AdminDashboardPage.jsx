import { useCallback, useEffect, useMemo, useState } from 'react'
import React from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Users, BookOpen, BarChart2, Bell, TrendingUp, AlertCircle, CheckCircle, Clock, PlusCircle, GraduationCap } from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import { io } from 'socket.io-client'

const DEPT_COLORS = ['#60a5fa', '#a78bfa', '#f97316', '#22c55e', '#ec4899', '#FFD60A']

function KpiCard({ icon: Icon, label, value, sub, color, delay }) {
    return (
        <motion.div className="stat-widget"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-muted text-xs uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-3xl font-bold text-main">{value}</p>
                    {sub && <p className="text-xs text-dim mt-1">{sub}</p>}
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
            </div>
        </motion.div>
    )
}

const normalizeLeaderboardRows = (rows) => {
    if (!Array.isArray(rows)) return []

    return rows.map((row, index) => ({
        ...row,
        id: Number(row?.id) || index + 1,
        xp: Number(row?.xp) || 0,
        chaptersCompleted: Number(row?.chaptersCompleted) || 0,
    }))
}

const normalizeDeptStats = (rows) => {
    if (!Array.isArray(rows)) return []

    return rows.map((row) => ({
        ...row,
        members: Number(row?.members) || 0,
        avgXp: Number(row?.avgXp) || 0,
    }))
}

const normalizeRecentActivityRows = (rows) => {
    if (!Array.isArray(rows)) return []

    return rows.map((row, index) => ({
        id: Number(row?.id) || index + 1,
        userName: row?.userName || row?.user_name || 'Unknown User',
        action: row?.action || 'Activity updated',
        icon: typeof row?.icon === 'string' && row.icon.trim() ? row.icon : '📝',
        createdAt: row?.createdAt || row?.created_at || null,
    }))
}

const formatRelativeTime = (dateValue) => {
    if (!dateValue) return 'just now'

    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return 'just now'

    const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))

    if (diffSeconds < 60) return 'just now'

    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes} min ago`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return date.toLocaleDateString()
}

export default function AdminDashboardPage() {
    const navigate = useNavigate()
    const [leaderboardRows, setLeaderboardRows] = useState([])
    const [deptStats, setDeptStats] = useState([])
    const [recentActivity, setRecentActivity] = useState([])
    const [totalChapters, setTotalChapters] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadingActivity, setLoadingActivity] = useState(true)

    const loadRecentActivity = useCallback(async (showLoading = false) => {
        if (showLoading) {
            setLoadingActivity(true)
        }

        try {
            const res = await axios.get('/api/admin/recent-activity', {
                params: { limit: 8 },
            })
            setRecentActivity(normalizeRecentActivityRows(res.data))
        } catch (err) {
            console.error('Failed to load recent activity:', err)
            setRecentActivity([])
        } finally {
            if (showLoading) {
                setLoadingActivity(false)
            }
        }
    }, [])

    useEffect(() => {
        let isMounted = true

        const loadAdminData = async () => {
            setLoading(true)
            try {
                const [leaderboardRes, deptRes, chaptersRes] = await Promise.all([
                    axios.get('/api/leaderboard', {
                        params: { filter: 'all', dept: 'all', includeZeroXp: 'true' },
                    }),
                    axios.get('/api/leaderboard/departments'),
                    axios.get('/api/elearning/getChapters'),
                ])

                if (!isMounted) return

                setLeaderboardRows(normalizeLeaderboardRows(leaderboardRes.data))
                setDeptStats(normalizeDeptStats(deptRes.data))
                setTotalChapters(Array.isArray(chaptersRes.data) ? chaptersRes.data.length : 0)
            } catch (err) {
                console.error('Failed to load admin dashboard data:', err)
                if (isMounted) {
                    setLeaderboardRows([])
                    setDeptStats([])
                    setTotalChapters(0)
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        loadAdminData()

        return () => {
            isMounted = false
        }
    }, [])

    useEffect(() => {
        loadRecentActivity(true)
    }, [loadRecentActivity])

    useEffect(() => {
        const socket = io('/', {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
        })

        socket.on('connect', () => {
            socket.emit('join-admin-activity')
        })

        socket.on('admin-activity-updated', () => {
            loadRecentActivity(false)
        })

        const intervalId = setInterval(() => {
            loadRecentActivity(false)
        }, 30000)

        return () => {
            clearInterval(intervalId)
            socket.off('admin-activity-updated')
            socket.disconnect()
        }
    }, [loadRecentActivity])

    const isAllChaptersDone = (chaptersCompleted) => (
        totalChapters > 0 && chaptersCompleted >= totalChapters
    )

    const totalUsers = leaderboardRows.length
    const completedAll = leaderboardRows.filter(u => isAllChaptersDone(u.chaptersCompleted)).length
    const completionRate = totalUsers > 0 ? Math.round((completedAll / totalUsers) * 100) : 0
    const avgXp = totalUsers > 0
        ? Math.round(leaderboardRows.reduce((sum, user) => sum + user.xp, 0) / totalUsers)
        : 0
    const notStarted = leaderboardRows.filter(u => u.chaptersCompleted === 0).length

    const departmentProgress = useMemo(() => {
        const completedByDept = leaderboardRows.reduce((acc, user) => {
            const dept = user.department || 'Unknown'
            if (isAllChaptersDone(user.chaptersCompleted)) {
                acc[dept] = (acc[dept] || 0) + 1
            }
            return acc
        }, {})

        if (deptStats.length > 0) {
            return deptStats.map((dept, index) => ({
                dept: dept.dept,
                total: dept.members,
                completed: completedByDept[dept.dept] || 0,
                avgXp: dept.avgXp,
                color: DEPT_COLORS[index % DEPT_COLORS.length],
            }))
        }

        const grouped = leaderboardRows.reduce((acc, user) => {
            const dept = user.department || 'Unknown'
            if (!acc[dept]) {
                acc[dept] = { dept, total: 0, completed: 0, xpSum: 0 }
            }

            acc[dept].total += 1
            acc[dept].xpSum += user.xp
            if (isAllChaptersDone(user.chaptersCompleted)) {
                acc[dept].completed += 1
            }

            return acc
        }, {})

        return Object.values(grouped).map((dept, index) => ({
            dept: dept.dept,
            total: dept.total,
            completed: dept.completed,
            avgXp: dept.total > 0 ? Math.round(dept.xpSum / dept.total) : 0,
            color: DEPT_COLORS[index % DEPT_COLORS.length],
        }))
    }, [deptStats, leaderboardRows, totalChapters])

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-bold font-display text-main mb-1">⚙️ Admin Dashboard</h1>
                    <p className="text-muted">Akebono Cyber Academy — Management Overview</p>
                </motion.div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard icon={Users} label="Total Employees" value={loading ? '...' : totalUsers} sub="Registered users" color="#60a5fa" delay={0.1} />
                    <KpiCard icon={CheckCircle} label="Completion Rate" value={loading ? '...' : `${completionRate}%`} sub="All chapters done" color="#22c55e" delay={0.15} />
                    <KpiCard icon={TrendingUp} label="Avg XP" value={loading ? '...' : avgXp.toLocaleString()} sub="Per employee" color="#FFD60A" delay={0.2} />
                    <KpiCard icon={AlertCircle} label="Not Started" value={loading ? '...' : notStarted} sub="Need attention" color="#E63946" delay={0.25} />
                </div>

                {/* Quick links */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { icon: Users, label: 'User Management', desc: 'Import, manage, and reset employee accounts', path: '/admin/users', color: '#60a5fa' },
                        { icon: BookOpen, label: 'Content Management', desc: 'Edit chapters, dialogues, and quiz questions', path: '/admin/content', color: '#a78bfa' },
                        { icon: GraduationCap, label: 'E-Learning', desc: 'Manage module articles and learning materials', path: '/admin/elearning', color: '#ec4899' },
                        { icon: BarChart2, label: 'Reports & Export', desc: 'Compliance reports, export to Excel and PDF', path: '/admin/reports', color: '#22c55e' },
                        { icon: PlusCircle, label: 'Buat eLearning', desc: 'Buat modul eLearning baru', path: '/admin/elearning', color: '#f97316' },
                    ].map(item => (
                        <motion.button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className="glass-card p-5 text-left hover:bg-card-border transition-all duration-200 group"
                            whileHover={{ scale: 1.02 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${item.color}20` }}>
                                <item.icon className="w-5 h-5" style={{ color: item.color }} />
                            </div>
                            <h3 className="font-bold text-main mb-1 group-hover:text-accent transition-colors">{item.label}</h3>
                            <p className="text-muted text-sm">{item.desc}</p>
                        </motion.button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Department Stats */}
                    <motion.div className="glass-card p-5"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <h2 className="font-bold text-main mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-accent" /> Department Progress
                        </h2>
                        <div className="space-y-3">
                            {loading && (
                                <p className="text-white/40 text-sm">Loading department stats...</p>
                            )}

                            {!loading && departmentProgress.length === 0 && (
                                <p className="text-white/40 text-sm">No department data available.</p>
                            )}

                            {!loading && departmentProgress.map(d => (
                                <div key={d.dept} className="flex items-center gap-3">
                                    <span className="w-20 text-muted text-sm">{d.dept}</span>
                                    <div className="flex-1 bg-input-bg rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${d.total > 0 ? (d.completed / d.total) * 100 : 0}%`, background: d.color }}
                                        />
                                    </div>
                                    <span className="text-xs text-dim w-12 text-right">{d.completed}/{d.total}</span>
                                    <span className="text-xs font-bold w-20 text-right" style={{ color: getDeptColor(d.dept) }}>
                                        {d.avgXp.toLocaleString()} XP
                                    </span>
                                </div>
                            ))}
                            {deptStats.length === 0 && <p className="text-center text-dim py-8">No department data found.</p>}
                        </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div className="glass-card p-5"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                        <h2 className="font-bold text-main mb-4 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-accent" /> Recent Activity
                        </h2>
                        <div className="space-y-3">
                            {loadingActivity && (
                                <p className="text-white/40 text-sm">Loading recent activity...</p>
                            )}

                            {!loadingActivity && recentActivity.length === 0 && (
                                <p className="text-white/40 text-sm">No recent activity yet.</p>
                            )}

                            {!loadingActivity && recentActivity.map((a, i) => (
                                <div key={`${a.id}-${a.createdAt || i}`} className="flex items-start gap-3">
                                    <span className="text-xl flex-shrink-0">{a.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-main font-medium">{a.userName}</p>
                                        <p className="text-muted text-xs">{a.action}</p>
                                    </div>
                                    <span className="text-dim text-xs flex-shrink-0 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {formatTime(formatRelativeTime(a.createdAt))}
                                    </span>
                                </div>
                            ))}
                            {recentActivity.length === 0 && <p className="text-center text-dim py-8">No recent activity.</p>}
                        </div>
                    </motion.div>
                </div>

                {/* Broadcast notification */}
                <motion.div className="glass-card p-5"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <h2 className="font-bold text-main mb-3 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-accent" /> Broadcast Notification
                    </h2>
                    <div className="flex gap-3">
                        <input className="input-field flex-1" placeholder="Type announcement to all employees..." />
                        <button className="btn-primary px-6 whitespace-nowrap">Send All</button>
                    </div>
                </motion.div>
            </div>
        </Layout>
    )
}
