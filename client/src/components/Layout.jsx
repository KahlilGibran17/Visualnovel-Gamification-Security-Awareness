import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
    Trophy, BookOpen, User, Home, ShieldAlert, LogOut, 
    GraduationCap, Gamepad2, HelpCircle, Sun, Moon,
    Music2, Volume2, VolumeX, ChevronDown, User2
} from 'lucide-react'

import { useAuth } from '../contexts/AuthContext.jsx'
import { useGame } from '../contexts/GameContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'
import { useAudio } from '../contexts/AudioContext.jsx'

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
    { path: '/admin/users', label: 'Manajemen User', icon: User },
    { path: '/admin/content', label: 'Konten Game', icon: BookOpen },
    { path: '/admin/reports', label: 'Laporan', icon: BookOpen }, // Using BookOpen as placeholder for BookCheck
    { path: '/admin/elearning', label: 'Manajemen E-Learning', icon: GraduationCap },
]

const superAdminItems = [
    { path: '/super-admin', label: 'Panel Super Admin', icon: ShieldAlert },
    { path: '/super-admin/add-admin', label: 'Tambah Admin', icon: User2 },
]

function SidebarXPBar({ xp, nextLevel, xpPct }) {
    return (
        <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] mb-1 text-dim">
                <span>{(xp || 0).toLocaleString()} XP</span>
                {nextLevel && <span>→ {nextLevel.xpRequired?.toLocaleString()}</span>}
            </div>
            <div className="xp-bar h-1.5">
                <motion.div
                    className="xp-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>
        </div>
    )
}

