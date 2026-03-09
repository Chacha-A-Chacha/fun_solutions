'use client';

import { useState, useEffect } from 'react';
import { SESSION_CONSTRAINTS } from '../lib/constants';

// Fallback defaults matching DB seed values
const DEFAULTS = {
  max_capacity_per_session: SESSION_CONSTRAINTS.MAX_CAPACITY,
  max_days_per_week: SESSION_CONSTRAINTS.MAX_DAYS_PER_STUDENT,
  max_sessions_per_day: SESSION_CONSTRAINTS.MAX_SESSIONS_PER_DAY,
  total_practicals_required: 15,
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setSettings({ ...DEFAULTS, ...data.settings });
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSettings();
    return () => { cancelled = true; };
  }, []);

  return { settings, loading };
}
