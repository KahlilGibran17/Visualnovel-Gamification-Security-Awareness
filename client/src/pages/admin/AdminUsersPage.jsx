import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Search, RefreshCw, UserPlus, MoreVertical, Filter } from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import AvatarDisplay from '../../components/AvatarDisplay.jsx'
import toast from 'react-hot-toast'

const LEVEL_LABELS = ['', 'Rookie', 'Aware', 'Guardian', 'Expert', 'Cyber Hero']

export default function AdminUsersPage() {
    const [search, setSearch] = useState('')
    const [deptFilter, setDeptFilter] = useState('All')
    const [showImport, setShowImport] = useState(false)
    const [dragging, setDragging] = useState(false)
    const [importFile, setImportFile] = useState(null)
    const [usersData, setUsersData] = useState([])
    const [loading, setLoading] = useState(true)
    const fileRef = useRef()

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await axios.get('/api/admin/users')
            setUsersData(res.data)
        } catch (err) {
            toast.error('Failed to fetch employees')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const depts = ['All', 'Engineering', 'IT', 'Marketing', 'HR', 'Finance', 'Operations']

    const filteredUsers = usersData.filter(u =>
        (deptFilter === 'All' || u.department === deptFilter) &&
        (search === '' || u.name.toLowerCase().includes(search.toLowerCase()) || u.nik.includes(search))
    )

    const handleFileDrop = (e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer?.files?.[0] || e.target.files?.[0]
        if (file) {
            setImportFile(file)
            toast.success(`File "${file.name}" ready to import!`)
        }
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
                        <p className="text-muted mt-1">{usersData.length} total employees</p>
                    </div>
                    <div className="md:ml-auto flex gap-2">
                        <button
                            id="bulk-import-btn"
                            onClick={() => setShowImport(!showImport)}
                            className="btn-secondary text-sm flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" /> Bulk Import CSV
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
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${dragging ? 'border-accent bg-accent/10' : 'border-white/20 hover:border-white/40'
                                    }`}
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
                            {/* Sample CSV */}
                            <div className="mt-4 bg-input-bg rounded-lg p-3">
                                <p className="text-xs text-dim mb-1 font-semibold">Sample CSV format:</p>
                                <code className="text-xs text-accent font-mono">
                                    NIK,Full Name,Department,Position,Email,Initial Password<br />
                                    10021,John Doe,Engineering,Junior Engineer,john.doe@akebono-brake.co.id,Welcome@2026
                                </code>
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
                                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${deptFilter === d ? 'bg-primary text-white' : 'bg-card-bg text-muted hover:bg-input-bg'
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
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <AvatarDisplay avatarId={user.avatar_id} size="sm" />
                                                    <span className="font-medium text-main">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="text-muted font-mono">{user.nik}</td>
                                            <td>{user.department}</td>
                                            <td>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-input-bg text-muted">
                                                    Lv.{user.level || 1} {LEVEL_LABELS[user.level || 1]}
                                                </span>
                                            </td>
                                            <td className="font-bold text-accent">{user.xp?.toLocaleString() || 0}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5, 6].map(n => (
                                                            <div key={n} className={`w-2 h-4 rounded-sm ${n <= (user.chapters_completed || 0) ? 'bg-accent' : 'bg-input-bg'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-dim">{user.chapters_completed || 0}/6</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button className="text-xs text-muted hover:text-main bg-input-bg hover:bg-card-bg px-2 py-1 rounded transition-colors">
                                                        Reset PWD
                                                    </button>
                                                    <button className="text-xs text-primary hover:text-red-300 bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors">
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
                    <div className="p-4 border-t border-card-border text-xs text-dim flex justify-between items-center">
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
