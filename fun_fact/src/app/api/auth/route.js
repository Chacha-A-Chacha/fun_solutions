// file: src/app/api/auth/route.js
// description: Fixed auth API route with async cookies support for Next.js 15

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { signToken, setAuthCookie, clearAuthCookie, getAuthToken, verifyToken } from '@/app/lib/utils/auth';
import { validateStudentCredentials, studentLoginSchema } from '@/app/lib/utils/validation';
import { SUCCESS_MESSAGES } from '@/app/lib/constants';

/**
 * POST /api/auth - Login endpoint
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request body against schema
    const result = studentLoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { id, email } = result.data;

    // Validate student credentials
    const validationResult = await validateStudentCredentials(id, email);

    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 401 }
      );
    }

    // Create or update student record
    const student = await prisma.student.upsert({
        where: { id },
        update: { email },
        create: {
          id,
          email,
          name: `Student ${id}` // Default name since it's required but not collected at login
        }
      });

    // Generate JWT token
    const token = await signToken({
      id: student.id,
      email: student.email
    });

    // Set auth cookie (now async)
    await setAuthCookie(token);

    return NextResponse.json({
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      student: {
        id: student.id,
        email: student.email,
        name: student.name,
        phoneNumber: student.phoneNumber
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth - Logout endpoint
 */
export async function DELETE() {
  try {
    // Clear auth cookie (now async)
    await clearAuthCookie();

    return NextResponse.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth - Get current user
 */
export async function GET(request) {
  try {
    // Get auth token from cookies (now async)
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = await verifyToken(token);

    if (!payload) {
      await clearAuthCookie(); // Clear invalid token (now async)
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get fresh student data
    const student = await prisma.student.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true
      }
    });

    if (!student) {
      await clearAuthCookie(); // Clear token if student no longer exists (now async)
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      student,
      message: 'Authentication successful'
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}
