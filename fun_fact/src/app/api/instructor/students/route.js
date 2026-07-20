// file: src/app/api/instructor/students/route.js
// description: API route to fetch all students with their booking information for instructor dashboard

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';
import { withRole } from '@/app/lib/utils/auth';
import { getSetting } from '@/app/lib/utils/settings';
import { getCurrentWeekMonday } from '@/app/lib/utils/dates';

/**
 * GET /api/instructor/students - Get all students with their booking details
 */
export const GET = withRole('INSTRUCTOR', 'ADMIN')(async function GET(request) {
  try {
    // Parse query parameters for filtering/pagination
    const { searchParams } = new URL(request.url);

    // When a sessionId is supplied (Add Participant flow), return the minimal list
    // of students eligible for that specific session: same licence class, not
    // already booked this week for that session, and not over their weekly limits.
    const sessionId = searchParams.get('sessionId');
    if (sessionId) {
      return await getEligibleStudentsForSession(sessionId);
    }

    const search = searchParams.get('search') || '';
    const statusParam = (searchParams.get('status') || 'active').toLowerCase();
    const categoryParam = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = (page - 1) * limit;

    // Status scope: active (default) hides deactivated students from listings/stats,
    // inactive shows only deactivated, all shows everyone.
    const statusFilter = statusParam === 'inactive'
      ? { status: 'INACTIVE' }
      : statusParam === 'archived'
        ? { status: 'ARCHIVED' }
        : statusParam === 'all'
          ? {}
          : { status: 'ACTIVE' };

    // Build where clause for search
    const searchFilter = search.trim() ? {
      OR: [
        { id: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
        { phoneNumber: { contains: search } }
      ]
    } : {};

    // Optional licence-class filter
    const categoryFilter = categoryParam ? { category: categoryParam } : {};

    const whereClause = { ...statusFilter, ...categoryFilter, ...searchFilter };

    // Get total count for pagination
    const totalCount = await prisma.student.count({ where: whereClause });

    // Fetch students with their bookings and session details
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        bookings: {
          include: {
            session: {
              select: {
                id: true,
                day: true,
                timeSlot: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'asc' }
      ],
      skip: offset,
      take: limit
    });

    const totalRequired = await getSetting('total_practicals_required', 15);

    // Format student data for the frontend
    const formattedStudents = students.map(student => {
      const bookings = student.bookings.map(booking => ({
        id: booking.id,
        sessionId: booking.sessionId,
        day: booking.session.day,
        dayName: DAY_NAMES[booking.session.day],
        timeSlot: booking.session.timeSlot,
        timeSlotName: TIME_SLOT_NAMES[booking.session.timeSlot],
        status: booking.status,
        weekOf: booking.weekOf,
        attendedAt: booking.attendedAt,
        completedAt: booking.completedAt,
        cancelledAt: booking.cancelledAt,
        notes: booking.notes,
        createdAt: booking.createdAt
      }));

      // Count active (non-cancelled) bookings
      const activeBookings = bookings.filter(b => b.status !== 'CANCELLED');

      return {
        id: student.id,
        studentNumber: student.studentNumber || student.id,
        name: student.name,
        email: student.email,
        phoneNumber: student.phoneNumber,
        category: student.category,
        status: student.status,
        deactivatedAt: student.deactivatedAt,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        bookings: bookings,
        bookingCount: activeBookings.length,
        totalSessions: bookings.length,
        completedSessions: bookings.filter(b => b.status === 'COMPLETED').length,
        attendedSessions: bookings.filter(b => b.status === 'ATTENDED' || b.status === 'COMPLETED').length,
        totalRequired,
        isComplete: bookings.filter(b => b.status === 'COMPLETED').length >= totalRequired,
        bookedDays: [...new Set(activeBookings.map(b => b.dayName))].join(', ') || 'No bookings'
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Calculate analytics from full dataset (DB-level, not paginated slice)
    const studentsWithBookingsCount = await prisma.student.count({
      where: {
        ...whereClause,
        bookings: { some: { status: { not: 'CANCELLED' } } }
      }
    });

    const totalActiveBookings = await prisma.booking.count({
      where: {
        status: { not: 'CANCELLED' },
        ...(statusParam === 'all' ? {} : { student: statusFilter })
      }
    });

    const analytics = {
      totalStudents: totalCount,
      studentsWithBookings: studentsWithBookingsCount,
      studentsWithoutBookings: totalCount - studentsWithBookingsCount,
      averageBookingsPerStudent: totalCount > 0
        ? (totalActiveBookings / totalCount).toFixed(1)
        : 0,
    };

    return NextResponse.json({
      students: formattedStudents,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPreviousPage
      },
      analytics,
      searchQuery: search
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
});

/**
 * Return active students eligible to be added to a specific session:
 *  - same licence class as the session
 *  - capacity permitting (checked here so the UI only offers valid students)
 *  - not already booked (non-cancelled) for that session this week
 *  - no other booking on the same day this week (max_sessions_per_day)
 *  - under the weekly day limit (max_days_per_week)
 */
async function getEligibleStudentsForSession(sessionId) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, day: true, category: true, capacity: true }
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const weekOf = getCurrentWeekMonday();
  const maxDaysPerWeek = await getSetting('max_days_per_week', 3);
  const maxSessionsPerDay = await getSetting('max_sessions_per_day', 1);

  // Candidate pool: active students of the matching licence class.
  const candidates = await prisma.student.findMany({
    where: { status: 'ACTIVE', category: session.category },
    select: { id: true, name: true, email: true, phoneNumber: true, category: true },
    orderBy: { name: 'asc' }
  });

  // Their current-week, non-cancelled bookings (with session day) in one query,
  // mirroring the include pattern used elsewhere in this file.
  const candidateIds = candidates.map(c => c.id);
  const weekBookings = candidateIds.length
    ? await prisma.booking.findMany({
        where: { studentId: { in: candidateIds }, weekOf, status: { not: 'CANCELLED' } },
        include: { session: { select: { day: true } } }
      })
    : [];

  // Group bookings by student for the eligibility checks
  const bookingsByStudent = {};
  for (const b of weekBookings) {
    (bookingsByStudent[b.studentId] ||= []).push(b);
  }

  const eligible = candidates
    .filter(s => {
      const bks = bookingsByStudent[s.id] || [];
      if (bks.some(b => b.sessionId === session.id)) return false; // already in this session
      const sameDay = bks.filter(b => b.session.day === session.day).length;
      if (sameDay >= maxSessionsPerDay) return false; // day conflict
      if (bks.length >= maxDaysPerWeek) return false; // weekly limit
      return true;
    })
    .map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phoneNumber: s.phoneNumber,
      category: s.category
    }));

  return NextResponse.json({ students: eligible, session: { id: session.id, category: session.category } });
}
