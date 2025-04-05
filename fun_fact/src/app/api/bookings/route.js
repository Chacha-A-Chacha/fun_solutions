// file: src/app/api/bookings/route.js
// Improved API route for bookings with better error handling and optimistic UI support

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { withAuth } from '@/app/lib/utils/auth';
import { validateSessionBooking, sessionBookingSchema } from '@/app/lib/utils/validation';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/app/lib/constants';

/**
 * Response helper functions
 */
const createErrorResponse = (message, status = 400) => {
  return NextResponse.json({ error: message }, { status });
};

const createSuccessResponse = (data, message, status = 200) => {
  return NextResponse.json({ ...data, message }, { status });
};

/**
 * POST /api/bookings - Create a new booking
 */
async function createBooking(request) {
  try {
    // Get student from auth middleware
    const student = request.student;
    
    // Parse request body
    const body = await request.json().catch(() => ({}));
    
    // Validate request body against schema
    const result = sessionBookingSchema.safeParse(body);
    if (!result.success) {
      return createErrorResponse(result.error.errors[0].message);
    }
    
    const { sessionId } = result.data;
    
    // Validate booking against constraints
    const validationResult = await validateSessionBooking(student.id, sessionId);
    
    if (!validationResult.valid) {
      return createErrorResponse(validationResult.error);
    }
    
    // Get session details before booking
    const sessionBefore = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { day: true, timeSlot: true }
    });
    
    if (!sessionBefore) {
      return createErrorResponse('Session not found');
    }
    
    // Create booking with transaction to prevent race conditions
    const booking = await prisma.$transaction(async (tx) => {
      // Lock the session for update (prevent concurrent bookings)
      const session = await tx.session.findUnique({
        where: { id: sessionId },
        include: { bookings: true }
      });
      
      // Double-check session capacity
      if (session.bookings.length >= session.capacity) {
        throw new Error(ERROR_MESSAGES.SESSION_FULL);
      }
      
      // Create the booking
      return tx.booking.create({
        data: {
          student: { connect: { id: student.id } },
          session: { connect: { id: sessionId } }
        }
      });
    });
    
    // Format booking with session details for client
    const formattedBooking = {
      id: booking.id,
      sessionId,
      day: sessionBefore.day,
      timeSlot: sessionBefore.timeSlot,
      createdAt: booking.createdAt
    };
    
    return createSuccessResponse(
      { booking: formattedBooking },
      SUCCESS_MESSAGES.BOOKING_CREATED
    );
  } catch (error) {
    console.error('Booking creation error:', error);
    
    // Handle specific error cases
    if (error.message === ERROR_MESSAGES.SESSION_FULL) {
      return createErrorResponse(ERROR_MESSAGES.SESSION_FULL);
    }
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return createErrorResponse('You have already booked this session');
    }
    
    return createErrorResponse(error.message || 'Failed to create booking', 500);
  }
}

/**
 * GET /api/bookings - Get student's bookings
 */
async function getBookings(request) {
  try {
    // Get student from auth middleware
    const student = request.student;
    
    // Get all bookings for the student with their sessions
    const bookings = await prisma.booking.findMany({
      where: { studentId: student.id },
      include: {
        session: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // Format the bookings
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      sessionId: booking.sessionId,
      day: booking.session.day,
      timeSlot: booking.session.timeSlot,
      createdAt: booking.createdAt
    }));
    
    return NextResponse.json({ bookings: formattedBookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return createErrorResponse('Failed to fetch bookings', 500);
  }
}

// Apply auth middleware to the routes
export const POST = withAuth(createBooking);
export const GET = withAuth(getBookings);
