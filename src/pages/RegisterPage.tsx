import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { OrderSummary } from '../components/OrderSummary';
import { TiltCard } from '../components/TiltCard';
import { Modal } from '../components/Modal';
import { calculateNights } from '../lib/formatters';
import { 
  getPublishedAnnouncements, 
  createPreRegistration, 
  checkDuplicateRegistration 
} from '../lib/api';
import { useToast } from '../context/ToastContext';
import type { Announcement, TeamMember } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  User, 
  Users,
  UserPlus,
  Trash2,
  Building, 
  ShieldAlert, 
  ArrowRight, 
  Megaphone,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  HelpCircle,
  ShieldCheck,
  Utensils,
  Info,
  BookOpen,
  GraduationCap,
  Trophy,
  BedDouble
} from 'lucide-react';

const EVENT_CATEGORIES = [
  'Technical Paper Presentation',
  'Coding & Hackathon',
  'Robotics & Automation',
  'Web & App Development',
  'Circuit Design & Hardware',
  'Gaming & Esports',
  'Cultural & Literary Events',
  'General Fest Attendee / Workshop',
  'Other Competition',
];

const ACADEMIC_YEARS = [
  '1st Year / 1st-2nd Sem',
  '2nd Year / 3rd-4th Sem',
  '3rd Year / 5th-6th Sem',
  '4th Year / 7th-8th Sem',
  'Postgraduate (M.Tech / MBA / MCA)',
  'Research Scholar / PhD',
  'Faculty / Mentor',
];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError, success: toastSuccess } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Stay dates default
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

  // Booking Type: individual vs team
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [teamName, setTeamName] = useState('');

  // Primary Participant State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[2]);
  const [eventCategory, setEventCategory] = useState(EVENT_CATEGORIES[0]);
  const [emergencyContact, setEmergencyContact] = useState('');

  // Teammates State
  const [teammates, setTeammates] = useState<TeamMember[]>([]);

  // Accommodation State
  const [accommodationRequired, setAccommodationRequired] = useState(true);
  const [checkInDate, setCheckInDate] = useState(tomorrow);
  const [checkOutDate, setCheckOutDate] = useState(dayAfter);
  const [accommodationDaysManual, setAccommodationDaysManual] = useState<number>(1);
  const [accommodationParticipantsCount, setAccommodationParticipantsCount] = useState<number>(1);

  // Meal Requirements State
  const [breakfastRequired, setBreakfastRequired] = useState(false);
  const [breakfastDays, setBreakfastDays] = useState(1);
  const [lunchRequired, setLunchRequired] = useState(false);
  const [lunchDays, setLunchDays] = useState(1);
  const [dinnerRequired, setDinnerRequired] = useState(false);
  const [dinnerDays, setDinnerDays] = useState(1);

  // Submission & Duplicate states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateError, setDuplicateError] = useState<{ referenceId: string; name: string } | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Calculate nights from dates
  const calculatedNights = calculateNights(checkInDate, checkOutDate);
  const effectiveStayDays = calculatedNights > 0 ? calculatedNights : accommodationDaysManual;

  const totalMembersCount = isTeamMode ? 1 + teammates.length : 1;
  const effectiveParticipants = isTeamMode ? accommodationParticipantsCount : (accommodationRequired ? 1 : 0);

  // Sync participant count when teammates change
  useEffect(() => {
    if (isTeamMode) {
      setAccommodationParticipantsCount(1 + teammates.length);
    } else {
      setAccommodationParticipantsCount(accommodationRequired ? 1 : 0);
    }
  }, [isTeamMode, teammates.length, accommodationRequired]);

  // Sync meal days with stay days default
  useEffect(() => {
    if (effectiveStayDays > 0) {
      if (!breakfastDays || breakfastDays <= 0) setBreakfastDays(effectiveStayDays);
      if (!lunchDays || lunchDays <= 0) setLunchDays(effectiveStayDays);
      if (!dinnerDays || dinnerDays <= 0) setDinnerDays(effectiveStayDays);
    }
  }, [effectiveStayDays]);

  // Load announcements
  useEffect(() => {
    async function loadData() {
      try {
        const a = await getPublishedAnnouncements();
        setAnnouncements(a);
      } catch (e) {
        console.error('Failed to load announcements:', e);
      }
    }
    loadData();
  }, []);

  const addTeammate = () => {
    setTeammates((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        fullName: '',
        mobile: '',
        email: '',
        gender: 'Male',
        department: department || '',
        academicYear: academicYear || ACADEMIC_YEARS[2],
        emergencyContact: '',
      },
    ]);
  };

  const updateTeammate = (index: number, field: keyof TeamMember, value: string) => {
    setTeammates((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeTeammate = (index: number) => {
    setTeammates((prev) => prev.filter((_, i) => i !== index));
  };

  // Check duplicate on phone blur
  const handlePhoneBlur = async (val: string) => {
    if (!val || val.replace(/\D/g, '').length < 10) return;
    try {
      const dup = await checkDuplicateRegistration(val, email);
      if (dup.isDuplicate && dup.existingReferenceId) {
        setDuplicateError({
          referenceId: dup.existingReferenceId,
          name: dup.existingName || 'Participant',
        });
        setShowDuplicateModal(true);
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateError(null);

    // Validation
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toastError('Please enter a valid 10-digit mobile number for the primary participant.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toastError('Please enter a valid email address.');
      return;
    }

    if (!department.trim()) {
      toastError('Please enter your academic department.');
      return;
    }

    if (accommodationRequired) {
      if (effectiveStayDays <= 0) {
        toastError('Check-out date must be after check-in date (minimum 1 day).');
        return;
      }
      if (effectiveParticipants <= 0) {
        toastError('Please enter at least 1 participant requiring accommodation.');
        return;
      }
    }

    if (isTeamMode) {
      for (let i = 0; i < teammates.length; i++) {
        const tm = teammates[i];
        if (!tm.fullName.trim()) {
          toastError(`Please enter full name for Teammate #${i + 2}.`);
          return;
        }
        const tmPhoneClean = tm.mobile.replace(/\D/g, '');
        if (tmPhoneClean.length < 10) {
          toastError(`Please enter a valid 10-digit mobile number for Teammate #${i + 2}.`);
          return;
        }
        if (!tm.email.trim() || !tm.email.includes('@')) {
          toastError(`Please enter a valid email address for Teammate #${i + 2}.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const res = await createPreRegistration({
        fullName: fullName.trim(),
        mobile: cleanPhone,
        email: email.trim().toLowerCase(),
        gender,
        college: college.trim(),
        department: department.trim(),
        academicYear,
        eventCategory,
        emergencyContact: emergencyContact.trim(),
        accommodationRequired,
        accommodationDays: accommodationRequired ? effectiveStayDays : 0,
        accommodationParticipants: accommodationRequired ? effectiveParticipants : 0,
        checkInDate: accommodationRequired ? checkInDate : undefined,
        checkOutDate: accommodationRequired ? checkOutDate : undefined,
        isTeam: isTeamMode,
        teamName: isTeamMode ? teamName.trim() : undefined,
        teamMembers: isTeamMode ? teammates : undefined,
        meals: {
          breakfast: breakfastRequired,
          breakfastDays: breakfastRequired ? breakfastDays : 0,
          lunch: lunchRequired,
          lunchDays: lunchRequired ? lunchDays : 0,
          dinner: dinnerRequired,
          dinnerDays: dinnerRequired ? dinnerDays : 0,
        },
      });

      toastSuccess('Pre-registration submitted successfully!');
      navigate(`/confirmation/${res.referenceId}`);
    } catch (err: any) {
      console.error('Submission error:', err);
      if (err.message && err.message.includes('already exists')) {
        const refMatch = err.message.match(/PRE-[0-9-]+/);
        setDuplicateError({
          referenceId: refMatch ? refMatch[0] : 'Reference Exists',
          name: fullName,
        });
        setShowDuplicateModal(true);
      } else {
        toastError(err.message || 'Failed to submit pre-registration.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-ambient-bg relative min-h-[calc(100vh-4rem)] py-8 sm:py-14 px-4 sm:px-6 lg:px-8 bg-transparent text-[#F0FDF9]">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Published Announcements Banner */}
        {announcements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-4 rounded-lg bg-[#061419]/90 border border-[#00F5B8]/20 shadow-[0_4px_20px_rgba(0,0,0,0.35)] flex items-start gap-3.5"
          >
            <Megaphone className="w-5 h-5 text-[#00F5B8] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#F7FAFC]">
              <span className="font-semibold block sm:inline mr-2 text-[#00F5B8]">
                {announcements[0].title}:
              </span>
              <span className="text-[#94A3B8]">{announcements[0].body}</span>
            </div>
          </motion.div>
        )}

        {/* Editorial Hero Header with Official Crest */}
        <div className="text-center space-y-5">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-r from-[#00F5B8]/20 via-[#38BDF8]/20 to-[#00F5B8]/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
              <div className="relative flex items-center gap-4 sm:gap-6 px-5 sm:px-8 py-3 sm:py-4 rounded-2xl bg-[#061419]/90 backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.65)]">
                {/* GM University Authentic Gold Crest */}
                <img 
                  src="/gmu-logo.png" 
                  alt="GM University" 
                  className="h-12 sm:h-16 w-auto object-contain drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)] transition-transform duration-200 group-hover:scale-105" 
                  loading="eager"
                />
                
                {/* Refined Divider */}
                <div className="h-10 sm:h-12 w-px bg-white/20" />
                
                {/* IGNITRON 2K26 Authentic Wordmark */}
                <div className="flex flex-col text-left">
                  <img 
                    src="/ignitron-2k26-logo.png" 
                    alt="IGNITRON 2K26" 
                    className="h-8 sm:h-11 w-auto object-contain drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)] transition-transform duration-200 group-hover:scale-105" 
                    loading="eager"
                  />
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="tracking-wider uppercase font-semibold text-[#9FB9C1] text-[10px] sm:text-xs">
                      Pre-Registration Portal
                    </span>
                    <span className="font-mono font-bold tracking-wider uppercase bg-[#00F5B8]/15 text-[#00F5B8] px-2 py-0.5 rounded border border-[#00F5B8]/30 text-[9px] sm:text-[10px] shadow-[0_0_8px_rgba(0,245,184,0.2)]">
                      DATA COLLECTION
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F7FAFC] font-heading leading-tight">
            Participant Pre-Registration
          </h1>
          <p className="text-xs sm:text-base text-[#94A3B8] max-w-xl mx-auto leading-relaxed px-2">
            Submit your participant details, accommodation, and meal requirements. No online payment is required; your coordinator will handle payment collection later.
          </p>
        </div>

        {/* REGISTRATION FORM CARD */}
        <TiltCard className="p-4 sm:p-8 md:p-10 relative overflow-hidden">
          {/* Subtle Watermarks */}
          <img 
            src="/gmu-logo.png" 
            alt="" 
            aria-hidden="true" 
            className="pointer-events-none select-none absolute -right-12 -top-12 w-64 sm:w-80 opacity-[0.04] object-contain" 
          />

          <form onSubmit={handleSubmit} className="relative z-10 space-y-7">
            
            {/* Booking Type: Individual vs Team */}
            <div className="space-y-2 pb-2">
              <label className="block text-xs font-semibold text-[#9FB9C1] uppercase tracking-wider">
                Registration Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 rounded-xl bg-[#040E12]/80 backdrop-blur-md border border-[#00F5B8]/20">
                <button
                  type="button"
                  onClick={() => {
                    setIsTeamMode(false);
                    setTeammates([]);
                  }}
                  className={`group flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                    !isTeamMode
                      ? 'bg-gradient-to-r from-[#00F5B8] to-[#00C49F] text-[#021713] shadow-[0_0_28px_rgba(0,245,184,0.4)] font-semibold'
                      : 'text-[#9FB9C1] hover:text-[#F0FDF9] hover:bg-[#071820]'
                  }`}
                >
                  <div className={`p-2 rounded-md ${!isTeamMode ? 'bg-[#021713]/15 text-[#021713]' : 'bg-[#0B1E26] text-[#00F5B8]'}`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">Individual Pre-Registration</div>
                    <div className={`text-[11px] ${!isTeamMode ? 'text-[#021713]/80' : 'text-[#5A7E88]'}`}>
                      Single participant entry
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsTeamMode(true);
                    if (teammates.length === 0) {
                      addTeammate();
                    }
                  }}
                  className={`group flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                    isTeamMode
                      ? 'bg-gradient-to-r from-[#00F5B8] to-[#00C49F] text-[#021713] shadow-[0_0_28px_rgba(0,245,184,0.4)] font-semibold'
                      : 'text-[#9FB9C1] hover:text-[#F0FDF9] hover:bg-[#071820]'
                  }`}
                >
                  <div className={`p-2 rounded-md ${isTeamMode ? 'bg-[#021713]/15 text-[#021713]' : 'bg-[#0B1E26] text-[#00F5B8]'}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">Team / Group Pre-Registration</div>
                    <div className={`text-[11px] ${isTeamMode ? 'text-[#021713]/80' : 'text-[#5A7E88]'}`}>
                      Team Leader + Teammates
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Team Name if Team Mode */}
            {isTeamMode && (
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#F0FDF9]">
                  Team Name (optional)
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. CyberKnights or Team Alpha"
                  className="w-full h-11 px-4 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 text-[#F0FDF9] placeholder:text-[#5A7E88] focus:border-[#00F5B8] focus:ring-2 focus:ring-[#00F5B8]/30 text-sm transition-all duration-200"
                />
              </div>
            )}

            {/* Section 1: Participant Details */}
            <div className="text-left border-b border-[#00F5B8]/15 pb-4">
              <h2 className="text-xl font-bold text-[#F0FDF9] font-heading tracking-tight flex items-center gap-2">
                <span>{isTeamMode ? 'Participant 1 (Team Leader Details)' : 'Participant Details'}</span>
              </h2>
              <p className="text-xs text-[#9FB9C1] mt-1">
                Enter your official identification and contact details for verification.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-[13px] font-medium text-[#F0FDF9]">
                  Full Name (as per Student / College ID) *
                </label>
                <div className="relative group">
                  <User className="w-4 h-4 text-[#5A7E88] group-focus-within:text-[#00F5B8] absolute left-3.5 top-3.5 pointer-events-none transition-colors" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aravind Swaminathan"
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 text-[#F0FDF9] placeholder:text-[#5A7E88] focus:border-[#00F5B8] focus:ring-2 focus:ring-[#00F5B8]/30 text-sm transition-all duration-200"
                  />
                </div>
              </div>

              {/* Mobile Phone */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#F0FDF9]">
                  Mobile Number (10 digits) *
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-semibold text-[#5A7E88] group-focus-within:text-[#00F5B8] select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onBlur={(e) => handlePhoneBlur(e.target.value)}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9840123456"
                    className="w-full h-11 pl-12 pr-4 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 text-[#F0FDF9] placeholder:text-[#5A7E88] focus:border-[#00F5B8] focus:ring-2 focus:ring-[#00F5B8]/30 text-sm transition-all duration-200"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#F0FDF9]">
                  Email Address * <span className="text-[11px] text-[#5A7E88] font-normal">(Records only; no emails sent)</span>
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-[#5A7E88] group-focus-within:text-[#00F5B8] absolute left-3.5 top-3.5 pointer-events-none transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.ac.in"
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 text-[#F0FDF9] placeholder:text-[#5A7E88] focus:border-[#00F5B8] focus:ring-2 focus:ring-[#00F5B8]/30 text-sm transition-all duration-200"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#F0FDF9]">
                  Gender (Hostel block allotment) *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 text-[#F0FDF9] focus:border-[#00F5B8] focus:ring-2 focus:ring-[#00F5B8]/30 text-sm transition-all duration-200"
                >
                  <option value="Male">Male (Boys Hostel)</option>
                  <option value="Female">Female (Girls Hostel)</option>
                </select>
              </div>

              {/* College / Institution */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#F0FDF9]">
                  College / Institution Name *
                </label>
                <div className="relative group">
                  <Building className="w-4 h-4 text-[#5A7E88] group-focus-within:text-[#00F5B8] absolute left-3.5 top-3.5 pointer-events-none transition-colors" />
                  <input
                    type="text"
                    required
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. GM Institute of Technology, Davangere"
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 text-[#F0FDF9] placeholder:text-[#5A7E88] focus:border-[#00F5B8] focus:ring-2 focus:ring-[#00F5B8]/30 text-sm transition-all duration-200"
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#F0FDF9]">
                  Department *
                </label>
                <div className="relative group">
                  <BookOpen className="w-4 h-4 text-[#5A7E88] group-focus-within:text-[#00F5B8] absolute left-3.5 top-3.5 pointer-events-none transition-colors" />
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science & Engineering"
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 text-[#F0FDF9] placeholder:text-[#5A7E88] focus:border-[#00F5B8] focus:ring-2 focus:ring-[#00F5B8]/30 text-sm transition-all duration-200"
                  />
                </div>
              </div>

              {/* Academic Year / Semester */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#F0FDF9]">
                  Year / Semester *
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 text-[#F0FDF9] focus:border-[#00F5B8] focus:ring-2 focus:ring-[#00F5B8]/30 text-sm transition-all duration-200"
                >
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Event or Participation Category */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#F0FDF9]">
                  Event / Participation Category *
                </label>
                <select
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 text-[#F0FDF9] focus:border-[#00F5B8] focus:ring-2 focus:ring-[#00F5B8]/30 text-sm transition-all duration-200"
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#F0FDF9]">
                  Emergency Contact (Name &amp; Phone) *
                </label>
                <div className="relative group">
                  <ShieldAlert className="w-4 h-4 text-[#5A7E88] group-focus-within:text-[#00F5B8] absolute left-3.5 top-3.5 pointer-events-none transition-colors" />
                  <input
                    type="text"
                    required
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g. Father: 98401 99999"
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 text-[#F0FDF9] placeholder:text-[#5A7E88] focus:border-[#00F5B8] focus:ring-2 focus:ring-[#00F5B8]/30 text-sm transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Teammates Section (If Team Mode) */}
            {isTeamMode && (
              <div className="pt-6 border-t border-[#00F5B8]/15 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#F0FDF9] flex items-center gap-2 font-heading tracking-tight">
                      <Users className="w-4 h-4 text-[#00F5B8]" />
                      <span>Teammates ({teammates.length})</span>
                    </h3>
                    <p className="text-xs text-[#9FB9C1] mt-0.5">
                      Add additional team members to collect their participant records.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addTeammate}
                    className="inline-flex items-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-[#00F5B8]/10 text-[#00F5B8] border border-[#00F5B8]/30 hover:bg-[#00F5B8]/20 transition-all duration-200"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Add Teammate</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {teammates.map((tm, index) => (
                    <div
                      key={tm.id || index}
                      className="p-4 sm:p-5 rounded-xl bg-[#061419]/80 border border-[#00F5B8]/20 space-y-4"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-[#00F5B8]/15">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-[#00F5B8]/15 text-[#00F5B8] border border-[#00F5B8]/30 flex items-center justify-center text-xs font-bold font-mono">
                            {index + 2}
                          </span>
                          <span className="text-xs font-bold text-[#F0FDF9]">
                            Teammate #{index + 2}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeTeammate(index)}
                          className="inline-flex items-center gap-1.5 text-xs text-[#F87171] hover:text-[#EF4444] px-2.5 py-1 rounded-md hover:bg-[#EF4444]/15 transition-all duration-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-[#F0FDF9]">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={tm.fullName}
                            onChange={(e) => updateTeammate(index, 'fullName', e.target.value)}
                            placeholder="Teammate name"
                            className="w-full h-10 px-3.5 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 text-[#F0FDF9] text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-[#F0FDF9]">Mobile Number *</label>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={tm.mobile}
                            onChange={(e) => updateTeammate(index, 'mobile', e.target.value.replace(/\D/g, ''))}
                            placeholder="98401 00000"
                            className="w-full h-10 px-3.5 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 text-[#F0FDF9] text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-[#F0FDF9]">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={tm.email}
                            onChange={(e) => updateTeammate(index, 'email', e.target.value)}
                            placeholder="teammate@college.ac.in"
                            className="w-full h-10 px-3.5 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 text-[#F0FDF9] text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-[#F0FDF9]">Gender *</label>
                          <select
                            value={tm.gender}
                            onChange={(e) => updateTeammate(index, 'gender', e.target.value)}
                            className="w-full h-10 px-3.5 rounded-lg border border-[#00F5B8]/20 bg-[#051117]/85 text-[#F0FDF9] text-xs"
                          >
                            <option value="Male">Male (Boys Hostel)</option>
                            <option value="Female">Female (Girls Hostel)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addTeammate}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-[#00F5B8]/35 hover:border-[#00F5B8] bg-[#00F5B8]/5 hover:bg-[#00F5B8]/10 text-[#00F5B8] text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Add Another Teammate (Member #{teammates.length + 2})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Section 2: Accommodation Requirement & Pricing */}
            <div className="pt-6 border-t border-[#00F5B8]/15 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#F0FDF9] flex items-center gap-2 font-heading tracking-tight">
                    <BedDouble className="w-4 h-4 text-[#00F5B8]" />
                    <span>Accommodation Requirement</span>
                  </h3>
                  <p className="text-xs text-[#9FB9C1] mt-0.5">
                    Tariff: ₹200 per person per day.
                  </p>
                </div>

                {/* Yes/No Toggle */}
                <div className="flex items-center gap-2 p-1 rounded-lg bg-[#040E12] border border-[#00F5B8]/20">
                  <button
                    type="button"
                    onClick={() => setAccommodationRequired(true)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      accommodationRequired
                        ? 'bg-[#00F5B8] text-[#021713] shadow-[0_0_12px_rgba(0,245,184,0.3)]'
                        : 'text-[#9FB9C1] hover:text-[#F0FDF9]'
                    }`}
                  >
                    Yes, Needed
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccommodationRequired(false)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      !accommodationRequired
                        ? 'bg-[#F87171] text-white shadow-[0_0_12px_rgba(248,113,113,0.3)]'
                        : 'text-[#9FB9C1] hover:text-[#F0FDF9]'
                    }`}
                  >
                    Not Required
                  </button>
                </div>
              </div>

              {accommodationRequired && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-5 rounded-xl bg-[#061419]/70 border border-[#00F5B8]/20 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Stay Dates */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#F0FDF9]">
                        Check-in Date *
                      </label>
                      <input
                        type="date"
                        required={accommodationRequired}
                        min={today}
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-[#00F5B8]/20 bg-[#051117] text-[#F0FDF9] text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#F0FDF9]">
                        Check-out Date *
                      </label>
                      <input
                        type="date"
                        required={accommodationRequired}
                        min={checkInDate || today}
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-[#00F5B8]/20 bg-[#051117] text-[#F0FDF9] text-xs"
                      />
                    </div>

                    {/* Calculated Days */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#F0FDF9]">
                        Accommodation Days
                      </label>
                      <div className="w-full h-10 px-3 rounded-lg border border-[#00F5B8]/20 bg-[#051117] text-[#00F5B8] text-xs font-mono font-bold flex items-center justify-between">
                        <span>{effectiveStayDays} {effectiveStayDays === 1 ? 'day' : 'days'}</span>
                        <span className="text-[10px] text-[#5A7E88]">₹200/day/person</span>
                      </div>
                    </div>
                  </div>

                  {/* Accommodation Participants count if Team Mode */}
                  {isTeamMode && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#F0FDF9]">
                        Number of participants requiring accommodation *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={totalMembersCount}
                        value={accommodationParticipantsCount}
                        onChange={(e) => setAccommodationParticipantsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full sm:w-48 h-10 px-3 rounded-lg border border-[#00F5B8]/20 bg-[#051117] text-[#F0FDF9] text-xs font-mono"
                      />
                      <p className="text-[11px] text-[#5A7E88]">
                        Max {totalMembersCount} team members. You can adjust this if only some members require hostel stay.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Section 3: Meal Requirements */}
            <div className="pt-6 border-t border-[#00F5B8]/15 space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#F0FDF9] flex items-center gap-2 font-heading tracking-tight">
                  <Utensils className="w-4 h-4 text-[#00F5B8]" />
                  <span>Meal Requirements</span>
                </h3>
                <p className="text-xs text-[#9FB9C1] mt-0.5">
                  Select required meals and indicate quantities or days. Do not assume all participants need every meal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Breakfast */}
                <div className={`p-4 rounded-xl border transition-all ${
                  breakfastRequired
                    ? 'bg-[#00F5B8]/10 border-[#00F5B8]/50 shadow-[0_0_16px_rgba(0,245,184,0.15)]'
                    : 'bg-[#061419]/70 border-[#00F5B8]/20'
                }`}>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={breakfastRequired}
                      onChange={(e) => setBreakfastRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00F5B8] focus:ring-[#00F5B8]"
                    />
                    <div>
                      <span className="text-sm font-bold text-[#F0FDF9] block">Breakfast</span>
                      <span className="text-xs text-[#00F5B8] font-mono font-semibold">₹50 per meal</span>
                    </div>
                  </label>

                  {breakfastRequired && (
                    <div className="mt-3 pt-3 border-t border-[#00F5B8]/15 space-y-1">
                      <label className="block text-[11px] text-[#9FB9C1]">Number of breakfast meals / days:</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={breakfastDays}
                        onChange={(e) => setBreakfastDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full h-8 px-2 rounded border border-[#00F5B8]/30 bg-[#051117] text-xs font-mono text-[#F0FDF9]"
                      />
                    </div>
                  )}
                </div>

                {/* Lunch */}
                <div className={`p-4 rounded-xl border transition-all ${
                  lunchRequired
                    ? 'bg-[#00F5B8]/10 border-[#00F5B8]/50 shadow-[0_0_16px_rgba(0,245,184,0.15)]'
                    : 'bg-[#061419]/70 border-[#00F5B8]/20'
                }`}>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lunchRequired}
                      onChange={(e) => setLunchRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00F5B8] focus:ring-[#00F5B8]"
                    />
                    <div>
                      <span className="text-sm font-bold text-[#F0FDF9] block">Lunch</span>
                      <span className="text-xs text-[#00F5B8] font-mono font-semibold">₹60 per meal</span>
                    </div>
                  </label>

                  {lunchRequired && (
                    <div className="mt-3 pt-3 border-t border-[#00F5B8]/15 space-y-1">
                      <label className="block text-[11px] text-[#9FB9C1]">Number of lunch meals / days:</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={lunchDays}
                        onChange={(e) => setLunchDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full h-8 px-2 rounded border border-[#00F5B8]/30 bg-[#051117] text-xs font-mono text-[#F0FDF9]"
                      />
                    </div>
                  )}
                </div>

                {/* Dinner */}
                <div className={`p-4 rounded-xl border transition-all ${
                  dinnerRequired
                    ? 'bg-[#00F5B8]/10 border-[#00F5B8]/50 shadow-[0_0_16px_rgba(0,245,184,0.15)]'
                    : 'bg-[#061419]/70 border-[#00F5B8]/20'
                }`}>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dinnerRequired}
                      onChange={(e) => setDinnerRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00F5B8] focus:ring-[#00F5B8]"
                    />
                    <div>
                      <span className="text-sm font-bold text-[#F0FDF9] block">Dinner</span>
                      <span className="text-xs text-[#00F5B8] font-mono font-semibold">₹60 per meal</span>
                    </div>
                  </label>

                  {dinnerRequired && (
                    <div className="mt-3 pt-3 border-t border-[#00F5B8]/15 space-y-1">
                      <label className="block text-[11px] text-[#9FB9C1]">Number of dinner meals / days:</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={dinnerDays}
                        onChange={(e) => setDinnerDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full h-8 px-2 rounded border border-[#00F5B8]/30 bg-[#051117] text-xs font-mono text-[#F0FDF9]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LIVE ESTIMATED ORDER SUMMARY (Sections 4 & 5) */}
            <OrderSummary
              accommodationRequired={accommodationRequired}
              accommodationParticipants={effectiveParticipants}
              accommodationDays={effectiveStayDays}
              breakfastRequired={breakfastRequired}
              breakfastDays={breakfastDays}
              lunchRequired={lunchRequired}
              lunchDays={lunchDays}
              dinnerRequired={dinnerRequired}
              dinnerDays={dinnerDays}
            />

            {/* SUBMIT BUTTON */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full h-12 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed text-base font-bold shadow-[0_0_24px_rgba(0,245,184,0.35)] hover:shadow-[0_0_36px_rgba(0,245,184,0.55)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group"
              >
                <span>
                  {isSubmitting
                    ? 'Submitting pre-registration...'
                    : isTeamMode
                    ? `Submit Team Pre-Registration (${totalMembersCount} Participants)`
                    : 'Submit Pre-Registration'}
                </span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          </form>
        </TiltCard>

        {/* SUPPORT HELP DESK */}
        <div className="rounded-xl bg-[#061419]/80 backdrop-blur-xl border border-[#00F5B8]/20 shadow-[0_8px_32px_rgba(0,0,0,0.65)] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00F5B8]/15">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#00F5B8] uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-[#00F5B8]" />
                <span>Hostel Coordination Desk</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-heading text-[#F0FDF9]">
                Have queries about accommodation or meal coordination?
              </h3>
              <p className="text-xs text-[#9FB9C1]">
                Payment will be collected directly by the respective coordinator at the desk.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="tel:+919980745913"
              className="p-4 rounded-xl bg-[#07161D]/75 border border-[#00F5B8]/20 hover:border-[#00F5B8]/60 transition-all duration-200 block"
            >
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-4 h-4 text-[#00F5B8]" />
                <span className="text-xs font-medium text-[#9FB9C1]">Coordinator Helpline</span>
              </div>
              <div className="text-base font-bold text-[#F0FDF9] font-mono">
                +91 99807 45913
              </div>
            </a>

            <a
              href="mailto:pavan.b.m1598@gmail.com?subject=Pre-Registration%20Query"
              className="p-4 rounded-xl bg-[#07161D]/75 border border-[#00F5B8]/20 hover:border-[#00F5B8]/60 transition-all duration-200 block"
            >
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-4 h-4 text-[#00F5B8]" />
                <span className="text-xs font-medium text-[#9FB9C1]">Coordinator Email</span>
              </div>
              <div className="text-sm font-bold text-[#F0FDF9] truncate">
                pavan.b.m1598@gmail.com
              </div>
            </a>

            <div className="p-4 rounded-xl bg-[#07161D]/75 border border-[#00F5B8]/20 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-4 h-4 text-[#00F5B8]" />
                <span className="text-xs font-medium text-[#9FB9C1]">Hostel Desk</span>
              </div>
              <div className="text-xs font-semibold text-[#F0FDF9]">
                Hostel Allocation Center
              </div>
              <div className="text-[11px] text-[#9FB9C1] mt-0.5">
                Main Campus Reception &amp; Boys/Girls Blocks
              </div>
            </div>
          </div>
        </div>

        {/* BRAND FOOTER */}
        <footer className="pt-6 pb-8 border-t border-[#00F5B8]/15 text-center space-y-4">
          <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <img src="/gmu-logo.png" alt="GM University" className="h-10 w-auto object-contain" />
            <div className="h-6 w-px bg-white/20" />
            <img src="/ignitron-2k26-logo.png" alt="IGNITRON 2K26" className="h-7 w-auto object-contain" />
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#00F5B8]/15 text-[#00F5B8] border border-[#00F5B8]/30">
              Pre-Registration Portal
            </span>
          </div>

          <p className="text-xs text-[#9FB9C1] max-w-md mx-auto leading-relaxed">
            GM University, Davangere · IGNITRON 2K26 National Technical Fest · For accommodation inquiries contact the hostel coordinator.
          </p>

          <div className="text-[11px] text-[#5A7E88] flex items-center justify-center gap-2">
            <span>© 2026 GM University. All rights reserved.</span>
            <span>·</span>
            <Link to="/admin/login" className="hover:text-[#00F5B8] transition-colors">
              Staff Portal
            </Link>
          </div>
        </footer>
      </div>

      {/* DUPLICATE REGISTRATION POPUP MODAL */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => { setShowDuplicateModal(false); setDuplicateError(null); }}
        title="Pre-Registration Already Submitted"
        maxWidth="sm"
      >
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#00F5B8]/15 border border-[#00F5B8]/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-[#00F5B8]" />
          </div>
          <div>
            <p className="text-sm text-[#9FB9C1] leading-relaxed">
              A pre-registration has already been recorded for this mobile number or email.
            </p>
            {duplicateError && (
              <div className="mt-3 p-3 rounded-lg bg-[#00F5B8]/10 border border-[#00F5B8]/30">
                <span className="text-xs text-[#9FB9C1]">Existing Reference ID</span>
                <div className="font-mono text-lg font-bold text-[#00F5B8] mt-0.5">
                  {duplicateError.referenceId}
                </div>
              </div>
            )}
            <div className="space-y-2 pt-4">
              {duplicateError && (
                <Link
                  to={`/confirmation/${duplicateError.referenceId}`}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-bold rounded-lg"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>View Pre-Registration Confirmation</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <button
                onClick={() => { setShowDuplicateModal(false); setDuplicateError(null); }}
                className="text-xs text-[#9FB9C1] hover:text-[#00F5B8] transition-colors w-full text-center py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
