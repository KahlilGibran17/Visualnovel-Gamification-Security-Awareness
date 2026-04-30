import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { GameProvider } from './contexts/GameContext.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import LoginPage from './pages/LoginPage.jsx'
import CharacterSetupPage from './pages/CharacterSetupPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ChapterSelectPage from './pages/ChapterSelectPage.jsx'
import ELearningPage from './pages/ELearningPage.jsx'
import ChapterResultPage from './pages/ChapterResultPage.jsx'
import LeaderboardPage from './pages/LeaderboardPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import VNEnginePage from './pages/VNEnginePage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ElearningPage from './pages/ELearningPage.jsx'
import ElearningPlayerPage from './pages/ElearningPlayerPage.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx'
import AdminContentPage from './pages/admin/AdminContentPage.jsx'
import GuidePage from './pages/GuidePage.jsx'
import AdminCMSPage from './pages/admin/AdminCMSPage.jsx'
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx'
import AdminELearningPage from './pages/admin/AdminELearningPage.jsx'

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ThemeProvider>
                    <GameProvider>
                        <div className="min-h-screen bg-main font-sans transition-colors duration-300">
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
                                <Route path="/elearning" element={
                                    <ProtectedRoute roles={['employee', 'manager', 'admin']}>
                                        <ELearningPage />
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
                                <Route path="/guide" element={
                                    <ProtectedRoute roles={['employee', 'manager', 'admin']}>
                                        <GuidePage />
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
                                        <AdminCMSPage />
                                    </ProtectedRoute>
                                } />
                                <Route path="/admin/elearning" element={
                                    <ProtectedRoute roles={['admin']}>
                                        <AdminELearningPage />
                                    </ProtectedRoute>
                                } />
                                <Route path="/admin/reports" element={
                                    <ProtectedRoute roles={['admin', 'manager']}>
                                        <AdminReportsPage />
                                    </ProtectedRoute>
                                } />

                                <Route path="/" element={<LandingPage />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </div>
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                style: {
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-main)',
                                    border: '1px solid var(--card-border)',
                                },
                                success: { iconTheme: { primary: '#FFD60A', secondary: '#1A1A2E' } },
                                error: { iconTheme: { primary: '#E63946', secondary: '#fff' } },
                            }}
                        />
                    </GameProvider>
                </ThemeProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
