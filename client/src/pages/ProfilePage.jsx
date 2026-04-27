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
    const { getLevelFromXP, getNextLevel, levels, loading, error, getUserRank } = useGame()
    const [editing, setEditing] = useState(false)
    const [displayName, setDisplayName] = useState(user?.name || '')
    const [avatarId, setAvatarId] = useState(user?.avatarId || 1)
    const [badgesByCategory, setBadgesByCategory] = useState({})
    const [chapterStats, setChapterStats] = useState({ completed: 0, total: 0 })

    const level = getLevelFromXP(user?.xp || 0)
    const nextLevel = getNextLevel(user?.xp || 0)
    const myRank = getUserRank()

    useEffect(() => {
        setDisplayName(user?.name || '')
        setAvatarId(user?.avatarId || 1)
    }, [user])

    const normalizeBadgeKey = (value) => {
        if (typeof value === 'string' || typeof value === 'number') {
            return String(value).trim().toLowerCase()
        }
        if (!value || typeof value !== 'object') return ''
        return String(
            value.id ?? value.badge_key ?? value.badgeId ?? value.badge_id ?? ''
        ).trim().toLowerCase()
    }

    const normalizeBadgeColor = (badge) => {
        const rawColor = typeof badge?.color === 'string' ? badge.color.trim() : ''
        const prefixed = rawColor && !rawColor.startsWith('#') ? `#${rawColor}` : rawColor
        return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(prefixed) ? prefixed : '#FFD60A'
    }

    const withAlpha = (hexColor, alphaHex) => {
        const clean = hexColor.replace('#', '')
        const sixDigit = clean.length === 3
            ? clean.split('').map((c) => c + c).join('')
            : clean
        return `#${sixDigit}${alphaHex}`
    }

    const getCategoryLabel = (badge) => (
        badge?.category_name || badge?.categoryName || badge?.category || 'Umum'
    )

    const earnedBadges = user?.badges || []
    const earnedBadgeSet = new Set(earnedBadges.map(normalizeBadgeKey).filter(Boolean))

    const safeXp = Math.max(0, Number(user?.xp) || 0)
    const nextLevelXp = nextLevel?.xpRequired ?? safeXp
    const xpPct = nextLevel ? Math.min(100, (safeXp / nextLevelXp) * 100) : 100
    
    const loadChapterStats = async () => {
        try {
            const res = await axios.get('/api/progress/chapters/total') // Updated to match reliable endpoint
            // Wait, I need user progress too. The admin endpoint was total.
            // Let's stick to the apip endpoint if it exists.
            const statsRes = await axios.get('/api/badges/getChapterProgress')
            setChapterStats(statsRes.data)
        } catch (error) {
            console.error('Error loading chapter stats:', error)
        }
    }    
    
    const loadBadgesByCategory = async () => {
        try {
            const res = await axios.get('/api/badges/getBadgesByCategory')
            const badgeList = res.data.badges || []
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

    const totalBadgeCount = Object.values(badgesByCategory)
        .reduce((sum, items) => sum + items.length, 0)

    const handleSave = async () => {
        try {
            await axios.put('/api/users/me', { displayName, avatarId })
            updateUser({ name: displayName, avatarId })
            setEditing(false)
            toast.success('Profil diperbarui!')
        } catch (err) {
            toast.error('Gagal memperbarui profil')
        }
    }

    if (!level) return null

    return (
        <Layout>
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-bold font-display text-main">Profil Saya</h1>
                    <p className="text-muted mt-1">Identitas pahlawan siber dan catatan pencapaian Anda</p>
                </motion.div>

                {/* Profile Card */}
                <motion.div className="glass-card p-6"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    {!editing ? (
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <AvatarDisplay avatarId={user?.avatarId || 1} size="xl" showRing ringColor={level.color} />
                            <div className="flex-1 w-full">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h2 className="text-2xl font-bold text-main">{user?.name}</h2>
                                        <p className="text-muted">{user?.position} • {user?.department}</p>
                                        <p className="text-dim text-sm font-mono">NPK: {user?.nik}</p>
                                    </div>
                                    <button onClick={() => setEditing(true)} className="btn-secondary text-xs flex items-center gap-2">
                                        <Edit3 className="w-3 h-3" /> Ubah
                                    </button>
                                </div>

                                {/* Level */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-3 py-0.5 rounded-full text-xs font-bold border"
                                        style={{ color: level.color, borderColor: `${level.color}60`, background: `${level.color}15` }}>
                                        {level.icon} {level.title}
                                    </span>
                                    <span className="text-muted text-xs">Tingkat {level.level}</span>
                                </div>

                                {/* XP */}
                                <div className="max-w-md">
                                    <div className="flex justify-between text-[10px] mb-1 text-muted">
                                        <span>{(user?.xp || 0).toLocaleString()} XP</span>
                                        {nextLevel && <span>{nextLevel.xpRequired.toLocaleString()} XP untuk {nextLevel.title}</span>}
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
                            <h2 className="font-bold text-main mb-4">Edit Profil</h2>
                            <div className="mb-4">
                                <label className="text-sm text-muted mb-2 block">Nama Tampilan</label>
                                <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="input-field max-w-sm" />
                            </div>
                            <div className="mb-4">
                                <label className="text-sm text-muted mb-2 block">Avatar</label>
                                <AvatarPicker selected={avatarId} onSelect={setAvatarId} />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setEditing(false)} className="btn-secondary">Batal</button>
                                <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Simpan Perubahan
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total XP', value: (user?.xp || 0).toLocaleString(), icon: '⭐' },
                        { label: 'Peringkat Global', value: `#${myRank || '—'}`, icon: '🏆' },
                        { label: 'Modul Selesai', value: `${chapterStats.completed}/${chapterStats.total}`, icon: '📚' },
                        { label: 'Login Beruntun', value: `${user?.streak || 1} hari`, icon: '🔥' },
                    ].map((s, i) => (
                        <motion.div key={s.label} className="stat-widget text-center"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
                            <div className="text-3xl mb-1">{s.icon}</div>
                            <p className="text-xl font-bold text-main">{s.value}</p>
                            <p className="text-xs text-dim">{s.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Level progression */}
                <motion.div className="glass-card p-5"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <h2 className="font-bold text-main mb-4">🎯 Progres Tingkat</h2>
                    <div className="flex items-end gap-2 overflow-x-auto pb-2">
                        {loading ? (
                            <p className="text-dim text-xs italic">Memuat tingkat...</p>
                        ) : error ? (
                            <p className="text-primary text-xs italic">Gagal memuat tingkat</p>
                        ) : levels.map((l, i) => {
                            const reached = (user?.xp || 0) >= l.xpRequired
                            const isCurrent = l.level === level.level
                            return (
                                <div key={l.level} className="flex-1 min-w-[60px] flex flex-col items-center gap-1">
                                    <span className="text-[10px] font-bold" style={{ color: reached ? l.color : '#ffffff30' }}>
                                        {isCurrent ? '▲' : ''}
                                    </span>
                                    <div className={`w-full rounded-t-xl flex items-end justify-center pb-1 transition-all`}
                                        style={{
                                            height: `${40 + i * 12}px`,
                                            background: reached ? `${l.color}30` : 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${reached ? l.color + '60' : 'rgba(255,255,255,0.1)'}`,
                                            boxShadow: isCurrent ? `0 0 15px ${l.color}60` : 'none',
                                        }}>
                                        <span className="text-lg">{l.icon}</span>
                                    </div>
                                    <p className="text-[10px] text-center font-medium truncate w-full" style={{ color: reached ? l.color : 'var(--text-dim)' }}>{l.title}</p>
                                    <p className="text-[9px] text-dim opacity-50">{l.xpRequired.toLocaleString()}</p>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* Badge Collection */}
                <motion.div className="glass-card p-5"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <h2 className="font-bold text-main mb-4">
                        🏆 Koleksi Lencana ({earnedBadgeSet.size}/{totalBadgeCount})
                    </h2>

                    {Object.entries(badgesByCategory).map(([categoryName, categoryBadges]) => (
                        <div key={categoryName} className="mb-6">
                            <h3 className="text-xs font-semibold text-dim uppercase tracking-widest mb-3 border-b border-card-border pb-1">
                                {categoryName}
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {categoryBadges.map(badge => {
                                    const earned = earnedBadgeSet.has(normalizeBadgeKey(badge))
                                    const badgeColor = normalizeBadgeColor(badge)
                                    const earnedStyle = earned
                                        ? {
                                            borderColor: withAlpha(badgeColor, '88'),
                                            background: `linear-gradient(135deg, ${withAlpha(badgeColor, '30')}, ${withAlpha(badgeColor, '14')})`,
                                            boxShadow: `0 0 15px ${withAlpha(badgeColor, '40')}`,
                                        }
                                        : undefined
                                    return (
                                        <motion.div
                                            key={badge.id}
                                            className={`${earned ? 'badge-earned' : 'badge-locked'} p-4 flex flex-col items-center gap-2`}
                                            whileHover={earned ? { scale: 1.05 } : {}}
                                            style={earnedStyle}
                                        >
                                            <span className="text-3xl">{badge.icon}</span>
                                            <p className="text-xs font-bold text-main text-center">{badge.name}</p>
                                            <p className="text-[10px] text-muted text-center line-clamp-2">{badge.desc}</p>
                                            {earned && <span className="text-[10px] font-bold" style={{ color: badgeColor }}>✓ Diperoleh</span>}
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
