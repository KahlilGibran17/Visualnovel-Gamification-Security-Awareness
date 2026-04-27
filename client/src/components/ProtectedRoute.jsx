import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/60 font-medium">Loading Akebono Cyber Academy...</p>
                </div>
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace />

    if (roles && !roles.includes(user.role)) {
        const fallbackPath = user.role === 'super-admin' ? '/super-admin' : '/dashboard'
        return <Navigate to={fallbackPath} replace />
    }

    if (!user.setupDone && user.role !== 'super-admin' && window.location.pathname !== '/setup') {
        return <Navigate to="/setup" replace />
    }

    return children
}
