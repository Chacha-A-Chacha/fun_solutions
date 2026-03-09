// file: src/app/api/instructor/sessions/route.js
// description: Updated API route with support for session enabled/disabled status

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';
import { withRole } from '@/app/lib/utils/auth';
import { getCurrentWeekMonday, getWeekMondayFor } from '@/app/lib/utils/dates';

/**
 * GET /api/instructor/sessions - Get all sessions with enrolled students
 */
export const GET = withRole('INSTRUCTOR', 'ADMIN')(async function GET(request) {
  try {
    // Support ?weekOf= query param, default to current week
    const { searchParams } = new URL(request.url);
    const weekOfParam = searchParams.get('weekOf');
    const weekOf = weekOfParam ? getWeekMondayFor(new Date(weekOfParam)) : getCurrentWeekMonday();

    // Get all sessions with their bookings for the target week
    const sessions = await prisma.session.findMany({
      include: {
        bookings: {
          where: {
            weekOf,
            status: { not: 'CANCELLED' }
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true
              }
            },
            markedBy: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: [
        { day: 'asc' },
        { timeSlot: 'asc' }
      ]
    });
    
    // Format the session data for display
    const formattedSessions = sessions.map(session => {
      const { day, timeSlot, capacity, bookings, metadata } = session;
      
      // Check if session is enabled (default to true if not specified)
      const isEnabled = metadata?.isEnabled !== false;
      
      return {
        id: session.id,
        day: day,
        dayName: DAY_NAMES[day],
        timeSlot: timeSlot,
        timeSlotName: TIME_SLOT_NAMES[timeSlot],
        capacity: capacity,
        enrolledCount: bookings.length,
        availableSpots: capacity - bookings.length,
        fillPercentage: Math.round((bookings.length / capacity) * 100),
        isEnabled: isEnabled,
        students: bookings.map(booking => ({
          id: booking.student.id,
          name: booking.student.name,
          email: booking.student.email,
          phoneNumber: booking.student.phoneNumber,
          bookingId: booking.id,
          status: booking.status,
          attendedAt: booking.attendedAt,
          completedAt: booking.completedAt,
          notes: booking.notes,
          markedBy: booking.markedBy?.name || null,
          bookingDate: booking.createdAt
        }))
      };
    });
    
    // Calculate analytics
    const analytics = calculateAnalytics(formattedSessions);
    
    return NextResponse.json({
      sessions: formattedSessions,
      analytics: analytics,
      weekOf: weekOf.toISOString()
    });
  } catch (error) {
    console.error('Error fetching instructor sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
});

/**
 * Calculate analytics from session data
 * @param {Array} sessions - The formatted sessions
 * @returns {Object} - Analytics object
 */
function calculateAnalytics(sessions) {
  // Only include enabled sessions in analytics
  const enabledSessions = sessions.filter(s => s.isEnabled !== false);
  
  // Total capacity and enrollment
  const totalCapacity = enabledSessions.reduce((sum, session) => sum + session.capacity, 0);
  const totalEnrolled = enabledSessions.reduce((sum, session) => sum + session.enrolledCount, 0);
  const overallFillRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
  
  // Include disabled sessions count
  const disabledSessionsCount = sessions.length - enabledSessions.length;
  
  // Find most and least popular sessions
  const sortedByFill = [...enabledSessions].sort((a, b) => b.fillPercentage - a.fillPercentage);
  const mostPopularSession = sortedByFill.length > 0 ? sortedByFill[0] : null;
  const leastPopularSession = sortedByFill.length > 0 ? sortedByFill[sortedByFill.length - 1] : null;
  
  // Day popularity
  const dayEnrollment = enabledSessions.reduce((acc, session) => {
    if (!acc[session.day]) {
      acc[session.day] = {
        day: session.day,
        dayName: session.dayName,
        enrolled: 0,
        capacity: 0
      };
    }
    acc[session.day].enrolled += session.enrolledCount;
    acc[session.day].capacity += session.capacity;
    
    return acc;
  }, {});
  
  // Calculate fill rate for each day
  const dayPopularity = Object.values(dayEnrollment).map(day => ({
    ...day,
    fillRate: day.capacity > 0 ? Math.round((day.enrolled / day.capacity) * 100) : 0
  })).sort((a, b) => b.fillRate - a.fillRate);
  
  // Count unique students
  const uniqueStudentIds = new Set();
  enabledSessions.forEach(session => {
    session.students.forEach(student => {
      uniqueStudentIds.add(student.id);
    });
  });
  
  return {
    totalSessions: enabledSessions.length,
    disabledSessionsCount,
    totalCapacity,
    totalEnrolled,
    availableSpots: totalCapacity - totalEnrolled,
    overallFillRate,
    uniqueStudentCount: uniqueStudentIds.size,
    averageSessionsPerStudent: uniqueStudentIds.size ? (totalEnrolled / uniqueStudentIds.size).toFixed(1) : 0,
    mostPopularSession: mostPopularSession ? {
      day: mostPopularSession.dayName,
      timeSlot: mostPopularSession.timeSlotName,
      fillRate: mostPopularSession.fillPercentage
    } : null,
    leastPopularSession: leastPopularSession ? {
      day: leastPopularSession.dayName,
      timeSlot: leastPopularSession.timeSlotName,
      fillRate: leastPopularSession.fillPercentage
    } : null,
    dayPopularity
  };
}
