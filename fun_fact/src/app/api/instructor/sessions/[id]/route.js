// file: src/app/api/instructor/sessions/[id]/route.js
// description: API route to manage individual session settings, including enabling and disabling sessions.

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';

/**
 * Response helper functions
 */
const createErrorResponse = (message, status = 400) => {
  return NextResponse.json({ error: message }, { status });
};

const createSuccessResponse = (data, message, status = 200) => {
  return NextResponse.json({ ...data, message }, { status });
};

/**
 * PATCH /api/instructor/sessions/:id - Update session status (enabled/disabled)
 */
export async function PATCH(request, { params }) {
  try {
    const sessionId = params.id;
    
    // Validate session ID
    if (!sessionId) {
      return createErrorResponse('Session ID is required');
    }
    
    // Parse request body
    const body = await request.json();
    
    // Extract isEnabled flag - default to true if not provided
    const { isEnabled = true } = body;
    
    // Validate isEnabled is a boolean
    if (typeof isEnabled !== 'boolean') {
      return createErrorResponse('isEnabled must be a boolean value');
    }
    
    // Check if session exists
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        bookings: {
          select: { id: true }
        }
      }
    });
    
    if (!existingSession) {
      return createErrorResponse('Session not found', 404);
    }
    
    // Update the session's enabled status
    // We implement this by storing a metadata field in the Session model
    // This assumes you've added a 'metadata' JSON field to your Session model
    // If you don't have this field, you'll need to migrate your database
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        metadata: {
          ...(existingSession.metadata || {}),
          isEnabled: isEnabled
        }
      },
      include: {
        bookings: {
          select: {
            id: true,
            studentId: true
          }
        }
      }
    });
    
    // Format response data
    const response = {
      id: updatedSession.id,
      day: updatedSession.day,
      timeSlot: updatedSession.timeSlot,
      capacity: updatedSession.capacity,
      enrolledCount: updatedSession.bookings.length,
      isEnabled: updatedSession.metadata?.isEnabled ?? true
    };
    
    return createSuccessResponse(
      { session: response },
      `Session ${isEnabled ? 'enabled' : 'disabled'} successfully`
    );
  } catch (error) {
    console.error('Error updating session status:', error);
    return createErrorResponse('Failed to update session status', 500);
  }
}

/**
 * GET /api/instructor/sessions/:id - Get details of a specific session
 */
export async function GET(request, { params }) {
  try {
    const sessionId = params.id;
    
    // Validate session ID
    if (!sessionId) {
      return createErrorResponse('Session ID is required');
    }
    
    // Fetch session with bookings and student information
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        bookings: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true
              }
            }
          }
        }
      }
    });
    
    if (!session) {
      return createErrorResponse('Session not found', 404);
    }
    
    // Format session data
    const formattedSession = {
      id: session.id,
      day: session.day,
      timeSlot: session.timeSlot,
      capacity: session.capacity,
      enrolledCount: session.bookings.length,
      availableSpots: session.capacity - session.bookings.length,
      isEnabled: session.metadata?.isEnabled ?? true,
      students: session.bookings.map(booking => ({
        id: booking.student.id,
        name: booking.student.name,
        email: booking.student.email,
        phoneNumber: booking.student.phoneNumber,
        bookingId: booking.id,
        bookingDate: booking.createdAt
      }))
    };
    
    return NextResponse.json({ session: formattedSession });
  } catch (error) {
    console.error('Error fetching session details:', error);
    return createErrorResponse('Failed to fetch session details', 500);
  }
}
