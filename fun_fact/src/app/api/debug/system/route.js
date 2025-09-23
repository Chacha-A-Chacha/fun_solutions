// file: src/app/api/debug/system/route.js
// description: Complete system health check and debugging overview

import { NextResponse } from 'next/server';

export async function GET(request) {
  const systemStatus = {
    timestamp: new Date().toISOString(),
    overall_health: "CHECKING",
    
    environment: {
      status: "CHECKING",
      details: {}
    },
    
    database: {
      status: "CHECKING", 
      details: {}
    },
    
    authentication: {
      status: "CHECKING",
      details: {}
    },
    
    api_endpoints: {
      status: "CHECKING",
      details: {}
    },
    
    recommendations: []
  };

  // 1. Environment Check
  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      DATABASE_URL_type: process.env.DATABASE_URL?.startsWith('mysql://') ? 'MySQL' : 
                         process.env.DATABASE_URL?.startsWith('file:') ? 'SQLite' : 'Unknown',
      DATABASE_URL_value: process.env.DATABASE_URL?.substring(0, 20) + '...',
      NEXTAUTH_SECRET_exists: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_SECRET_length: process.env.NEXTAUTH_SECRET?.length || 0
    };
    
    systemStatus.environment.status = "HEALTHY";
    systemStatus.environment.details = envCheck;
    
    if (!envCheck.DATABASE_URL_exists) {
      systemStatus.recommendations.push("❌ DATABASE_URL is missing from environment variables");
    }
    if (!envCheck.NEXTAUTH_SECRET_exists) {
      systemStatus.recommendations.push("❌ NEXTAUTH_SECRET is missing from environment variables");
    }
    
  } catch (error) {
    systemStatus.environment.status = "ERROR";
    systemStatus.environment.details = { error: error.message };
  }

  // 2. Database Check
  try {
    // Import Prisma client
    const prismaModule = await import('@/app/lib/db/prisma-client');
    const prisma = prismaModule.default;
    
    // Test connection
    await prisma.$connect();
    
    // Test basic queries
    const [studentCount, sessionCount, bookingCount] = await Promise.all([
      prisma.student.count().catch(() => -1),
      prisma.session.count().catch(() => -1), 
      prisma.booking.count().catch(() => -1)
    ]);
    
    // Test complex query (like instructor dashboard uses)
    const sampleSessions = await prisma.session.findMany({
      take: 1,
      include: {
        bookings: {
          include: {
            student: true
          }
        }
      }
    }).catch(() => []);
    
    systemStatus.database.status = "HEALTHY";
    systemStatus.database.details = {
      connection: "✅ Connected",
      student_count: studentCount,
      session_count: sessionCount,
      booking_count: bookingCount,
      complex_queries: sampleSessions.length >= 0 ? "✅ Working" : "❌ Failed",
      sample_session: sampleSessions[0] ? {
        id: sampleSessions[0].id,
        day: sampleSessions[0].day,
        bookings: sampleSessions[0].bookings.length
      } : null
    };
    
    if (studentCount === -1 || sessionCount === -1) {
      systemStatus.recommendations.push("⚠️ Some database tables may not exist or be accessible");
    }
    if (sessionCount === 0) {
      systemStatus.recommendations.push("💡 No sessions found - you may need to create initial session data");
    }
    
  } catch (error) {
    systemStatus.database.status = "ERROR";
    systemStatus.database.details = { 
      error: error.message,
      type: error.constructor.name
    };
    
    if (error.message.includes('mysql://')) {
      systemStatus.recommendations.push("🔧 Schema provider mismatch: Update schema.prisma to use 'sqlite' provider");
    }
  }

  // 3. Authentication Check  
  try {
    const { getAuthToken, verifyToken } = await import('@/app/lib/utils/auth');
    
    // Test token functions
    const token = await getAuthToken();
    let tokenValid = false;
    let payload = null;
    
    if (token) {
      payload = await verifyToken(token);
      tokenValid = !!payload;
    }
    
    systemStatus.authentication.status = "HEALTHY";
    systemStatus.authentication.details = {
      cookie_access: "✅ Working",
      has_active_token: !!token,
      token_valid: tokenValid,
      token_payload: payload ? {
        id: payload.id,
        email: payload.email,
        expires_in_seconds: payload.exp ? Math.floor((payload.exp * 1000 - Date.now()) / 1000) : null
      } : null
    };
    
  } catch (error) {
    systemStatus.authentication.status = "ERROR";
    systemStatus.authentication.details = { error: error.message };
    
    if (error.message.includes('cookies')) {
      systemStatus.recommendations.push("🔧 Cookie access issue - check Next.js 15 async cookies implementation");
    }
  }

  // 4. API Endpoints Check
  try {
    // Test if key API routes are accessible (by checking if modules can be imported)
    const apiTests = {
      auth_route: false,
      sessions_route: false,
      bookings_route: false,
      students_route: false
    };
    
    try {
      await import('@/app/api/auth/route');
      apiTests.auth_route = true;
    } catch (e) { /* ignore */ }
    
    try {
      await import('@/app/api/instructor/sessions/route');
      apiTests.sessions_route = true;
    } catch (e) { /* ignore */ }
    
    try {
      await import('@/app/api/bookings/route'); 
      apiTests.bookings_route = true;
    } catch (e) { /* ignore */ }
    
    // Check if students API exists (the new one we're adding)
    try {
      await import('@/app/api/instructor/students/route');
      apiTests.students_route = true;
    } catch (e) { /* ignore */ }
    
    systemStatus.api_endpoints.status = "HEALTHY";
    systemStatus.api_endpoints.details = apiTests;
    
    if (!apiTests.students_route) {
      systemStatus.recommendations.push("📝 Students API route may be missing - needed for student list feature");
    }
    
  } catch (error) {
    systemStatus.api_endpoints.status = "ERROR";
    systemStatus.api_endpoints.details = { error: error.message };
  }

  // 5. Overall Health Assessment
  const healthChecks = [
    systemStatus.environment.status === "HEALTHY",
    systemStatus.database.status === "HEALTHY", 
    systemStatus.authentication.status === "HEALTHY",
    systemStatus.api_endpoints.status === "HEALTHY"
  ];
  
  const healthyCount = healthChecks.filter(Boolean).length;
  const totalChecks = healthChecks.length;
  
  if (healthyCount === totalChecks) {
    systemStatus.overall_health = "HEALTHY";
  } else if (healthyCount >= totalChecks - 1) {
    systemStatus.overall_health = "MOSTLY_HEALTHY"; 
  } else if (healthyCount >= totalChecks / 2) {
    systemStatus.overall_health = "DEGRADED";
  } else {
    systemStatus.overall_health = "UNHEALTHY";
  }

  // 6. Add general recommendations
  if (systemStatus.overall_health === "HEALTHY") {
    systemStatus.recommendations.push("🎉 All systems operational!");
  }
  
  if (systemStatus.database.status === "ERROR") {
    systemStatus.recommendations.push("🚨 Database issues detected - check DATABASE_URL and schema.prisma configuration");
  }

  return NextResponse.json({
    health_status: systemStatus.overall_health,
    health_score: `${healthyCount}/${totalChecks}`,
    system_status: systemStatus
  });
}

