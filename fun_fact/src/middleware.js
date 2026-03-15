import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production'
);

const STAFF_AUTH_COOKIE = 'staff-token';

export async function middleware(request) {
  const token = request.cookies.get(STAFF_AUTH_COOKIE)?.value;

  // No token → redirect to staff login
  if (!token) {
    // For API routes, return 401 JSON instead of redirect
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/?tab=staff', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);

    // Admin-only routes require ADMIN role
    if (
      request.nextUrl.pathname.startsWith('/admin') ||
      request.nextUrl.pathname.startsWith('/api/admin')
    ) {
      if (payload.role !== 'ADMIN') {
        if (request.nextUrl.pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL('/instructor', request.url));
      }
    }

    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.id);
    response.headers.set('x-user-role', payload.role);
    return response;
  } catch (error) {
    // Invalid/expired token → clear cookie and redirect
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    const response = NextResponse.redirect(new URL('/?tab=staff', request.url));
    response.cookies.delete(STAFF_AUTH_COOKIE);
    return response;
  }
}

export const config = {
  matcher: [
    '/instructor/:path*',
    '/api/instructor/:path*',
    '/admin/:path*',
    '/api/admin/((?!reset-bookings).)*',
  ],
};
