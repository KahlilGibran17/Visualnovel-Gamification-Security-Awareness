import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Users, BookOpen, BarChart2, Bell, TrendingUp, AlertCircle, CheckCircle, Clock, GraduationCap } from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import { DEMO_LEADERBOARD } from '../../contexts/GameContext.jsx'

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
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-3xl font-bold text-white">{value}</p>
                    {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
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
    const totalUsers = DEMO_LEADERBOARD.length
    const completedAll = DEMO_LEADERBOARD.filter(u => u.chaptersCompleted === 6).length
    const completionRate = Math.round((completedAll / totalUsers) * 100)
    const avgXp = Math.round(DEMO_LEADERBOARD.reduce((s, u) => s + u.xp, 0) / totalUsers)

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-bold font-display text-white mb-1">⚙️ Admin Dashboard</h1>
                    <p className="text-white/50">Akebono Cyber Academy — Management Overview</p>
                </motion.div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard icon={Users} label="Total Employees" value={totalUsers} sub="Registered users" color="#60a5fa" delay={0.1} />
                    <KpiCard icon={CheckCircle} label="Completion Rate" value={`${completionRate}%`} sub="All chapters done" color="#22c55e" delay={0.15} />
                    <KpiCard icon={TrendingUp} label="Avg XP" value={avgXp.toLocaleString()} sub="Per employee" color="#FFD60A" delay={0.2} />
                    <KpiCard icon={AlertCircle} label="Not Started" value={DEMO_LEADERBOARD.filter(u => u.chaptersCompleted === 0).length} sub="Need attention" color="#E63946" delay={0.25} />
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
                            className="glass-card p-5 text-left hover:bg-white/10 transition-all duration-200 group"
                            whileHover={{ scale: 1.02 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${item.color}20` }}>
                                <item.icon className="w-5 h-5" style={{ color: item.color }} />
                            </div>
                            <h3 className="font-bold text-white mb-1 group-hover:text-accent transition-colors">{item.label}</h3>
                            <p className="text-white/50 text-sm">{item.desc}</p>
                        </motion.button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Department Stats */}
                    <motion.div className="glass-card p-5"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-accent" /> Department Progress
                        </h2>
                        <div className="space-y-3">
                            {DEPT_STATS_FULL.map(d => (
                                <div key={d.dept} className="flex items-center gap-3">
                                    <span className="w-20 text-white/70 text-sm">{d.dept}</span>
                                    <div className="flex-1 bg-white/10 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full transition-all duration-1000"
                                            style={{ width: `${(d.completed / d.total) * 100}%`, background: d.color }}
                                        />
                                    </div>
                                    <span className="text-xs text-white/50 w-12 text-right">{d.completed}/{d.total}</span>
                                    <span className="text-xs font-bold w-20 text-right" style={{ color: d.color }}>
                                        {d.avgXp.toLocaleString()} XP
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Recent Activity */}
                    <motion.div className="glass-card p-5"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-accent" /> Recent Activity
                        </h2>
                        <div className="space-y-3">
                            {RECENT_ACTIVITY.map((a, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="text-xl flex-shrink-0">{a.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white/80 text-sm font-medium">{a.user}</p>
                                        <p className="text-white/50 text-xs">{a.action}</p>
                                    </div>
                                    <span className="text-white/30 text-xs flex-shrink-0 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {a.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Broadcast notification */}
                <motion.div className="glass-card p-5"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <h2 className="font-bold text-white mb-3 flex items-center gap-2">
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
