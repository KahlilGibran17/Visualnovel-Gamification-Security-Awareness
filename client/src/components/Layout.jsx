import { useGame } from '../contexts/GameContext.jsx'
import { useNavigate, useLocation} from 'react-router-dom'
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'
import { useAudio } from '../contexts/AudioContext.jsx'
import { Trophy, BookOpen, User, Home, ShieldAlert, LogOut, GraduationCap, Music2, Volume2, VolumeX, JapaneseYenIcon, BookCheck, User2, Gamepad2, HelpCircle, Sun, Moon, PencilRuler } from 'lucide-react'
import { motion } from 'framer-motion'
import AvatarDisplay from './AvatarDisplay.jsx'
import { ChevronDown as ChevronDownIcon } from 'lucide-react';
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
    { path: '/admin', label: 'Admin Panel', icon: ShieldAlert },
    { path: '/admin/users', label: 'User Management', icon: User },
    { path: '/admin/content', label: 'Content Management', icon: BookOpen },
    { path: '/admin/reports', label: 'Reports', icon: BookCheck },
    { path: '/admin/elearning', label: 'E-Learning Management', icon: GraduationCap },
    { path: '/admin/pretest', label: 'Pre-test Management', icon: PencilRuler }
    

]

const superAdminItems = [
    {path: '/super-admin', label: 'Super Admin Panel', icon: ShieldAlert},
    {path: '/super-admin/add-admin', label: 'Add Admin', icon: User2},
]

