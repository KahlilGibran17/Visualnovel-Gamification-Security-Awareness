import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext.jsx'
import axios from 'axios'

const GameContext = createContext(null)

// Chapter definitions
export const CHAPTERS = [
    { id: 1, title: 'First Day', subtitle: 'Phishing Email', icon: '📧', location: 'Office Lobby', unlockAt: 0 },
    { id: 2, title: 'The Open Desk', subtitle: 'Clean Desk Policy', icon: '🗂️', location: 'Workstation', unlockAt: 1 },
    { id: 3, title: 'Stranger in the Elevator', subtitle: 'Social Engineering', icon: '🛗', location: 'Elevator', unlockAt: 2 },
    { id: 4, title: 'Change Your Password', subtitle: 'Password Security', icon: '🔐', location: 'IT Room', unlockAt: 3 },
    { id: 5, title: 'Incident!', subtitle: 'Incident Reporting', icon: '🚨', location: 'Server Room', unlockAt: 4 },
    { id: 6, title: 'Showdown with Ph1sh', subtitle: 'FINALE', icon: '⚔️', location: 'Data Center', unlockAt: 5 },
]

export const LEVELS = [
    { level: 1, title: 'Rookie', xpRequired: 0, color: '#94a3b8', icon: '🛡️' },
    { level: 2, title: 'Aware', xpRequired: 500, color: '#60a5fa', icon: '👁️' },
    { level: 3, title: 'Guardian', xpRequired: 1500, color: '#a78bfa', icon: '🛡️' },
    { level: 4, title: 'Expert', xpRequired: 3000, color: '#f59e0b', icon: '⚡' },
    { level: 5, title: 'Cyber Hero', xpRequired: 6000, color: '#E63946', icon: '🦸' },
]

export const BADGES = [
    { id: 'phishing-hunter', name: 'Phishing Hunter', icon: '🎣', desc: 'Complete Chapter 1 with perfect score', color: '#E63946' },
    { id: 'tidy-desk', name: 'Tidy Desk', icon: '🗂️', desc: 'Complete Chapter 2', color: '#3b82f6' },
    { id: 'social-shield', name: 'Social Shield', icon: '🛡️', desc: 'Complete Chapter 3', color: '#8b5cf6' },
    { id: 'password-master', name: 'Password Master', icon: '🔐', desc: 'Complete Chapter 4 without mistakes', color: '#22c55e' },
    { id: 'first-responder', name: 'First Responder', icon: '🚨', desc: 'Complete Chapter 5', color: '#f97316' },
    { id: 'cyber-hero', name: 'Cyber Hero', icon: '🦸', desc: 'Complete all chapters with good endings', color: '#FFD60A' },
    { id: '7-day-streak', name: '7-Day Streak', icon: '🔥', desc: 'Log in 7 consecutive days', color: '#ef4444' },
    { id: 'speed-runner', name: 'Speed Runner', icon: '⚡', desc: 'Complete a chapter in record time', color: '#06b6d4' },
]

// Demo data for leaderboard
export const DEMO_LEADERBOARD = [
    { rank: 1, id: 3, name: 'Ahmad Fauzi', department: 'IT', xp: 5600, level: 4, chaptersCompleted: 6, avatarId: 5, nik: 'admin001' },
    { rank: 2, id: 1, name: 'Budi Santoso', department: 'Engineering', xp: 2850, level: 3, chaptersCompleted: 4, avatarId: 1, nik: '10001' },
    { rank: 3, id: 5, name: 'Riko Pratama', department: 'Engineering', xp: 2700, level: 3, chaptersCompleted: 4, avatarId: 4, nik: '10005' },
    { rank: 4, id: 6, name: 'Maya Sari', department: 'Marketing', xp: 2200, level: 3, chaptersCompleted: 3, avatarId: 2, nik: '10006' },
    { rank: 5, id: 2, name: 'Siti Rahayu', department: 'HR', xp: 1900, level: 2, chaptersCompleted: 3, avatarId: 3, nik: '10002' },
    { rank: 6, id: 7, name: 'Doni Kurniawan', department: 'Finance', xp: 1650, level: 2, chaptersCompleted: 2, avatarId: 6, nik: '10007' },
    { rank: 7, id: 8, name: 'Lestari Wulandari', department: 'Engineering', xp: 1400, level: 2, chaptersCompleted: 2, avatarId: 7, nik: '10008' },
    { rank: 8, id: 9, name: 'Hendra Gunawan', department: 'Operations', xp: 1200, level: 2, chaptersCompleted: 2, avatarId: 8, nik: '10009' },
    { rank: 9, id: 10, name: 'Nurul Fadilah', department: 'IT', xp: 1050, level: 2, chaptersCompleted: 2, avatarId: 1, nik: '10010' },
    { rank: 10, id: 11, name: 'Rizky Aditya', department: 'Marketing', xp: 900, level: 2, chaptersCompleted: 1, avatarId: 2, nik: '10011' },
    { rank: 11, id: 12, name: 'Eka Putri', department: 'HR', xp: 800, level: 2, chaptersCompleted: 1, avatarId: 3, nik: '10012' },
    { rank: 12, id: 13, name: 'Fajar Nugroho', department: 'Finance', xp: 700, level: 2, chaptersCompleted: 1, avatarId: 4, nik: '10013' },
    { rank: 13, id: 14, name: 'Gita Permata', department: 'Operations', xp: 600, level: 2, chaptersCompleted: 1, avatarId: 5, nik: '10014' },
    { rank: 14, id: 15, name: 'Irfan Hakim', department: 'Engineering', xp: 500, level: 2, chaptersCompleted: 1, avatarId: 6, nik: '10015' },
    { rank: 15, id: 16, name: 'Juliana Putri', department: 'Marketing', xp: 400, level: 1, chaptersCompleted: 0, avatarId: 7, nik: '10016' },
    { rank: 16, id: 17, name: 'Kevin Wijaya', department: 'IT', xp: 350, level: 1, chaptersCompleted: 0, avatarId: 8, nik: '10017' },
    { rank: 17, id: 18, name: 'Linda Hartati', department: 'HR', xp: 300, level: 1, chaptersCompleted: 0, avatarId: 1, nik: '10018' },
    { rank: 18, id: 19, name: 'Mita Anggraini', department: 'Finance', xp: 200, level: 1, chaptersCompleted: 0, avatarId: 2, nik: '10019' },
    { rank: 19, id: 20, name: 'Nanda Prabowo', department: 'Operations', xp: 150, level: 1, chaptersCompleted: 0, avatarId: 3, nik: '10020' },
    { rank: 20, id: 4, name: 'Dewi Kusuma', department: 'Finance', xp: 0, level: 1, chaptersCompleted: 0, avatarId: 2, nik: '10003' },
]

