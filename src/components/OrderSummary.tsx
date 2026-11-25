import React from 'react';
import { CountUp } from './CountUp';
import { formatINR } from '../lib/formatters';
import { SERVICE_PRICING } from '../types';
import { ShieldAlert, Info, BedDouble, Utensils, Users, Calendar } from 'lucide-react';

interface OrderSummaryProps {
  accommodationRequired: boolean;
  accommodationParticipants: number;
  accommodationDays: number;
  breakfastRequired: boolean;
  breakfastDays: number;
  lunchRequired: boolean;
  lunchDays: number;
  dinnerRequired: boolean;
  dinnerDays: number;
  isConfirmationPage?: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  accommodationRequired,
  accommodationParticipants,
  accommodationDays,
  breakfastRequired,
  breakfastDays,
  lunchRequired,
  lunchDays,
  dinnerRequired,
  dinnerDays,
  isConfirmationPage = false,
}) => {
  const participants = Math.max(1, accommodationParticipants || 1);
  const days = Math.max(0, accommodationDays || 0);

  const accommodationCost = accommodationRequired
    ? participants * days * SERVICE_PRICING.accommodationPerPersonPerDay
    : 0;

  const breakfastCost = breakfastRequired
    ? participants * Math.max(0, breakfastDays) * SERVICE_PRICING.breakfastPerMeal
    : 0;

  const lunchCost = lunchRequired
    ? participants * Math.max(0, lunchDays) * SERVICE_PRICING.lunchPerMeal
    : 0;

  const dinnerCost = dinnerRequired
    ? participants * Math.max(0, dinnerDays) * SERVICE_PRICING.dinnerPerMeal
    : 0;

  const totalEstimatedAmount = accommodationCost + breakfastCost + lunchCost + dinnerCost;

  return (
    <div className="rounded-xl bg-[#061419]/80 backdrop-blur-xl border border-[#00F5B8]/20 p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.65),0_0_24px_rgba(0,245,184,0.06)] relative overflow-hidden transition-all duration-300 hover:border-[#00F5B8]/35 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#00F5B8]/40 before:to-transparent space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#00F5B8]/15 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00F5B8]/15 text-[#00F5B8] flex items-center justify-center border border-[#00F5B8]/30">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#F0FDF9] font-heading tracking-tight">
              Estimated Accommodation &amp; Meal Charges
            </h3>
            <p className="text-[11px] text-[#9FB9C1]">
              Live estimate calculated dynamically based on your requirements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {participants > 1 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#00F5B8] bg-[#00F5B8]/10 px-2.5 py-1 rounded-md border border-[#00F5B8]/25">
              <Users className="w-3 h-3" />
              <span>{participants} participants</span>
            </span>
          )}
          {accommodationRequired && days > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#00F5B8] bg-[#00F5B8]/10 px-2.5 py-1 rounded-md border border-[#00F5B8]/25">
              <Calendar className="w-3 h-3" />
              <span>{days} {days === 1 ? 'day' : 'days'} stay</span>
            </span>
          )}
        </div>
      </div>

      {/* Breakdown Items */}
      <div className="space-y-3 text-sm">
        {/* Accommodation charges */}
        <div className="flex justify-between items-center text-[#9FB9C1] hover:text-[#F0FDF9] hover:bg-[#00F5B8]/[0.04] p-2 rounded-lg transition-colors">
          <div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-[#00F5B8]" />
            <span>Accommodation charges</span>
            {accommodationRequired ? (
              <span className="text-xs text-[#5A7E88]">
                ({participants} {participants === 1 ? 'person' : 'persons'} × {days} {days === 1 ? 'day' : 'days'} × {formatINR(SERVICE_PRICING.accommodationPerPersonPerDay)})
              </span>
            ) : (
              <span className="text-xs text-[#5A7E88] italic">(Not required)</span>
            )}
          </div>
          <span className="font-mono font-bold text-[#F0FDF9]">
            {formatINR(accommodationCost)}
          </span>
        </div>

        {/* Breakfast charges */}
        <div className="flex justify-between items-center text-[#9FB9C1] hover:text-[#F0FDF9] hover:bg-[#00F5B8]/[0.04] p-2 rounded-lg transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00F5B8]" />
            <span>Breakfast charges</span>
            {breakfastRequired && breakfastDays > 0 ? (
              <span className="text-xs text-[#5A7E88]">
                ({participants} {participants === 1 ? 'person' : 'persons'} × {breakfastDays} {breakfastDays === 1 ? 'meal' : 'meals'} × {formatINR(SERVICE_PRICING.breakfastPerMeal)})
              </span>
            ) : (
              <span className="text-xs text-[#5A7E88] italic">(Not selected)</span>
            )}
          </div>
          <span className="font-mono font-bold text-[#F0FDF9]">
            {formatINR(breakfastCost)}
          </span>
        </div>

        {/* Lunch charges */}
        <div className="flex justify-between items-center text-[#9FB9C1] hover:text-[#F0FDF9] hover:bg-[#00F5B8]/[0.04] p-2 rounded-lg transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00F5B8]" />
            <span>Lunch charges</span>
            {lunchRequired && lunchDays > 0 ? (
              <span className="text-xs text-[#5A7E88]">
                ({participants} {participants === 1 ? 'person' : 'persons'} × {lunchDays} {lunchDays === 1 ? 'meal' : 'meals'} × {formatINR(SERVICE_PRICING.lunchPerMeal)})
              </span>
            ) : (
              <span className="text-xs text-[#5A7E88] italic">(Not selected)</span>
            )}
          </div>
          <span className="font-mono font-bold text-[#F0FDF9]">
            {formatINR(lunchCost)}
          </span>
        </div>

        {/* Dinner charges */}
        <div className="flex justify-between items-center text-[#9FB9C1] hover:text-[#F0FDF9] hover:bg-[#00F5B8]/[0.04] p-2 rounded-lg transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00F5B8]" />
            <span>Dinner charges</span>
            {dinnerRequired && dinnerDays > 0 ? (
              <span className="text-xs text-[#5A7E88]">
                ({participants} {participants === 1 ? 'person' : 'persons'} × {dinnerDays} {dinnerDays === 1 ? 'meal' : 'meals'} × {formatINR(SERVICE_PRICING.dinnerPerMeal)})
              </span>
            ) : (
              <span className="text-xs text-[#5A7E88] italic">(Not selected)</span>
            )}
          </div>
          <span className="font-mono font-bold text-[#F0FDF9]">
            {formatINR(dinnerCost)}
          </span>
        </div>
      </div>

      {/* Total Estimated Amount */}
      <div className="pt-4 border-t border-[#00F5B8]/15 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#9FB9C1]">
            Total Estimated Amount
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#00F5B8] tracking-tight font-heading mt-0.5 drop-shadow-[0_0_18px_rgba(0,245,184,0.45)]">
            <CountUp value={totalEstimatedAmount} isCurrency />
          </div>
          <div className="text-[11px] text-[#5A7E88] mt-0.5">
            * Estimated amount only. No payment collected online.
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#00F5B8]/10 text-[#00F5B8] border border-[#00F5B8]/25 font-mono">
            ESTIMATE ONLY
          </span>
        </div>
      </div>

      {/* Mandatory Highlighted Notice Box (Section 5) */}
      <div className="p-4 rounded-xl bg-[#030D11]/90 border border-[#00F5B8]/30 space-y-2">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-[#00F5B8] flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-[#F0FDF9] leading-relaxed font-medium">
            <p className="mb-2">
              {isConfirmationPage
                ? "Your pre-registration has been submitted successfully. The above amount is an estimated calculation based on your accommodation and meal requirements."
                : "The above amount is an estimated calculation based on your accommodation and meal requirements."}
            </p>
            <p className="mb-2 text-[#5EE5BC]">
              No online payment is required at this stage. The respective coordinator will contact you regarding payment collection and further arrangements.
            </p>
            <p className="text-[#F87171] font-semibold">
              Please do not make any payment through this website.
            </p>
          </div>
        </div>
      </div>

      {/* Meal Coordination Communication (Section 6) */}
      {(breakfastRequired || lunchRequired || dinnerRequired) && (
        <div className="p-3.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-start gap-2.5 text-xs text-[#FCD34D]">
          <Info className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
          <span>
            Meal charges will be collected separately by the coordinator. Participants requiring meal arrangements should coordinate with the respective Hostel Coordinator.
          </span>
        </div>
      )}
    </div>
  );
};
