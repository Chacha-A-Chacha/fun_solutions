import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { signToken, setAuthCookie, clearAuthCookie } from '@/lib/utils/auth';
import { validateStudentCredentials, studentLoginSchema } from '@/lib/utils/validation';
import { SUCCESS_MESSAGES } from '@/lib/constants';

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
      create: { id, email }
    });
    
    // Generate JWT token
    const token = await signToken({
      id: student.id,
      email: student.email
    });
    
    // Set auth cookie
    setAuthCookie(token);
    
    return NextResponse.json({
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      student: {
        id: student.id,
        email: student.email
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
    clearAuthCookie();
    
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
    // This will be handled by middleware to check the token
    const student = request.student;
    
    if (!student) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ student });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}
