import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { withRole } from '@/app/lib/utils/auth';
import { getSettings } from '@/app/lib/utils/settings';

/**
 * GET /api/admin/settings — read all settings (instructor + admin)
 */
export const GET = withRole('INSTRUCTOR', 'ADMIN')(async function GET() {
  try {
    const settings = await getSettings();
    // Also return raw rows for admin UI (labels, types)
    const rows = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
    return NextResponse.json({ settings, rows });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
});

/**
 * PATCH /api/admin/settings — update settings (admin only)
 * Body: { "key": "value", ... }
 */
export const PATCH = withRole('ADMIN')(async function PATCH(request) {
  try {
    const updates = await request.json();

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const existing = await prisma.systemSetting.findUnique({ where: { key } });
      if (!existing) {
        results.push({ key, error: 'Setting not found' });
        continue;
      }

      await prisma.systemSetting.update({
        where: { key },
        data: { value: String(value) }
      });

      // Note: per-session capacity is no longer synced from this global setting.
      // Capacity is set per (day, timeSlot, licence class) via the capacity matrix
      // (/api/admin/session-capacities). `max_capacity_per_session` now only acts
      // as the default capacity applied to the default class when seeding new slots.

      results.push({ key, value: String(value), updated: true });
    }

    return NextResponse.json({ message: 'Settings updated', results });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
});
