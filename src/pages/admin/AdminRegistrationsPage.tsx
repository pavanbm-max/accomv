import React, { useState, useEffect } from 'react';
import { FollowupStatusBadge } from '../../components/FollowupStatusBadge';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { formatINR, formatDate, formatDateTime } from '../../lib/formatters';
import { 
  getPreRegistrations, 
  updateCoordinatorFollowup, 
  deleteRegistration 
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { PreRegistration, CoordinatorFollowupStatus } from '../../types';
import { FOLLOWUP_STATUS_OPTIONS } from '../../types';
import { 
  Eye, 
  FileSpreadsheet, 
  Trash2, 
  RefreshCw, 
  Search, 
  Filter, 
  X, 
  Save, 
  Phone, 
  Mail, 
  Building, 
  Calendar, 
  BedDouble, 
  Utensils, 
  Users,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const EVENT_CATEGORIES = [
  'All Categories',
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

export const AdminRegistrationsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [registrations, setRegistrations] = useState<PreRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('All Categories');
  const [selectedAccommodation, setSelectedAccommodation] = useState('all');
  const [selectedDays, setSelectedDays] = useState('all');
  const [selectedFollowupStatus, setSelectedFollowupStatus] = useState('all');

  // Drawer / View State
  const [selectedReg, setSelectedReg] = useState<PreRegistration | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerStatus, setDrawerStatus] = useState<CoordinatorFollowupStatus>('Pending Contact');
  const [drawerNotes, setDrawerNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Delete modal state
  const [regToDelete, setRegToDelete] = useState<PreRegistration | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getPreRegistrations({
        search: searchQuery,
        eventCategory: selectedEvent === 'All Categories' ? 'all' : selectedEvent,
        accommodationRequired: selectedAccommodation,
        accommodationDays: selectedDays,
        followupStatus: selectedFollowupStatus,
      });
      setRegistrations(data);
    } catch (err: any) {
      toastError(err.message || 'Failed to load pre-registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedEvent, selectedAccommodation, selectedDays, selectedFollowupStatus]);

  // Open drawer
  const handleOpenDrawer = (reg: PreRegistration) => {
    setSelectedReg(reg);
    setDrawerStatus(reg.admin_followup?.followup_status || 'Pending Contact');
    setDrawerNotes(reg.admin_followup?.coordinator_notes || '');
    setIsDrawerOpen(true);
  };

  // Quick update of status from table dropdown
  const handleInlineStatusChange = async (reg: PreRegistration, newStatus: CoordinatorFollowupStatus) => {
    try {
      await updateCoordinatorFollowup(reg.id, newStatus, reg.admin_followup?.coordinator_notes);
      toastSuccess(`Updated status for ${reg.reference_id} to "${newStatus}"`);
      // Update locally
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === reg.id
            ? {
                ...r,
                admin_followup: {
                  ...r.admin_followup,
                  registration_id: reg.id,
                  followup_status: newStatus,
                  coordinator_notes: r.admin_followup?.coordinator_notes,
                  updated_at: new Date().toISOString(),
                },
              }
            : r
        )
      );
    } catch (err: any) {
      toastError(err.message || 'Failed to update follow-up status.');
    }
  };

  // Save drawer changes
  const handleSaveDrawerFollowup = async () => {
    if (!selectedReg) return;
    setIsSavingNotes(true);
    try {
      await updateCoordinatorFollowup(selectedReg.id, drawerStatus, drawerNotes);
      toastSuccess('Follow-up status & notes saved successfully.');
      setIsDrawerOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to save follow-up details.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!regToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRegistration(regToDelete.id);
      toastSuccess(`Pre-registration ${regToDelete.reference_id} deleted.`);
      setRegToDelete(null);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete record.');
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export (Section 8)
  const handleExportCSV = () => {
    if (registrations.length === 0) {
      toastError('No pre-registration records to export.');
      return;
    }

    const headers = [
      'Reference ID',
      'Registration Date',
      'Full Name',
      'Mobile Number',
      'Email Address',
      'Gender',
      'College / Institution',
      'Department',
      'Academic Year',
      'Event Category',
      'Emergency Contact',
      'Accommodation Required',
      'Accommodation Participants',
      'Accommodation Days',
      'Check-in Date',
      'Check-out Date',
      'Accommodation Estimated Amount (INR)',
      'Breakfast Meals Count',
      'Breakfast Amount (INR)',
      'Lunch Meals Count',
      'Lunch Amount (INR)',
      'Dinner Meals Count',
      'Dinner Amount (INR)',
      'Total Meals Count',
      'Total Meal Estimated Amount (INR)',
      'Total Estimated Amount (INR)',
      'Coordinator Follow-up Status',
      'Coordinator Notes',
    ];

    const rows = registrations.map((r) => {
      const bQty = r.meal_requirements?.breakfast_quantity || 0;
      const lQty = r.meal_requirements?.lunch_quantity || 0;
      const dQty = r.meal_requirements?.dinner_quantity || 0;
      const totalMeals = bQty + lQty + dQty;

      return [
        r.reference_id,
        `"${formatDateTime(r.created_at)}"`,
        `"${r.full_name.replace(/"/g, '""')}"`,
        r.mobile,
        r.email,
        r.gender || '',
        `"${(r.college || '').replace(/"/g, '""')}"`,
        `"${(r.department || '').replace(/"/g, '""')}"`,
        `"${(r.academic_year || '').replace(/"/g, '""')}"`,
        `"${(r.event_category || '').replace(/"/g, '""')}"`,
        `"${(r.emergency_contact || '').replace(/"/g, '""')}"`,
        r.accommodation_required ? 'YES' : 'NO',
        r.accommodation_required ? r.accommodation_participants || 1 : 0,
        r.accommodation_required ? r.accommodation_days || 0 : 0,
        r.check_in_date || '',
        r.check_out_date || '',
        r.accommodation_estimated_amount || 0,
        bQty,
        r.meal_requirements?.breakfast_amount || 0,
        lQty,
        r.meal_requirements?.lunch_amount || 0,
        dQty,
        r.meal_requirements?.dinner_amount || 0,
        totalMeals,
        r.meal_estimated_amount || 0,
        r.total_estimated_amount || 0,
        `"${r.admin_followup?.followup_status || 'Pending Contact'}"`,
        `"${(r.admin_followup?.coordinator_notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `pre_registrations_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess(`Exported ${registrations.length} pre-registrations to CSV.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#F7FAFC]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#00F5B8]/15 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[#F0FDF9]">
            Pre-Registrations &amp; Participant Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#9FB9C1] mt-1">
            Browse participant records, accommodation needs, meal demands, and manage coordinator follow-up statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={registrations.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#061419] border border-[#00F5B8]/25 text-[#00F5B8] text-xs font-semibold hover:border-[#00F5B8]/60 hover:bg-[#081F28] transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={loadData}
            title="Refresh list"
            className="p-2 text-[#9FB9C1] hover:text-[#00F5B8] rounded-md hover:bg-[#061419] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#061419]/80 border border-[#00F5B8]/20 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[#5A7E88] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, mobile, email, or college..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#00F5B8]/20 bg-[#051117] text-xs text-[#F0FDF9] placeholder:text-[#5A7E88] focus:border-[#00F5B8] focus:outline-none"
            />
          </div>

          {/* Event Category Filter */}
          <div>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#00F5B8]/20 bg-[#051117] text-xs text-[#F0FDF9] focus:border-[#00F5B8] focus:outline-none"
            >
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Accommodation Filter */}
          <div>
            <select
              value={selectedAccommodation}
              onChange={(e) => setSelectedAccommodation(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#00F5B8]/20 bg-[#051117] text-xs text-[#F0FDF9] focus:border-[#00F5B8] focus:outline-none"
            >
              <option value="all">Accommodation: All</option>
              <option value="yes">Accommodation Required</option>
              <option value="no">Accommodation Not Required</option>
            </select>
          </div>

          {/* Stay Days Filter */}
          <div>
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#00F5B8]/20 bg-[#051117] text-xs text-[#F0FDF9] focus:border-[#00F5B8] focus:outline-none"
            >
              <option value="all">Stay Days: All</option>
              <option value="1">1 Day Stay</option>
              <option value="2">2 Days Stay</option>
              <option value="3+">3+ Days Stay</option>
            </select>
          </div>
        </div>

        {/* Coordinator Follow-up Status filter pills */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#00F5B8]/15 text-xs">
          <span className="text-[#9FB9C1] font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Follow-up Status:</span>
          </span>
          <button
            onClick={() => setSelectedFollowupStatus('all')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              selectedFollowupStatus === 'all'
                ? 'bg-[#00F5B8] text-[#021713] font-bold'
                : 'bg-[#040E12] text-[#9FB9C1] hover:text-[#F0FDF9]'
            }`}
          >
            All ({registrations.length})
          </button>
          {FOLLOWUP_STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedFollowupStatus(status)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                selectedFollowupStatus === status
                  ? 'bg-[#00F5B8] text-[#021713] font-bold'
                  : 'bg-[#040E12] text-[#9FB9C1] hover:text-[#F0FDF9]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* REGISTRATIONS DATA TABLE */}
      <div className="rounded-xl bg-[#061419]/80 backdrop-blur-xl border border-[#00F5B8]/20 shadow-[0_8px_32px_rgba(0,0,0,0.65)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#040E12] text-[#9FB9C1] uppercase tracking-wider font-semibold border-b border-[#00F5B8]/15">
                <th className="py-3 px-3.5">Reference ID</th>
                <th className="py-3 px-3.5">Participant Details</th>
                <th className="py-3 px-3.5">College &amp; Dept</th>
                <th className="py-3 px-3.5">Event Category</th>
                <th className="py-3 px-3.5">Accommodation</th>
                <th className="py-3 px-3.5">Meals (B / L / D)</th>
                <th className="py-3 px-3.5">Est. Total</th>
                <th className="py-3 px-3.5">Follow-up Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#00F5B8]/10">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#9FB9C1]">
                    Loading pre-registrations...
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#9FB9C1]">
                    No pre-registrations match your search and filter criteria.
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => {
                  const currentStatus = reg.admin_followup?.followup_status || 'Pending Contact';
                  return (
                    <tr
                      key={reg.id}
                      className="hover:bg-[#00F5B8]/[0.04] transition-colors"
                    >
                      {/* Reference ID */}
                      <td className="py-3.5 px-3.5 font-mono font-bold text-[#00F5B8]">
                        {reg.reference_id}
                        <div className="text-[10px] text-[#5A7E88] font-sans font-normal mt-0.5">
                          {formatDate(reg.created_at)}
                        </div>
                      </td>

                      {/* Participant Details */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-semibold text-[#F0FDF9] text-sm">{reg.full_name}</div>
                        <div className="font-mono text-[11px] text-[#9FB9C1] mt-0.5">+91 {reg.mobile}</div>
                        <div className="text-[11px] text-[#5A7E88] truncate max-w-[150px]">{reg.email}</div>
                      </td>

                      {/* College & Dept */}
                      <td className="py-3.5 px-3.5 text-[#9FB9C1]">
                        <div className="truncate max-w-[170px] text-[#F0FDF9] font-medium" title={reg.college}>
                          {reg.college}
                        </div>
                        <div className="text-[11px] text-[#5A7E88]">{reg.department || '—'}</div>
                        <div className="text-[10px] text-[#00F5B8]/80">{reg.academic_year || ''}</div>
                      </td>

                      {/* Event Category */}
                      <td className="py-3.5 px-3.5 text-[#9FB9C1]">
                        <span className="inline-block px-2 py-0.5 rounded bg-[#061419] border border-[#00F5B8]/20 text-[11px] text-[#00F5B8] font-medium">
                          {reg.event_category || 'Fest Event'}
                        </span>
                      </td>

                      {/* Accommodation */}
                      <td className="py-3.5 px-3.5 text-[#9FB9C1]">
                        {reg.accommodation_required ? (
                          <div>
                            <span className="text-[#00F5B8] font-semibold">
                              {reg.accommodation_participants || 1}p × {reg.accommodation_days || 0}d
                            </span>
                            <div className="text-[10px] text-[#5A7E88]">
                              {formatINR(reg.accommodation_estimated_amount)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#5A7E88] italic">No accommodation</span>
                        )}
                      </td>

                      {/* Meals */}
                      <td className="py-3.5 px-3.5 text-xs">
                        {(!reg.meal_requirements || (
                          (reg.meal_requirements.breakfast_quantity || 0) === 0 &&
                          (reg.meal_requirements.lunch_quantity || 0) === 0 &&
                          (reg.meal_requirements.dinner_quantity || 0) === 0
                        )) ? (
                          <span className="text-[#5A7E88] italic text-[11px]">No meals</span>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1">
                              {(reg.meal_requirements.breakfast_quantity || 0) > 0 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300" title="Breakfast count">
                                  <span>B:</span>
                                  <strong>{reg.meal_requirements.breakfast_quantity}</strong>
                                </span>
                              )}
                              {(reg.meal_requirements.lunch_quantity || 0) > 0 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300" title="Lunch count">
                                  <span>L:</span>
                                  <strong>{reg.meal_requirements.lunch_quantity}</strong>
                                </span>
                              )}
                              {(reg.meal_requirements.dinner_quantity || 0) > 0 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300" title="Dinner count">
                                  <span>D:</span>
                                  <strong>{reg.meal_requirements.dinner_quantity}</strong>
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#9FB9C1] font-mono">
                              {((reg.meal_requirements.breakfast_quantity || 0) +
                                (reg.meal_requirements.lunch_quantity || 0) +
                                (reg.meal_requirements.dinner_quantity || 0))} meals ({formatINR(reg.meal_estimated_amount)})
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Estimated Total */}
                      <td className="py-3.5 px-3.5 font-mono font-bold text-sm text-[#F0FDF9]">
                        {formatINR(reg.total_estimated_amount)}
                      </td>

                      {/* Coordinator Follow-up Status Dropdown */}
                      <td className="py-3.5 px-3.5">
                        <select
                          value={currentStatus}
                          onChange={(e) =>
                            handleInlineStatusChange(reg, e.target.value as CoordinatorFollowupStatus)
                          }
                          className="h-8 px-2 rounded border border-[#00F5B8]/20 bg-[#040E12] text-xs font-semibold focus:border-[#00F5B8] focus:outline-none"
                        >
                          {FOLLOWUP_STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(reg)}
                            className="p-1.5 rounded-md hover:bg-[#00F5B8]/15 text-[#9FB9C1] hover:text-[#00F5B8] transition-colors"
                            title="View details & coordinator notes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setRegToDelete(reg)}
                              className="p-1.5 rounded-md hover:bg-red-500/15 text-[#9FB9C1] hover:text-red-400 transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL & COORDINATOR FOLLOW-UP DRAWER */}
      {isDrawerOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl h-full bg-[#040E12] border-l border-[#00F5B8]/25 p-6 overflow-y-auto space-y-6 text-xs text-[#F0FDF9] shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#00F5B8]/15">
              <div>
                <span className="font-mono text-base font-bold text-[#00F5B8]">
                  {selectedReg.reference_id}
                </span>
                <p className="text-[11px] text-[#9FB9C1] mt-0.5">
                  Submitted: {formatDateTime(selectedReg.created_at)}
                </p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-md hover:bg-[#061419] text-[#9FB9C1] hover:text-[#F0FDF9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Coordinator Follow-up Status Section */}
            <div className="p-4 rounded-xl bg-[#061419] border border-[#00F5B8]/30 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#00F5B8]">
                Coordinator Follow-up Management
              </h4>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-[#9FB9C1]">
                  Follow-up Status *
                </label>
                <select
                  value={drawerStatus}
                  onChange={(e) => setDrawerStatus(e.target.value as CoordinatorFollowupStatus)}
                  className="w-full h-9 px-3 rounded-lg border border-[#00F5B8]/25 bg-[#040E12] text-xs font-semibold text-[#F0FDF9]"
                >
                  {FOLLOWUP_STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-[#9FB9C1]">
                  Coordinator Notes &amp; Follow-up Log:
                </label>
                <textarea
                  rows={3}
                  value={drawerNotes}
                  onChange={(e) => setDrawerNotes(e.target.value)}
                  placeholder="Record coordinator calls, bed allotment status, payment arrangement notes, etc."
                  className="w-full p-2.5 rounded-lg border border-[#00F5B8]/20 bg-[#040E12] text-xs text-[#F0FDF9] placeholder:text-[#5A7E88]"
                />
              </div>

              <button
                onClick={handleSaveDrawerFollowup}
                disabled={isSavingNotes}
                className="btn-primary w-full py-2 flex items-center justify-center gap-2 text-xs font-bold rounded-lg"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingNotes ? 'Saving...' : 'Save Follow-up Update'}</span>
              </button>
            </div>

            {/* Participant Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#9FB9C1]">
                Participant Identification
              </h4>
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-[#061419]/60 border border-[#00F5B8]/15">
                <div>
                  <span className="text-[#5A7E88]">Full Name:</span>
                  <div className="font-semibold text-sm mt-0.5">{selectedReg.full_name}</div>
                </div>
                <div>
                  <span className="text-[#5A7E88]">Mobile Phone:</span>
                  <div className="font-mono font-semibold mt-0.5">+91 {selectedReg.mobile}</div>
                </div>
                <div>
                  <span className="text-[#5A7E88]">Email Address:</span>
                  <div className="mt-0.5 truncate">{selectedReg.email}</div>
                </div>
                <div>
                  <span className="text-[#5A7E88]">Gender:</span>
                  <div className="mt-0.5">{selectedReg.gender || 'Male'}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-[#5A7E88]">College / Institution:</span>
                  <div className="mt-0.5 font-medium">{selectedReg.college}</div>
                </div>
                <div>
                  <span className="text-[#5A7E88]">Department:</span>
                  <div className="mt-0.5">{selectedReg.department || '—'}</div>
                </div>
                <div>
                  <span className="text-[#5A7E88]">Academic Year:</span>
                  <div className="mt-0.5">{selectedReg.academic_year || '—'}</div>
                </div>
                <div>
                  <span className="text-[#5A7E88]">Event Category:</span>
                  <div className="mt-0.5 text-[#00F5B8] font-semibold">{selectedReg.event_category}</div>
                </div>
                <div>
                  <span className="text-[#5A7E88]">Emergency Contact:</span>
                  <div className="mt-0.5">{selectedReg.emergency_contact || '—'}</div>
                </div>
              </div>
            </div>

            {/* Team details if present */}
            {selectedReg.is_team && selectedReg.team_members && selectedReg.team_members.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#9FB9C1]">
                  Teammates ({selectedReg.team_members.length})
                </h4>
                <div className="divide-y divide-[#00F5B8]/15 rounded-lg bg-[#061419]/60 border border-[#00F5B8]/15 p-3 space-y-2">
                  {selectedReg.team_members.map((tm, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex justify-between">
                      <div>
                        <span className="font-semibold">{idx + 2}. {tm.fullName}</span>
                        <span className="text-[10px] text-[#5A7E88] ml-2">({tm.gender || 'Male'})</span>
                      </div>
                      <span className="font-mono text-[#9FB9C1]">+91 {tm.mobile}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accommodation & Meals Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#9FB9C1]">
                Requirements &amp; Cost Estimation
              </h4>

              {/* Accommodation card */}
              <div className="p-3.5 rounded-lg bg-[#061419]/60 border border-[#00F5B8]/15 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#9FB9C1] text-xs">Accommodation:</span>
                  <span className="font-mono font-semibold text-xs text-[#F0FDF9]">
                    {selectedReg.accommodation_required
                      ? `${selectedReg.accommodation_participants || 1} person(s) × ${selectedReg.accommodation_days || 0} day(s) = ${formatINR(selectedReg.accommodation_estimated_amount)}`
                      : 'None (₹0)'}
                  </span>
                </div>
                {selectedReg.accommodation_required && selectedReg.check_in_date && selectedReg.check_out_date && (
                  <div className="text-[11px] text-[#5A7E88]">
                    Dates: {formatDate(selectedReg.check_in_date)} to {formatDate(selectedReg.check_out_date)}
                  </div>
                )}
              </div>

              {/* Specific Meal Details & Counts */}
              <div className="p-3.5 rounded-lg bg-[#061419]/60 border border-[#00F5B8]/15 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00F5B8] flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Meal Demands &amp; Counts</span>
                  </span>
                  <span className="text-[11px] text-[#9FB9C1] font-mono">
                    Total: {((selectedReg.meal_requirements?.breakfast_quantity || 0) +
                             (selectedReg.meal_requirements?.lunch_quantity || 0) +
                             (selectedReg.meal_requirements?.dinner_quantity || 0))} meals
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-[#040E12] border border-amber-500/25 text-center">
                    <div className="text-[10px] font-bold uppercase text-amber-400">Breakfast</div>
                    <div className="text-lg font-bold font-mono text-[#F0FDF9] mt-0.5">
                      {selectedReg.meal_requirements?.breakfast_quantity || 0}
                    </div>
                    <div className="text-[10px] text-[#5A7E88]">
                      {formatINR(selectedReg.meal_requirements?.breakfast_amount || 0)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#040E12] border border-emerald-500/25 text-center">
                    <div className="text-[10px] font-bold uppercase text-emerald-400">Lunch</div>
                    <div className="text-lg font-bold font-mono text-[#F0FDF9] mt-0.5">
                      {selectedReg.meal_requirements?.lunch_quantity || 0}
                    </div>
                    <div className="text-[10px] text-[#5A7E88]">
                      {formatINR(selectedReg.meal_requirements?.lunch_amount || 0)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#040E12] border border-indigo-500/25 text-center">
                    <div className="text-[10px] font-bold uppercase text-indigo-400">Dinner</div>
                    <div className="text-lg font-bold font-mono text-[#F0FDF9] mt-0.5">
                      {selectedReg.meal_requirements?.dinner_quantity || 0}
                    </div>
                    <div className="text-[10px] text-[#5A7E88]">
                      {formatINR(selectedReg.meal_requirements?.dinner_amount || 0)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-[#00F5B8]/10">
                  <span className="text-[#9FB9C1]">Total Estimated Meal Cost:</span>
                  <span className="font-mono font-bold text-[#F0FDF9]">
                    {formatINR(selectedReg.meal_estimated_amount)}
                  </span>
                </div>
              </div>

              {/* Total pipeline amount */}
              <div className="p-3 rounded-lg bg-[#040E12] border border-[#00F5B8]/25 flex justify-between items-center">
                <span className="font-bold text-[#F0FDF9] text-xs sm:text-sm">Total Estimated Pipeline:</span>
                <span className="font-mono font-bold text-[#00F5B8] text-sm sm:text-base">
                  {formatINR(selectedReg.total_estimated_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(regToDelete)}
        title="Delete Pre-Registration"
        message={`Are you sure you want to delete pre-registration record for ${regToDelete?.full_name} (${regToDelete?.reference_id})? This action cannot be undone.`}
        confirmLabel="Delete Record"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setRegToDelete(null)}
      />
    </div>
  );
};
