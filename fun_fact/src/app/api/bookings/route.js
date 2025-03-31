import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { withAuth } from '@/app/lib/utils/auth';
import { validateSessionBooking, sessionBookingSchema } from '@/app/lib/utils/validation';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/app/lib/constants';

/**
 * POST /api/bookings - Create a new booking
 */
async function createBooking(request) {
  try {
    // Get student from auth middleware
    const student = request.student;
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body against schema
    const result = sessionBookingSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { sessionId } = result.data;
    
    // Validate booking against constraints
    const validationResult = await validateSessionBooking(student.id, sessionId);
    
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
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
        },
        include: {
          session: true
        }
      });
    });
    
    return NextResponse.json({
      message: SUCCESS_MESSAGES.BOOKING_CREATED,
      booking: {
        id: booking.id,
        sessionId: booking.sessionId,
        day: booking.session.day,
        timeSlot: booking.session.timeSlot
      }
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings - Get student's bookings
 */
async function getBookings(request) {
  try {
    // Get student from auth middleware
    const student = request.student;
    
    // Get all bookings for the student
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
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bookings/:id - Cancel a booking
 */
async function deleteBooking(request) {
  try {
    // Get student from auth middleware
    const student = request.student;
    
    // Get booking ID from URL
    const url = new URL(request.url);
    const bookingId = url.pathname.split('/').pop();
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }
    
    // Check if booking exists and belongs to the student
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        studentId: student.id
      }
    });
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or not authorized' },
        { status: 404 }
      );
    }
    
    // Delete the booking
    await prisma.booking.delete({
      where: { id: bookingId }
    });
    
    return NextResponse.json({
      message: SUCCESS_MESSAGES.BOOKING_CANCELLED
    });
  } catch (error) {
    console.error('Booking deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}

// Apply auth middleware to all routes
export const POST = withAuth(createBooking);
export const GET = withAuth(getBookings);
export const DELETE = withAuth(deleteBooking);
