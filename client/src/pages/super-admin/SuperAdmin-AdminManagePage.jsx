import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ShieldCheck, UserCog, ArrowLeft, RefreshCcw, Search,
    ChevronDown, Loader2, UserMinus, CheckCircle, AlertTriangle, X, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../../components/Layout.jsx'
import toast from '../../utils/toast.js'

// ── Confirm Modal ──────────────────────────────────────────────────────────

function ConfirmModal({ title, message, confirmText, danger, loading, onConfirm, onCancel }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
        >
            <motion.div
                initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
                className="glass-card p-6 w-full max-w-sm ring-1 ring-white/10 shadow-2xl"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        danger ? 'bg-red-500/15' : 'bg-primary/15'
                    }`}>
                        <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-primary'}`} />
                    </div>
                    <div>
                        <p className="font-bold text-main text-sm">{title}</p>
                        <p className="text-xs text-main/50 mt-0.5">{message}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 nav-item py-2.5 text-sm font-semibold justify-center"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                            danger
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                                : 'btn-primary'
                        }`}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {confirmText}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function SuperAdminAdminManagePage() {
    const navigate = useNavigate()

    const [admins, setAdmins] = useState([])
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [promoting, setPromoting] = useState(false)

    const [selectedEmployee, setSelectedEmployee] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [adminCurrentPage, setAdminCurrentPage] = useState(1)
    const ADMINS_PER_PAGE = 10
    const [showEmployeeModal, setShowEmployeeModal] = useState(false)
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('')

    // Confirm states
    const [confirmPromote, setConfirmPromote] = useState(null) // employee obj
    const [confirmDemote, setConfirmDemote] = useState(null)   // admin obj
    const [actionLoading, setActionLoading] = useState(false)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [adminsRes, employeesRes] = await Promise.all([
                axios.get('/api/superAdmin/admins'),
                axios.get('/api/superAdmin/employees'),
            ])
            setAdmins(adminsRes.data?.admins || [])
            setEmployees(employeesRes.data?.employees || [])
        } catch (err) {
            console.error('Fetch error:', err)
            toast.error('Gagal memuat data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    // ── Promote ────────────────────────────────────────────────────────────
    const handlePromote = async () => {
        if (!confirmPromote) return
        setActionLoading(true)
        try {
            await axios.put('/api/superAdmin/admins/promote', { userId: confirmPromote.id })
            toast.success(`${confirmPromote.name} berhasil dijadikan admin`)
            setConfirmPromote(null)
            setSelectedEmployee('')
            await fetchData()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal mempromosikan user')
        } finally {
            setActionLoading(false)
        }
    }

    // ── Demote ─────────────────────────────────────────────────────────────
    const handleDemote = async () => {
        if (!confirmDemote) return
        setActionLoading(true)
        try {
            await axios.put(`/api/superAdmin/admins/${confirmDemote.id}/demote`)
            toast.success(`${confirmDemote.name} dikembalikan ke karyawan`)
            setConfirmDemote(null)
            await fetchData()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menghapus role admin')
        } finally {
            setActionLoading(false)
        }
    }

    useEffect(() => {
        setAdminCurrentPage(1)
    }, [searchTerm])

    // Filter, sort, and paginate admins
    const filteredAdmins = admins
        .filter(a =>
            !searchTerm || a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.nik?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    const totalAdminPages = Math.ceil(filteredAdmins.length / ADMINS_PER_PAGE)
    const paginatedAdmins = filteredAdmins.slice(
        (adminCurrentPage - 1) * ADMINS_PER_PAGE,
        adminCurrentPage * ADMINS_PER_PAGE
    )

    const selectedEmp = employees.find(e => String(e.id) === selectedEmployee)

    return (
        <Layout>
            <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                >
                    <button onClick={() => navigate('/super-admin')} className="nav-item p-2 flex-shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl md:text-2xl font-bold text-main flex items-center gap-2">
                            <UserCog className="w-6 h-6 text-primary" />
                            Admin Management
                        </h1>
                        <p className="text-xs md:text-sm text-main/50">
                            Promosikan karyawan menjadi admin atau cabut role admin
                        </p>
                    </div>
                </motion.div>

                {/* Promote Section */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="glass-card p-5"
                >
                    <h2 className="text-sm font-bold text-main mb-3 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        Tambah Admin dari Karyawan
                    </h2>
                    <p className="text-xs text-main/40 mb-4">
                        Pilih karyawan dari dropdown, lalu klik "Jadikan Admin" untuk mengubah role-nya.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <button
                                onClick={() => setShowEmployeeModal(true)}
                                disabled={loading}
                                className="input-field text-sm w-full text-left flex justify-between items-center"
                            >
                                <span className={selectedEmp ? 'text-main' : 'text-main/50'}>
                                    {loading ? 'Memuat karyawan...' : selectedEmp ? `${selectedEmp.name} (${selectedEmp.nik}) ${selectedEmp.department ? `— ${selectedEmp.department}` : ''}` : '— Pilih karyawan —'}
                                </span>
                                <ChevronDown className="w-4 h-4 text-main/30" />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                if (!selectedEmp) {
                                    toast.error('Pilih karyawan terlebih dahulu')
                                    return
                                }
                                setConfirmPromote(selectedEmp)
                            }}
                            disabled={!selectedEmployee || loading}
                            className="btn-primary text-sm py-2.5 px-5 flex items-center justify-center gap-2 disabled:opacity-40 flex-shrink-0"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            Jadikan Admin
                        </button>
                    </div>

                    {selectedEmp && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 glass-card p-3 border-primary/20"
                            style={{ background: 'rgba(230,57,70,0.04)' }}
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div>
                                    <span className="text-main/30">NIK</span>
                                    <p className="text-main font-semibold">{selectedEmp.nik}</p>
                                </div>
                                <div>
                                    <span className="text-main/30">Nama</span>
                                    <p className="text-main font-semibold">{selectedEmp.name}</p>
                                </div>
                                <div>
                                    <span className="text-main/30">Department</span>
                                    <p className="text-main font-semibold">{selectedEmp.department || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-main/30">Posisi</span>
                                    <p className="text-main font-semibold">{selectedEmp.position || '-'}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {employees.length === 0 && !loading && (
                        <p className="text-xs text-main/30 mt-3">Tidak ada karyawan yang tersedia untuk dipromosikan.</p>
                    )}
                </motion.div>

                {/* Admin List */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-5"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <h2 className="text-sm font-bold text-main flex items-center gap-2">
                            <UserCog className="w-4 h-4 text-primary" />
                            Daftar Admin
                            {admins.length > 0 && (
                                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-bold">
                                    {admins.length}
                                </span>
                            )}
                        </h2>
                        <div className="relative max-w-xs w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-main/30" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Cari nama atau NIK..."
                                className="input-field text-sm pl-9 w-full"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-10 text-main/40">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat data admin...
                        </div>
                    ) : filteredAdmins.length === 0 ? (
                        <div className="text-center py-10 text-main/25">
                            <UserCog className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">{searchTerm ? 'Tidak ada admin yang cocok' : 'Belum ada admin'}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {paginatedAdmins.map((admin, i) => (
                                <motion.div
                                    key={admin.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold text-primary">
                                            {(admin.name || '?').charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-main truncate">{admin.name}</p>
                                        <p className="text-[11px] text-main/40">
                                            {admin.nik}
                                            {admin.department ? ` · ${admin.department}` : ''}
                                            {admin.position ? ` · ${admin.position}` : ''}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setConfirmDemote(admin)}
                                        className="text-xs text-white hover:text-white border border-red-500 hover:border-red-600 bg-red-500 hover:bg-red-600 rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5 flex-shrink-0"
                                    >
                                        <UserMinus className="w-3.5 h-3.5" />
                                        Cabut Admin
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {filteredAdmins.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                            <div className="text-xs text-main/50">
                                Menampilkan {paginatedAdmins.length > 0 ? (adminCurrentPage - 1) * ADMINS_PER_PAGE + 1 : 0} - {Math.min(adminCurrentPage * ADMINS_PER_PAGE, filteredAdmins.length)} dari {filteredAdmins.length} admin
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setAdminCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={adminCurrentPage === 1}
                                    className="nav-item p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-semibold text-main/80">
                                    Hal {adminCurrentPage} / {totalAdminPages || 1}
                                </span>
                                <button
                                    onClick={() => setAdminCurrentPage(p => Math.min(totalAdminPages, p + 1))}
                                    disabled={adminCurrentPage === totalAdminPages || totalAdminPages === 0}
                                    className="nav-item p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Confirm Promote */}
                <AnimatePresence>
                    {confirmPromote && (
                        <ConfirmModal
                            title="Jadikan Admin"
                            message={`Apakah Anda yakin ingin memberikan hak akses admin kepada ${confirmPromote.name} (${confirmPromote.nik})?`}
                            confirmText="Jadikan Admin"
                            loading={actionLoading}
                            onConfirm={handlePromote}
                            onCancel={() => setConfirmPromote(null)}
                        />
                    )}
                </AnimatePresence>

                {/* Confirm Demote */}
                <AnimatePresence>
                    {confirmDemote && (
                        <ConfirmModal
                            title="Cabut Role Admin"
                            message={`Apakah Anda yakin ingin mencabut role admin dari ${confirmDemote.name} (${confirmDemote.nik})?`}
                            confirmText="Ya, Cabut Admin"
                            danger
                            loading={actionLoading}
                            onConfirm={handleDemote}
                            onCancel={() => setConfirmDemote(null)}
                        />
                    )}
                </AnimatePresence>

                {/* Employee Selection Modal */}
                <AnimatePresence>
                    {showEmployeeModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center px-4"
                            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
                                className="glass-card p-5 w-full max-w-lg ring-1 ring-white/10 shadow-2xl flex flex-col max-h-[85vh] bg-main"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-main">Pilih Karyawan</h3>
                                    <button onClick={() => setShowEmployeeModal(false)} className="nav-item p-1.5">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-main/40" />
                                    <input
                                        type="text"
                                        placeholder="Cari NIK atau Nama karyawan..."
                                        value={employeeSearchTerm}
                                        onChange={e => setEmployeeSearchTerm(e.target.value)}
                                        className="input-field text-sm w-full pl-9"
                                    />
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                    {employees
                                        .filter(e => !employeeSearchTerm || e.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) || e.nik.toLowerCase().includes(employeeSearchTerm.toLowerCase()))
                                        .map(emp => (
                                        <button
                                            key={emp.id}
                                            onClick={() => {
                                                setSelectedEmployee(String(emp.id));
                                                setShowEmployeeModal(false);
                                                setEmployeeSearchTerm('');
                                            }}
                                            className="w-full text-left p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-main">{emp.name}</p>
                                                <p className="text-xs text-main/50 mt-1">NIK: {emp.nik} • {emp.department || '-'}</p>
                                            </div>
                                            {selectedEmployee === String(emp.id) && (
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            )}
                                        </button>
                                    ))}
                                    {employees.filter(e => !employeeSearchTerm || e.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) || e.nik.toLowerCase().includes(employeeSearchTerm.toLowerCase())).length === 0 && (
                                        <div className="text-center py-6 text-main/40 text-sm">
                                            Karyawan tidak ditemukan
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    )
}