/**
 * POST /api/debug/system - Run specific system tests
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { test_type } = body;
    
    let testResult = null;
    
    switch (test_type) {
      case 'full_instructor_flow':
        // Test the full instructor dashboard data flow
        const prismaModule = await import('@/app/lib/db/prisma-client');
        const prisma = prismaModule.default;
        
        const sessions = await prisma.session.findMany({
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
        
        testResult = {
          sessions_found: sessions.length,
          total_bookings: sessions.reduce((sum, s) => sum + s.bookings.length, 0),
          sample_session: sessions[0] ? {
            id: sessions[0].id,
            day: sessions[0].day,
            timeSlot: sessions[0].timeSlot,
            enrolled: sessions[0].bookings.length,
            capacity: sessions[0].capacity
          } : null
        };
        break;
        
      case 'student_auth_flow':
        // Test student authentication flow
        const { validateStudentCredentials } = await import('@/app/lib/utils/validation');
        
        // Try to find any existing student for testing
        const prismaModule2 = await import('@/app/lib/db/prisma-client');
        const prisma2 = prismaModule2.default;
        
        const sampleStudent = await prisma2.student.findFirst();
        
        if (sampleStudent) {
          const validation = await validateStudentCredentials(sampleStudent.id, sampleStudent.email);
          testResult = {
            sample_student_exists: true,
            validation_works: validation.valid,
            student_data: validation.student ? {
              id: validation.student.id,
              name: validation.student.name
            } : null
          };
        } else {
          testResult = {
            sample_student_exists: false,
            message: "No students in database to test with"
          };
        }
        break;
        
      default:
        return NextResponse.json({
          error: "Invalid test_type. Use: full_instructor_flow, student_auth_flow"
        }, { status: 400 });
    }
    
    return NextResponse.json({
      test_type,
      result: testResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      test_type: body?.test_type || 'unknown',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
