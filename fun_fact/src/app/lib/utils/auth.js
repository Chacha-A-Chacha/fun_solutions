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
    return null;
  }
}

/**
 * Set the auth token cookie
 * @param {Object} response - The Next.js response object
 * @param {string} token - The token to set
 */
export function setAuthCookie(token) {
  cookies().set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 24 hours in seconds
    sameSite: 'strict'
  });
}

/**
 * Clear the auth token cookie
 */
export function clearAuthCookie() {
  cookies().delete(AUTH_COOKIE);
}

/**
 * Get the current auth token from cookies
 * @returns {string|null} - The auth token or null if not found
 */
export function getAuthToken() {
  return cookies().get(AUTH_COOKIE)?.value || null;
}

/**
 * Get the current authenticated student from the token
 * @returns {Promise<Object|null>} - The student data or null if not authenticated
 */
export async function getCurrentStudent() {
  const token = getAuthToken();
  if (!token) return null;
  
  const payload = await verifyToken(token);
  return payload;
}

/**
 * Authentication middleware for API routes
 * @param {Function} handler - The route handler
 * @returns {Function} - The wrapped handler with auth check
 */
export function withAuth(handler) {
  return async (request, ...args) => {
    const student = await getCurrentStudent();
    
    if (!student) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Add student data to the request context
    request.student = student;
    
    return handler(request, ...args);
  };
}
