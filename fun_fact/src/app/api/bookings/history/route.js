import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { withAuth } from '@/app/lib/utils/auth';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';
import { getSetting } from '@/app/lib/utils/settings';

/**
 * GET /api/bookings/history - Get full booking history for the authenticated student
 */
async function getBookingHistory(request) {
  try {
    const student = request.student;

    const rawBookings = await prisma.booking.findMany({
      where: { studentId: student.id },
      include: {
        session: { select: { day: true, timeSlot: true } },
        markedBy: { select: { name: true } },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: { changedBy: { select: { name: true } } }
        }
      },
      orderBy: [
        { weekOf: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const bookings = rawBookings.map(b => ({
      id: b.id,
      day: b.session.day,
      dayName: DAY_NAMES[b.session.day],
      timeSlot: b.session.timeSlot,
      timeSlotName: TIME_SLOT_NAMES[b.session.timeSlot],
      status: b.status,
      weekOf: b.weekOf,
      attendedAt: b.attendedAt,
      completedAt: b.completedAt,
      cancelledAt: b.cancelledAt,
      notes: b.notes,
      markedBy: b.markedBy?.name || null,
      createdAt: b.createdAt,
      statusHistory: b.statusHistory.map(h => ({
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        changedBy: h.changedBy?.name || null,
        reason: h.reason,
        createdAt: h.createdAt
      }))
    }));

    const totalRequired = await getSetting('total_practicals_required', 15);
    const completedCount = bookings.filter(b => b.status === 'COMPLETED').length;

    const summary = {
      totalBookings: bookings.length,
      completed: completedCount,
      attended: bookings.filter(b => b.status === 'ATTENDED' || b.status === 'COMPLETED').length,
      noShows: bookings.filter(b => b.status === 'NO_SHOW').length,
      incomplete: bookings.filter(b => b.status === 'INCOMPLETE').length,
      cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
      totalRequired,
      progressPercent: Math.min(100, Math.round((completedCount / totalRequired) * 100)),
      isComplete: completedCount >= totalRequired,
    };

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phoneNumber: student.phoneNumber
      },
      bookings,
      summary
    });
  } catch (error) {
    console.error('Error fetching booking history:', error);
    return NextResponse.json({ error: 'Failed to fetch booking history' }, { status: 500 });
  }
}

export const GET = withAuth(getBookingHistory);
