import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext.jsx'
import axios from 'axios'

const GameContext = createContext(null)

// Fallback data for safety
const FALLBACK_CHAPTERS = [
    { id: 1, title: 'Hari Pertama', subtitle: 'Email Phishing', icon: '📧', location: 'Lobi Kantor', unlockAt: 0, scenes: [] },
    { id: 2, title: 'Meja Terbuka', subtitle: 'Kebijakan Meja Bersih', icon: '🗂️', location: 'Ruang Kerja', unlockAt: 1, scenes: [] },
    { id: 3, title: 'Orang Asing', subtitle: 'Rekayasa Sosial', icon: '🛗', location: 'Lift', unlockAt: 2, scenes: [] },
    { id: 4, title: 'Ganti Sandi Anda', subtitle: 'Keamanan Kata Sandi', icon: '🔐', location: 'Ruang IT', unlockAt: 3, scenes: [] },
    { id: 5, title: 'Insiden!', subtitle: 'Pelaporan Insiden', icon: '🚨', location: 'Ruang Server', unlockAt: 4, scenes: [] },
    { id: 6, title: 'Pertarungan Terakhir', subtitle: 'FINAL', icon: '⚔️', location: 'Pusat Data', unlockAt: 5, scenes: [] },
]

const DEFAULT_LEVEL = { level: 1, title: 'Pemula', xpRequired: 0, color: '#94a3b8', icon: '🛡️' }

const getLevelXPRequired = (level) => {
    const rawValue = level?.xpRequired ?? level?.xprequired ?? level?.xp_required
    const xpRequired = Number(rawValue)
    return Number.isFinite(xpRequired) ? xpRequired : null
}

const normalizeLevels = (rows) => {
    if (!Array.isArray(rows)) return []
    return rows
        .map((row, index) => {
            const xpRequired = getLevelXPRequired(row)
            const levelNumber = Number(row?.level)
            if (!Number.isFinite(xpRequired)) return null
            return {
                ...row,
                xpRequired,
                level: Number.isFinite(levelNumber) ? levelNumber : index + 1,
            }
        })
        .filter(Boolean)
        .sort((a, b) => a.xpRequired - b.xpRequired)
}

const normalizeLeaderboardRows = (rows) => {
    if (!Array.isArray(rows)) return []
    return rows.map((row, index) => ({
        ...row,
        rank: Number(row?.rank) || index + 1,
        xp: Number(row?.xp) || 0,
        level: Number(row?.level) || 1,
        chaptersCompleted: Number(row?.chaptersCompleted) || 0,
        avatarId: Number(row?.avatarId) || 1,
    }))
}

