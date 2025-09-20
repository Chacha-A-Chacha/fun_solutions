// file: src/app/api/admin/reset-bookings/route.js
// description: API endpoint to automatically reset all booking records, designed to be called by Vercel cron every Sunday at 4:59 PM

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';

export async function POST(request) {
  // Security check
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.RESET_API_KEY}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
    const userAgent = request.headers.get('user-agent');
      if (!userAgent?.includes('vercel-cron')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      try {
        const result = await prisma.booking.deleteMany({});
        return NextResponse.json({
          message: `Reset complete. Deleted ${result.count} bookings.`,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Booking reset failed:', error);
        return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
      }
}