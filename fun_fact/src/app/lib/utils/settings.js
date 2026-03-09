import prisma from '../db/prisma-client';

// Default values (fallbacks if DB is empty)
const DEFAULTS = {
  max_capacity_per_session: 4,
  max_days_per_week: 3,
  max_sessions_per_day: 1,
  total_practicals_required: 15,
};

/**
 * Get all system settings as a { key: parsedValue } map
 */
export async function getSettings() {
  try {
    const rows = await prisma.systemSetting.findMany();
    const settings = { ...DEFAULTS };

    for (const row of rows) {
      if (row.type === 'number') {
        settings[row.key] = parseInt(row.value, 10);
      } else if (row.type === 'boolean') {
        settings[row.key] = row.value === 'true';
      } else {
        settings[row.key] = row.value;
      }
    }

    return settings;
  } catch {
    // Fallback to defaults when DB is unavailable (e.g. during build)
    return { ...DEFAULTS };
  }
}

/**
 * Get a single setting by key
 */
export async function getSetting(key, defaultValue) {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  if (!row) return defaultValue ?? DEFAULTS[key] ?? null;

  if (row.type === 'number') return parseInt(row.value, 10);
  if (row.type === 'boolean') return row.value === 'true';
  return row.value;
}
