import React from 'react';
import { Link } from 'react-router-dom';
import { LogoPlaceholder } from './LogoPlaceholder';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { profile, isStaff, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#03090C]/80 border-b border-[#00F5B8]/15 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-all duration-300 group hover:drop-shadow-[0_0_16px_rgba(0,245,184,0.35)]">
          <LogoPlaceholder size="md" showBadge={true} />
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          {isStaff ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Admin Portal Link */}
              <Link
                to="/admin"
                className="group inline-flex items-center gap-1.5 text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-md bg-[#00F5B8]/10 text-[#00F5B8] border border-[#00F5B8]/30 hover:bg-[#00F5B8]/20 hover:border-[#00F5B8]/60 hover:shadow-[0_0_16px_rgba(0,245,184,0.25)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <LayoutDashboard className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
                <span className="hidden sm:inline">Coordinator Portal</span>
                <span className="text-[10px] bg-[#00F5B8] text-[#021713] px-1.5 py-0.5 rounded font-mono uppercase font-bold shadow-[0_0_8px_rgba(0,245,184,0.4)]">
                  {profile?.role}
                </span>
              </Link>

              {/* Sign out */}
              <button
                onClick={signOut}
                title="Sign out"
                className="p-1.5 text-[#9FB9C1] hover:text-[#F87171] rounded-md hover:bg-[#EF4444]/10 hover:shadow-[0_0_12px_rgba(239,68,68,0.2)] hover:border hover:border-[#EF4444]/30 border border-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#00F5B8]"
              >
                <LogOut className="w-4 h-4 transition-transform duration-200 hover:-translate-x-0.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/admin/login"
              className="text-xs font-medium text-[#9FB9C1] hover:text-[#00F5B8] px-2.5 sm:px-3 py-2 rounded-md hover:bg-[#061419]/90 border border-transparent hover:border-[#00F5B8]/30 hover:shadow-[0_0_14px_rgba(0,245,184,0.15)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-1.5 group"
            >
              <Shield className="w-3.5 h-3.5 text-[#00F5B8] transition-transform duration-200 group-hover:scale-110" />
              <span className="hidden xs:inline">Coordinator Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
