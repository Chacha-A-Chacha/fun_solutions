import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { withAuth, getCurrentStudent } from '@/app/lib/utils/auth';
import { DAYS, DAY_TIME_SLOTS } from '@/app/lib/constants';

/**
 * GET /api/sessions - Get all available sessions with booking counts
 */
export async function GET() {
  try {
    // Get current student if authenticated
    const currentStudent = await getCurrentStudent();
    
    // Get all sessions with their booking counts
    const sessions = await prisma.session.findMany({
      include: {
        bookings: {
          select: {
            id: true,
            studentId: true,
          },
        },
      },
    });

    // Get student's existing bookings if authenticated
    const studentBookings = currentStudent
      ? await prisma.booking.findMany({
          where: { studentId: currentStudent.id },
          select: { sessionId: true },
        })
      : [];

    // Format the sessions with availability information
    const formattedSessions = sessions.map((session) => {
      const bookingCount = session.bookings.length;
      const isAvailable = bookingCount < session.capacity;
      const isBooked = studentBookings.some(
        (booking) => booking.sessionId === session.id
      );

      return {
        id: session.id,
        day: session.day,
        timeSlot: session.timeSlot,
        capacity: session.capacity,
        bookingCount,
        availableSpots: session.capacity - bookingCount,
        isAvailable,
        isBooked,
      };
    });

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/availability - Get session availability grouped by day
 */
export async function getAvailability() {
  try {
    // Get current student if authenticated
    const currentStudent = await getCurrentStudent();
    
    // Calculate availability by day and time slot
    const availability = {};
    
    // Initialize availability object with days and time slots
    Object.values(DAYS).forEach(day => {
      availability[day] = {};
      DAY_TIME_SLOTS[day].forEach(timeSlot => {
        availability[day][timeSlot] = {
          available: 0,
          total: 0,
          isBooked: false
        };
      });
    });
    
    // Get all sessions with their booking counts
    const sessions = await prisma.session.findMany({
      include: {
        bookings: {
          select: {
            id: true,
            studentId: true,
          },
        },
      },
    });
    
    // Get student's existing bookings if authenticated
    const studentBookings = currentStudent
      ? await prisma.booking.findMany({
          where: { studentId: currentStudent.id },
          select: { sessionId: true, session: true },
        })
      : [];
    
    // Fill availability data
    sessions.forEach(session => {
      const { day, timeSlot, capacity } = session;
      const bookingCount = session.bookings.length;
      const isBooked = studentBookings.some(booking => booking.sessionId === session.id);
      
      availability[day][timeSlot] = {
        available: capacity - bookingCount,
        total: capacity,
        isBooked
      };
    });
    
    return NextResponse.json({ availability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

// Attach middleware to routes
export const GET_availability = withAuth(getAvailability);
