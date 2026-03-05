import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Search, RefreshCw, UserPlus, MoreVertical, Filter } from 'lucide-react'
import Layout from '../../components/Layout.jsx'
import AvatarDisplay from '../../components/AvatarDisplay.jsx'
import { DEMO_LEADERBOARD } from '../../contexts/GameContext.jsx'
import toast from 'react-hot-toast'

const LEVEL_LABELS = ['', 'Rookie', 'Aware', 'Guardian', 'Expert', 'Cyber Hero']

export default function AdminUsersPage() {
    const [search, setSearch] = useState('')
    const [deptFilter, setDeptFilter] = useState('All')
    const [showImport, setShowImport] = useState(false)
    const [dragging, setDragging] = useState(false)
    const [importFile, setImportFile] = useState(null)
    const fileRef = useRef()

    const depts = ['All', 'Engineering', 'IT', 'Marketing', 'HR', 'Finance', 'Operations']

    const users = DEMO_LEADERBOARD.filter(u =>
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
        toast.success(`Importing ${importFile.name}... (Demo mode — no actual backend call)`)
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
                        <h1 className="text-3xl font-bold font-display text-white">👥 User Management</h1>
                        <p className="text-white/50 mt-1">{DEMO_LEADERBOARD.length} total employees</p>
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
                            <h2 className="font-bold text-white mb-3">📂 Bulk Import Employees</h2>
                            <p className="text-white/50 text-sm mb-4">
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
                                <Upload className="w-10 h-10 mx-auto mb-3 text-white/40" />
                                <p className="text-white/60">{importFile ? `✅ ${importFile.name}` : 'Drag & drop CSV/Excel here, or click to browse'}</p>
                                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileDrop} />
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setShowImport(false)} className="btn-secondary flex-1">Cancel</button>
                                <button id="confirm-import-btn" onClick={handleImport} className="btn-primary flex-1">
                                    Import Employees
                                </button>
                            </div>
                            {/* Sample CSV */}
                            <div className="mt-4 bg-white/5 rounded-lg p-3">
                                <p className="text-xs text-white/40 mb-1 font-semibold">Sample CSV format:</p>
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
                                {users.map((user, i) => (
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
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                                                Lv.{user.level} {LEVEL_LABELS[user.level]}
                                            </span>
                                        </td>
                                        <td className="font-bold text-accent">{user.xp.toLocaleString()}</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5, 6].map(n => (
                                                        <div key={n} className={`w-2 h-4 rounded-sm ${n <= user.chaptersCompleted ? 'bg-accent' : 'bg-white/10'}`} />
                                                    ))}
                                                </div>
                                                <span className="text-xs text-white/40">{user.chaptersCompleted}/6</span>
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
                        Showing {users.length} of {DEMO_LEADERBOARD.length} employees
                    </div>
                </motion.div>
            </div>
        </Layout>
    )
}
