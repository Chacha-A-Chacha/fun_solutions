// file: src/app/lib/utils/auth.js
// description: Fixed auth utilities with async cookies() support for Next.js 15

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// JWT signing key
const secretKey = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production'
);

// Token expiration (24 hours)
const tokenExpiration = '24h';

// Cookie name for the auth token
const AUTH_COOKIE = 'auth-token';

/**
 * Sign a JWT token for a student
 * @param {Object} payload - The data to include in the token
 * @returns {Promise<string>} - The signed token
 */
export async function signToken(payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(tokenExpiration)
    .sign(secretKey);
  
  return token;
}

/**
 * Verify a JWT token
 * @param {string} token - The token to verify
 * @returns {Promise<Object>} - The decoded token payload
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Set the auth token cookie - ASYNC version for Next.js 15
 * @param {string} token - The token to set
 */
export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
    sameSite: 'strict'
  });
}

/**
 * Clear the auth token cookie - ASYNC version for Next.js 15
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

/**
 * Get the current auth token from cookies - ASYNC version for Next.js 15
 * @returns {Promise<string|null>} - The auth token or null if not found
 */
export async function getAuthToken() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE)?.value || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Helper function to check authentication for API handlers - ASYNC version
 * @returns {Promise<Object|null>} - The authenticated student or null
 */
export async function getAuthenticatedStudent() {
  try {
    const token = await getAuthToken();
    if (!token) return null;
    
    const payload = await verifyToken(token);
    if (!payload) {
      await clearAuthCookie();
      return null;
    }
    
    // Import the prisma client here to avoid circular dependencies
    const { default: prisma } = await import('@/app/lib/db/prisma-client');
    
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
      await clearAuthCookie();
      return null;
    }
    
    return student;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Authentication middleware for API routes - Updated for async cookies
 * @param {Function} handler - The route handler
 * @returns {Function} - The wrapped handler with auth check
 */
export function withAuth(handler) {
  return async (request, ...args) => {
    try {
      const student = await getAuthenticatedStudent();
      
      if (!student) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Add student data to the request context
      request.student = student;
      
      return handler(request, ...args);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}