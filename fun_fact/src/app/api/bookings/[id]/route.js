// file: src/app/api/bookings/[id]/route.js
// description: This API route handles operations on specific bookings, including deleting bookings by ID.

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { withAuth } from '@/app/lib/utils/auth';
import { SUCCESS_MESSAGES } from '@/app/lib/constants';

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

// Apply auth middleware
export const DELETE = withAuth(deleteBooking);
