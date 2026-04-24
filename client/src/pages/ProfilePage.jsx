import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useGame } from '../contexts/GameContext.jsx'
import Layout from '../components/Layout.jsx'
import AvatarDisplay, { AvatarPicker } from '../components/AvatarDisplay.jsx'
import { useState } from 'react'
import { Edit3, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function ProfilePage() {
    const { user, updateUser } = useAuth()
    const { getLevelFromXP, getNextLevel, BADGES, LEVELS, getUserRank } = useGame()
    const [editing, setEditing] = useState(false)
    const [displayName, setDisplayName] = useState(user?.name || '')
    const [avatarId, setAvatarId] = useState(user?.avatarId || 1)

    const level = getLevelFromXP(user?.xp || 0)
    const nextLevel = getNextLevel(user?.xp || 0)
    const myRank = getUserRank()
    const earnedBadges = user?.badges || []

    const xpIntoLevel = (user?.xp || 0) - level.xpRequired
    const xpForNext = nextLevel ? nextLevel.xpRequired - level.xpRequired : 1
    const xpPct = nextLevel ? Math.min(100, (xpIntoLevel / xpForNext) * 100) : 100

    const handleSave = async () => {
        try {
            await axios.put('/api/users/me', { displayName, avatarId })
        } catch { }
        updateUser({ name: displayName, avatarId })
        setEditing(false)
        toast.success('Profil diperbarui!')
    }

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
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h2 className="text-2xl font-bold text-main">{user?.name}</h2>
                                        <p className="text-muted">{user?.position} • {user?.department}</p>
                                        <p className="text-dim text-sm">NIK: {user?.nik}</p>
                                    </div>
                                    <button onClick={() => setEditing(true)} className="btn-secondary text-sm flex items-center gap-2">
                                        <Edit3 className="w-4 h-4" /> Ubah
                                    </button>
                                </div>

                                {/* Level */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-3 py-1 rounded-full text-sm font-bold border"
                                        style={{ color: level.color, borderColor: `${level.color}60`, background: `${level.color}15` }}>
                                        {level.icon} {level.title}
                                    </span>
                                    <span className="text-muted text-sm">Tingkat {level.level}</span>
                                </div>

                                {/* XP */}
                                <div className="max-w-md">
                                    <div className="flex justify-between text-xs mb-1 text-muted">
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
                        { label: 'Modul Selesai', value: `${user?.chaptersCompleted || 0}/6`, icon: '📚' },
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
                    <div className="flex items-end gap-2">
                        {LEVELS.map((l, i) => {
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
                                    <p className="text-xs text-center font-medium" style={{ color: reached ? l.color : 'var(--text-dim)' }}>{l.title}</p>
                                    <p className="text-xs text-dim opacity-50">{l.xpRequired.toLocaleString()}</p>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* Badge Collection */}
                <motion.div className="glass-card p-5"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <h2 className="font-bold text-main mb-4">🏆 Koleksi Lencana ({earnedBadges.length}/{BADGES.length})</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {BADGES.map(badge => {
                            const earned = earnedBadges.includes(badge.id)
                            return (
                                <motion.div key={badge.id}
                                    className={`${earned ? 'badge-earned' : 'badge-locked'} p-4 flex flex-col items-center gap-2`}
                                    whileHover={earned ? { scale: 1.05 } : {}}>
                                    <span className="text-3xl">{badge.icon}</span>
                                    <p className="text-xs font-bold text-main text-center">{badge.name}</p>
                                    <p className="text-xs text-muted text-center">{badge.desc}</p>
                                    {earned && <span className="text-xs text-accent font-bold">✓ Diperoleh</span>}
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>
            </div>
        </Layout>
    )
}
