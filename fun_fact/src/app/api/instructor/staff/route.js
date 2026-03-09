import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withRole } from '@/app/lib/utils/auth';

const createStaffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['INSTRUCTOR', 'ADMIN']).default('INSTRUCTOR'),
});

/**
 * POST /api/instructor/staff - Create a new instructor/admin (admin only)
 */
export const POST = withRole('ADMIN')(async function POST(request) {
  try {
    const body = await request.json();

    const result = createStaffSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, role } = result.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'A staff member with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    return NextResponse.json({ message: 'Staff member created successfully', user }, { status: 201 });
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 });
  }
});
