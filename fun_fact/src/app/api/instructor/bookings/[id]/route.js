import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { withRole } from '@/app/lib/utils/auth';

// Valid status transitions
const VALID_TRANSITIONS = {
  BOOKED: ['ATTENDED', 'NO_SHOW', 'CANCELLED'],
  ATTENDED: ['COMPLETED', 'INCOMPLETE'],
};

/**
 * PATCH /api/instructor/bookings/:id - Update booking status
 */
export const PATCH = withRole('INSTRUCTOR', 'ADMIN')(async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { status, notes } = await request.json();
    const user = request.user;

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[booking.status];
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${booking.status} to ${status}` },
        { status: 400 }
      );
    }

    // Build update data
    const updateData = {
      status,
      markedById: user.id,
    };

    if (notes !== undefined) updateData.notes = notes;
    if (status === 'ATTENDED') updateData.attendedAt = new Date();
    if (status === 'COMPLETED' || status === 'INCOMPLETE') updateData.completedAt = new Date();
    if (status === 'CANCELLED') updateData.cancelledAt = new Date();

    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: updateData,
        include: {
          student: { select: { id: true, name: true, email: true } },
          session: { select: { day: true, timeSlot: true } },
          markedBy: { select: { name: true } }
        }
      }),
      prisma.bookingStatusHistory.create({
        data: {
          bookingId: id,
          fromStatus: booking.status,
          toStatus: status,
          changedById: user.id,
          reason: notes || null
        }
      })
    ]);

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error('Booking status update error:', error);
    return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
  }
});

/**
 * DELETE /api/instructor/bookings/:id - Cancel a booking (admin only)
 */
export const DELETE = withRole('ADMIN')(async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = request.user;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          markedById: user.id
        }
      }),
      prisma.bookingStatusHistory.create({
        data: {
          bookingId: id,
          fromStatus: booking.status,
          toStatus: 'CANCELLED',
          changedById: user.id,
          reason: 'Cancelled by admin'
        }
      })
    ]);

    return NextResponse.json({ message: 'Booking cancelled' });
  } catch (error) {
    console.error('Booking cancellation error:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
});
