// file: src/app/api/instructor/sessions/route.js
// description: Updated API route with support for session enabled/disabled status

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';

/**
 * GET /api/instructor/sessions - Get all sessions with enrolled students
 */
export async function GET() {
  try {
    // Get all sessions with their bookings and student information
    const sessions = await prisma.session.findMany({
      include: {
        bookings: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true
              }
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
          bookingDate: booking.createdAt
        }))
      };
    });
    
    // Calculate analytics
    const analytics = calculateAnalytics(formattedSessions);
    
    return NextResponse.json({
      sessions: formattedSessions,
      analytics: analytics
    });
  } catch (error) {
    console.error('Error fetching instructor sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

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
  
  // Time slot popularity
  const timeSlotEnrollment = enabledSessions.reduce((acc, session) => {
    if (!acc[session.timeSlot]) {
      acc[session.timeSlot] = {
        timeSlot: session.timeSlot,
        timeSlotName: session.timeSlotName,
        enrolled: 0,
        capacity: 0
      };
    }
    acc[session.timeSlot].enrolled += session.enrolledCount;
    acc[session.timeSlot].capacity += session.capacity;
    
    return acc;
  }, {});
  
  // Calculate fill rate for each time slot
  const timeSlotPopularity = Object.values(timeSlotEnrollment).map(slot => ({
    ...slot,
    fillRate: slot.capacity > 0 ? Math.round((slot.enrolled / slot.capacity) * 100) : 0
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
    averageSessionsPerStudent: uniqueStudentIds.size ? (totalEnrolled / uniqueStudentIds.size).toFixed(2) : 0,
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
    dayPopularity,
    timeSlotPopularity
  };
}
