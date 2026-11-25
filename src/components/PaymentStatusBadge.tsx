import React from 'react';
import { FollowupStatusBadge } from './FollowupStatusBadge';

interface PaymentStatusBadgeProps {
  status?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status = 'Pending Contact',
  size = 'md',
}) => {
  return <FollowupStatusBadge status={status} size={size === 'lg' ? 'md' : size} />;
};
