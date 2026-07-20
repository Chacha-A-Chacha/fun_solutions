// file: src/app/api/instructor/export/route.js
// Description: Configurable CSV export for instructor/admin. Supports three datasets
// (session enrollments, student directory, raw bookings) with filters for student
// status, week scope, and whether cancelled bookings are included.

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';
import { withRole } from '@/app/lib/utils/auth';
import { getSetting } from '@/app/lib/utils/settings';
import { getCurrentWeekMonday } from '@/app/lib/utils/dates';

// Escape a single CSV cell per RFC 4180 (quote when it contains comma, quote, or newline)
function csvCell(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cells) {
  return cells.map(csvCell).join(',') + '\n';
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

// Build the Prisma where-filter for booking-level queries from the request options
function buildBookingWhere({ week, includeCancelled, studentStatus }) {
  const where = {};
  if (week === 'current') where.weekOf = getCurrentWeekMonday();
  if (!includeCancelled) where.status = { not: 'CANCELLED' };
  if (studentStatus !== 'all') where.student = { status: studentStatus.toUpperCase() };
  return where;
}

async function buildEnrollmentsCsv(opts) {
  const bookingWhere = buildBookingWhere(opts);

  const sessions = await prisma.session.findMany({
    include: {
      bookings: {
        where: bookingWhere,
        include: {
          student: { select: { id: true, studentNumber: true, name: true, email: true, phoneNumber: true, status: true } }
        },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: [{ day: 'asc' }, { timeSlot: 'asc' }]
  });

  let csv = csvRow([
    'Day', 'Time', 'Class', 'Capacity', 'Enrolled', 'Available', 'Week Of',
    'Student ID', 'Student Name', 'Student Email', 'Student Phone', 'Booking Status'
  ]);

  for (const session of sessions) {
    const day = DAY_NAMES[session.day];
    const time = TIME_SLOT_NAMES[session.timeSlot];
    const enrolled = session.bookings.length;
    const available = session.capacity - enrolled;

    // Skip closed, empty slots (unopened category rows) to keep the export readable.
    if (session.capacity === 0 && enrolled === 0) continue;

    if (enrolled === 0) {
      csv += csvRow([day, time, session.category, session.capacity, enrolled, available, '', '', '', '', '', '']);
      continue;
    }

    session.bookings.forEach((booking, index) => {
      const s = booking.student;
      // Session columns only on the first row of each session for readability
      const sessionCols = index === 0
        ? [day, time, session.category, session.capacity, enrolled, available]
        : ['', '', '', '', '', ''];
      csv += csvRow([
        ...sessionCols,
        formatDate(booking.weekOf),
        s.studentNumber || s.id, s.name, s.email, s.phoneNumber || '', booking.status
      ]);
    });
  }

  return csv;
}

async function buildStudentsCsv(opts) {
  const where = opts.studentStatus === 'all' ? {} : { status: opts.studentStatus.toUpperCase() };

  const students = await prisma.student.findMany({
    where,
    include: { bookings: { select: { status: true } } },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }]
  });

  const totalRequired = await getSetting('total_practicals_required', 15);

  let csv = csvRow([
    'Student ID', 'Name', 'Email', 'Phone', 'Class', 'Status',
    'Completed', 'Total Required', 'Complete', 'Total Bookings', 'Created At', 'Deactivated At'
  ]);

  for (const student of students) {
    const completed = student.bookings.filter(b => b.status === 'COMPLETED').length;
    csv += csvRow([
      student.studentNumber || student.id, student.name, student.email, student.phoneNumber || '', student.category, student.status,
      completed, totalRequired, completed >= totalRequired ? 'Yes' : 'No',
      student.bookings.length, formatDate(student.createdAt), formatDate(student.deactivatedAt)
    ]);
  }

  return csv;
}

async function buildBookingsCsv(opts) {
  const where = buildBookingWhere(opts);

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      student: { select: { id: true, studentNumber: true, name: true, status: true } },
      session: { select: { day: true, timeSlot: true } },
      markedBy: { select: { name: true } }
    },
    orderBy: [{ weekOf: 'desc' }, { createdAt: 'desc' }]
  });

  let csv = csvRow([
    'Booking ID', 'Student ID', 'Student Name', 'Student Status', 'Class', 'Day', 'Time',
    'Week Of', 'Booking Status', 'Marked By', 'Attended At', 'Completed At', 'Notes'
  ]);

  for (const b of bookings) {
    csv += csvRow([
      b.id, b.student.studentNumber || b.student.id, b.student.name, b.student.status, b.category,
      DAY_NAMES[b.session.day], TIME_SLOT_NAMES[b.session.timeSlot],
      formatDate(b.weekOf), b.status, b.markedBy?.name || '',
      formatDate(b.attendedAt), formatDate(b.completedAt), b.notes || ''
    ]);
  }

  return csv;
}

/**
 * GET /api/instructor/export - Export data as CSV.
 * Query params:
 *   type=enrollments|students|bookings   (default: enrollments)
 *   studentStatus=all|active|inactive    (default: all — preserves legacy output)
 *   week=all|current                     (default: all)
 *   includeCancelled=true|false          (default: true — preserves legacy output)
 */
export const GET = withRole('INSTRUCTOR', 'ADMIN')(async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'enrollments').toLowerCase();

    const studentStatusRaw = (searchParams.get('studentStatus') || 'all').toLowerCase();
    const studentStatus = ['all', 'active', 'inactive'].includes(studentStatusRaw) ? studentStatusRaw : 'all';

    const week = (searchParams.get('week') || 'all').toLowerCase() === 'current' ? 'current' : 'all';
    // Default true keeps the legacy export (which included cancelled bookings) intact
    const includeCancelled = (searchParams.get('includeCancelled') || 'true').toLowerCase() !== 'false';

    const opts = { studentStatus, week, includeCancelled };

    let csvContent;
    let label;
    if (type === 'students') {
      csvContent = await buildStudentsCsv(opts);
      label = 'students';
    } else if (type === 'bookings') {
      csvContent = await buildBookingsCsv(opts);
      label = 'bookings';
    } else {
      csvContent = await buildEnrollmentsCsv(opts);
      label = 'session_enrollments';
    }

    const headers = {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=${label}_${new Date().toISOString().split('T')[0]}.csv`
    };

    return new NextResponse(csvContent, { headers });
  } catch (error) {
    console.error('Error generating export:', error);
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
});
