// file: src/app/api/instructor/students/route.js
// description: API route to fetch all students with their booking information for instructor dashboard

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';

/**
 * GET /api/instructor/students - Get all students with their booking details
 */
export async function GET(request) {
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

    // Format student data for the frontend
    const formattedStudents = students.map(student => {
      const bookings = student.bookings.map(booking => ({
        id: booking.id,
        sessionId: booking.sessionId,
        day: booking.session.day,
        dayName: DAY_NAMES[booking.session.day],
        timeSlot: booking.session.timeSlot,
        timeSlotName: TIME_SLOT_NAMES[booking.session.timeSlot],
        createdAt: booking.createdAt
      }));

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        phoneNumber: student.phoneNumber,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        bookings: bookings,
        bookingCount: bookings.length,
        bookedDays: bookings.map(b => b.dayName).join(', ') || 'No bookings'
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Calculate analytics
    const analytics = {
      totalStudents: totalCount,
      studentsWithBookings: formattedStudents.filter(s => s.bookingCount > 0).length,
      studentsWithoutBookings: formattedStudents.filter(s => s.bookingCount === 0).length,
      averageBookingsPerStudent: totalCount > 0
        ? (formattedStudents.reduce((sum, s) => sum + s.bookingCount, 0) / totalCount).toFixed(2)
        : 0,
      studentsWithMaxBookings: formattedStudents.filter(s => s.bookingCount >= 3).length,
      totalBookings: formattedStudents.reduce((sum, s) => sum + s.bookingCount, 0)
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
}
