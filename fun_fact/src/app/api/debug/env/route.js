// file: src/app/api/debug/env/route.js
// description: Debug endpoint to check environment variables (REMOVE AFTER DEBUGGING)

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 10) || 'MISSING',
    NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
    ALL_ENV_KEYS: Object.keys(process.env).filter(key =>
      key.includes('DATABASE') || key.includes('AUTH')
    )
  });
}