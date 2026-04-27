import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, UserPlus, RefreshCcw, IdCard, UserCircle2, Mail, Building2, BriefcaseBusiness, KeyRound } from 'lucide-react'
import axios from 'axios'
import Layout from '../../components/Layout.jsx'
import toast from '../../utils/toast.js'

const INITIAL_FORM = {
	nik: '',
	name: '',
	email: '',
	department: '',
	position: '',
	password: '',
}

const normalizeDashboardData = (payload) => {
	const rows = Array.isArray(payload?.recentAdmins) ? payload.recentAdmins : []

	return {
		totalAdmins: Number(payload?.totalAdmins) || 0,
		recentAdmins: rows.map((row, index) => ({
			id: Number(row?.id) || index + 1,
			nik: row?.nik || '-',
			name: row?.name || '-',
			email: row?.email || '-',
			department: row?.department || '-',
			position: row?.position || '-',
			createdAt: row?.createdAt || row?.created_at || null,
		})),
	}
}

const formatDateTime = (value) => {
	if (!value) return '-'
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return '-'
	return date.toLocaleString()
}

export default function SuperAdminDashboardPage() {
	const [form, setForm] = useState(INITIAL_FORM)
	const [dashboard, setDashboard] = useState({ totalAdmins: 0, recentAdmins: [] })
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)

	const loadDashboard = useCallback(async () => {
		try {
			const res = await axios.get('/api/superAdmin/dashboard')
			setDashboard(normalizeDashboardData(res.data))
		} catch (err) {
			console.error('Failed to load super admin dashboard:', err)
			toast.error('Gagal memuat dashboard super admin')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadDashboard()
	}, [loadDashboard])

	const handleChange = (field) => (e) => {
		setForm((prev) => ({ ...prev, [field]: e.target.value }))
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		const nik = form.nik.trim()
		const name = form.name.trim()
		const password = form.password.trim()

		if (!nik || !name || !password) {
			toast.error('NIK, nama, dan password wajib diisi')
			return
		}

		setSubmitting(true)
		try {
			await axios.post('/api/superAdmin/admins', {
				nik,
				name,
				password,
				email: form.email.trim(),
				department: form.department.trim(),
				position: form.position.trim(),
			})

			toast.success('Admin baru berhasil dibuat')
			setForm(INITIAL_FORM)
			await loadDashboard()
		} catch (err) {
			console.error('Failed to create admin:', err)
			toast.error(err.response?.data?.message || 'Gagal membuat akun admin')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<Layout>
			<div className="p-6 max-w-6xl mx-auto space-y-6">
				<motion.div
					initial={{ opacity: 0, y: -14 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex flex-col md:flex-row md:items-center gap-4"
				>
					<div>
						<h1 className="text-3xl font-bold font-display text-white flex items-center gap-2">
							<ShieldCheck className="w-7 h-7 text-accent" />
							Super Admin Dashboard
						</h1>
						<p className="text-white/50 mt-1">Fungsi utama role super admin: menambah akun admin.</p>
					</div>

					<button
						onClick={loadDashboard}
						className="btn-secondary md:ml-auto flex items-center gap-2"
					>
						<RefreshCcw className="w-4 h-4" /> Refresh
					</button>
				</motion.div>

				<motion.div
					className="glass-card p-5"
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
				>
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs text-white/50 uppercase tracking-wider">Total Admin</p>
							<p className="text-3xl font-bold text-white mt-1">
								{loading ? '...' : dashboard.totalAdmins.toLocaleString()}
							</p>
						</div>
						<div className="w-11 h-11 rounded-xl bg-accent/20 flex items-center justify-center">
							<UserPlus className="w-5 h-5 text-accent" />
						</div>
					</div>
				</motion.div>

				<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
					<motion.form
						onSubmit={handleSubmit}
						className="glass-card p-5 space-y-4 lg:col-span-3"
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<h2 className="font-bold text-white text-lg mb-2">Tambah Admin Baru</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<label className="space-y-1">
								<span className="text-xs text-white/50 flex items-center gap-1"><IdCard className="w-3.5 h-3.5" /> NIK</span>
								<input value={form.nik} onChange={handleChange('nik')} className="input-field" placeholder="Contoh: admin002" />
							</label>

							<label className="space-y-1">
								<span className="text-xs text-white/50 flex items-center gap-1"><UserCircle2 className="w-3.5 h-3.5" /> Nama Lengkap</span>
								<input value={form.name} onChange={handleChange('name')} className="input-field" placeholder="Nama admin" />
							</label>

							<label className="space-y-1">
								<span className="text-xs text-white/50 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</span>
								<input value={form.email} onChange={handleChange('email')} className="input-field" placeholder="opsional" />
							</label>

							<label className="space-y-1">
								<span className="text-xs text-white/50 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Department</span>
								<input value={form.department} onChange={handleChange('department')} className="input-field" placeholder="opsional" />
							</label>

							<label className="space-y-1">
								<span className="text-xs text-white/50 flex items-center gap-1"><BriefcaseBusiness className="w-3.5 h-3.5" /> Position</span>
								<input value={form.position} onChange={handleChange('position')} className="input-field" placeholder="opsional" />
							</label>

							<label className="space-y-1">
								<span className="text-xs text-white/50 flex items-center gap-1"><KeyRound className="w-3.5 h-3.5" /> Password Awal</span>
								<input type="password" value={form.password} onChange={handleChange('password')} className="input-field" placeholder="minimal 6 karakter" />
							</label>
						</div>

						<button
							type="submit"
							disabled={submitting}
							className="btn-primary w-full md:w-auto px-6 inline-flex items-center justify-center gap-2"
						>
							{submitting ? 'Menyimpan...' : 'Tambah Admin'}
						</button>
					</motion.form>

					<motion.div
						className="glass-card p-5 lg:col-span-2"
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<h2 className="font-bold text-white text-lg mb-3">Admin Terbaru</h2>

						<div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
							{loading && <p className="text-sm text-white/40">Memuat data admin...</p>}

							{!loading && dashboard.recentAdmins.length === 0 && (
								<p className="text-sm text-white/40">Belum ada data admin.</p>
							)}

							{!loading && dashboard.recentAdmins.map((admin) => (
								<div key={admin.id} className="border border-white/10 rounded-lg p-3 bg-white/[0.03]">
									<p className="font-semibold text-white text-sm">{admin.name}</p>
									<p className="text-xs text-white/45">NIK: {admin.nik}</p>
									<p className="text-xs text-white/45">{admin.email}</p>
									<p className="text-xs text-white/45">{admin.department} {admin.position !== '-' ? `- ${admin.position}` : ''}</p>
									<p className="text-[11px] text-white/30 mt-1">Dibuat: {formatDateTime(admin.createdAt)}</p>
								</div>
							))}
						</div>
					</motion.div>
				</div>
			</div>
		</Layout>
	)
}
