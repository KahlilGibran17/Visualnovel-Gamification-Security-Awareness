import { useGame } from '../contexts/GameContext.jsx'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'
import { Trophy, BookOpen, User, Home, ShieldAlert, LogOut, Settings, GraduationCap, Gamepad2, HelpCircle, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AvatarDisplay from './AvatarDisplay.jsx'
import GuidedTour from './GuidedTour.jsx'
import OnboardingGuide from './OnboardingGuide.jsx'

const navItems = [
    { path: '/dashboard', label: 'Beranda', icon: Home },
    { path: '/elearning', label: 'E-Learning', icon: GraduationCap },
    { path: '/chapters', label: 'Mulai Main', icon: Gamepad2 },
    { path: '/leaderboard', label: 'Peringkat', icon: Trophy },
    { path: '/profile', label: 'Profil', icon: User },
    { path: '/guide', label: 'Panduan', icon: HelpCircle },
]

const adminItems = [
    { path: '/admin', label: 'Panel Admin', icon: ShieldAlert },
]

export default function Layout({ children }) {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const { getLevelFromXP, LEVELS, getUserRank, isTourActive, currentStep, startTour, forceStartTour, completeTour, setTourStep } = useGame()
    const navigate = useNavigate()
    const location = useLocation()

    const level = getLevelFromXP(user?.xp || 0)
    const nextLevel = LEVELS.find(l => l.level === level.level + 1)
    const xpIntoLevel = (user?.xp || 0) - level.xpRequired
    const xpForNext = nextLevel ? nextLevel.xpRequired - level.xpRequired : 1
    const xpPct = nextLevel ? Math.min(100, (xpIntoLevel / xpForNext) * 100) : 100

    const [showGuide, setShowGuide] = useState(false)
    const [isFirstTime, setIsFirstTime] = useState(false)

    useEffect(() => {
        const completed = localStorage.getItem('ake_onboarding_completed')
        if (!completed && user) {
            setShowGuide(true)
            setIsFirstTime(true)
        }
    }, [user])

    const handleOnboardingComplete = () => {
        localStorage.setItem('ake_onboarding_completed', 'true')
        setShowGuide(false)
        setIsFirstTime(false)
    }

    useEffect(() => {
        const onboardingDone = localStorage.getItem('ake_onboarding_completed')
        const tourDisabled = localStorage.getItem('ake_tour_disabled') === 'true'
        
        if (onboardingDone && !tourDisabled && user && !isTourActive) {
            startTour()
        }
    }, [user])

    const isActive = (path) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-secondary border-r border-card-border flex flex-col flex-shrink-0 z-40 transition-colors duration-300">
                {/* Logo */}
                <div className="p-6 border-b border-card-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-main leading-tight">Akebono</p>
                            <p className="text-xs text-accent font-semibold">Cyber Academy</p>
                        </div>
                    </div>
                    
                    {/* Theme Toggle Button */}
                    <button 
                        onClick={toggleTheme}
                        className="p-2 rounded-lg bg-card-bg hover:bg-input-bg text-accent transition-colors"
                        title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                    </button>
                </div>

                {/* User mini profile */}
                <div className="p-4 border-b border-card-border">
                    <div className="flex items-center gap-3">
                        <AvatarDisplay avatarId={user?.avatarId || 1} size="sm" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-main truncate">{user?.name}</p>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs" style={{ color: level.color }}>{level.icon} {level.title}</span>
                            </div>
                        </div>
                    </div>
                    {/* Mini XP bar */}
                    <div className="mt-3">
                        <div className="flex justify-between text-xs text-dim mb-1">
                            <span>{user?.xp?.toLocaleString()} XP</span>
                            {nextLevel && <span>→ {nextLevel.xpRequired?.toLocaleString()}</span>}
                        </div>
                        <div className="xp-bar h-2">
                            <motion.div
                                className="xp-bar-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${xpPct}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map(item => {
                        const itemId = item.path === '/chapters' ? 'nav-chapters' : 
                                     item.path === '/leaderboard' ? 'nav-leaderboard' : 
                                     item.path === '/elearning' ? 'nav-elearning' : undefined;

                        if (item.path === '/guide') {
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => forceStartTour()}
                                    className="w-full text-left nav-item"
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    <span>{item.label}</span>
                                </button>
                            )
                        }
                        return (
                            <button
                                key={item.path}
                                id={itemId}
                                onClick={() => navigate(item.path)}
                                className={`w-full text-left ${isActive(item.path) ? 'nav-item-active' : 'nav-item'}`}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span>{item.label}</span>
                            </button>
                        )
                    })}

                    {(user?.role === 'admin' || user?.role === 'manager') && (
                        <>
                            <div className="my-3 border-t border-card-border" />
                            <p className="text-xs text-dim px-4 mb-1 uppercase tracking-wider">Admin</p>
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
                <div className="p-4 border-t border-card-border">
                    <div className="glass-card p-3 flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-accent flex-shrink-0" />
                        <div>
                            <p className="text-xs text-dim">Peringkat Anda</p>
                            <p className="font-bold text-accent">#{getUserRank() || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <div className="p-4 border-t border-card-border">
                    <button
                        onClick={() => { logout(); navigate('/login') }}
                        className="w-full nav-item text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto bg-main relative transition-colors duration-300">
                {children}
            </main>

            {/* Onboarding Guide Overlay */}
            <OnboardingGuide 
                isOpen={showGuide} 
                onComplete={handleOnboardingComplete} 
                isForced={isFirstTime} 
            />

            {/* Guided Tour Overlay */}
            <GuidedTour 
                isActive={isTourActive} 
                currentStep={currentStep}
                onStepChange={setTourStep}
                onComplete={completeTour} 
            />
        </div>
    )
}
