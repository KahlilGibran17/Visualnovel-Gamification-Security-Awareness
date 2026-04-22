import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Search, UserPlus } from 'lucide-react'
import { useGame } from '../../contexts/GameContext.jsx'
import Layout from '../../components/Layout.jsx'
import AvatarDisplay from '../../components/AvatarDisplay.jsx'
import toast from '../../utils/toast.js'
import axios from 'axios'

//const LEVEL_LABELS = ['', 'Rookie', 'Aware', 'Guardian', 'Expert', 'Cyber Hero']

const normalizeLeaderboardRows = (rows) => {
    if (!Array.isArray(rows)) return []

    return rows.map((row, index) => ({
        ...row,
        id: Number(row?.id) || index + 1,
        rank: Number(row?.rank) || index + 1,
        xp: Number(row?.xp) || 0,
        level: Number(row?.level) || 1,
        chaptersCompleted: Number(row?.chaptersCompleted) || 0,
        avatarId: Number(row?.avatarId) || 1,
    }))
}

export default function AdminUsersPage() {
    const { user, updateUser, refreshUser } = useAuth()
    const { getLevelFromXP, getNextLevel, badges,levels,loading,error, getUserRank } = useGame()
    const [search, setSearch] = useState('')
    const [deptFilter, setDeptFilter] = useState('All')
    const [showImport, setShowImport] = useState(false)
    const [dragging, setDragging] = useState(false)
    const [importFile, setImportFile] = useState(null)
    const [leaderboardRows, setLeaderboardRows] = useState([])
    const [totalChapters, setTotalChapters] = useState(0)
    const [loadingUsers, setLoadingUsers] = useState(true)
    const fileRef = useRef()
    


    useEffect(() => {
        let isMounted = true

        const loadUsers = async () => {
            setLoadingUsers(true)
            try {
                const [leaderboardRes, chaptersRes] = await Promise.all([
                    axios.get('/api/leaderboard', {
                        params: { filter: 'all', dept: 'all', includeZeroXp: 'true' },
                    }),
                    axios.get('/api/elearning/getChapters'),
                ])

                if (isMounted) {
                    setLeaderboardRows(normalizeLeaderboardRows(leaderboardRes.data))
                    setTotalChapters(Array.isArray(chaptersRes.data) ? chaptersRes.data.length : 0)
                }
            } catch (err) {
                console.error('Failed to load users for admin page:', err)
                if (isMounted) {
                    setLeaderboardRows([])
                    setTotalChapters(0)
                    toast.error('Failed to load users data')
                }
            } finally {
                if (isMounted) {
                    setLoadingUsers(false)
                }
            }
        }

        loadUsers()

        return () => {
            isMounted = false
        }
    }, [])

    const depts = useMemo(
        () => ['All', ...Array.from(new Set(leaderboardRows.map(u => u.department).filter(Boolean)))],
        [leaderboardRows]
    )

    const LEVEL_LABELS = useMemo(() => {
        const labels = {}
        levels.forEach(l => {
            labels[l.level] = l.title
        })
        return labels
    }, [levels])

    const users = useMemo(
        () => leaderboardRows.filter(u =>
            (deptFilter === 'All' || u.department === deptFilter) &&
            (search === '' || u.name.toLowerCase().includes(search.toLowerCase()) || u.nik.includes(search))
        ),
        [deptFilter, leaderboardRows, search]
    )

    const effectiveTotalChapters = useMemo(() => {
        if (totalChapters > 0) return totalChapters

        return leaderboardRows.reduce(
            (max, row) => Math.max(max, Number(row?.chaptersCompleted) || 0),
            0
        )
    }, [leaderboardRows, totalChapters])

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <motion.div className="flex flex-col items-center gap-0.5"
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div>
                        <h1 className="text-3xl font-bold font-display text-white">👥 User Management</h1>
                        <p className="text-white/50 mt-1">
                            {loadingUsers ? 'Loading users...' : `${leaderboardRows.length} total employees`}
                        </p>
                    </div>
                    <div className="md:ml-auto flex gap-2">
                        <button className="btn-primary text-sm flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Add Employee
                        </button>
                    </div>
                </motion.div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or NIK..."
                            className="input-field pl-9"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {depts.map(d => (
                            <button key={d}
                                onClick={() => setDeptFilter(d)}
                                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${deptFilter === d ? 'bg-primary text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                                    }`}>
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <motion.div className="glass-card overflow-hidden"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="overflow-x-auto">
                        <table className="admin-table w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th>Employee</th>
                                    <th>NIK</th>
                                    <th>Department</th>
                                    <th>Level</th>
                                    <th>XP</th>
                                    <th>Progress</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingUsers && (
                                    <tr>
                                        <td colSpan={7} className="text-center text-white/40 py-8">Loading users...</td>
                                    </tr>
                                )}

                                {!loadingUsers && users.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center text-white/40 py-8">No users found.</td>
                                    </tr>
                                )}

                                {!loadingUsers && users.map((user, i) => (
                                    <motion.tr key={user.id}
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <AvatarDisplay avatarId={user.avatarId} size="sm" />
                                                <span className="font-medium text-white">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="text-white/60 font-mono">{user.nik}</td>
                                        <td>{user.department}</td>
                                        <td>
                                            <div className="flex flex-col gap-0.5">
                                               <span className="text-xs text-white/40">Lv.{user.level}</span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                                                        {LEVEL_LABELS[user.level]}
                                                    </span>
                                            </div>
                                        </td>
                                        <td className="font-bold text-accent">{user.xp.toLocaleString()}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-0.5">
                                                    {Array.from({ length: effectiveTotalChapters }).map((_, idx) => {
                                                        const chapterNumber = idx + 1
                                                        return (
                                                            <div
                                                                key={chapterNumber}
                                                                className={`w-2 h-4 rounded-sm ${chapterNumber <= user.chaptersCompleted ? 'bg-accent' : 'bg-white/10'}`}
                                                            />
                                                        )
                                                    })}
                                                </div>
                                                <span className="text-xs text-white/40">{user.chaptersCompleted}/{effectiveTotalChapters}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button className="text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/15 px-2 py-1 rounded transition-colors">
                                                    Reset PWD
                                                </button>
                                                <button className="text-xs text-primary hover:text-red-300 bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors">
                                                    Details
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-white/10 text-xs text-white/40">
                        Showing {users.length} of {leaderboardRows.length} employees
                    </div>
                </motion.div>
            </div>
        </Layout>
    )
}
