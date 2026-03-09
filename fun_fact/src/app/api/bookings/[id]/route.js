// file: src/app/api/bookings/[id]/route.js
// Improved API route for managing individual bookings

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { withAuth } from '@/app/lib/utils/auth';
import { SUCCESS_MESSAGES } from '@/app/lib/constants';
import { getCurrentWeekMonday } from '@/app/lib/utils/dates';

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

    // Only allow cancelling BOOKED status
    if (booking.status !== 'BOOKED') {
      return createErrorResponse('Only booked sessions can be cancelled');
    }

    // Soft delete — update status to CANCELLED
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      }),
      prisma.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: 'BOOKED',
          toStatus: 'CANCELLED',
          reason: 'Cancelled by student'
        }
      })
    ]);

    return createSuccessResponse({
      deletedBooking: {
        id: bookingId,
        sessionId: booking.sessionId,
        day: booking.session.day,
        timeSlot: booking.session.timeSlot
      }
    }, SUCCESS_MESSAGES.BOOKING_CANCELLED);
  } catch (error) {
    console.error('Booking deletion error:', error);
    return createErrorResponse('Failed to cancel booking', 500);
  }
}

// Apply auth middleware
export const DELETE = withAuth(deleteBooking);
