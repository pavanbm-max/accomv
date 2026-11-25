import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { LogoPlaceholder } from '../components/LogoPlaceholder';
import { TiltCard } from '../components/TiltCard';
import { formatINR, formatDate, formatDateTime } from '../lib/formatters';
import { getPreRegistration } from '../lib/api';
import { useToast } from '../context/ToastContext';
import type { PreRegistration } from '../types';
import { Skeleton } from '../components/Skeleton';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Phone, 
  Mail, 
  Building, 
  Calendar, 
  BedDouble, 
  Utensils, 
  Users, 
  ArrowLeft, 
  ShieldAlert, 
  Printer, 
  GraduationCap, 
  BookOpen, 
  Trophy 
} from 'lucide-react';

export const ConfirmationPage: React.FC = () => {
  const { referenceId } = useParams<{ referenceId: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [registration, setRegistration] = useState<PreRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!referenceId) return;
      try {
        const data = await getPreRegistration(referenceId);
        setRegistration(data);

        // Confetti celebration
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00F5B8', '#38BDF8', '#F59E0B', '#F0FDF9'],
          });
        } catch {}
      } catch (err: any) {
        console.error('Failed to load confirmation details:', err);
        toastError(err.message || 'Unable to retrieve pre-registration details.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [referenceId, toastError]);

  const copyRefId = () => {
    if (!registration) return;
    navigator.clipboard.writeText(registration.reference_id);
    setCopied(true);
    toastSuccess('Reference ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Skeleton className="h-16 w-full rounded-xl bg-[#061419]" />
          <Skeleton className="h-64 w-full rounded-xl bg-[#061419]" />
        </div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#F87171]">Pre-Registration Record Not Found</h2>
        <p className="text-xs text-[#9FB9C1]">
          We could not locate reference ID "{referenceId}".
        </p>
        <Link
          to="/"
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    );
  }

  const meals = registration.meal_requirements;
  const stayDays = registration.accommodation_days || 0;
  const stayParticipants = registration.accommodation_participants || 1;

  return (
    <div className="page-ambient-bg relative min-h-[calc(100vh-4rem)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-[#F0FDF9]">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Navigation & Actions Top Bar */}
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#9FB9C1] hover:text-[#00F5B8] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#061419] border border-[#00F5B8]/20 text-[#00F5B8] text-xs font-semibold hover:border-[#00F5B8]/50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Confirmation</span>
          </button>
        </div>

        {/* Confirmation Card */}
        <TiltCard className="p-6 sm:p-10 space-y-8 relative overflow-hidden">
          
          {/* Success Banner */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#00F5B8]/15 border border-[#00F5B8]/30 flex items-center justify-center mx-auto shadow-[0_0_24px_rgba(0,245,184,0.3)]">
              <CheckCircle2 className="w-9 h-9 text-[#00F5B8]" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00F5B8] bg-[#00F5B8]/10 px-2.5 py-1 rounded border border-[#00F5B8]/25">
                Pre-Registration Successful
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#F0FDF9] mt-2">
                Thank You for Pre-Registering!
              </h1>
              <p className="text-xs sm:text-sm text-[#9FB9C1] max-w-lg mx-auto mt-1 leading-relaxed">
                Thank you for your pre-registration! Your details have been successfully recorded. The coordinator will contact you regarding accommodation confirmation and payment collection.
              </p>
            </div>

            {/* Reference ID Showcase */}
            <div className="p-4 rounded-xl bg-[#040E12]/90 border border-[#00F5B8]/30 max-w-md mx-auto space-y-1">
              <div className="text-xs text-[#9FB9C1] uppercase tracking-wider font-semibold">
                Your Pre-Registration Reference ID
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-xl sm:text-2xl font-bold text-[#00F5B8] tracking-wider select-all">
                  {registration.reference_id}
                </span>
                <button
                  type="button"
                  onClick={copyRefId}
                  title="Copy reference ID"
                  className="p-1.5 rounded-md hover:bg-[#00F5B8]/15 text-[#9FB9C1] hover:text-[#00F5B8] transition-colors print:hidden"
                >
                  {copied ? <Check className="w-4 h-4 text-[#00F5B8]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-[11px] text-[#5A7E88]">
                Please note or quote this Reference ID when speaking with the hostel coordinator.
              </div>
            </div>
          </div>

          {/* Section: Participant Details */}
          <div className="pt-6 border-t border-[#00F5B8]/15 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#00F5B8]">
              Participant Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-[#040E12]/60 border border-[#00F5B8]/15 space-y-1">
                <span className="text-[#9FB9C1]">Full Name</span>
                <div className="text-sm font-semibold text-[#F0FDF9]">{registration.full_name}</div>
              </div>

              <div className="p-3 rounded-lg bg-[#040E12]/60 border border-[#00F5B8]/15 space-y-1">
                <span className="text-[#9FB9C1]">Mobile Number</span>
                <div className="text-sm font-mono font-semibold text-[#F0FDF9]">+91 {registration.mobile}</div>
              </div>

              <div className="p-3 rounded-lg bg-[#040E12]/60 border border-[#00F5B8]/15 space-y-1">
                <span className="text-[#9FB9C1]">Email Address</span>
                <div className="text-sm font-semibold text-[#F0FDF9] truncate">{registration.email}</div>
              </div>

              <div className="p-3 rounded-lg bg-[#040E12]/60 border border-[#00F5B8]/15 space-y-1">
                <span className="text-[#9FB9C1]">Gender &amp; Block</span>
                <div className="text-sm font-semibold text-[#F0FDF9]">
                  {registration.gender || 'Male'} ({registration.gender === 'Female' ? 'Girls Hostel' : 'Boys Hostel'})
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#040E12]/60 border border-[#00F5B8]/15 space-y-1 sm:col-span-2">
                <span className="text-[#9FB9C1]">College / Institution</span>
                <div className="text-sm font-semibold text-[#F0FDF9]">{registration.college}</div>
              </div>

              {registration.department && (
                <div className="p-3 rounded-lg bg-[#040E12]/60 border border-[#00F5B8]/15 space-y-1">
                  <span className="text-[#9FB9C1]">Department</span>
                  <div className="text-sm font-semibold text-[#F0FDF9]">{registration.department}</div>
                </div>
              )}

              {registration.academic_year && (
                <div className="p-3 rounded-lg bg-[#040E12]/60 border border-[#00F5B8]/15 space-y-1">
                  <span className="text-[#9FB9C1]">Academic Year / Semester</span>
                  <div className="text-sm font-semibold text-[#F0FDF9]">{registration.academic_year}</div>
                </div>
              )}

              {registration.event_category && (
                <div className="p-3 rounded-lg bg-[#040E12]/60 border border-[#00F5B8]/15 space-y-1">
                  <span className="text-[#9FB9C1]">Event Category</span>
                  <div className="text-sm font-semibold text-[#00F5B8]">{registration.event_category}</div>
                </div>
              )}

              {registration.emergency_contact && (
                <div className="p-3 rounded-lg bg-[#040E12]/60 border border-[#00F5B8]/15 space-y-1">
                  <span className="text-[#9FB9C1]">Emergency Contact</span>
                  <div className="text-sm font-semibold text-[#F0FDF9]">{registration.emergency_contact}</div>
                </div>
              )}
            </div>

            {/* Team details if applicable */}
            {registration.is_team && registration.team_members && registration.team_members.length > 0 && (
              <div className="pt-4 space-y-3">
                <div className="text-xs font-semibold text-[#9FB9C1]">
                  Teammates ({registration.team_members.length})
                </div>
                <div className="divide-y divide-[#00F5B8]/15 rounded-lg border border-[#00F5B8]/15 bg-[#040E12]/60 p-3 space-y-2">
                  {registration.team_members.map((tm, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-[#F0FDF9]">{idx + 2}. {tm.fullName}</span>
                        <span className="text-[11px] text-[#5A7E88] ml-2">({tm.gender || 'Male'})</span>
                      </div>
                      <div className="font-mono text-[#9FB9C1]">+91 {tm.mobile}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section: Accommodation & Meal Details */}
          <div className="pt-6 border-t border-[#00F5B8]/15 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#00F5B8]">
              Accommodation &amp; Meal Requirements
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-[#040E12]/60 border border-[#00F5B8]/15 space-y-1">
                <div className="flex items-center gap-1.5 text-[#9FB9C1]">
                  <BedDouble className="w-3.5 h-3.5 text-[#00F5B8]" />
                  <span>Accommodation Requirement</span>
                </div>
                <div className="text-sm font-semibold text-[#F0FDF9]">
                  {registration.accommodation_required ? (
                    <span className="text-[#00F5B8]">Required ({stayParticipants} participants, {stayDays} days)</span>
                  ) : (
                    <span className="text-[#9FB9C1]">Not Required</span>
                  )}
                </div>
                {registration.accommodation_required && registration.check_in_date && registration.check_out_date && (
                  <div className="text-[11px] text-[#5A7E88]">
                    Stay: {formatDate(registration.check_in_date)} to {formatDate(registration.check_out_date)}
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-[#040E12]/60 border border-[#00F5B8]/15 space-y-1">
                <div className="flex items-center gap-1.5 text-[#9FB9C1]">
                  <Utensils className="w-3.5 h-3.5 text-[#00F5B8]" />
                  <span>Meal Demand</span>
                </div>
                <div className="text-xs space-y-1 text-[#F0FDF9]">
                  <div>Breakfast: <strong className="font-mono text-[#00F5B8]">{meals?.breakfast_quantity || 0} meals</strong></div>
                  <div>Lunch: <strong className="font-mono text-[#00F5B8]">{meals?.lunch_quantity || 0} meals</strong></div>
                  <div>Dinner: <strong className="font-mono text-[#00F5B8]">{meals?.dinner_quantity || 0} meals</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Estimated Breakdown Box */}
          <div className="pt-6 border-t border-[#00F5B8]/15 space-y-4">
            <h3 className="text-base font-bold text-[#F0FDF9] font-heading">
              Estimated Accommodation &amp; Meal Charges
            </h3>

            <div className="rounded-xl bg-[#040E12]/90 border border-[#00F5B8]/20 p-4 sm:p-5 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-[#9FB9C1]">
                <span>Accommodation charges:</span>
                <span className="font-mono font-bold text-[#F0FDF9]">
                  {formatINR(registration.accommodation_estimated_amount)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[#9FB9C1]">
                <span>Breakfast charges ({meals?.breakfast_quantity || 0} meals × ₹50):</span>
                <span className="font-mono font-bold text-[#F0FDF9]">
                  {formatINR(meals?.breakfast_amount || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[#9FB9C1]">
                <span>Lunch charges ({meals?.lunch_quantity || 0} meals × ₹60):</span>
                <span className="font-mono font-bold text-[#F0FDF9]">
                  {formatINR(meals?.lunch_amount || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[#9FB9C1]">
                <span>Dinner charges ({meals?.dinner_quantity || 0} meals × ₹60):</span>
                <span className="font-mono font-bold text-[#F0FDF9]">
                  {formatINR(meals?.dinner_amount || 0)}
                </span>
              </div>

              <div className="pt-3 border-t border-[#00F5B8]/20 flex justify-between items-center">
                <span className="font-bold text-sm sm:text-base text-[#F0FDF9]">
                  Total Estimated Amount:
                </span>
                <span className="font-mono font-bold text-lg sm:text-2xl text-[#00F5B8]">
                  {formatINR(registration.total_estimated_amount)}
                </span>
              </div>
            </div>

            {/* MANDATORY HIGHLIGHTED NOTICE (Section 5) */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#061419]/90 border border-[#00F5B8]/35 space-y-2">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-[#00F5B8] flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-[#F0FDF9] leading-relaxed">
                  <p className="mb-2 font-medium">
                    Your pre-registration has been submitted successfully. The above amount is an estimated calculation based on your accommodation and meal requirements.
                  </p>
                  <p className="mb-2 text-[#5EE5BC] font-medium">
                    No online payment is required at this stage. The respective coordinator will contact you regarding payment collection and further arrangements.
                  </p>
                  <p className="text-[#F87171] font-bold">
                    Please do not make any payment through this website.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-[#00F5B8]/15 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <Link
              to="/"
              className="btn-primary w-full sm:w-auto px-6 py-3 text-xs font-bold rounded-lg inline-flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(0,245,184,0.3)]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Homepage</span>
            </Link>

            <span className="text-[11px] text-[#5A7E88]">
              Recorded at: {formatDateTime(registration.created_at)}
            </span>
          </div>
        </TiltCard>
      </div>
    </div>
  );
};
