import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogoPlaceholder } from '../../components/LogoPlaceholder';
import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  UserCog, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X,
  ArrowLeft
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { profile, isAdmin, isStaff, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-sm text-[#9FB9C1]">
          <div className="w-8 h-8 rounded-full border-2 border-[#00F5B8] border-t-transparent animate-spin" />
          <span>Restoring coordinator session...</span>
        </div>
      </div>
    );
  }

  if (!isStaff) {
    return <Navigate to="/admin/login" replace />;
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, adminOnly: false },
    { label: 'Pre-Registrations', path: '/admin/registrations', icon: Users, adminOnly: false },
    { label: 'Announcements', path: '/admin/announcements', icon: Megaphone, adminOnly: false },
    { label: 'Staff Users', path: '/admin/users', icon: UserCog, adminOnly: true },
    { label: 'Tariff Settings', path: '/admin/settings', icon: SettingsIcon, adminOnly: true },
  ];

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row transition-colors text-[#F0FDF9]">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#03090C]/85 backdrop-blur-xl border-b border-[#00F5B8]/15">
        <LogoPlaceholder size="sm" showBadge={true} />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md text-[#9FB9C1] hover:bg-[#061419] hover:text-[#F0FDF9]"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#040E12]/85 backdrop-blur-xl border-r border-[#00F5B8]/15 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6">
          <div className="pb-6 border-b border-[#00F5B8]/15">
            <LogoPlaceholder size="md" showBadge={true} />
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#00F5B8]/10 text-[#00F5B8] border border-[#00F5B8]/25">
                {profile?.role === 'admin' ? 'Hostel Admin' : 'Coordinator'}
              </span>
              <span className="text-xs text-[#9FB9C1] truncate">{profile?.full_name}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00F5B8]/20 to-[#00C49F]/10 text-[#00F5B8] border border-[#00F5B8]/30 font-semibold shadow-[0_0_12px_rgba(0,245,184,0.15)]'
                      : 'text-[#9FB9C1] hover:text-[#F0FDF9] hover:bg-[#061419]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00F5B8]' : 'text-[#5A7E88]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-6 border-t border-[#00F5B8]/15 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#9FB9C1] hover:text-[#00F5B8] hover:bg-[#061419] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#5A7E88]" />
            <span>Public Pre-Registration</span>
          </Link>

          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#F87171] hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
