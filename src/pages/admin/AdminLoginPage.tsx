import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LogoPlaceholder } from '../../components/LogoPlaceholder';
import { Lock, Mail, Key } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await signIn(email, password);
      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Signed in successfully.');
        navigate('/admin');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-ambient-bg min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-transparent text-[#F0FDF9]">
      <div className="w-full max-w-md rounded-xl bg-[#061419]/85 backdrop-blur-xl border border-[#00F5B8]/20 shadow-[0_8px_32px_rgba(0,0,0,0.65)] hover:border-[#00F5B8]/35 transition-all duration-300 p-6 sm:p-8 space-y-6 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#00F5B8]/40 before:to-transparent">
        <div className="text-center space-y-3">
          <LogoPlaceholder size="md" variant="stacked" showBadge={true} className="mx-auto" />
          <h2 className="text-xl font-bold text-[#F0FDF9] font-heading tracking-tight pt-1">
            Staff &amp; desk login
          </h2>
          <p className="text-xs text-[#9FB9C1]">
            Sign in with your authorized hostel staff or volunteer credentials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#F0FDF9] mb-1">
              Staff email address
            </label>
            <div className="relative group">
              <Mail className="w-4 h-4 text-[#5A7E88] group-focus-within:text-[#00F5B8] transition-colors duration-200 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="warden@hostel.in"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 backdrop-blur-md text-[#F0FDF9] placeholder:text-[#5A7E88] hover:border-[#00F5B8]/40 hover:bg-[#071720] focus:outline-none focus:ring-2 focus:ring-[#00F5B8]/30 focus:border-[#00F5B8] focus:shadow-[0_0_16px_rgba(0,245,184,0.2)] text-sm transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#F0FDF9] mb-1">
              Password
            </label>
            <div className="relative group">
              <Key className="w-4 h-4 text-[#5A7E88] group-focus-within:text-[#00F5B8] transition-colors duration-200 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 backdrop-blur-md text-[#F0FDF9] placeholder:text-[#5A7E88] hover:border-[#00F5B8]/40 hover:bg-[#071720] focus:outline-none focus:ring-2 focus:ring-[#00F5B8]/30 focus:border-[#00F5B8] focus:shadow-[0_0_16px_rgba(0,245,184,0.2)] text-sm transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 rounded-xl shadow-[0_0_20px_rgba(0,245,184,0.3)] hover:shadow-[0_0_32px_rgba(0,245,184,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 group"
          >
            <Lock className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            <span>{isSubmitting ? 'Signing in...' : 'Sign in to Terminal'}</span>
          </button>
        </form>

        <div className="pt-3 border-t border-[#00F5B8]/15 text-center space-y-1.5 text-xs text-[#9FB9C1]">
          <div>Accounts are managed by the hostel administration.</div>
          <div className="text-[11px] text-[#5A7E88]">
            Need desk credentials? Contact: <a href="tel:+919980745913" className="text-[#00F5B8] hover:underline">+91 99807 45913</a> · <a href="mailto:pavan.b.m1598@gmail.com" className="text-[#00F5B8] hover:underline">pavan.b.m1598@gmail.com</a>
          </div>
        </div>
      </div>
    </div>
  );
};
