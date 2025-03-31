import { z } from 'zod';
import prisma from '../db';
import { SESSION_CONSTRAINTS, ERROR_MESSAGES } from '../constants';

// Student login validation schema
export const studentLoginSchema = z.object({
  id: z.string()
    .min(1, 'Student ID is required')
    .regex(/^DR-\d{4}-\d{2}$/, 'Invalid ID format. Should match pattern: DR-XXXX-XX'),
  email: z.string().email('Invalid email format')
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

    // Check if session is full
    if (session.bookings.length >= SESSION_CONSTRAINTS.MAX_CAPACITY) {
      return {
        valid: false,
        error: ERROR_MESSAGES.SESSION_FULL
      };
    }

    // Get student's existing bookings
    const studentBookings = await prisma.booking.findMany({
      where: { studentId },
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
    if (studentBookings.length >= SESSION_CONSTRAINTS.MAX_DAYS_PER_STUDENT) {
      return {
        valid: false,
        error: ERROR_MESSAGES.MAX_DAYS_REACHED
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
