import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext.jsx'
import axios from 'axios'

const GameContext = createContext(null)


// Fallback data
const CHAPTERS = [
    { id: 1, title: 'Hari Pertama', subtitle: 'Email Phishing', icon: '📧', location: 'Lobi Kantor', unlockAt: 0, scenes: [] },
    { id: 2, title: 'Meja Terbuka', subtitle: 'Kebijakan Meja Bersih', icon: '🗂️', location: 'Ruang Kerja', unlockAt: 1, scenes: [] },
    { id: 3, title: 'Orang Asing', subtitle: 'Rekayasa Sosial', icon: '🛗', location: 'Lift', unlockAt: 2, scenes: [] },
    { id: 4, title: 'Ganti Sandi Anda', subtitle: 'Keamanan Kata Sandi', icon: '🔐', location: 'Ruang IT', unlockAt: 3, scenes: [] },
    { id: 5, title: 'Insiden!', subtitle: 'Pelaporan Insiden', icon: '🚨', location: 'Ruang Server', unlockAt: 4, scenes: [] },
    { id: 6, title: 'Pertarungan Terakhir', subtitle: 'FINAL', icon: '⚔️', location: 'Pusat Data', unlockAt: 5, scenes: [] },
]


const DEFAULT_LEVEL = { level: 1, title: 'Rookie', xpRequired: 0, color: '#94a3b8', icon: '🛡️' }

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