function SidebarXPBar({ xp, nextLevel,currentLevel }) {
    const safeXp = Math.max(0, Number(xp) || 0)
    const nextLevelXp = nextLevel?.xpRequired ?? safeXp
    const xpForNext = Math.max(1, nextLevelXp)
    const pct = nextLevel ? Math.min(100, (safeXp / xpForNext) * 100) : 100

    return (
        <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1 text-main">
                <span>{safeXp.toLocaleString()} XP</span>
                <span>→</span>
                <span>{nextLevelXp.toLocaleString()}XP</span>
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
    const { user, logout } = useAuth();
    const [isAdminOpen, setIsAdminOpen] = useState(() => {
        const saved = sessionStorage.getItem('isAdminOpen');
        return saved !== null ? saved === 'true' : true;
    });
    
    useEffect(() => {
        sessionStorage.setItem('isAdminOpen', isAdminOpen);
    }, [isAdminOpen]);

    const navRef = useRef(null);

    useLayoutEffect(() => {
        if (navRef.current) {
            const savedScroll = sessionStorage.getItem('sidebarScrollPos');
            if (savedScroll) {
                navRef.current.scrollTop = parseInt(savedScroll, 10);
            }
        }
    }, []);

    const handleScroll = (e) => {
        sessionStorage.setItem('sidebarScrollPos', e.target.scrollTop);
    };

    const { theme, toggleTheme } = useTheme()
    const { getLevelFromXP, getNextLevel, getUserRank, isTourActive, currentStep, startTour, forceStartTour, completeTour, setTourStep } = useGame();
    const {
        bgmEnabled,
        setBgmEnabled,
        sfxEnabled,
        setSfxEnabled,
        bgmVolume,
        setBgmVolume,
        sfxVolume,
        setSfxVolume,
        unlockAudio,
        playSfx,
    } = useAudio();
    const navigate = useNavigate();
    const location = useLocation();
    const isSuperAdmin = user?.role === 'super-admin';
    const isNoXpRole = user?.role === 'admin' || user?.role === 'super-admin';

    const currentXp = user?.xp || 0
    const level = getLevelFromXP(currentXp)
    const nextLevel = getNextLevel(currentXp)
   
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
    const handleUiClick = () => {
        unlockAudio()
        playSfx('click')
    }
    const handleNavigate = (path) => {
        handleUiClick()
        navigate(path)
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-secondary border-r border-card-border flex flex-col flex-shrink-0 z-40 transition-colors duration-300">
                {/* Logo */}
                <div className="p-6 border-b border-card-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-6 h-6 text-main" />
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
                     <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                            <AvatarDisplay avatarId={user?.avatarId || 1} size="sm" />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-main truncate">{user?.name}</p>
                                {!isNoXpRole && (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-xs" style={{ color: level?.color || '#94a3b8' }}>{level?.icon || '🛡️'} {level?.title || 'Loading'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {!isNoXpRole && <SidebarXPBar xp={currentXp} nextLevel={nextLevel} currentLevel={level} />}
                    </div>
                </div>

                {/* Nav */}
                <nav ref={navRef} onScroll={handleScroll} className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {!isSuperAdmin && navItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => handleNavigate(item.path)}
                            className={`w-full text-left ${isActive(item.path) ? 'nav-item-active' : 'nav-item'}`}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                    {!isSuperAdmin && (user?.role === 'admin' || user?.role === 'manager') && (
                        <>
                            <div className="my-3 border-t border-white/10" />
                            <p className="text-xs text-main/30 px-4 mb-1 uppercase tracking-wider">Admin</p>

                            {/* Admin Panel sebagai toggle */}
                            <button
                                onClick={() => {
                                    handleNavigate('/admin')
                                    setIsAdminOpen(prev => !prev)
                                }}
                                className={`w-full text-left ${isActive('/admin') ? 'nav-item-active' : 'nav-item'}`}
                            >
                                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                                <span className="flex-1">Admin Panel</span>
                                <ChevronDownIcon
                                    className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                                    style={{ transform: isAdminOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                                />
                            </button>

                            {/* Sub-items */}
                            {isAdminOpen && (
                                <div className="ml-3 pl-3 border-l border-white/10 space-y-1 mt-1">
                                    {adminItems.slice(1).map(item => (
                                        <button
                                            key={item.path}
                                            onClick={() => handleNavigate(item.path)}
                                            className={`w-full text-left ${isActive(item.path) ? 'nav-item-active' : 'nav-item'}`}
                                        >
                                            <item.icon className="w-5 h-5 flex-shrink-0" />
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {(user?.role === 'super-admin') && (
                        <>
                            <div className="my-3 border-t border-white/10" />
                            <p className="text-xs text-main/30 px-4 mb-1 uppercase tracking-wider">Super Admin</p>
                            {superAdminItems.map(item => (
                                <button
                                    key={item.path}
                                    onClick={() => handleNavigate(item.path)}
                                    className={`w-full text-left ${location.pathname === item.path ? 'nav-item-active' : 'nav-item'}`}
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
                            <p className="text-xs text-main/40">Your Rank</p>
                            <p className="font-bold text-accent">#{getUserRank() || '—'}</p>
                        </div>
                    </div>
                </div>

                  <div className="p-4 border-t border-white/10">
                    <div className="glass-card p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-main/40 uppercase tracking-wider">Audio</p>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => {
                                        handleUiClick()
                                        setBgmEnabled(v => !v)
                                    }}
                                    className={`p-1.5 rounded-lg border transition-colors ${bgmEnabled ? 'text-accent border-accent/40 bg-accent/10' : 'text-main/40 border-white/10 hover:border-white/30'}`}
                                    title={bgmEnabled ? 'Matikan music' : 'Nyalakan music'}
                                >
                                    <Music2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => {
                                        handleUiClick()
                                        setSfxEnabled(v => !v)
                                    }}
                                    className={`p-1.5 rounded-lg border transition-colors ${sfxEnabled ? 'text-accent border-accent/40 bg-accent/10' : 'text-main/40 border-white/10 hover:border-white/30'}`}
                                    title={sfxEnabled ? 'Matikan sound effect' : 'Nyalakan sound effect'}
                                >
                                    {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-main/40 w-9">BGM</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={bgmVolume}
                                    onChange={(e) => setBgmVolume(Number(e.target.value))}
                                    onPointerUp={() => handleUiClick()}
                                    className="w-full accent-primary"
                                />
                                <span className="text-[11px] text-main/35 w-8 text-right">{Math.round(bgmVolume * 100)}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-main/40 w-9">SFX</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={sfxVolume}
                                    onChange={(e) => setSfxVolume(Number(e.target.value))}
                                    onPointerUp={() => handleUiClick()}
                                    className="w-full accent-primary"
                                />
                                <span className="text-[11px] text-main/35 w-8 text-right">{Math.round(sfxVolume * 100)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <div className="p-4 border-t border-card-border">
                    <button
                        onClick={() => { logout(); navigate('/login') }}
                        className="w-full nav-item text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="layout-main flex-1 overflow-y-auto bg-main relative transition-colors duration-300">
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
