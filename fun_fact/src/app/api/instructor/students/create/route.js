import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { z } from 'zod';

// Validation schema for student creation
const createStudentSchema = z.object({
  id: z.string()
    .min(1, 'Student ID is required')
    .regex(/^DR-\d{4,5}-\d{2}$/, 'Student ID must be in format DR-XXXX-XX'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phoneNumber: z.string().optional()
});

/**
 * POST /api/instructor/students/create - Create a new student
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    const validationResult = createStudentSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0].message;
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
    
    const { id, name, email, phoneNumber } = validationResult.data;
    
    // Check if student ID already exists
    const existingStudentById = await prisma.student.findUnique({
      where: { id }
    });
    
    if (existingStudentById) {
      return NextResponse.json(
        { error: 'Student with this ID already exists' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingStudentByEmail = await prisma.student.findUnique({
      where: { email }
    });
    
    if (existingStudentByEmail) {
      return NextResponse.json(
        { error: 'Student with this email already exists' },
        { status: 400 }
      );
    }
    
    // Create the student
    const student = await prisma.student.create({
      data: {
        id,
        name,
        email,
        phoneNumber: phoneNumber || null
      }
    });
    
    return NextResponse.json({
      message: 'Student created successfully',
      student
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
