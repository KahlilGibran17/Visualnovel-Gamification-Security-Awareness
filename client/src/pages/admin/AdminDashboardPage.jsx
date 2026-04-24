import React from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Users, BookOpen, BarChart2, Bell, TrendingUp, AlertCircle, CheckCircle, Clock, GraduationCap } from 'lucide-react'
import Layout from '../../components/Layout.jsx'

const DEPT_STATS_FULL = [
    { dept: 'IT', total: 3, completed: 2, avgXp: 3325, color: '#60a5fa' },
    { dept: 'Engineering', total: 4, completed: 3, avgXp: 2488, color: '#a78bfa' },
    { dept: 'Marketing', total: 3, completed: 1, avgXp: 1167, color: '#f97316' },
    { dept: 'Finance', total: 4, completed: 1, avgXp: 475, color: '#22c55e' },
    { dept: 'HR', total: 3, completed: 1, avgXp: 1000, color: '#ec4899' },
    { dept: 'Operations', total: 3, completed: 0, avgXp: 450, color: '#FFD60A' },
]

const RECENT_ACTIVITY = [
    { user: 'Ahmad Fauzi', action: 'Completed Chapter 6 — Cyber Hero badge earned', time: '2 min ago', icon: '🏆' },
    { user: 'Budi Santoso', action: 'Completed Chapter 4 with perfect score', time: '15 min ago', icon: '💎' },
    { user: 'Maya Sari', action: 'Moved up to Guardian level', time: '1 hour ago', icon: '⬆️' },
    { user: 'Dewi Kusuma', action: 'First login! Character setup complete', time: '2 hours ago', icon: '👋' },
    { user: 'Riko Pratama', action: 'Chapter 3 — Bad Ending (retrying)', time: '3 hours ago', icon: '⚠️' },
]

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

export default function AdminDashboardPage() {
    const navigate = useNavigate()
    const [stats, setStats] = React.useState(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState(null)

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/admin/overview')
                setStats(res.data)
            } catch (err) {
                console.error('Failed to fetch admin stats', err)
                setError('Failed to load statistics from server.')
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) return (
        <Layout>
            <div className="p-6 flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        </Layout>
    )

    if (error) return (
        <Layout>
            <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <AlertCircle className="w-12 h-12 text-primary mb-4" />
                <h2 className="text-xl font-bold text-main mb-2">Error Loading Dashboard</h2>
                <p className="text-muted mb-6">{error}</p>
                <button onClick={() => window.location.reload()} className="btn-primary px-6">Retry</button>
            </div>
        </Layout>
    )

    const { totalUsers, completedAll, avgXp, notStarted, deptStats, recentActivity } = stats || {
        totalUsers: 0, completedAll: 0, avgXp: 0, notStarted: 0, deptStats: [], recentActivity: []
    }

    const completionRate = totalUsers > 0 ? Math.round((completedAll / totalUsers) * 100) : 0

    const getDeptColor = (dept) => {
        const colors = {
            'IT': '#60a5fa',
            'Engineering': '#a78bfa',
            'Marketing': '#f97316',
            'Finance': '#22c55e',
            'HR': '#ec4899',
            'Operations': '#FFD60A'
        }
        return colors[dept] || '#94a3b8'
    }

    const formatTime = (dateStr) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} min ago`
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours} hour ago`
        return date.toLocaleDateString()
    }

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
                    <KpiCard icon={Users} label="Total Employees" value={totalUsers} sub="Registered users" color="#60a5fa" delay={0.1} />
                    <KpiCard icon={CheckCircle} label="Completion Rate" value={`${completionRate}%`} sub="All chapters done" color="#22c55e" delay={0.15} />
                    <KpiCard icon={TrendingUp} label="Avg XP" value={avgXp.toLocaleString()} sub="Per employee" color="#FFD60A" delay={0.2} />
                    <KpiCard icon={AlertCircle} label="Not Started" value={notStarted} sub="Need attention" color="#E63946" delay={0.25} />
                </div>

                {/* Quick links */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { icon: Users, label: 'User Management', desc: 'Import, manage, and reset employee accounts', path: '/admin/users', color: '#60a5fa' },
                        { icon: BookOpen, label: 'Content Management', desc: 'Edit chapters, dialogues, and quiz questions', path: '/admin/content', color: '#a78bfa' },
                        { icon: GraduationCap, label: 'E-Learning', desc: 'Manage module articles and learning materials', path: '/admin/elearning', color: '#ec4899' },
                        { icon: BarChart2, label: 'Reports & Export', desc: 'Compliance reports, export to Excel and PDF', path: '/admin/reports', color: '#22c55e' },
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
                            {deptStats.map(d => (
                                <div key={d.dept} className="flex items-center gap-3">
                                    <span className="w-20 text-muted text-sm">{d.dept}</span>
                                    <div className="flex-1 bg-input-bg rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${(d.completed / d.total) * 100}%`, background: getDeptColor(d.dept) }}
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
                            {recentActivity.map((a, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="text-xl flex-shrink-0">{a.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-main font-medium">{a.user}</p>
                                        <p className="text-muted text-xs">{a.action}</p>
                                    </div>
                                    <span className="text-dim text-xs flex-shrink-0 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {formatTime(a.time)}
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