export const DEPT_STATS = [
    { dept: 'IT', avgXp: 3325, members: 3 },
    { dept: 'Engineering', avgXp: 2488, members: 4 },
    { dept: 'Marketing', avgXp: 1167, members: 3 },
    { dept: 'Finance', avgXp: 475, members: 4 },
    { dept: 'HR', avgXp: 1000, members: 3 },
    { dept: 'Operations', avgXp: 450, members: 3 },
]

export function GameProvider({ children }) {
    const { user, updateUser } = useAuth()
    const [chapterProgress, setChapterProgress] = useState({})
    const [leaderboard, setLeaderboard] = useState(DEMO_LEADERBOARD)
    const [xpPopups, setXpPopups] = useState([])

    useEffect(() => {
        if (user) {
            loadProgress()
        }
    }, [user?.id])

    const loadProgress = async () => {
        try {
            const res = await axios.get('/api/progress')
            setChapterProgress(res.data)
        } catch {
            // Demo: simulate some progress
            const demo = {}
            if (user?.chaptersCompleted >= 1) {
                demo[1] = { completed: true, ending: 'good', xpEarned: 250, score: 100 }
            }
            if (user?.chaptersCompleted >= 2) {
                demo[2] = { completed: true, ending: 'good', xpEarned: 200, score: 80 }
            }
            setChapterProgress(demo)
        }
    }

    const getLevelFromXP = (xp) => {
        let lvl = LEVELS[0]
        for (const l of LEVELS) {
            if (xp >= l.xpRequired) lvl = l
        }
        return lvl
    }

    const getNextLevel = (xp) => {
        const current = getLevelFromXP(xp)
        return LEVELS.find(l => l.level === current.level + 1) || null
    }

    const triggerXPPopup = (amount) => {
        const id = Date.now()
        setXpPopups(prev => [...prev, { id, amount }])
        setTimeout(() => {
            setXpPopups(prev => prev.filter(p => p.id !== id))
        }, 2000)
    }

    const awardXP = async (amount, reason) => {
        triggerXPPopup(amount)
        const newXp = (user?.xp || 0) + amount
        const newLevel = getLevelFromXP(newXp)
        updateUser({ xp: newXp, level: newLevel.level })

        try {
            await axios.post('/api/progress/xp', { amount, reason })
        } catch {
            // demo mode, state already updated
        }
    }

    const completeChapter = async (chapterId, result) => {
        const xpToAward = result.ending === 'good' ? 200 : 100
        const totalXp = result.xpEarned + (result.perfect ? 100 : 0)

        setChapterProgress(prev => ({
            ...prev,
            [chapterId]: { ...result, completed: true, xpEarned: totalXp }
        }))

        updateUser({
            xp: (user?.xp || 0) + totalXp,
            chaptersCompleted: Math.max(user?.chaptersCompleted || 0, chapterId)
        })

        try {
            await axios.post(`/api/progress/chapter/${chapterId}/complete`, result)
        } catch { }
    }

    const getUserRank = () => {
        const myEntry = leaderboard.find(e => e.nik === user?.nik)
        return myEntry?.rank || null
    }

    const getNextRankGap = () => {
        const rank = getUserRank()
        if (!rank || rank <= 1) return null
        const above = leaderboard.find(e => e.rank === rank - 1)
        if (!above) return null
        const gap = above.xp - (user?.xp || 0)
        return { rank: rank - 1, name: above.name, gap }
    }

    return (
        <GameContext.Provider value={{
            chapterProgress,
            leaderboard,
            xpPopups,
            getLevelFromXP,
            getNextLevel,
            awardXP,
            completeChapter,
            getUserRank,
            getNextRankGap,
            CHAPTERS,
            LEVELS,
            BADGES,
        }}>
            {children}
        </GameContext.Provider>
    )
}

export const useGame = () => {
    const ctx = useContext(GameContext)
    if (!ctx) throw new Error('useGame must be used within GameProvider')
    return ctx
}
