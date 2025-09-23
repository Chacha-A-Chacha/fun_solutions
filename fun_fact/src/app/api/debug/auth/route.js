// file: src/app/api/debug/auth/route.js
// description: Comprehensive authentication debugging endpoint

import { NextResponse } from 'next/server';
import { getAuthToken, verifyToken, getAuthenticatedStudent } from '@/app/lib/utils/auth';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      request_url: request.url,
      
      // Test cookie access
      cookie_access: {
        cookies_function_available: typeof cookies === 'function',
        error: null
      },
      
      // Test auth token retrieval
      auth_token: {
        token_exists: false,
        token_length: 0,
        token_preview: null,
        error: null
      },
      
      // Test token verification
      token_verification: {
        is_valid: false,
        payload: null,
        error: null
      },
      
      // Test student authentication
      student_auth: {
        student_found: false,
        student_data: null,
        error: null
      },
      
      // Environment checks
      environment: {
        NEXTAUTH_SECRET_exists: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_SECRET_length: process.env.NEXTAUTH_SECRET?.length || 0,
        NODE_ENV: process.env.NODE_ENV
      }
    };

    // Test 1: Cookie Access
    try {
      const cookieStore = await cookies();
      debugInfo.cookie_access.cookies_function_available = true;
    } catch (error) {
      debugInfo.cookie_access.error = error.message;
    }

    // Test 2: Auth Token Retrieval
    try {
      const token = await getAuthToken();
      debugInfo.auth_token.token_exists = !!token;
      debugInfo.auth_token.token_length = token?.length || 0;
      debugInfo.auth_token.token_preview = token ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : null;
    } catch (error) {
      debugInfo.auth_token.error = error.message;
    }

    // Test 3: Token Verification (only if token exists)
    if (debugInfo.auth_token.token_exists) {
      try {
        const token = await getAuthToken();
        const payload = await verifyToken(token);
        debugInfo.token_verification.is_valid = !!payload;
        debugInfo.token_verification.payload = payload ? {
          id: payload.id,
          email: payload.email,
          iat: payload.iat,
          exp: payload.exp,
          expires_in: payload.exp ? Math.floor((payload.exp * 1000 - Date.now()) / 1000) : null
        } : null;
      } catch (error) {
        debugInfo.token_verification.error = error.message;
      }
    }

    // Test 4: Student Authentication
    try {
      const student = await getAuthenticatedStudent();
      debugInfo.student_auth.student_found = !!student;
      debugInfo.student_auth.student_data = student ? {
        id: student.id,
        email: student.email,
        name: student.name,
        has_phone: !!student.phoneNumber
      } : null;
    } catch (error) {
      debugInfo.student_auth.error = error.message;
    }

    // Test 5: Manual Cookie Check
    try {
      const cookieStore = await cookies();
      const authCookie = cookieStore.get('auth-token');
      debugInfo.manual_cookie_check = {
        cookie_exists: !!authCookie,
        cookie_value_length: authCookie?.value?.length || 0,
        all_cookie_names: cookieStore.getAll().map(c => c.name)
      };
    } catch (error) {
      debugInfo.manual_cookie_check = { error: error.message };
    }

    return NextResponse.json({
      status: "AUTH_DEBUG_COMPLETE",
      authentication_status: {
        has_token: debugInfo.auth_token.token_exists,
        token_valid: debugInfo.token_verification.is_valid,
        student_authenticated: debugInfo.student_auth.student_found
      },
      debug_details: debugInfo
    });

  } catch (error) {
    return NextResponse.json({
      status: "AUTH_DEBUG_FAILED",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/debug/auth - Test authentication with credentials
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { id, email } = body;

    const testResults = {
      timestamp: new Date().toISOString(),
      input: { id: id || 'NOT_PROVIDED', email: email || 'NOT_PROVIDED' },
      
      validation: {
        id_format_valid: false,
        email_format_valid: false
      },
      
      database_check: {
        student_exists: false,
        student_data: null,
        error: null
      },
      
      token_generation: {
        success: false,
        token_preview: null,
        error: null
      }
    };

    // Validate input format
    if (id) {
      testResults.validation.id_format_valid = /^DR-\d{4,5}-\d{2}$/.test(id);
    }
    if (email) {
      testResults.validation.email_format_valid = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
    }

    // Test database lookup (only if both provided)
    if (id && email) {
      try {
        const { validateStudentCredentials } = await import('@/app/lib/utils/validation');
        const result = await validateStudentCredentials(id, email);
        
        testResults.database_check.student_exists = result.valid;
        testResults.database_check.student_data = result.student ? {
          id: result.student.id,
          email: result.student.email,
          name: result.student.name,
          has_phone: !!result.student.phoneNumber
        } : null;
        
        if (!result.valid) {
          testResults.database_check.error = result.error;
        }
      } catch (error) {
        testResults.database_check.error = error.message;
      }
    }

    // Test token generation (only if student exists)
    if (testResults.database_check.student_exists && testResults.database_check.student_data) {
      try {
        const { signToken } = await import('@/app/lib/utils/auth');
        const token = await signToken({
          id: testResults.database_check.student_data.id,
          email: testResults.database_check.student_data.email
        });
        
        testResults.token_generation.success = true;
        testResults.token_generation.token_preview = `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
      } catch (error) {
        testResults.token_generation.error = error.message;
      }
    }

    return NextResponse.json({
      status: "AUTH_TEST_COMPLETE",
      summary: {
        input_valid: testResults.validation.id_format_valid && testResults.validation.email_format_valid,
        student_found: testResults.database_check.student_exists,
        can_generate_token: testResults.token_generation.success
      },
      test_results: testResults
    });

  } catch (error) {
    return NextResponse.json({
      status: "AUTH_TEST_FAILED",
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
