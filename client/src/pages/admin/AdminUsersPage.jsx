import React, { useState, useEffect, useMemo, useRef } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Search, UserPlus, RefreshCw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useGame } from '../../contexts/GameContext.jsx'
import Layout from '../../components/Layout.jsx'
import AvatarDisplay from '../../components/AvatarDisplay.jsx'
import toast from '../../utils/toast.js'

const normalizeUsersData = (rows) => {
    if (!Array.isArray(rows)) return []
    return rows.map((row, index) => ({
        ...row,
        id: row?.id || index + 1,
        xp: Number(row?.xp) || 0,
        level: Number(row?.level) || 1,
        chapters_completed: Number(row?.chapters_completed) || 0,
        avatar_id: Number(row?.avatar_id) || 1,
    }))
}

export default function AdminUsersPage() {
    const { levels } = useGame()
    const [search, setSearch] = useState('')
    const [deptFilter, setDeptFilter] = useState('All')
    const [showImport, setShowImport] = useState(false)
    const [dragging, setDragging] = useState(false)
    const [importFile, setImportFile] = useState(null)
    const [usersData, setUsersData] = useState([])
    const [totalChapters, setTotalChapters] = useState(0)
    const [loading, setLoading] = useState(true)
    const fileRef = useRef()

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const [usersRes, chaptersRes] = await Promise.all([
                axios.get('/api/admin/users'),
                axios.get('/api/progress/chapters/total')
            ])
            setUsersData(normalizeUsersData(usersRes.data))
            setTotalChapters(chaptersRes.data?.total || 0)
        } catch (err) {
            console.error('Failed to fetch employees', err)
            toast.error('Failed to fetch employees')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const depts = useMemo(() => {
        const uniqueDepts = Array.from(new Set(usersData.map(u => u.department).filter(Boolean)))
        return ['All', ...uniqueDepts.sort()]
    }, [usersData])

    const LEVEL_LABELS = useMemo(() => {
        const labels = {}
        levels.forEach(l => { labels[l.level] = l.title })
        return labels
    }, [levels])

    const filteredUsers = useMemo(() => {
        return usersData.filter(u =>
            (deptFilter === 'All' || u.department === deptFilter) &&
            (search === '' || u.name.toLowerCase().includes(search.toLowerCase()) || u.nik.includes(search))
        )
    }, [deptFilter, usersData, search])

    const handleFileDrop = (e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.target.files?.[0] || e.dataTransfer?.files?.[0]
        if (file) setImportFile(file)
    }

    const handleImport = () => {
        if (!importFile) { toast.error('Please select a CSV or Excel file first'); return }
        toast.success(`Importing ${importFile.name}... (Backend processing required)`)
        setImportFile(null)
        setShowImport(false)
    }

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <motion.div className="flex flex-col md:flex-row md:items-center gap-4"
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div>
                        <h1 className="text-3xl font-bold font-display text-main">👥 User Management</h1>
                        <p className="text-muted mt-1">{loading ? 'Loading...' : `${usersData.length} total employees`}</p>
                    </div>
                    <div className="md:ml-auto flex gap-2">
                        <button onClick={() => setShowImport(!showImport)} className="btn-secondary text-sm flex items-center gap-2">
                            <Upload className="w-4 h-4" /> Bulk Import
                        </button>
                        <button className="btn-primary text-sm flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Add Employee
                        </button>
                    </div>
                </motion.div>

                {/* Import panel */}
                <AnimatePresence>
                    {showImport && (
                        <motion.div className="glass-card p-6"
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                            <h2 className="font-bold text-main mb-3">📂 Bulk Import Employees</h2>
                            <p className="text-muted text-sm mb-4">
                                Upload a CSV or Excel file with columns: <span className="text-accent">NIK, Full Name, Department, Position, Email, Initial Password</span>
                            </p>
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${dragging ? 'border-accent bg-accent/10' : 'border-card-border hover:border-accent/40'}`}
                                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleFileDrop}
                                onClick={() => fileRef.current?.click()}
                            >
                                <Upload className="w-10 h-10 mx-auto mb-3 text-dim" />
                                <p className="text-muted">{importFile ? `✅ ${importFile.name}` : 'Drag & drop CSV/Excel here, or click to browse'}</p>
                                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileDrop} />
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setShowImport(false)} className="btn-secondary flex-1">Cancel</button>
                                <button id="confirm-import-btn" onClick={handleImport} className="btn-primary flex-1">
                                    Import Employees
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
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
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${deptFilter === d ? 'bg-primary text-white' : 'bg-card-bg text-muted hover:bg-input-bg'}`}>
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
                                <tr className="border-b border-card-border">
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
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="py-20 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-20 text-center text-dim italic">
                                            No employees found matching the criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user, i) => (
                                        <motion.tr key={user.id}
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <AvatarDisplay avatarId={user.avatar_id} size="sm" />
                                                    <span className="font-medium text-main">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="text-muted font-mono">{user.nik}</td>
                                            <td>{user.department}</td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-dim">Lv.{user.level}</span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-input-bg text-muted w-fit">
                                                        {LEVEL_LABELS[user.level] || 'Rookie'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="font-bold text-accent">{user.xp.toLocaleString()}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-0.5">
                                                        {Array.from({ length: totalChapters || 6 }).map((_, idx) => {
                                                            const ch = idx + 1
                                                            return (
                                                                <div key={ch} className={`w-2 h-4 rounded-sm ${ch <= user.chapters_completed ? 'bg-accent' : 'bg-input-bg'}`} />
                                                            )
                                                        })}
                                                    </div>
                                                    <span className="text-xs text-dim">{user.chapters_completed}/{totalChapters || 6}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button className="text-[10px] text-muted hover:text-main bg-input-bg hover:bg-card-border px-2 py-1 rounded transition-colors">
                                                        Reset
                                                    </button>
                                                    <button className="text-[10px] text-primary hover:text-accent bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors">
                                                        Details
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-card-border text-[10px] text-dim flex justify-between items-center">
                        <div>Showing {filteredUsers.length} of {usersData.length} employees</div>
                        <button onClick={fetchUsers} className="flex items-center gap-1 hover:text-main transition-colors">
                            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
                        </button>
                    </div>
                </motion.div>
            </div>
        </Layout>
    )
}
