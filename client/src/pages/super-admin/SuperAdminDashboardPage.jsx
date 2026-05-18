import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, RefreshCcw, Users, UserCog } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../../components/Layout.jsx'
import toast from '../../utils/toast.js'

export default function SuperAdminDashboardPage() {
	const navigate = useNavigate()
	const [dashboard, setDashboard] = useState({ totalAdmins: 0, totalEmployees: 0 })
	const [loading, setLoading] = useState(true)

	const loadDashboard = useCallback(async () => {
		try {
			const res = await axios.get('/api/superAdmin/dashboard')
			setDashboard({
				totalAdmins: Number(res.data?.totalAdmins) || 0,
				totalEmployees: Number(res.data?.totalEmployees) || 0,
			})
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

	return (
		<Layout>
			<div className="p-6 max-w-4xl mx-auto space-y-6">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -14 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex flex-col md:flex-row md:items-center gap-4"
				>
					<div>
						<h1 className="text-3xl font-bold font-display text-main flex items-center gap-2">
							<ShieldCheck className="w-7 h-7 text-accent" />
							Super Admin Dashboard
						</h1>
						<p className="text-main/50 mt-1">Kelola role admin dari halaman Admin Management.</p>
					</div>
				</motion.div>

				{/* Stats */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<motion.div
						className="glass-card p-5"
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.05 }}
					>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-main/50 uppercase tracking-wider">Total Admin</p>
								<p className="text-3xl font-bold text-main mt-1">
									{loading ? '...' : dashboard.totalAdmins.toLocaleString()}
								</p>
							</div>
							<div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center">
								<UserCog className="w-5 h-5 text-primary" />
							</div>
						</div>
					</motion.div>

					<motion.div
						className="glass-card p-5"
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
					>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs text-main/50 uppercase tracking-wider">Total Karyawan</p>
								<p className="text-3xl font-bold text-main mt-1">
									{loading ? '...' : dashboard.totalEmployees.toLocaleString()}
								</p>
							</div>
							<div className="w-11 h-11 rounded-xl bg-accent/20 flex items-center justify-center">
								<Users className="w-5 h-5 text-accent" />
							</div>
						</div>
					</motion.div>
				</div>

				{/* Quick action */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.15 }}
				>
					<button
						onClick={() => navigate('/super-admin/add-admin')}
						className="glass-card p-5 w-full text-left hover:border-primary/30 transition-all group flex items-center gap-4"
					>
						<div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/25 transition-colors">
							<UserCog className="w-6 h-6 text-primary" />
						</div>
						<div className="flex-1">
							<p className="text-sm font-bold text-main group-hover:text-primary transition-colors">
								Admin Management
							</p>
							<p className="text-xs text-main/40 mt-0.5">
								Kelola role admin — promosikan karyawan atau cabut role admin
							</p>
						</div>
						<span className="text-main/20 text-lg">→</span>
					</button>
				</motion.div>
			</div>
		</Layout>
	)
}
