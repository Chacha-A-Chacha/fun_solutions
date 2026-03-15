import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';
import { withRole } from '@/app/lib/utils/auth';
import { getSetting } from '@/app/lib/utils/settings';
import { z } from 'zod';

const updateStudentSchema = z.object({
  id: z.string().regex(/^DR-\d{4,5}-\d{2}$/, 'Student ID must be in format DR-XXXX-XX').optional(),
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phoneNumber: z.string().optional().nullable(),
});

/**
 * GET /api/instructor/students/:id - Get a single student with full booking history
 */
export const GET = withRole('INSTRUCTOR', 'ADMIN')(async function GET(request, { params }) {
  try {
    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            session: { select: { day: true, timeSlot: true } },
            markedBy: { select: { name: true } },
            statusHistory: {
              orderBy: { createdAt: 'asc' },
              include: { changedBy: { select: { name: true } } }
            }
          },
          orderBy: [
            { weekOf: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const bookings = student.bookings.map(b => ({
      id: b.id,
      day: b.session.day,
      dayName: DAY_NAMES[b.session.day],
      timeSlot: b.session.timeSlot,
      timeSlotName: TIME_SLOT_NAMES[b.session.timeSlot],
      status: b.status,
      weekOf: b.weekOf,
      attendedAt: b.attendedAt,
      completedAt: b.completedAt,
      cancelledAt: b.cancelledAt,
      notes: b.notes,
      markedBy: b.markedBy?.name || null,
      createdAt: b.createdAt,
      statusHistory: b.statusHistory.map(h => ({
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        changedBy: h.changedBy?.name || null,
        reason: h.reason,
        createdAt: h.createdAt
      }))
    }));

    // Summary stats
    const totalRequired = await getSetting('total_practicals_required', 15);
    const completedCount = bookings.filter(b => b.status === 'COMPLETED').length;
    const summary = {
      totalBookings: bookings.length,
      completed: completedCount,
      attended: bookings.filter(b => b.status === 'ATTENDED' || b.status === 'COMPLETED').length,
      noShows: bookings.filter(b => b.status === 'NO_SHOW').length,
      incomplete: bookings.filter(b => b.status === 'INCOMPLETE').length,
      cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
      totalRequired,
      progressPercent: Math.min(100, Math.round((completedCount / totalRequired) * 100)),
      isComplete: completedCount >= totalRequired,
    };

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phoneNumber: student.phoneNumber,
        createdAt: student.createdAt
      },
      bookings,
      summary
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    return NextResponse.json({ error: 'Failed to fetch student details' }, { status: 500 });
  }
});

/**
 * PATCH /api/instructor/students/:id - Update student details (admin only)
 */
export const PATCH = withRole('ADMIN')(async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = updateStudentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check ID uniqueness if ID is being changed
    if (result.data.id && result.data.id !== id) {
      const idTaken = await prisma.student.findUnique({
        where: { id: result.data.id }
      });
      if (idTaken) {
        return NextResponse.json(
          { error: 'A student with this ID already exists' },
          { status: 400 }
        );
      }
    }

    // Check email uniqueness if email is being changed
    if (result.data.email && result.data.email !== existing.email) {
      const emailTaken = await prisma.student.findUnique({
        where: { email: result.data.email }
      });
      if (emailTaken) {
        return NextResponse.json(
          { error: 'A student with this email already exists' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.student.update({
      where: { id },
      data: result.data
    });

    return NextResponse.json({ message: 'Student updated successfully', student: updated });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
});
