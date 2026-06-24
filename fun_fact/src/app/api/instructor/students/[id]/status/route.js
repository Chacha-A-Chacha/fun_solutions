import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { withRole } from '@/app/lib/utils/auth';

const VALID_STATUSES = ['ACTIVE', 'INACTIVE'];

/**
 * PATCH /api/instructor/students/:id/status - Activate or deactivate a student (admin only).
 * Deactivating keeps all data and history but revokes the student's access.
 */
export const PATCH = withRole('ADMIN')(async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'status must be ACTIVE or INACTIVE' },
        { status: 400 }
      );
    }

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (existing.status === status) {
      return NextResponse.json(
        { error: `Student is already ${status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        status,
        deactivatedAt: status === 'INACTIVE' ? new Date() : null
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        status: true,
        deactivatedAt: true
      }
    });

    await prisma.systemLog.create({
      data: {
        action: status === 'INACTIVE' ? 'STUDENT_DEACTIVATED' : 'STUDENT_REACTIVATED',
        message: `Student ${id} ${status === 'INACTIVE' ? 'deactivated' : 'reactivated'} by ${request.user.name}`,
        data: { studentId: id, by: request.user.id }
      }
    });

    return NextResponse.json({
      message: status === 'INACTIVE' ? 'Student deactivated' : 'Student reactivated',
      student: updated
    });
  } catch (error) {
    console.error('Error updating student status:', error);
    return NextResponse.json({ error: 'Failed to update student status' }, { status: 500 });
  }
});
