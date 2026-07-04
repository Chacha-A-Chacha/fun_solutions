// file: src/app/api/admin/session-capacities/route.js
// Admin-only per-(day, timeSlot, licence class) capacity matrix.
// GET returns every session row (all classes) with capacity and current-week
// enrolment so the admin UI can warn before lowering capacity below enrolment.
// PATCH bulk-updates capacities. Rows are never created/deleted here — the full
// matrix is pre-seeded, so every edit is an update on an existing row (FK-safe).

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { withRole } from '@/app/lib/utils/auth';
import { DAY_NAMES, TIME_SLOT_NAMES, LICENCE_CLASSES } from '@/app/lib/constants';
import { getCurrentWeekMonday } from '@/app/lib/utils/dates';

/**
 * GET /api/admin/session-capacities
 * Optional ?category= to scope to one licence class.
 */
export const GET = withRole('INSTRUCTOR', 'ADMIN')(async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const weekOf = getCurrentWeekMonday();

    const sessions = await prisma.session.findMany({
      where: category ? { category } : {},
      include: {
        bookings: {
          where: { weekOf, status: { not: 'CANCELLED' } },
          select: { id: true }
        }
      },
      orderBy: [{ category: 'asc' }, { day: 'asc' }, { timeSlot: 'asc' }]
    });

    const rows = sessions.map(s => ({
      id: s.id,
      day: s.day,
      dayName: DAY_NAMES[s.day],
      timeSlot: s.timeSlot,
      timeSlotName: TIME_SLOT_NAMES[s.timeSlot],
      category: s.category,
      capacity: s.capacity,
      enrolledCount: s.bookings.length,
      isEnabled: s.metadata?.isEnabled !== false
    }));

    return NextResponse.json({ rows });
  } catch (error) {
    console.error('Error fetching session capacities:', error);
    return NextResponse.json({ error: 'Failed to fetch session capacities' }, { status: 500 });
  }
});

/**
 * PATCH /api/admin/session-capacities  (admin only)
 * Body: { updates: [{ id, capacity } | { day, timeSlot, category, capacity }, ...] }
 * Lowering capacity below current enrolment is allowed and never auto-cancels
 * bookings — it only prevents new ones.
 */
export const PATCH = withRole('ADMIN')(async function PATCH(request) {
  try {
    const body = await request.json();
    const updates = Array.isArray(body?.updates) ? body.updates : null;

    if (!updates || updates.length === 0) {
      return NextResponse.json({ error: 'updates array is required' }, { status: 400 });
    }

    const ops = [];
    for (const u of updates) {
      const capacity = Number(u.capacity);
      if (!Number.isInteger(capacity) || capacity < 0) {
        return NextResponse.json(
          { error: `Invalid capacity for ${u.id || `${u.day}/${u.timeSlot}/${u.category}`}` },
          { status: 400 }
        );
      }

      if (u.id) {
        ops.push(prisma.session.update({ where: { id: u.id }, data: { capacity } }));
      } else if (u.day && u.timeSlot && u.category) {
        if (!LICENCE_CLASSES.includes(u.category)) {
          return NextResponse.json({ error: `Unknown licence class ${u.category}` }, { status: 400 });
        }
        ops.push(prisma.session.update({
          where: { day_timeSlot_category: { day: u.day, timeSlot: u.timeSlot, category: u.category } },
          data: { capacity }
        }));
      } else {
        return NextResponse.json({ error: 'Each update needs an id or day+timeSlot+category' }, { status: 400 });
      }
    }

    await prisma.$transaction(ops);

    return NextResponse.json({ message: `Updated ${ops.length} slot${ops.length !== 1 ? 's' : ''}`, count: ops.length });
  } catch (error) {
    console.error('Error updating session capacities:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'One or more slots were not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update session capacities' }, { status: 500 });
  }
});
