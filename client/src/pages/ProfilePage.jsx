import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useGame } from '../contexts/GameContext.jsx'
import Layout from '../components/Layout.jsx'
import AvatarDisplay, { AvatarPicker } from '../components/AvatarDisplay.jsx'
import { useState, useEffect } from 'react'
import { Edit3, Save } from 'lucide-react'
import toast from '../utils/toast.js'
import axios from 'axios'

export default function ProfilePage() {
    const { user, updateUser, refreshUser } = useAuth()
    const { getLevelFromXP, getNextLevel, badges,levels,loading,error, getUserRank } = useGame()
    const [editing, setEditing] = useState(false)
    const [displayName, setDisplayName] = useState(user?.name || '')
    const [avatarId, setAvatarId] = useState(user?.avatarId || 1)
    const [badgesByCategory, setBadgesByCategory] = useState({})
    const [chapterStats, setChapterStats] = useState({ completed: 0, total: 0 })

    const level = getLevelFromXP(user?.xp || 0)
    const nextLevel = getNextLevel(user?.xp || 0)
    const myRank = getUserRank()
    if (!level) return null
    const normalizeBadgeKey = (value) => {
        if (typeof value === 'string' || typeof value === 'number') {
            return String(value).trim().toLowerCase()
        }
        if (!value || typeof value !== 'object') return ''
        return String(
            value.id ?? value.badge_key ?? value.badgeId ?? value.badge_id ?? ''
        ).trim().toLowerCase()
    }

    const getCategoryLabel = (badge) => (
        badge?.category_name || badge?.categoryName || badge?.category || 'Uncategorized'
    )

    const earnedBadges = user?.badges || []
    const earnedBadgeSet = new Set(earnedBadges.map(normalizeBadgeKey).filter(Boolean))

    const safeXp = Math.max(0, Number(user?.xp) || 0)
    const nextLevelXp = nextLevel?.xpRequired ?? safeXp
    const xpForNext = Math.max(1, nextLevelXp)
    const xpPct = nextLevel ? Math.min(100, (safeXp / xpForNext) * 100) : 100
    
    const loadChapterStats = async () => {
    try {
        const data = await axios.get('/api/badges/getChapterProgress')
        setChapterStats(data.data)
    } catch (error) {
        console.error('Error loading chapter stats:', error)
    }
}    
    
    const loadBadgesByCategory = async () => {
        try {
            const data = await axios.get('/api/badges/getBadgesByCategory')
            const badgeList = data.data.badges
            console.log('Loaded badges by category:', badgeList)
            const grouped = badgeList.reduce((groups, badge) => {
                const key = getCategoryLabel(badge)
                if (!groups[key]) groups[key] = []
                groups[key].push(badge)
                return groups
            }, {})
            setBadgesByCategory(grouped)
        } catch (error) {
            console.error('Error loading badges by category:', error)
        }
    }
    useEffect(() => {
        loadBadgesByCategory()
        refreshUser()
        loadChapterStats()
    }, [])

    const groupedBadges = Object.keys(badgesByCategory).length
        ? badgesByCategory
        : badges.reduce((groups, badge) => {
            const key = getCategoryLabel(badge)
            if (!groups[key]) groups[key] = []
            groups[key].push(badge)
            return groups
        }, {})

    const totalBadgeCount = Object.values(groupedBadges)
        .reduce((sum, items) => sum + items.length, 0)
    const handleSave = async () => {
        try {
            await axios.put('/api/users/me', { displayName, avatarId })
        } catch { }
        updateUser({ name: displayName, avatarId })
        setEditing(false)
        toast.success('Profile updated!')
    }

    return (
        <Layout>
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-bold font-display text-white">My Profile</h1>
                    <p className="text-white/50 mt-1">Your cyber hero identity and achievement record</p>
                </motion.div>

                {/* Profile Card */}
                <motion.div className="glass-card p-6"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    {!editing ? (
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <AvatarDisplay avatarId={user?.avatarId || 1} size="xl" showRing ringColor={level.color} />
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                                        <p className="text-white/50">{user?.position} • {user?.department}</p>
                                        <p className="text-white/30 text-sm">NIK: {user?.nik}</p>
                                    </div>
                                    <button onClick={() => setEditing(true)} className="btn-secondary text-sm flex items-center gap-2">
                                        <Edit3 className="w-4 h-4" /> Edit
                                    </button>
                                </div>

                                {/* Level */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-3 py-1 rounded-full text-sm font-bold border"
                                        style={{ color: level.color, borderColor: `${level.color}60`, background: `${level.color}15` }}>
                                        {level.icon} {level.title}
                                    </span>
                                    <span className="text-white/50 text-sm">Level {level.level}</span>
                                </div>

                                {/* XP */}
                                <div className="max-w-md">
                                    <div className="flex justify-between text-xs mb-1 text-white/50">
                                        <span>{(user?.xp || 0).toLocaleString()} XP</span>
                                        {nextLevel && <span>{nextLevel.xpRequired.toLocaleString()} XP for {nextLevel.title}</span>}
                                    </div>
                                    <div className="xp-bar">
                                        <motion.div className="xp-bar-fill"
                                            initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1 }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h2 className="font-bold text-white mb-4">Edit Profile</h2>
                            <div className="mb-4">
                                <label className="text-sm text-white/60 mb-2 block">Display Name</label>
                                <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="input-field max-w-sm" />
                            </div>
                            <div className="mb-4">
                                <label className="text-sm text-white/60 mb-2 block">Avatar</label>
                                <AvatarPicker selected={avatarId} onSelect={setAvatarId} />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
                                <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Save Changes
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total XP', value: (user?.xp || 0).toLocaleString(), icon: '⭐' },
                        { label: 'Global Rank', value: `#${myRank || '—'}`, icon: '🏆' },
                        { label: 'Chapters Done', value: `${chapterStats.completed}/${chapterStats.total}`, icon: '📚' },
                        { label: 'Login Streak', value: `${user?.streak || 1} days`, icon: '🔥' },
                    ].map((s, i) => (
                        <motion.div key={s.label} className="stat-widget text-center"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
                            <div className="text-3xl mb-1">{s.icon}</div>
                            <p className="text-xl font-bold text-white">{s.value}</p>
                            <p className="text-xs text-white/40">{s.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Level progression */}
                <motion.div className="glass-card p-5"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <h2 className="font-bold text-white mb-4">🎯 Level Progression</h2>
                    <div className="flex items-end gap-2">
                        {loading ? (
                            <p className="text-white/40 text-xs text-center">Loading levels...</p>
                        ) : error ? (
                            <p className="text-red-400 text-xs text-center">Failed to load levels</p>
                        ) : levels.map((l, i) => {
                            const reached = (user?.xp || 0) >= l.xpRequired
                            const isCurrent = l.level === level.level
                            return (
                                <div key={l.level} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-xs font-bold" style={{ color: reached ? l.color : '#ffffff30' }}>
                                        {isCurrent ? '▲' : ''}
                                    </span>
                                    <div className={`w-full rounded-t-xl flex items-end justify-center pb-1 transition-all`}
                                        style={{
                                            height: `${40 + i * 15}px`,
                                            background: reached ? `${l.color}30` : 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${reached ? l.color + '60' : 'rgba(255,255,255,0.1)'}`,
                                            boxShadow: isCurrent ? `0 0 15px ${l.color}60` : 'none',
                                        }}>
                                        <span className="text-lg">{l.icon}</span>
                                    </div>
                                    <p className="text-xs text-center font-medium" style={{ color: reached ? l.color : '#ffffff40' }}>{l.title}</p>
                                    <p className="text-xs text-white/20">{l.xpRequired.toLocaleString()}</p>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* Badge Collection */}
              <motion.div
                    className="glass-card p-5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="font-bold text-white mb-4">
                        🏆 Badge Collection ({earnedBadgeSet.size}/{totalBadgeCount})
                    </h2>

                    {/* Group badges by category */}
                    {Object.entries(groupedBadges).map(([categoryName, categoryBadges]) => (
                        <div key={categoryName} className="mb-6">
                            {/* Category Header */}
                            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">
                                {categoryName === 'Badge Game' ? '🎮' : '📚'} {categoryName}
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {categoryBadges.map(badge => {
                                    const earned = earnedBadgeSet.has(normalizeBadgeKey(badge))
                                    return (
                                        <motion.div
                                            key={badge.id}
                                            className={`${earned ? 'badge-earned' : 'badge-locked'} p-4 flex flex-col items-center gap-2`}
                                            whileHover={earned ? { scale: 1.05 } : {}}
                                        >
                                            <span className="text-3xl">{badge.icon}</span>
                                            <p className="text-xs font-bold text-white text-center">{badge.name}</p>
                                            <p className="text-xs text-white/40 text-center">{badge.desc}</p>
                                            {earned && <span className="text-xs text-accent font-bold">✓ Earned</span>}
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </Layout>
    )
}
