import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { withRole } from '@/app/lib/utils/auth';

const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];

const STUDENT_SELECT = {
  id: true,
  studentNumber: true,
  name: true,
  email: true,
  phoneNumber: true,
  status: true,
  deactivatedAt: true,
};

/**
 * PATCH /api/instructor/students/:id/status - Change a student's status (admin only).
 *  - ACTIVE/INACTIVE: reversible deactivation; keeps data + the student number.
 *  - ARCHIVED: permanent. Renames the id (freeing the student number for reuse via
 *    the Booking FK's ON UPDATE CASCADE) and records the original number in
 *    studentNumber. Terminal — an archived student cannot be changed back.
 */
export const PATCH = withRole('ADMIN')(async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Archiving is one-way: an already-archived student is terminal.
    if (existing.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'This student is archived and cannot be changed.' },
        { status: 400 }
      );
    }

    if (existing.status === status) {
      return NextResponse.json(
        { error: `Student is already ${status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // ── Archive & release the student number ──
    if (status === 'ARCHIVED') {
      const number = existing.studentNumber || existing.id;
      const releasedId = `${existing.id}~${crypto.randomUUID().slice(0, 8)}`;

      const updated = await prisma.student.update({
        where: { id },
        data: {
          id: releasedId,          // FK ON UPDATE CASCADE moves the student's bookings
          studentNumber: number,   // preserve the readable number for history/exports
          status: 'ARCHIVED',
          deactivatedAt: new Date(),
        },
        select: STUDENT_SELECT,
      });

      await prisma.systemLog.create({
        data: {
          action: 'STUDENT_ARCHIVED',
          message: `Student ${number} archived and number released by ${request.user.name}`,
          data: { number, releasedId, by: request.user.id },
        },
      });

      return NextResponse.json({
        message: `Student archived — number ${number} is now available for reuse`,
        student: updated,
      });
    }

    // ── Reversible activate / deactivate ──
    const updated = await prisma.student.update({
      where: { id },
      data: {
        status,
        deactivatedAt: status === 'INACTIVE' ? new Date() : null,
      },
      select: STUDENT_SELECT,
    });

    await prisma.systemLog.create({
      data: {
        action: status === 'INACTIVE' ? 'STUDENT_DEACTIVATED' : 'STUDENT_REACTIVATED',
        message: `Student ${id} ${status === 'INACTIVE' ? 'deactivated' : 'reactivated'} by ${request.user.name}`,
        data: { studentId: id, by: request.user.id },
      },
    });

    return NextResponse.json({
      message: status === 'INACTIVE' ? 'Student deactivated' : 'Student reactivated',
      student: updated,
    });
  } catch (error) {
    console.error('Error updating student status:', error);
    return NextResponse.json({ error: 'Failed to update student status' }, { status: 500 });
  }
});