export default function Layout({ children }) {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const { 
        getLevelFromXP, getNextLevel, getUserRank, 
        isTourActive, currentStep, startTour, forceStartTour, 
        completeTour, setTourStep 
    } = useGame()
    const {
        bgmEnabled, setBgmEnabled, sfxEnabled, setSfxEnabled,
        bgmVolume, setBgmVolume, sfxVolume, setSfxVolume,
        unlockAudio, playSfx
    } = useAudio()
    
    const navigate = useNavigate()
    const location = useLocation()
    const [isAdminOpen, setIsAdminOpen] = useState(true)
    const [showGuide, setShowGuide] = useState(false)
    const [isFirstTime, setIsFirstTime] = useState(false)

    const isSuperAdmin = user?.role === 'super-admin'
    const currentXp = user?.xp || 0
    const level = getLevelFromXP(currentXp)
    const nextLevel = getNextLevel(currentXp)
    const safeXp = Math.max(0, Number(currentXp) || 0)
    const nextLevelXp = nextLevel?.xpRequired ?? safeXp
    const xpPct = nextLevel ? Math.min(100, (safeXp / nextLevelXp) * 100) : 100

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
    
    const handleUiClick = () => {
        unlockAudio()
        playSfx('click')
    }

    const handleNavigate = (path) => {
        handleUiClick()
        navigate(path)
    }

    if (!level) return null

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
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px]" style={{ color: level.color }}>{level.icon} {level.title}</span>
                            </div>
                        </div>
                    </div>
                    {!isSuperAdmin && <SidebarXPBar xp={currentXp} nextLevel={nextLevel} xpPct={xpPct} />}
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {!isSuperAdmin && navItems.map(item => {
                        const itemId = item.path === '/chapters' ? 'nav-chapters' : 
                                     item.path === '/leaderboard' ? 'nav-leaderboard' : 
                                     item.path === '/elearning' ? 'nav-elearning' : undefined;

                        if (item.path === '/guide') {
                            return (
                                <button key={item.path} onClick={() => forceStartTour()} className="w-full text-left nav-item">
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    <span>{item.label}</span>
                                </button>
                            )
                        }
                        return (
                            <button
                                key={item.path}
                                id={itemId}
                                onClick={() => handleNavigate(item.path)}
                                className={`w-full text-left ${isActive(item.path) ? 'nav-item-active' : 'nav-item'}`}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span>{item.label}</span>
                            </button>
                        )
                    })}

                    {!isSuperAdmin && (user?.role === 'admin' || user?.role === 'manager') && (
                        <>
                            <div className="my-3 border-t border-card-border" />
                            <p className="text-[10px] text-dim px-4 mb-1 uppercase tracking-wider">Manajemen</p>

                            <button
                                onClick={() => {
                                    handleNavigate('/admin')
                                    setIsAdminOpen(prev => !prev)
                                }}
                                className={`w-full text-left ${isActive('/admin') ? 'nav-item-active' : 'nav-item'}`}
                            >
                                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                                <span className="flex-1">Panel Admin</span>
                                <ChevronDown
                                    className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                                    style={{ transform: isAdminOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                                />
                            </button>

                            {isAdminOpen && (
                                <div className="ml-3 pl-3 border-l border-card-border space-y-1 mt-1">
                                    {adminItems.slice(1).map(item => (
                                        <button
                                            key={item.path}
                                            onClick={() => handleNavigate(item.path)}
                                            className={`w-full text-left ${isActive(item.path) ? 'nav-item-active' : 'nav-item'}`}
                                        >
                                            <item.icon className="w-4 h-4 flex-shrink-0" />
                                            <span className="text-xs">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {isSuperAdmin && (
                        <>
                            <div className="my-3 border-t border-card-border" />
                            <p className="text-[10px] text-dim px-4 mb-1 uppercase tracking-wider">Super Admin</p>
                            {superAdminItems.map(item => (
                                <button
                                    key={item.path}
                                    onClick={() => handleNavigate(item.path)}
                                    className={`w-full text-left ${isActive(item.path) ? 'nav-item-active' : 'nav-item'}`}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </>
                    )}
                </nav>

                {!isSuperAdmin && (
                    <div className="p-4 border-t border-card-border">
                        <div className="glass-card p-3 flex items-center gap-3">
                            <Trophy className="w-5 h-5 text-accent flex-shrink-0" />
                            <div>
                                <p className="text-[10px] text-dim">Peringkat Anda</p>
                                <p className="font-bold text-accent">#{getUserRank() || '—'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Audio controls */}
                <div className="p-4 border-t border-card-border">
                    <div className="glass-card p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-dim uppercase tracking-wider">Audio</p>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => { handleUiClick(); setBgmEnabled(v => !v) }}
                                    className={`p-1 rounded-lg border transition-colors ${bgmEnabled ? 'text-accent border-accent/40 bg-accent/10' : 'text-dim border-card-border hover:border-accent/30'}`}
                                >
                                    <Music2 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => { handleUiClick(); setSfxEnabled(v => !v) }}
                                    className={`p-1 rounded-lg border transition-colors ${sfxEnabled ? 'text-accent border-accent/40 bg-accent/10' : 'text-dim border-card-border hover:border-accent/30'}`}
                                >
                                    {sfxEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-dim w-6">BGM</span>
                                <input type="range" min="0" max="1" step="0.01" value={bgmVolume} onChange={(e) => setBgmVolume(Number(e.target.value))} onPointerUp={() => handleUiClick()} className="w-full accent-primary h-1" />
                                <span className="text-[9px] text-dim w-6 text-right">{Math.round(bgmVolume * 100)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-dim w-6">SFX</span>
                                <input type="range" min="0" max="1" step="0.01" value={sfxVolume} onChange={(e) => setSfxVolume(Number(e.target.value))} onPointerUp={() => handleUiClick()} className="w-full accent-primary h-1" />
                                <span className="text-[9px] text-dim w-6 text-right">{Math.round(sfxVolume * 100)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <div className="p-4 border-t border-card-border">
                    <button
                        onClick={() => { handleUiClick(); logout(); navigate('/login') }}
                        className="w-full nav-item text-primary hover:text-red-400 hover:bg-primary/10 transition-colors"
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

            <OnboardingGuide isOpen={showGuide} onComplete={handleOnboardingComplete} isForced={isFirstTime} />
            <GuidedTour isActive={isTourActive} currentStep={currentStep} onStepChange={setTourStep} onComplete={completeTour} />
        </div>
    )
}
