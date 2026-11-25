import React, { useState } from 'react';
import type { SystemSettings } from '../types';
import { formatINR } from '../lib/formatters';
import { 
  BedDouble, 
  Utensils, 
  Save, 
  ShieldCheck,
  Info
} from 'lucide-react';

interface PricingSettingsCardProps {
  settings: SystemSettings;
  onSave: (updates: Partial<SystemSettings>) => Promise<void>;
  isAdmin: boolean;
}

export const PricingSettingsCard: React.FC<PricingSettingsCardProps> = ({
  settings,
  onSave,
  isAdmin,
}) => {
  const [perNightFee, setPerNightFee] = useState<number>(settings.per_night_fee || 200);
  const [breakfastFee, setBreakfastFee] = useState<number>(settings.breakfast_fee || 50);
  const [lunchFee, setLunchFee] = useState<number>(settings.lunch_fee || 60);
  const [dinnerFee, setDinnerFee] = useState<number>(settings.dinner_fee || 60);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onSave({
        per_night_fee: Number(perNightFee),
        breakfast_fee: Number(breakfastFee),
        lunch_fee: Number(lunchFee),
        dinner_fee: Number(dinnerFee),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl bg-[#061419]/80 border border-[#00F5B8]/20 shadow-[0_4px_24px_rgba(0,0,0,0.4)] p-6 sm:p-8 text-[#F7FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#00F5B8]/15 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-[#00F5B8]" />
            <h3 className="text-xl font-bold font-heading tracking-tight text-[#F0FDF9]">
              Pre-Registration Tariff Settings
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#9FB9C1] mt-1">
            Configure default per-day accommodation rates and per-meal charges used for cost estimations.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#040E12] border border-[#00F5B8]/20 text-xs font-medium text-[#00F5B8]">
          <span className="w-2 h-2 rounded-full bg-[#00F5B8]" />
          <span>Pre-Registration Portal</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Accommodation Rate */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#F7FAFC]">
              Accommodation Rate (₹ per person per day)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#5A7E88] font-semibold">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="1"
                required
                disabled={!isAdmin}
                value={perNightFee}
                onChange={(e) => setPerNightFee(Number(e.target.value))}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#00F5B8]/20 bg-[#051117] text-[#F7FAFC] focus:border-[#00F5B8] focus:outline-none text-sm font-mono"
              />
            </div>
            <p className="text-[11px] text-[#9FB9C1]">
              Standard default: ₹200 / person / day.
            </p>
          </div>

          {/* Breakfast Rate */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#F7FAFC]">
              Breakfast Rate (₹ per person per meal)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#5A7E88] font-semibold">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="1"
                required
                disabled={!isAdmin}
                value={breakfastFee}
                onChange={(e) => setBreakfastFee(Number(e.target.value))}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#00F5B8]/20 bg-[#051117] text-[#F7FAFC] focus:border-[#00F5B8] focus:outline-none text-sm font-mono"
              />
            </div>
            <p className="text-[11px] text-[#9FB9C1]">
              Standard default: ₹50 / meal.
            </p>
          </div>

          {/* Lunch Rate */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#F7FAFC]">
              Lunch Rate (₹ per person per meal)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#5A7E88] font-semibold">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="1"
                required
                disabled={!isAdmin}
                value={lunchFee}
                onChange={(e) => setLunchFee(Number(e.target.value))}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#00F5B8]/20 bg-[#051117] text-[#F7FAFC] focus:border-[#00F5B8] focus:outline-none text-sm font-mono"
              />
            </div>
            <p className="text-[11px] text-[#9FB9C1]">
              Standard default: ₹60 / meal.
            </p>
          </div>

          {/* Dinner Rate */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#F7FAFC]">
              Dinner Rate (₹ per person per meal)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#5A7E88] font-semibold">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="1"
                required
                disabled={!isAdmin}
                value={dinnerFee}
                onChange={(e) => setDinnerFee(Number(e.target.value))}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#00F5B8]/20 bg-[#051117] text-[#F7FAFC] focus:border-[#00F5B8] focus:outline-none text-sm font-mono"
              />
            </div>
            <p className="text-[11px] text-[#9FB9C1]">
              Standard default: ₹60 / meal.
            </p>
          </div>
        </div>

        {/* Informational Policy Note */}
        <div className="p-4 rounded-lg bg-[#040E12] border border-[#00F5B8]/20 flex items-start gap-3">
          <Info className="w-4 h-4 text-[#00F5B8] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#9FB9C1] leading-relaxed">
            <span className="font-semibold text-[#F0FDF9] block">
              Pre-Registration Estimations
            </span>
            <p>
              These rates are used to calculate the dynamic estimated charges presented to participants during pre-registration. No online payments are accepted; coordinators verify and collect actual charges during on-campus arrival.
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center justify-between pt-4 border-t border-[#00F5B8]/15">
            {savedSuccess ? (
              <span className="text-xs font-semibold text-[#00F5B8] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#00F5B8]" />
                Tariff settings saved successfully!
              </span>
            ) : (
              <span className="text-xs text-[#9FB9C1]">Updates apply to new pre-registrations.</span>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-xs font-semibold disabled:opacity-50 rounded-lg"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Tariff Settings'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
