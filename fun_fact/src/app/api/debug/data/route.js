// file: src/app/api/debug/data/route.js
// description: Comprehensive data fetching and database debugging endpoint

import { NextResponse } from 'next/server';

export async function GET(request) {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    database_status: {
      client_import: { success: false, error: null },
      connection: { success: false, error: null },
      schema_validation: { success: false, error: null }
    },
    
    basic_queries: {
      student_count: { success: false, count: 0, error: null },
      session_count: { success: false, count: 0, error: null },
      booking_count: { success: false, count: 0, error: null }
    },
    
    complex_queries: {
      sessions_with_bookings: { success: false, data: null, error: null },
      students_with_bookings: { success: false, data: null, error: null }
    },
    
    schema_info: {
      database_provider: null,
      database_url_type: null,
      models_available: []
    }
  };

  // Test 1: Prisma Client Import
  let prisma = null;
  try {
    const prismaModule = await import('@/app/lib/db/prisma-client');
    prisma = prismaModule.default;
    debugInfo.database_status.client_import.success = true;
  } catch (error) {
    debugInfo.database_status.client_import.error = error.message;
    return NextResponse.json({
      status: "DATA_DEBUG_FAILED",
      error: "Failed to import Prisma client",
      debug_info: debugInfo
    }, { status: 500 });
  }

  // Test 2: Database Connection
  try {
    await prisma.$connect();
    debugInfo.database_status.connection.success = true;
  } catch (error) {
    debugInfo.database_status.connection.error = error.message;
  }

  // Test 3: Schema Validation (try a simple query)
  try {
    await prisma.$queryRaw`SELECT 1`;
    debugInfo.database_status.schema_validation.success = true;
  } catch (error) {
    debugInfo.database_status.schema_validation.error = error.message;
  }

  // Get schema info
  debugInfo.schema_info.database_url_type = process.env.DATABASE_URL?.startsWith('mysql://') ? 'MySQL' : 
                                           process.env.DATABASE_URL?.startsWith('file:') ? 'SQLite' : 'Unknown';

  // Test 4: Basic Queries
  // Student count
  try {
    const count = await prisma.student.count();
    debugInfo.basic_queries.student_count.success = true;
    debugInfo.basic_queries.student_count.count = count;
  } catch (error) {
    debugInfo.basic_queries.student_count.error = error.message;
  }

  // Session count
  try {
    const count = await prisma.session.count();
    debugInfo.basic_queries.session_count.success = true;
    debugInfo.basic_queries.session_count.count = count;
  } catch (error) {
    debugInfo.basic_queries.session_count.error = error.message;
  }

  // Booking count
  try {
    const count = await prisma.booking.count();
    debugInfo.basic_queries.booking_count.success = true;
    debugInfo.basic_queries.booking_count.count = count;
  } catch (error) {
    debugInfo.basic_queries.booking_count.error = error.message;
  }

  // Test 5: Complex Queries
  // Sessions with bookings (like instructor dashboard)
  try {
    const sessions = await prisma.session.findMany({
      take: 5, // Limit to 5 for debugging
      include: {
        bookings: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { day: 'asc' },
        { timeSlot: 'asc' }
      ]
    });

    debugInfo.complex_queries.sessions_with_bookings.success = true;
    debugInfo.complex_queries.sessions_with_bookings.data = {
      count: sessions.length,
      sample: sessions.map(session => ({
        id: session.id,
        day: session.day,
        timeSlot: session.timeSlot,
        capacity: session.capacity,
        enrolled: session.bookings.length,
        metadata_type: typeof session.metadata,
        has_students: session.bookings.length > 0,
        students: session.bookings.map(b => ({
          student_id: b.student.id,
          student_name: b.student.name
        }))
      }))
    };
  } catch (error) {
    debugInfo.complex_queries.sessions_with_bookings.error = error.message;
  }

  // Students with bookings
  try {
    const students = await prisma.student.findMany({
      take: 5, // Limit to 5 for debugging
      include: {
        bookings: {
          include: {
            session: {
              select: {
                day: true,
                timeSlot: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    debugInfo.complex_queries.students_with_bookings.success = true;
    debugInfo.complex_queries.students_with_bookings.data = {
      count: students.length,
      sample: students.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        booking_count: student.bookings.length,
        sessions: student.bookings.map(b => ({
          day: b.session.day,
          time_slot: b.session.timeSlot
        }))
      }))
    };
  } catch (error) {
    debugInfo.complex_queries.students_with_bookings.error = error.message;
  }

  // Test 6: Table Structure Check
  try {
    // Try to get the first record from each table to verify structure
    const sampleStudent = await prisma.student.findFirst();
    const sampleSession = await prisma.session.findFirst();
    const sampleBooking = await prisma.booking.findFirst();

    debugInfo.table_structure = {
      student_fields: sampleStudent ? Object.keys(sampleStudent) : [],
      session_fields: sampleSession ? Object.keys(sampleSession) : [],
      booking_fields: sampleBooking ? Object.keys(sampleBooking) : [],
      
      student_sample: sampleStudent ? {
        id: sampleStudent.id,
        has_name: !!sampleStudent.name,
        has_email: !!sampleStudent.email,
        created_at_type: typeof sampleStudent.createdAt
      } : null,
      
      session_sample: sampleSession ? {
        id: sampleSession.id,
        day: sampleSession.day,
        timeSlot: sampleSession.timeSlot,
        capacity: sampleSession.capacity,
        metadata_type: typeof sampleSession.metadata,
        metadata_value: sampleSession.metadata
      } : null
    };
  } catch (error) {
    debugInfo.table_structure = { error: error.message };
  }

  // Summary
  const summary = {
    database_connected: debugInfo.database_status.connection.success,
    basic_queries_work: debugInfo.basic_queries.student_count.success && 
                       debugInfo.basic_queries.session_count.success,
    complex_queries_work: debugInfo.complex_queries.sessions_with_bookings.success,
    total_records: {
      students: debugInfo.basic_queries.student_count.count,
      sessions: debugInfo.basic_queries.session_count.count,
      bookings: debugInfo.basic_queries.booking_count.count
    },
    ready_for_app: debugInfo.database_status.connection.success && 
                   debugInfo.basic_queries.student_count.success &&
                   debugInfo.complex_queries.sessions_with_bookings.success
  };

  return NextResponse.json({
    status: summary.ready_for_app ? "DATA_DEBUG_SUCCESS" : "DATA_DEBUG_ISSUES",
    summary,
    debug_details: debugInfo
  });
}

/**
 * POST /api/debug/data - Test specific queries
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { query_type, params } = body;
    
    const prismaModule = await import('@/app/lib/db/prisma-client');
    const prisma = prismaModule.default;
    
    let result = null;
    
    switch (query_type) {
      case 'find_student':
        if (params?.id) {
          result = await prisma.student.findUnique({
            where: { id: params.id },
            include: { bookings: true }
          });
        }
        break;
        
      case 'find_sessions_by_day':
        if (params?.day) {
          result = await prisma.session.findMany({
            where: { day: params.day },
            include: { bookings: true }
          });
        }
        break;
        
      case 'instructor_sessions':
        result = await prisma.session.findMany({
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
          },
          orderBy: [
            { day: 'asc' },
            { timeSlot: 'asc' }
          ]
        });
        break;
        
      default:
        return NextResponse.json({
          error: "Invalid query_type. Use: find_student, find_sessions_by_day, instructor_sessions"
        }, { status: 400 });
    }
    
    return NextResponse.json({
      status: "QUERY_SUCCESS",
      query_type,
      params,
      result_count: Array.isArray(result) ? result.length : (result ? 1 : 0),
      result: result
    });
    
  } catch (error) {
    return NextResponse.json({
      status: "QUERY_FAILED",
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