export function GameProvider({ children }) {
    const { user, updateUser } = useAuth()
    
    // State from MAIN
    const [chapterProgress, setChapterProgress] = useState({})
    const [leaderboard, setLeaderboard] = useState([])
    const [deptStats, setDeptStats] = useState([])
    const [xpPopups, setXpPopups] = useState([])
    const [isTourActive, setIsTourActive] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [tourShownThisSession, setTourShownThisSession] = useState(false)

    const [chapters, setChapters] = useState(FALLBACK_CHAPTERS)
    const [levels, setLevels] = useState([])
    const [badges, setBadges] = useState([])
    const [backgrounds, setBackgrounds] = useState([])
    const [characters, setCharacters] = useState([])
    const [uiTypes, setUiTypes] = useState([])
    const [roadmapNodes, setRoadmapNodes] = useState([])
    const [elearningCompleted, setElearningCompleted] = useState(false)

    // State from APIP
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [leaderboardLoading, setLeaderboardLoading] = useState(false)
    const [leaderboardError, setLeaderboardError] = useState(null)

    const fetchContent = useCallback(async () => {
        try {
            const [cRes, lRes, bRes, bgRes, charRes, uiRes, rmRes] = await Promise.all([
                axios.get('/api/content/chapters').catch(() => ({ data: [] })),
                axios.get('/api/badges/getLevelBadges').catch(() => ({ data: [] })), 
                axios.get('/api/content/badges').catch(() => ({ data: [] })),
                axios.get('/api/cms/backgrounds').catch(() => ({ data: [] })),
                axios.get('/api/cms/characters').catch(() => ({ data: [] })),
                axios.get('/api/content/ui-types').catch(() => ({ data: [] })),
                axios.get('/api/roadmap').catch(() => ({ data: [] }))
            ])

            if (cRes.data) setChapters(Array.isArray(cRes.data) && cRes.data.length > 0 ? cRes.data : FALLBACK_CHAPTERS)
            
            const levelRows = Array.isArray(lRes.data) ? lRes.data : (lRes.data?.levelBadges || [])
            setLevels(normalizeLevels(levelRows))

            if (bRes.data) setBadges(bRes.data)
            if (bgRes.data) setBackgrounds(bgRes.data)
            if (charRes.data) setCharacters(charRes.data)
            if (uiRes.data) setUiTypes(uiRes.data)
            if (rmRes.data) setRoadmapNodes(rmRes.data)
            
            setError(null)
        } catch (err) {
            console.error('Error fetching content:', err)
            setError(err)
        } finally {
            setLoading(false)
        }
    }, [])

    const loadLeaderboard = useCallback(async ({ filter = 'all', dept = 'all' } = {}) => {
        setLeaderboardLoading(true)
        setLeaderboardError(null)
        try {
            const [lbRes, deptRes] = await Promise.all([
                axios.get('/api/leaderboard', { params: { filter, dept } }),
                axios.get('/api/leaderboard/departments')
            ])
            const normalizedLB = normalizeLeaderboardRows(lbRes.data)
            setLeaderboard(normalizedLB)
            if (deptRes.data && Array.isArray(deptRes.data)) {
                setDeptStats(deptRes.data)
            }
            return normalizedLB
        } catch (err) {
            console.error('Failed to load leaderboard:', err)
            setLeaderboardError(err)
            return []
        } finally {
            setLeaderboardLoading(false)
        }
    }, [])

    const loadProgress = useCallback(async () => {
        try {
            const res = await axios.get('/api/progress')
            setChapterProgress(res.data)
            
            // Check if e-learning node (pId 0) is completed
            if (res.data[0]?.completed) {
                setElearningCompleted(true)
            }
        } catch (err) {
            console.warn('Failed to load progress', err.message)
        }
    }, [])

    const completeElearning = async () => {
        setElearningCompleted(true)
        // Optionally update chapterProgress locally to trigger UI updates
        setChapterProgress(prev => ({
            ...prev,
            [0]: { ...prev[0], completed: true }
        }))
    }

    useEffect(() => {
        if (user) {
            fetchContent()
            loadLeaderboard()
            loadProgress()
        } else {
            setChapterProgress({})
            setLeaderboard([])
            setLoading(false)
        }
    }, [user?.id, fetchContent, loadLeaderboard, loadProgress])

    // Synchronize local leaderboard rank
    useEffect(() => {
        if (!user || leaderboard.length === 0) return
        setLeaderboard(prev => {
            const index = prev.findIndex(u => u.nik === user.nik || u.id === user.id)
            if (index === -1) return prev
            if (prev[index].xp === user.xp) return prev
            const updated = [...prev]
            updated[index] = { ...updated[index], xp: user.xp, level: user.level }
            updated.sort((a, b) => b.xp - a.xp)
            let rank = 1
            for (let i = 0; i < updated.length; i++) {
                if (i > 0 && Math.floor(updated[i].xp) < Math.floor(updated[i - 1].xp)) rank = i + 1
                updated[i].rank = rank
            }
            return updated
        })
    }, [user?.xp, user?.level, user?.id, user?.nik])

    const getLevelFromXP = (xp) => {
        const safeXp = Math.max(0, Number(xp) || 0)
        let lvl = DEFAULT_LEVEL
        for (const l of levels) {
            if (safeXp >= l.xpRequired) lvl = l
            else break
        }
        return lvl
    }

    const getNextLevel = (xp) => {
        const safeXp = Math.max(0, Number(xp) || 0)
        return levels.find(l => safeXp < l.xpRequired) || null
    }

    const triggerXPPopup = (amount) => {
        const id = Date.now()
        setXpPopups(prev => [...prev, { id, amount }])
        setTimeout(() => {
            setXpPopups(prev => prev.filter(p => p.id !== id))
        }, 2000)
    }

    const awardXP = async (amount, reason, chapterId = null) => {
        try {
            const res = await axios.post('/api/progress/xp', { amount, reason, chapterId })
            const actualAwarded = typeof res.data?.amount === 'number' ? res.data.amount : amount
            
            if (actualAwarded > 0) {
                triggerXPPopup(actualAwarded)
                const newXp = (user?.xp || 0) + actualAwarded
                const newLevel = getLevelFromXP(newXp)
                updateUser({ xp: newXp, level: newLevel.level })
            }
        } catch {
            // Fallback in case of server connection failure
            triggerXPPopup(amount)
            const newXp = (user?.xp || 0) + amount
            const newLevel = getLevelFromXP(newXp)
            updateUser({ xp: newXp, level: newLevel.level })
        }
    }

    const updateSecurityStats = async (stats) => {
        // Stats: { score, strength, category, password }
        updateUser({
            security_score: stats.score,
            password_strength: stats.strength,
            password_category: stats.category
        })
        try {
            await axios.put('/api/users/security-stats', stats)
        } catch (err) {
            console.warn('Failed to sync security stats to server', err.message)
        }
    }

    const updateTrustPoints = async (amount) => {
        // amount is the new total
        updateUser({ trust_points: amount })
        try {
            await axios.put('/api/users/trust-points', { amount })
        } catch (err) {
            console.warn('Failed to sync trust points to server', err.message)
        }
    }

    const completeChapter = async (chapterId, result) => {
        const totalXp = result.xpEarned + (result.perfect ? 100 : 0)
        const wasCompleted = chapterProgress[chapterId]?.completed === true

        setChapterProgress(prev => ({
            ...prev,
            [chapterId]: { ...result, completed: true, xpEarned: totalXp }
        }))

        if (!wasCompleted) {
            updateUser({
                xp: (user?.xp || 0) + totalXp,
                chaptersCompleted: Math.max(user?.chaptersCompleted || 0, chapterId)
            })
        } else {
            updateUser({
                chaptersCompleted: Math.max(user?.chaptersCompleted || 0, chapterId)
            })
        }

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
        return { rank: rank - 1, name: above.name, gap: above.xp - (user?.xp || 0) }
    }

    const startTour = () => {
        if (tourShownThisSession && !isTourActive) return
        setCurrentStep(0)
        setIsTourActive(true)
        setTourShownThisSession(true)
    }

    const forceStartTour = () => {
        setCurrentStep(0)
        setIsTourActive(true)
        setTourShownThisSession(true)
    }

    const completeTour = (dontShowAgain) => {
        if (dontShowAgain) localStorage.setItem('ake_tour_disabled', 'true')
        setIsTourActive(false)
    }

    return (
        <GameContext.Provider value={{
            chapterProgress,
            leaderboard,
            deptStats,
            xpPopups,
            getLevelFromXP,
            getNextLevel,
            awardXP,
            updateSecurityStats,
            updateTrustPoints,
            completeChapter,
            getUserRank,
            getNextRankGap,
            CHAPTERS: chapters,
            LEVELS: levels,
            levels: levels,
            BADGES: badges,
            BACKGROUNDS: backgrounds,
            CHARACTERS: characters,
            UI_TYPES: uiTypes,
            ROADMAP_NODES: roadmapNodes,
            elearningCompleted,
            completeElearning,
            isTourActive,
            currentStep,
            startTour,
            forceStartTour,
            completeTour,
            setTourStep: setCurrentStep,
            loadLeaderboard,
            loadProgress,
            loading,
            error,
            leaderboardLoading,
            leaderboardError
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
