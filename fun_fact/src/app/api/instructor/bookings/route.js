import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { withRole } from '@/app/lib/utils/auth';
import { getCurrentWeekMonday } from '@/app/lib/utils/dates';
import { SESSION_CONSTRAINTS, ERROR_MESSAGES } from '@/app/lib/constants';

/**
 * POST /api/instructor/bookings - Add a student to a session (instructor/admin)
 */
export const POST = withRole('INSTRUCTOR', 'ADMIN')(async function POST(request) {
  try {
    const { studentId, sessionId } = await request.json();

    if (!studentId || !sessionId) {
      return NextResponse.json(
        { error: 'studentId and sessionId are required' },
        { status: 400 }
      );
    }

    const weekOf = getCurrentWeekMonday();

    // Check student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check session exists and get current bookings
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        bookings: {
          where: { weekOf, status: { not: 'CANCELLED' } }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Licence class must match, and the class must be offered at this slot.
    if (session.capacity <= 0) {
      return NextResponse.json({ error: 'This session is not offered for its licence class.' }, { status: 400 });
    }
    if (student.category !== session.category) {
      return NextResponse.json(
        { error: `Student is licence class ${student.category}, but this session is for ${session.category}.` },
        { status: 400 }
      );
    }

    // Check capacity
    if (session.bookings.length >= (session.capacity || SESSION_CONSTRAINTS.MAX_CAPACITY)) {
      return NextResponse.json({ error: ERROR_MESSAGES.SESSION_FULL }, { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.booking.findFirst({
      where: { studentId, sessionId, weekOf, status: { not: 'CANCELLED' } }
    });
    if (existing) {
      return NextResponse.json({ error: 'Student already booked for this session' }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        studentId,
        sessionId,
        category: session.category,
        status: 'BOOKED',
        weekOf
      },
      include: {
        student: { select: { id: true, name: true, email: true, phoneNumber: true } },
        session: { select: { day: true, timeSlot: true } }
      }
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Instructor booking creation error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Duplicate booking' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
});
