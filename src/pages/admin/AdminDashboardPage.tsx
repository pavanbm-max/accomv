import React, { useState, useEffect } from 'react';
import { CountUp } from '../../components/CountUp';
import { FollowupStatusBadge } from '../../components/FollowupStatusBadge';
import { LogoPlaceholder } from '../../components/LogoPlaceholder';
import { formatINR, formatDate } from '../../lib/formatters';
import { getDashboardStats, getPreRegistrations } from '../../lib/api';
import type { PreRegistrationStats, PreRegistration } from '../../types';
import { Skeleton } from '../../components/Skeleton';
import { 
  Users, 
  BedDouble, 
  Calendar, 
  IndianRupee, 
  Utensils, 
  RefreshCw, 
  ArrowRight,
  Clock,
  PhoneCall,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Coffee
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<PreRegistrationStats | null>(null);
  const [recentRegistrations, setRecentRegistrations] = useState<PreRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, regs] = await Promise.all([
        getDashboardStats(),
        getPreRegistrations(),
      ]);
      setStats(s);
      setRecentRegistrations(regs.slice(0, 8));
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#F7FAFC]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00F5B8]/15">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <LogoPlaceholder size="sm" showBadge={false} />
          <div className="h-8 w-px bg-white/15 hidden sm:block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F0FDF9] font-heading">
              Pre-Registration Operations Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#9FB9C1] mt-1">
              Hostel accommodation demand, meal planning metrics, and coordinator follow-up tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/registrations"
            className="btn-primary inline-flex items-center gap-1.5 py-2 px-3.5 text-xs font-semibold rounded-md"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage All Pre-Registrations</span>
          </Link>
          <button
            onClick={loadData}
            title="Refresh metrics"
            className="p-2 text-[#94A3B8] hover:text-[#00F5B8] rounded-md hover:bg-[#061419] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CORE METRIC STATS CARDS (Section 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pre-Registrations */}
        <div className="p-5 rounded-xl bg-[#061419]/80 backdrop-blur-xl border border-[#00F5B8]/20 shadow-[0_8px_32px_rgba(0,0,0,0.65)] hover:-translate-y-0.5 hover:border-[#00F5B8]/40 transition-all duration-200 cursor-default relative overflow-hidden">
          <div className="flex items-center justify-between text-[#9FB9C1] text-xs font-medium">
            <span>Total Pre-Registrations</span>
            <div className="w-8 h-8 rounded-lg bg-[#00F5B8]/15 text-[#00F5B8] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-[#F0FDF9] font-heading tracking-tight">
            {loading || !stats ? (
              <Skeleton className="h-8 w-20 bg-[#0B1E26]" />
            ) : (
              <CountUp value={stats.total_registrations} />
            )}
          </div>
          <div className="mt-2 text-[11px] text-[#9FB9C1]">
            Total participant records collected
          </div>
        </div>

        {/* Total Accommodation Participants */}
        <div className="p-5 rounded-xl bg-[#061419]/80 backdrop-blur-xl border border-[#00F5B8]/20 shadow-[0_8px_32px_rgba(0,0,0,0.65)] hover:-translate-y-0.5 hover:border-[#00F5B8]/40 transition-all duration-200 cursor-default relative overflow-hidden">
          <div className="flex items-center justify-between text-[#9FB9C1] text-xs font-medium">
            <span>Accommodation Participants</span>
            <div className="w-8 h-8 rounded-lg bg-[#00F5B8]/15 text-[#00F5B8] flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-[#00F5B8] font-heading tracking-tight">
            {loading || !stats ? (
              <Skeleton className="h-8 w-20 bg-[#0B1E26]" />
            ) : (
              <CountUp value={stats.total_accommodation_participants} />
            )}
          </div>
          <div className="mt-2 text-[11px] text-[#00F5B8]">
            Guests requesting hostel beds
          </div>
        </div>

        {/* Total Requested Accommodation Days */}
        <div className="p-5 rounded-xl bg-[#061419]/80 backdrop-blur-xl border border-[#00F5B8]/20 shadow-[0_8px_32px_rgba(0,0,0,0.65)] hover:-translate-y-0.5 hover:border-[#00F5B8]/40 transition-all duration-200 cursor-default relative overflow-hidden">
          <div className="flex items-center justify-between text-[#9FB9C1] text-xs font-medium">
            <span>Requested Stay Days</span>
            <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-[#38BDF8] font-heading tracking-tight">
            {loading || !stats ? (
              <Skeleton className="h-8 w-20 bg-[#0B1E26]" />
            ) : (
              <CountUp value={stats.total_requested_accommodation_days} />
            )}
          </div>
          <div className="mt-2 text-[11px] text-[#38BDF8]">
            Cumulative person-days of stay
          </div>
        </div>

        {/* Estimated Total Charges */}
        <div className="p-5 rounded-xl bg-[#061419]/80 backdrop-blur-xl border border-[#00F5B8]/20 shadow-[0_8px_32px_rgba(0,0,0,0.65)] hover:-translate-y-0.5 hover:border-[#00F5B8]/40 transition-all duration-200 cursor-default relative overflow-hidden">
          <div className="flex items-center justify-between text-[#9FB9C1] text-xs font-medium">
            <span>Estimated Total Charges</span>
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-[#F59E0B] font-heading tracking-tight">
            {loading || !stats ? (
              <Skeleton className="h-8 w-28 bg-[#0B1E26]" />
            ) : (
              <CountUp value={stats.total_estimated_charges} isCurrency />
            )}
          </div>
          <div className="mt-2 text-[11px] text-[#9FB9C1]">
            Estimated accommodation &amp; meal value
          </div>
        </div>
      </div>

      {/* MEAL DEMAND & CHARGES BREAKDOWN ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Meal Demand Summary */}
        <div className="p-5 rounded-xl bg-[#061419]/80 border border-[#00F5B8]/20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#00F5B8]/15">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-[#00F5B8]" />
              <h3 className="text-sm font-bold text-[#F0FDF9] uppercase tracking-wider">
                Meal Demand Breakdown
              </h3>
            </div>
            <span className="text-xs text-[#9FB9C1]">Kitchen procurement counts</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-[#040E12] border border-[#00F5B8]/15 text-center">
              <div className="text-[11px] font-semibold text-[#9FB9C1] uppercase">Breakfast</div>
              <div className="text-xl sm:text-2xl font-bold text-[#00F5B8] mt-1 font-mono">
                {loading || !stats ? <Skeleton className="h-6 w-12 mx-auto bg-[#0B1E26]" /> : stats.breakfast_demand}
              </div>
              <div className="text-[10px] text-[#5A7E88] mt-0.5">@ ₹50 / meal</div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#040E12] border border-[#00F5B8]/15 text-center">
              <div className="text-[11px] font-semibold text-[#9FB9C1] uppercase">Lunch</div>
              <div className="text-xl sm:text-2xl font-bold text-[#00F5B8] mt-1 font-mono">
                {loading || !stats ? <Skeleton className="h-6 w-12 mx-auto bg-[#0B1E26]" /> : stats.lunch_demand}
              </div>
              <div className="text-[10px] text-[#5A7E88] mt-0.5">@ ₹60 / meal</div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#040E12] border border-[#00F5B8]/15 text-center">
              <div className="text-[11px] font-semibold text-[#9FB9C1] uppercase">Dinner</div>
              <div className="text-xl sm:text-2xl font-bold text-[#00F5B8] mt-1 font-mono">
                {loading || !stats ? <Skeleton className="h-6 w-12 mx-auto bg-[#0B1E26]" /> : stats.dinner_demand}
              </div>
              <div className="text-[10px] text-[#5A7E88] mt-0.5">@ ₹60 / meal</div>
            </div>
          </div>
        </div>

        {/* Estimated Revenue Breakdown */}
        <div className="p-5 rounded-xl bg-[#061419]/80 border border-[#00F5B8]/20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#00F5B8]/15">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-[#00F5B8]" />
              <h3 className="text-sm font-bold text-[#F0FDF9] uppercase tracking-wider">
                Estimated Charges Classification
              </h3>
            </div>
            <span className="text-xs text-[#9FB9C1]">Tariff breakdown</span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#040E12] border border-[#00F5B8]/15">
              <span className="text-[#9FB9C1]">Estimated Accommodation Charges:</span>
              <span className="font-mono font-bold text-[#00F5B8]">
                {loading || !stats ? <Skeleton className="h-4 w-20 bg-[#0B1E26]" /> : formatINR(stats.estimated_accommodation_charges)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#040E12] border border-[#00F5B8]/15">
              <span className="text-[#9FB9C1]">Estimated Meal Charges:</span>
              <span className="font-mono font-bold text-[#00F5B8]">
                {loading || !stats ? <Skeleton className="h-4 w-20 bg-[#0B1E26]" /> : formatINR(stats.estimated_meal_charges)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#040E12] border border-[#00F5B8]/25">
              <span className="font-bold text-[#F0FDF9]">Total Estimated Pipeline:</span>
              <span className="font-mono font-bold text-[#F59E0B]">
                {loading || !stats ? <Skeleton className="h-4 w-24 bg-[#0B1E26]" /> : formatINR(stats.total_estimated_charges)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* COORDINATOR FOLLOW-UP STATUS PIPELINE */}
      <div className="p-5 rounded-xl bg-[#061419]/80 border border-[#00F5B8]/20 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#00F5B8]/15">
          <div>
            <h3 className="text-sm font-bold text-[#F0FDF9] uppercase tracking-wider">
              Coordinator Follow-up Status
            </h3>
            <p className="text-xs text-[#9FB9C1]">
              Administrative progress of student coordinator follow-ups
            </p>
          </div>
          <span className="text-[11px] text-[#5A7E88]">
            * Administrative statuses, not verified payment statuses
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Contact</span>
            </div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-2">
              {stats?.followup_counts?.pending_contact || 0}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/30 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-400">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Contacted</span>
            </div>
            <div className="text-xl font-bold text-sky-400 font-mono mt-2">
              {stats?.followup_counts?.contacted || 0}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Awaiting Payment</span>
            </div>
            <div className="text-xl font-bold text-purple-400 font-mono mt-2">
              {stats?.followup_counts?.awaiting_payment || 0}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#00F5B8]/10 border border-[#00F5B8]/30 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#00F5B8]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirmed</span>
            </div>
            <div className="text-xl font-bold text-[#00F5B8] font-mono mt-2">
              {stats?.followup_counts?.confirmed || 0}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center col-span-2 sm:col-span-1">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-400">
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelled</span>
            </div>
            <div className="text-xl font-bold text-red-400 font-mono mt-2">
              {stats?.followup_counts?.cancelled || 0}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT PRE-REGISTRATIONS TABLE */}
      <div className="rounded-xl bg-[#061419]/80 backdrop-blur-xl border border-[#00F5B8]/20 shadow-[0_8px_32px_rgba(0,0,0,0.65)] overflow-hidden p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#00F5B8]/15">
          <div>
            <h3 className="text-base font-bold text-[#F0FDF9] font-heading tracking-tight">
              Recent Pre-Registrations
            </h3>
            <p className="text-xs text-[#9FB9C1]">Latest participant submissions.</p>
          </div>
          <Link
            to="/admin/registrations"
            className="text-xs font-semibold text-[#00F5B8] hover:underline flex items-center gap-1 group"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-medium uppercase text-[#9FB9C1] border-b border-[#00F5B8]/15 pb-2">
                <th className="py-2.5 px-3">Reference ID</th>
                <th className="py-2.5 px-3">Participant</th>
                <th className="py-2.5 px-3">College / Dept</th>
                <th className="py-2.5 px-3">Accommodation</th>
                <th className="py-2.5 px-3">Meals</th>
                <th className="py-2.5 px-3">Est. Total</th>
                <th className="py-2.5 px-3">Follow-up Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#00F5B8]/10 text-xs">
              {recentRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#9FB9C1]">
                    No pre-registrations recorded yet.
                  </td>
                </tr>
              ) : (
                recentRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-[#00F5B8]/[0.05] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#00F5B8]">
                      {reg.reference_id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#F0FDF9]">{reg.full_name}</div>
                      <div className="text-[11px] font-mono text-[#9FB9C1]">+91 {reg.mobile}</div>
                    </td>
                    <td className="py-3 px-3 text-[#9FB9C1]">
                      <div className="truncate max-w-[180px] text-[#F0FDF9]">{reg.college}</div>
                      <div className="text-[11px] text-[#5A7E88]">{reg.department || '—'}</div>
                    </td>
                    <td className="py-3 px-3 text-[#9FB9C1]">
                      {reg.accommodation_required ? (
                        <span className="text-[#00F5B8]">
                          {reg.accommodation_participants || 1}p × {reg.accommodation_days || 0}d
                        </span>
                      ) : (
                        <span className="text-[#5A7E88]">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#9FB9C1]">
                      <span className="font-mono">
                        B:{reg.meal_requirements?.breakfast_quantity || 0} L:{reg.meal_requirements?.lunch_quantity || 0} D:{reg.meal_requirements?.dinner_quantity || 0}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#F0FDF9]">
                      {formatINR(reg.total_estimated_amount)}
                    </td>
                    <td className="py-3 px-3">
                      <FollowupStatusBadge status={reg.admin_followup?.followup_status} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
