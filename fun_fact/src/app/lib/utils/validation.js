import { z } from 'zod';
import prisma from '../db/prisma-client';
import { ERROR_MESSAGES } from '../constants';
import { getCurrentWeekMonday } from './dates';
import { getSetting } from './settings';

// Student login validation schema
export const studentLoginSchema = z.object({
  id: z.string()
    .min(1, 'Student ID is required')
    .regex(/^DR-\d{4,5}-\d{2}$/, 'Invalid ID format. Should match pattern: DR-XXXX-XX'),
  email: z.string().email('Invalid email format')
});

// Staff login validation schema
export const staffLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// Session booking validation schema
export const sessionBookingSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID')
});

/**
 * Validate student credentials against the database
 * @param {string} id - Student ID
 * @param {string} email - Student email
 * @returns {Promise<Object>} - Validation result
 */
export async function validateStudentCredentials(id, email) {
  try {
    // Check if student exists
    const student = await prisma.student.findFirst({
      where: {
        id,
        email
      }
    });

    if (!student) {
      return {
        valid: false,
        error: ERROR_MESSAGES.INVALID_CREDENTIALS
      };
    }

    return {
      valid: true,
      student
    };
  } catch (error) {
    console.error('Error validating student credentials:', error);
    return {
      valid: false,
      error: ERROR_MESSAGES.SYSTEM_ERROR
    };
  }
}

/**
 * Validate if a student can book a session
 * @param {string} studentId - Student ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} - Validation result
 */
export async function validateSessionBooking(studentId, sessionId) {
  try {
    // Get the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        bookings: true
      }
    });

    if (!session) {
      return {
        valid: false,
        error: 'Session not found'
      };
    }

    // Fetch dynamic settings
    const maxCapacity = await getSetting('max_capacity_per_session', 4);
    const maxDaysPerWeek = await getSetting('max_days_per_week', 3);

    // Only count active bookings for current week toward capacity
    const weekOf = getCurrentWeekMonday();
    const activeBookings = session.bookings.filter(
      b => b.status !== 'CANCELLED' && b.weekOf.getTime() === weekOf.getTime()
    );

    // Check if session is full
    if (activeBookings.length >= maxCapacity) {
      return {
        valid: false,
        error: `This session is already at full capacity (${maxCapacity} students).`
      };
    }

    // Get student's existing active bookings for current week
    const studentBookings = await prisma.booking.findMany({
      where: {
        studentId,
        weekOf,
        status: { not: 'CANCELLED' }
      },
      include: {
        session: true
      }
    });

    // Check if student already booked this day
    const alreadyBookedSameDay = studentBookings.some(
      booking => booking.session.day === session.day
    );

    if (alreadyBookedSameDay) {
      return {
        valid: false,
        error: ERROR_MESSAGES.DAY_ALREADY_BOOKED
      };
    }

    // Check if student reached max days
    if (studentBookings.length >= maxDaysPerWeek) {
      return {
        valid: false,
        error: `You can only select up to ${maxDaysPerWeek} days per week.`
      };
    }

    return {
      valid: true,
      session
    };
  } catch (error) {
    console.error('Error validating session booking:', error);
    return {
      valid: false,
      error: ERROR_MESSAGES.SYSTEM_ERROR
    };
  }
}