export function useLevels(){

    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth()

    useEffect(() => {
        if (!user) {
            setLevels([])
            setLoading(false)
            return
        }

        let isMounted = true

        const fetchLevels = async () => {
            setLoading(true)
            try {
                const res = await axios.get('/api/badges/getLevelBadges');
                const rows = Array.isArray(res.data)
                    ? res.data
                    : Array.isArray(res.data?.levelBadges)
                        ? res.data.levelBadges
                        : []

                const normalizedLevels = normalizeLevels(rows)
                if (isMounted) {
                    setLevels(normalizedLevels)
                }
                console.log('Fetched levels:', normalizedLevels);
            } catch (err) {
                console.error('Error fetching levels:', err);
                if (isMounted) {
                    setError(err)
                    setLevels([])
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            };
        };

        fetchLevels();
        return () => {
            isMounted = false
        }
    }, [user?.id]);

    return { levels, loading, error };


    
}
export function GameProvider({ children }) {
    const { user, updateUser } = useAuth()
    const [chapterProgress, setChapterProgress] = useState({})
    const [leaderboard, setLeaderboard] = useState([])
    const [leaderboardLoading, setLeaderboardLoading] = useState(false)
    const [leaderboardError, setLeaderboardError] = useState(null)
    const [deptStats, setDeptStats] = useState(DEMO_DEPT_STATS)
    const [xpPopups, setXpPopups] = useState([])
    const [badges, setBadges] = useState([])
    const { levels,loading,error } = useLevels()
    const [isTourActive, setIsTourActive] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [tourShownThisSession, setTourShownThisSession] = useState(false)

    const [chapters, setChapters] = useState(FALLBACK_CHAPTERS)
    const [levels, setLevels] = useState(FALLBACK_LEVELS)
    const [badges, setBadges] = useState(FALLBACK_BADGES)
    const [backgrounds, setBackgrounds] = useState([])
    const [characters, setCharacters] = useState([])
    const [uiTypes, setUiTypes] = useState([])
    const [roadmapNodes, setRoadmapNodes] = useState([])

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const [cRes, lRes, bRes, bgRes, charRes, uiRes, rmRes] = await Promise.all([
                    axios.get('/api/content/chapters'),
                    axios.get('/api/content/levels'),
                    axios.get('/api/content/badges'),
                    axios.get('/api/cms/backgrounds').catch(() => ({ data: [] })),
                    axios.get('/api/cms/characters').catch(() => ({ data: [] })),
                    axios.get('/api/content/ui-types').catch(() => ({ data: [] })),
                    axios.get('/api/roadmap').catch(() => ({ data: [] }))
                ])
                if (Array.isArray(cRes.data) && cRes.data.length > 0) {
                    setChapters(cRes.data)
                }
                if (Array.isArray(lRes.data) && lRes.data.length > 0) {
                    setLevels(lRes.data.map(l => ({ level: l.level, title: l.title, xpRequired: l.xp_required, color: l.color, icon: l.icon })))
                }
                if (Array.isArray(bRes.data) && bRes.data.length > 0) {
                    setBadges(bRes.data)
                }
                if (bgRes?.data && Array.isArray(bgRes.data)) {
                    setBackgrounds(bgRes.data)
                }
                if (charRes?.data && Array.isArray(charRes.data)) {
                    setCharacters(charRes.data)
                }
                if (uiRes?.data && Array.isArray(uiRes.data)) {
                    setUiTypes(uiRes.data)
                }
                if (rmRes?.data && Array.isArray(rmRes.data)) {
                    setRoadmapNodes(rmRes.data)
                }
            } catch (err) {
                console.warn('Using fallback content (auth may not be ready):', err.message)
            }
        }

        const fetchLeaderboardData = async () => {
            try {
                const [lbRes, deptRes] = await Promise.all([
                    axios.get('/api/leaderboard'),
                    axios.get('/api/leaderboard/departments')
                ])
                if (lbRes.data && Array.isArray(lbRes.data) && lbRes.data.length > 0) {
                    setLeaderboard(lbRes.data)
                }
                if (deptRes.data && Array.isArray(deptRes.data) && deptRes.data.length > 0) {
                    setDeptStats(deptRes.data)
                }
            } catch (err) {
                console.warn('Using fallback leaderboard', err.message)
            }
        }

        // Only fetch content when user is authenticated (token available via axios defaults)
        if (user) {
            fetchContent()
            fetchLeaderboardData()
            loadProgress()
            loadLeaderboard()
        } else {
            setChapterProgress({})
            setLeaderboard([])
        }
    }, [user?.id])

    // Synchronize local leaderboard immediately when user changes xp so rank adjusts continuously 
    useEffect(() => {
        if (!user) return
        setLeaderboard(prev => {
            const index = prev.findIndex(u => u.nik === user.nik || u.id === user.id)
            if (index === -1) {
                // User not in leaderboard yet, add them so they can see themselves rank up
                const updated = [...prev, {
                    id: user.id || Date.now(),
                    nik: user.nik,
                    name: user.name || 'You',
                    department: user.department || 'Unknown',
                    xp: user.xp || 0,
                    level: user.level || 1,
                    avatarId: user.avatarId || 1,
                    chaptersCompleted: user.chaptersCompleted || 0
                }]
                updated.sort((a, b) => b.xp - a.xp)
                let rank = 1
                for (let i = 0; i < updated.length; i++) {
                    if (i > 0 && Math.floor(updated[i].xp) < Math.floor(updated[i - 1].xp)) {
                        rank = i + 1
                    }
                    updated[i].rank = rank
                }
                return updated
            }

            if (prev[index].xp === user.xp) return prev // unchanged

            const updated = [...prev]
            updated[index] = { ...updated[index], xp: user.xp, level: user.level }

            // Re-sort
            updated.sort((a, b) => b.xp - a.xp)

            // Re-rank 
            let rank = 1
            for (let i = 0; i < updated.length; i++) {
                if (i > 0 && Math.floor(updated[i].xp) < Math.floor(updated[i - 1].xp)) {
                    rank = i + 1
                }
                updated[i].rank = rank
            }
            return updated
        })
    }, [user?.xp, user?.level, user?.id, user?.nik, user?.name, user?.department])

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

    const loadLeaderboard = async ({ filter = 'all', dept = 'all' } = {}) => {
        if (!user) {
            setLeaderboard([])
            return []
        }

        setLeaderboardLoading(true)
        setLeaderboardError(null)

        try {
            const res = await axios.get('/api/leaderboard', {
                params: { filter, dept },
            })

            const normalizedRows = normalizeLeaderboardRows(res.data)
            setLeaderboard(normalizedRows)
            return normalizedRows
        } catch (err) {
            console.error('Failed to load leaderboard:', err)
            setLeaderboardError(err)
            setLeaderboard([])
            return []
        } finally {
            setLeaderboardLoading(false)
        }
    }

    const getLevelFromXP = (xp) => {
        const safeXp = Math.max(0, Number(xp) || 0)
        const levelList = (levels && levels.length > 0) ? levels : []

        let lvl = DEFAULT_LEVEL
        for (const l of levelList) {
            if (safeXp >= l.xpRequired) lvl = l
            else break
        }

        return lvl
    }

    const getNextLevel = (xp) => {
        const safeXp = Math.max(0, Number(xp) || 0)
        const levelList = (levels && levels.length > 0) ? levels : []
        return levelList.find(l => safeXp < l.xpRequired) || null
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

    const loadBadges = async () => {
        try {
            const data = await axios.get('/api/badges/getBadges')
            setBadges(data.data.badges)
        } catch (error) {
            console.error('Error loading badges:', error)
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

    const elearningCompleted = chapterProgress[0]?.completed === true
    
    const completeElearning = async () => {
        setChapterProgress(prev => ({
            ...prev,
            0: { completed: true, ending: 'good', xpEarned: 0, score: 100 }
        }))
        try {
            await axios.post('/api/progress/chapter/0/complete', {
                ending: 'good',
                xpEarned: 0,
                perfect: true,
                score: 100,
                wrongChoices: 0
            })
        } catch (err) {
            console.error('Failed to save elearning progress', err)
        }
    }

    const startTour = () => {
        if (tourShownThisSession && !isTourActive) return // Don't auto-start if already shown
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
        if (dontShowAgain) {
            localStorage.setItem('ake_tour_disabled', 'true')
        }
        setIsTourActive(false)
    }

    const setTourStep = (step) => {
        setCurrentStep(step)
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
            completeChapter,
            completeElearning,
            getUserRank,
            getNextRankGap,
            elearningCompleted,
            CHAPTERS: chapters,
            LEVELS: levels,
            BADGES: badges,
            BACKGROUNDS: backgrounds,
            CHARACTERS: characters,
            UI_TYPES: uiTypes,
            ROADMAP_NODES: roadmapNodes,
            isTourActive,
            currentStep,
            startTour,
            forceStartTour,
            completeTour,
            setTourStep
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
