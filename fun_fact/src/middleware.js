// File: src/middleware.js
// Description: Middleware to protect instructor routes and handle authentication

import { NextResponse } from 'next/server';

export function middleware(request) {
  // This is a simple middleware to protect instructor routes
  // In a production app, you would implement proper instructor authentication
  
  const instructorPath = '/instructor';
  const instructorApiPath = '/api/instructor';
  
  // Check if the request is for an instructor route
  if (
    request.nextUrl.pathname.startsWith(instructorPath) ||
    request.nextUrl.pathname.startsWith(instructorApiPath)
  ) {
    // Check for the presence of an instructor cookie or query parameter
    // For demo purposes, we're using a simple query parameter
    // In production, use proper authentication
    const isInstructorMode = request.nextUrl.searchParams.get('instructor_key') === 'demo_instructor_access';
    
    if (!isInstructorMode) {
      // Redirect to the login page if not authenticated
      // For this demo, we're appending the query parameter to the current URL
      const url = new URL(request.url);
      url.searchParams.set('instructor_key', 'demo_instructor_access');
      
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: ['/instructor/:path*', '/api/instructor/:path*'],
};
