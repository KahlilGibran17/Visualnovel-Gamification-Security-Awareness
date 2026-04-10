import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { GameProvider } from './contexts/GameContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import LoginPage from './pages/LoginPage.jsx'
import CharacterSetupPage from './pages/CharacterSetupPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ChapterSelectPage from './pages/ChapterSelectPage.jsx'
import VNEnginePage from './pages/VNEnginePage.jsx'
import ChapterResultPage from './pages/ChapterResultPage.jsx'
import LeaderboardPage from './pages/LeaderboardPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ElearningPage from './pages/ELearningPage.jsx'
import ElearningPlayerPage from './pages/ElearningPlayerPage.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx'
import AdminContentPage from './pages/admin/AdminContentPage.jsx'
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx'
import AdminElearningPage from './pages/admin/AdminElearningPage.jsx'

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <GameProvider>
                    <div className="min-h-screen bg-dark font-sans">
                        <Routes>
                            {/* Public */}
                            <Route path="/login" element={<LoginPage />} />

                            {/* Protected Employee Routes */}
                            <Route path="/setup" element={
                                <ProtectedRoute roles={['employee', 'manager', 'admin']}>
                                    <CharacterSetupPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/dashboard" element={
                                <ProtectedRoute roles={['employee', 'manager', 'admin']}>
                                    <DashboardPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/chapters" element={
                                <ProtectedRoute roles={['employee', 'manager', 'admin']}>
                                    <ChapterSelectPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/play/:chapterId" element={
                                <ProtectedRoute roles={['employee', 'manager', 'admin']}>
                                    <VNEnginePage />
                                </ProtectedRoute>
                            } />
                            <Route path="/result/:chapterId" element={
                                <ProtectedRoute roles={['employee', 'manager', 'admin']}>
                                    <ChapterResultPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/leaderboard" element={
                                <ProtectedRoute roles={['employee', 'manager', 'admin']}>
                                    <LeaderboardPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/profile" element={
                                <ProtectedRoute roles={['employee', 'manager', 'admin']}>
                                    <ProfilePage />
                                </ProtectedRoute>
                            } />
                            <Route path="/elearning" element={
                                <ProtectedRoute roles={['employee', 'manager', 'admin']}>
                                    <ElearningPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/elearning/:id" element={
                                <ProtectedRoute roles={['employee', 'manager', 'admin']}>
                                    <ElearningPlayerPage />
                                </ProtectedRoute>
                            } />

                            {/* Admin Routes */}
                            <Route path="/admin" element={
                                <ProtectedRoute roles={['admin', 'manager']}>
                                    <AdminDashboardPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin/users" element={
                                <ProtectedRoute roles={['admin']}>
                                    <AdminUsersPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin/content" element={
                                <ProtectedRoute roles={['admin']}>
                                    <AdminContentPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/admin/reports" element={
                                <ProtectedRoute roles={['admin', 'manager']}>
                                    <AdminReportsPage />
                                </ProtectedRoute>
                            } />
                            <Route path="admin/elearning" element={
                                <ProtectedRoute roles={['admin', 'manager']}>
                                    <AdminElearningPage />
                                </ProtectedRoute>
                            } />

                            <Route path="/" element={<Navigate to="/login" replace />} />
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </div>
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            style: {
                                background: '#16213E',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.1)',
                            },
                            success: { iconTheme: { primary: '#FFD60A', secondary: '#1A1A2E' } },
                            error: { iconTheme: { primary: '#E63946', secondary: '#fff' } },
                        }}
                    />
                </GameProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
