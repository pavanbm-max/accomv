import React from 'react';
import type { CoordinatorFollowupStatus } from '../types';
import { Clock, PhoneCall, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface FollowupStatusBadgeProps {
  status?: CoordinatorFollowupStatus | string;
  size?: 'sm' | 'md';
}

export const FollowupStatusBadge: React.FC<FollowupStatusBadgeProps> = ({
  status = 'Pending Contact',
  size = 'md',
}) => {
  const normalized = status || 'Pending Contact';

  let config = {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    label: 'Pending Contact',
    icon: Clock,
  };

  switch (normalized) {
    case 'Contacted':
      config = {
        bg: 'bg-sky-500/15',
        text: 'text-sky-400',
        border: 'border-sky-500/30',
        label: 'Contacted',
        icon: PhoneCall,
      };
      break;
    case 'Awaiting Payment':
      config = {
        bg: 'bg-purple-500/15',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
        label: 'Awaiting Payment',
        icon: AlertCircle,
      };
      break;
    case 'Confirmed':
      config = {
        bg: 'bg-[#00F5B8]/15',
        text: 'text-[#00F5B8]',
        border: 'border-[#00F5B8]/30',
        label: 'Confirmed',
        icon: CheckCircle2,
      };
      break;
    case 'Cancelled':
      config = {
        bg: 'bg-red-500/15',
        text: 'text-red-400',
        border: 'border-red-500/30',
        label: 'Cancelled',
        icon: XCircle,
      };
      break;
    default:
      config = {
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        label: 'Pending Contact',
        icon: Clock,
      };
      break;
  }

  const Icon = config.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold border ${config.bg} ${config.text} ${config.border} ${padding}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};
