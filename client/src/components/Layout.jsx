import { useGame } from '../contexts/GameContext.jsx'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Trophy, BookOpen, User, Home, ShieldAlert, LogOut, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'
import AvatarDisplay from './AvatarDisplay.jsx'

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/chapters', label: 'Chapters', icon: BookOpen },
    { path: '/elearning', label: 'E-Learning', icon: GraduationCap },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/profile', label: 'Profile', icon: User },
]

const adminItems = [
    { path: '/admin', label: 'Admin Panel', icon: ShieldAlert },
]

function SidebarXPBar({ xp, nextLevel }) {
    const safeXp = Math.max(0, Number(xp) || 0)
    const nextLevelXp = nextLevel?.xpRequired ?? safeXp
    const xpForNextLevel = Math.max(1, nextLevelXp)
    const pct = nextLevel ? Math.min(100, (safeXp / xpForNextLevel) * 100) : 100

    return (
        <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1 text-white/40">
                <span>{safeXp.toLocaleString()} XP</span>
                <span>→</span>
                <span>{nextLevelXp.toLocaleString()}</span>
            </div>
            <div className="xp-bar h-2 relative">
                <motion.div
                    className="xp-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>
        </div>
    )
}
export default function Layout({ children }) {
    const { user, logout } = useAuth()
    const { getLevelFromXP, getNextLevel, getUserRank } = useGame()
    const navigate = useNavigate()
    const location = useLocation()

    const currentXp = user?.xp || 0
    const level = getLevelFromXP(currentXp)
    const nextLevel = getNextLevel(currentXp)

    const isActive = (path) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-dark-card border-r border-white/10 flex flex-col flex-shrink-0 z-40">
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-white leading-tight">Akebono</p>
                            <p className="text-xs text-accent font-semibold">Cyber Academy</p>
                        </div>
                    </div>
                </div>

                {/* User mini profile */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <AvatarDisplay avatarId={user?.avatarId || 1} size="sm" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-white truncate">{user?.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs" style={{ color: level?.color || '#94a3b8' }}>{level?.icon || '🛡️'} {level?.title || 'Loading'}</span>
                            </div>
                        </div>
                    </div>
                    <SidebarXPBar xp={currentXp} nextLevel={nextLevel} />
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full text-left ${isActive(item.path) ? 'nav-item-active' : 'nav-item'}`}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span>{item.label}</span>
                        </button>
                    ))}

                    {(user?.role === 'admin' || user?.role === 'manager') && (
                        <>
                            <div className="my-3 border-t border-white/10" />
                            <p className="text-xs text-white/30 px-4 mb-1 uppercase tracking-wider">Admin</p>
                            {adminItems.map(item => (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`w-full text-left ${isActive(item.path) ? 'nav-item-active' : 'nav-item'}`}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </>
                    )}
                </nav>

                {/* Rank widget */}
                <div className="p-4 border-t border-white/10">
                    <div className="glass-card p-3 flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-accent flex-shrink-0" />
                        <div>
                            <p className="text-xs text-white/40">Your Rank</p>
                            <p className="font-bold text-accent">#{getUserRank() || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={() => { logout(); navigate('/login') }}
                        className="w-full nav-item text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto bg-dark relative">
                {children}
            </main>
        </div>
    )
}
