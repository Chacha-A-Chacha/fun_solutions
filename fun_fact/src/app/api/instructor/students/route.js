// file: src/app/api/instructor/students/route.js
// description: API route to fetch all students with their booking information for instructor dashboard

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';
import { withRole } from '@/app/lib/utils/auth';
import { getSetting } from '@/app/lib/utils/settings';

/**
 * GET /api/instructor/students - Get all students with their booking details
 */
export const GET = withRole('INSTRUCTOR', 'ADMIN')(async function GET(request) {
  try {
    // Parse query parameters for filtering/pagination
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = (page - 1) * limit;

    // Build where clause for search
    const whereClause = search.trim() ? {
      OR: [
        { id: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

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
        name: student.name,
        email: student.email,
        phoneNumber: student.phoneNumber,
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
      where: { status: { not: 'CANCELLED' } }
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
