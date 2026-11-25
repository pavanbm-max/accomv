import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';

// Lazy-loaded route components
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage').then(m => ({ default: m.ConfirmationPage })));

// Admin Pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminRegistrationsPage = lazy(() => import('./pages/admin/AdminRegistrationsPage').then(m => ({ default: m.AdminRegistrationsPage })));
const AdminAnnouncementsPage = lazy(() => import('./pages/admin/AdminAnnouncementsPage').then(m => ({ default: m.AdminAnnouncementsPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));

const RouteLoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center p-4">
    <div className="flex flex-col items-center gap-3 text-sm text-[#94A3B8]">
      <div className="w-8 h-8 rounded-full border-2 border-[#00F5B8] border-t-transparent animate-spin" />
      <span>Loading portal...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            {/* Fixed Cosmic Space Horizon & Nebula Background Layer */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
              <div 
                className="w-full h-full bg-cover bg-center bg-no-repeat scale-100 transform-gpu"
                style={{ 
                  backgroundImage: "url('/cosmic-bg.jpg')", 
                  backgroundPosition: "center 25%",
                  backgroundAttachment: "fixed" 
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#020608]/75 via-[#03090C]/55 to-[#020608]/90" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,245,184,0.08),transparent_70%)]" />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col text-[#F0FDF9] font-sans antialiased selection:bg-[#00F5B8]/25 selection:text-[#00F5B8]">
              <Navbar />
              <div className="flex-1">
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Routes>
                    {/* Public Guest Pre-Registration Flow */}
                    <Route path="/" element={<RegisterPage />} />
                    <Route path="/confirmation/:referenceId" element={<ConfirmationPage />} />

                    {/* Backwards compatibility redirects */}
                    <Route path="/checkout/:scanToken" element={<Navigate to="/" replace />} />
                    <Route path="/scan" element={<Navigate to="/admin" replace />} />

                    {/* Staff Authentication */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />

                    {/* Admin Protected Portal */}
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboardPage />} />
                      <Route path="registrations" element={<AdminRegistrationsPage />} />
                      <Route path="announcements" element={<AdminAnnouncementsPage />} />
                      <Route path="users" element={<AdminUsersPage />} />
                      <Route path="settings" element={<AdminSettingsPage />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </div>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
