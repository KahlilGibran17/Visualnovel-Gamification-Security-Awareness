import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from '../../utils/toast.js'
import Layout from '../../components/Layout.jsx'
import {
    Plus, X, Loader2, ArrowLeft,
    UserPlus, UserCheck, Search,Trash2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'


function AddAdminModal({ onClose, onSaved }) {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await axios.get('/api/users/admin/getEmployees')
                setEmployees(Array.isArray(res.data) ? res.data : [])
            } catch (err) {
                setError('Gagal memuat data karyawan')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchEmployees()
    }, [])

    const filtered = employees.filter(emp => {
        const name = String(emp?.name || '').toLowerCase()
        const email = String(emp?.email || '').toLowerCase()
        const nik = String(emp?.nik || '').toLowerCase()
        const keyword = search.toLowerCase()

        return name.includes(keyword) || email.includes(keyword) || nik.includes(keyword)
    })

    const handleSelect = async (emp) => {
        setSubmitting(true)
        try {
            await axios.patch(`/api/users/admin/updateRole/${emp.id}`, { role_name: 'admin' })
            await onSaved()
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menambahkan admin')
            console.error(err)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-4xl glass-card overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                            <UserPlus className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Pilih Karyawan</h2>
                            <p className="text-xs text-white/40">Pilih karyawan yang akan dijadikan Admin</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="nav-item p-2">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-3 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type="text"
                            placeholder="Cari nama, NIK, atau email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="input-field text-sm w-full pl-9"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
                    {error && (
                        <p className="text-red-400 text-xs text-center py-4">{error}</p>
                    )}

                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white/5 backdrop-blur border-b border-white/10">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider w-10">No</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">NIK</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Nama</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Email</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Departemen</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Posisi</th>
                                <th className="px-4 py-3 w-24 text-center text-xs font-semibold text-white/40 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-white/30 text-sm">
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-white/30 text-sm">
                                        Tidak ada karyawan ditemukan
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((emp, index) => (
                                    <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 text-white/40 text-center">{index + 1}</td>
                                        <td className="px-4 py-3 text-white/70 font-mono text-xs">{emp.nik}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {String(emp?.name || '-').slice(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-white font-medium">{emp.name || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-white/60">{emp.email}</td>
                                        <td className="px-4 py-3 text-white/60">{emp.department}</td>
                                        <td className="px-4 py-3 text-white/60">{emp.position}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleSelect(emp)}
                                                disabled={submitting}
                                                className="btn-primary text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-1.5 mx-auto"
                                            >
                                                {submitting
                                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                                    : <UserCheck className="w-3 h-3" />
                                                }
                                                Pilih
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-white/10">
                    <p className="text-xs text-white/30">
                        Total <span className="text-white/60 font-medium">{filtered.length}</span> karyawan
                    </p>
                    <button onClick={onClose} className="nav-item px-4 py-2 text-sm font-semibold">
                        Tutup
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default function SuperAdminAdminManagePage() {
    const navigate = useNavigate()                         
    const [showAddAdmin, setShowAddAdmin] = useState(false) 
    const [admins, setAdmins] = useState([])
    const [loadingAdmins, setLoadingAdmins] = useState(true)
    const [adminError, setAdminError] = useState('')
    const [updatingAdminId, setUpdatingAdminId] = useState(null)

    const fetchAdmins = async () => {
        setLoadingAdmins(true)
        setAdminError('')
        try {
            const res = await axios.get('/api/users/admin/getAdmins')
            setAdmins(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            console.error('Gagal memuat data admin:', err)
            setAdminError(err.response?.data?.message || 'Gagal memuat data admin')
            setAdmins([])
        } finally {
            setLoadingAdmins(false)
        }
    }

    useEffect(() => {
        fetchAdmins()
    }, [])

    const performDemoteAdmin = async (admin) => {
        const nameOrNik = admin?.name || admin?.nik || 'admin ini'

        setUpdatingAdminId(admin.id)
        setAdminError('')

        try {
            await axios.patch(`/api/users/admin/updateRole/${admin.id}`, { role_name: 'employee' })
            toast.success(`${nameOrNik} berhasil diubah menjadi karyawan biasa`)
            await fetchAdmins()
        } catch (err) {
            const message = err.response?.data?.message || 'Gagal mengubah admin menjadi karyawan'
            console.error('Gagal mengubah admin menjadi karyawan:', err)
            setAdminError(message)
            toast.error(message)
        } finally {
            setUpdatingAdminId(null)
        }
    }

    const handleDemoteAdmin = (admin) => {
        const nameOrNik = admin?.name || admin?.nik || 'admin ini'

        toast.custom(
            (t) => (
                <div
                    className="h-full w-full flex items-center justify-center bg-black/55 px-4"
                    onClick={() => toast.dismiss(t.id)}
                >
                    <div
                        className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="text-sm font-semibold text-slate-100">Konfirmasi Perubahan Role</p>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            Yakin mengubah <span className="text-white font-medium">{nameOrNik}</span> menjadi karyawan biasa?
                        </p>
                        <div className="mt-3 flex justify-end gap-2">
                            <button
                                onClick={() => toast.dismiss(t.id)}
                                className="px-3 py-1.5 text-xs rounded-lg font-semibold text-slate-200 border border-slate-600 hover:bg-slate-700/70"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    toast.dismiss(t.id)
                                    performDemoteAdmin(admin)
                                }}
                                className="px-3 py-1.5 text-xs rounded-lg font-semibold text-red-100 border border-red-400/40 bg-red-500/20 hover:bg-red-500/30"
                            >
                                Ya, Ubah
                            </button>
                        </div>
                    </div>
                </div>
            ),
            {
                id: `confirm-demote-admin-${admin?.id}`,
                duration: 10000,
                position: 'top-center',
                style: {
                    position: 'fixed',
                    inset: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'transparent',
                    boxShadow: 'none',
                    maxWidth: 'none',
                    padding: 0,
                    margin: 0,
                    transform: 'none',
                },
            }
        )
    }

	return (
        <Layout>
          <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="nav-item p-2">
                        <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold font-display text-white"> Kelola Admin</h1>
                    <p className="text-white/50 mt-1">Tambah, edit, atau hapus akun admin yang dapat mengelola konten dan pengguna.</p>  
                </div>
                <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowAddAdmin(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Tambah Admin
                        </button>
                    </div>
                </div>

                <div className="glass-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Daftar Admin</h2>
                        <p className="text-xs text-white/50">
                            {loadingAdmins ? 'Memuat data admin...' : `Total ${admins.length} admin`}
                        </p>
                    </div>

                    {adminError && (
                        <div className="px-5 py-3 border-b border-white/10">
                            <p className="text-xs text-red-300">{adminError}</p>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider w-10">No</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">NIK</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Nama</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Email</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Departemen</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Posisi</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-white/40 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loadingAdmins ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-white/30 text-sm">
                                            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                                            Memuat data admin...
                                        </td>
                                    </tr>
                                ) : admins.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-white/30 text-sm">
                                            Belum ada data admin
                                        </td>
                                    </tr>
                                ) : (
                                    admins.map((admin, index) => (
                                        <tr key={admin.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 text-white/40 text-center">{index + 1}</td>
                                            <td className="px-4 py-3 text-white/70 font-mono text-xs">{admin.nik || '-'}</td>
                                            <td className="px-4 py-3 text-white font-medium">{admin.name || '-'}</td>
                                            <td className="px-4 py-3 text-white/60">{admin.email || '-'}</td>
                                            <td className="px-4 py-3 text-white/60">{admin.department || '-'}</td>
                                            <td className="px-4 py-3 text-white/60">{admin.position || '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleDemoteAdmin(admin)}
                                                    disabled={updatingAdminId === admin.id}
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Hapus dari Admin"
                                                >
                                                    {updatingAdminId === admin.id
                                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                                        : <Trash2 className="w-4 h-4" />
                                                    }
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
            </div>
            </div>

          <AnimatePresence>
                {showAddAdmin && (
                    <AddAdminModal
                        onClose={() => setShowAddAdmin(false)}
                        onSaved={fetchAdmins} // ✅ fix: panggil fetchAdmins
                    />
                )}
            </AnimatePresence>
        </Layout>
    )
}
