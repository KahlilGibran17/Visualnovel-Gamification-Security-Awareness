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
    const [xpPopups, setXpPopups] = useState([])
    const [badges, setBadges] = useState([])
    const { levels,loading,error } = useLevels()

    useEffect(() => {
        if (user) {
            loadProgress()
            loadLeaderboard()
        } else {
            setChapterProgress({})
            setLeaderboard([])
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
            loadLeaderboard,
            CHAPTERS,
            levels,
            loading,
            error,
            leaderboardLoading,
            leaderboardError,
            badges,
            loadBadges
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
