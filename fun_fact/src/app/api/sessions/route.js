// file: src/app/api/sessions/route.js
// Updated API route for retrieving available sessions with respect to enabled/disabled status

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { withAuth } from '@/app/lib/utils/auth';

/**
 * Response helper functions
 */
const createErrorResponse = (message, status = 400) => {
  return NextResponse.json({ error: message }, { status });
};

/**
 * GET /api/sessions - Get all available sessions with booking status
 */
async function getSessions(request) {
  try {
    // Get student from auth middleware
    const student = request.student;
    
    // Get all sessions with their bookings
    const sessions = await prisma.session.findMany({
      include: {
        bookings: {
          select: {
            id: true,
            studentId: true
          }
        }
      },
      orderBy: [
        { day: 'asc' },
        { timeSlot: 'asc' }
      ]
    });
    
    // Get student's bookings to check which sessions they've booked
    const studentBookings = await prisma.booking.findMany({
      where: { studentId: student.id },
      select: { sessionId: true }
    });
    
    // Set of sessionIds the student has booked
    const bookedSessionIds = new Set(
      studentBookings.map(booking => booking.sessionId)
    );
    
    // Format the sessions
    const formattedSessions = sessions
      // Filter out disabled sessions
      .filter(session => session.metadata?.isEnabled !== false)
      .map(session => {
        // Check if this session is booked by the student
        const isBooked = bookedSessionIds.has(session.id);
        
        // Check availability
        const availableSpots = session.capacity - session.bookings.length;
        const isAvailable = availableSpots > 0;
        
        return {
          id: session.id,
          day: session.day,
          timeSlot: session.timeSlot,
          capacity: session.capacity,
          availableSpots,
          isAvailable,
          isBooked,
          bookings: session.bookings.map(b => ({
            id: b.id,
            isCurrentStudent: b.studentId === student.id
          }))
        };
      });
    
    return NextResponse.json({ 
      sessions: formattedSessions,
      // Include last updated time to help with cache validation
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return createErrorResponse('Failed to fetch sessions', 500);
  }
}

// Apply auth middleware
export const GET = withAuth(getSessions);
