import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from '../utils/toast.js'

const AuthContext = createContext(null)



export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [token, setToken] = useState(() => localStorage.getItem('ake_token'))

    useEffect(() => {
        if (token) {
            // Try to fetch profile from backend; fall back to demo
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            fetchProfile()
        } else {
            setLoading(false)
        }
    }, [token])

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/api/users/me')
            setUser(res.data)
        } catch {
            // Backend offline — check demo session
            const demo = localStorage.getItem('ake_demo_user')
            if (demo) setUser(JSON.parse(demo))
        } finally {
            setLoading(false)
        }
    }

    const refreshUser = async () => {
        await fetchProfile()
    }

    const login = async (nik, password, remember) => {
        try {
            const res = await axios.post('/api/auth/login', { nik, password })
            const { token: newToken, user: userData } = res.data
            setToken(newToken)
            setUser(userData)
            if (remember) localStorage.setItem('ake_token', newToken)
            else sessionStorage.setItem('ake_token', newToken)
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
            return { success: true, user: userData }
        } catch (err) {
            // Demo mode fallback
            // const demo = DEMO_USERS.find(u => u.nik === nik && password === (nik === 'admin001' ? 'admin123' : 'password123'))
            // if (demo) {
            //     const fakeToken = 'demo_' + demo.nik
            //     setToken(fakeToken)
            //     setUser(demo)
            //     if (remember) localStorage.setItem('ake_token', fakeToken)
            //     localStorage.setItem('ake_demo_user', JSON.stringify(demo))
            //     return { success: true, user: demo }
            // }
            return { success: false, error: err.response?.data?.message || 'Invalid NIK or password' }
        }
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('ake_token')
        localStorage.removeItem('ake_demo_user')
        sessionStorage.removeItem('ake_token')
        delete axios.defaults.headers.common['Authorization']
    }

    const updateUser = (updates) => {
        const updated = { ...user, ...updates }
        setUser(updated)
        if (localStorage.getItem('ake_demo_user')) {
            localStorage.setItem('ake_demo_user', JSON.stringify(updated))
        }
    }

    const forgotPassword = async (nik) => {
        try {
            await axios.post('/api/auth/forgot-password', { nik })
            return { success: true }
        } catch {
            // Simulate success in demo mode
            return { success: true }
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshUser, forgotPassword, isDemo: token?.startsWith('demo_') }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
