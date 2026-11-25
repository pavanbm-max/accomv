import React, { useState, useEffect } from 'react';
import { PricingSettingsCard } from '../../components/PricingSettingsCard';
import { getSystemSettings, updateSystemSettings } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/Skeleton';
import type { SystemSettings } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getSystemSettings();
      setSettings(data);
    } catch (e: any) {
      toastError(e.message || 'Failed to load system settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (updates: Partial<SystemSettings>) => {
    try {
      const updated = await updateSystemSettings(updates);
      setSettings(updated);
      toastSuccess('Settings updated successfully.');
    } catch (e: any) {
      toastError(e.message || 'Failed to update settings.');
      throw e;
    }
  };

  if (loading || !settings) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64 bg-[#061419] rounded-md" />
        <Skeleton className="h-96 rounded-lg bg-[#061419]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-[#F7FAFC]">
      <div className="pb-4 border-b border-[#00F5B8]/15">
        <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-[#F0FDF9]">
          Portal Tariff Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#9FB9C1] mt-1">
          Adjust accommodation and meal rates used for participant cost estimates.
        </p>
      </div>

      <PricingSettingsCard
        settings={settings}
        onSave={handleSave}
        isAdmin={isAdmin}
      />
    </div>
  );
};
