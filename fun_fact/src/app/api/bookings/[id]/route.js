// file: src/app/api/bookings/[id]/route.js
// Improved API route for managing individual bookings

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { withAuth } from '@/app/lib/utils/auth';
import { SUCCESS_MESSAGES } from '@/app/lib/constants';

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
 * DELETE /api/bookings/:id - Cancel a booking
 */
async function deleteBooking(request, { params }) {
  try {
    // Get student from auth middleware
    const student = request.student;
    
    // Get booking ID from route params
    const bookingId = params.id;
    
    if (!bookingId) {
      return createErrorResponse('Booking ID is required');
    }
    
    // Fetch the booking with session details before deleting
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        studentId: student.id
      },
      include: {
        session: {
          select: {
            id: true,
            day: true,
            timeSlot: true
          }
        }
      }
    });
    
    if (!booking) {
      return createErrorResponse('Booking not found or not authorized', 404);
    }
    
    // Store session details for response
    const sessionDetails = {
      id: booking.session.id,
      day: booking.session.day,
      timeSlot: booking.session.timeSlot
    };
    
    // Delete the booking
    await prisma.booking.delete({
      where: { id: bookingId }
    });
    
    return createSuccessResponse({
      // Include session details to help client-side state management
      deletedBooking: {
        id: bookingId,
        sessionId: booking.sessionId,
        day: sessionDetails.day,
        timeSlot: sessionDetails.timeSlot
      }
    }, SUCCESS_MESSAGES.BOOKING_CANCELLED);
  } catch (error) {
    console.error('Booking deletion error:', error);
    return createErrorResponse('Failed to cancel booking', 500);
  }
}

// Apply auth middleware
export const DELETE = withAuth(deleteBooking);
