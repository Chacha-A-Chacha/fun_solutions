// file path: fun_fact/src/app/api/instructor/export/route.js
// file: src/app/api/instructor/export/route.js
// Description: This API route exports session and enrollment data as a CSV file. It retrieves session data from the database, formats it into CSV format, and sends it as a downloadable file in the response. The CSV includes details about each session, including day, time, capacity, enrolled students, and their contact information.

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db/prisma-client';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';

/**
 * GET /api/instructor/export - Export sessions and enrollments as CSV
 */
export async function GET() {
  try {
    // Get all sessions with their bookings and student information
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
    
    // Format the data for CSV export
    let csvContent = 'Day,Time,Capacity,Enrolled,Available,Student ID,Student Name,Student Email,Student Phone\n';
    
    sessions.forEach(session => {
      const day = DAY_NAMES[session.day];
      const time = TIME_SLOT_NAMES[session.timeSlot];
      const capacity = session.capacity;
      const enrolled = session.bookings.length;
      const available = capacity - enrolled;
      
      if (enrolled === 0) {
        // If no students enrolled, add a row with empty student info
        csvContent += `${day},${time},${capacity},${enrolled},${available},,,,\n`;
      } else {
        // Add a row for each enrolled student
        session.bookings.forEach((booking, index) => {
          const studentId = booking.student.id;
          const studentName = booking.student.name;
          const studentEmail = booking.student.email;
          const studentPhone = booking.student.phoneNumber || '';
          
          if (index === 0) {
            // Include session info only for the first student
            csvContent += `${day},${time},${capacity},${enrolled},${available},${studentId},${studentName},${studentEmail},${studentPhone}\n`;
          } else {
            // For additional students, leave session info blank
            csvContent += `,,,,,"${studentId}","${studentName}","${studentEmail}","${studentPhone}"\n`;
          }
        });
      }
    });
    
    // Set response headers for CSV download
    const headers = {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=session_enrollments_${new Date().toISOString().split('T')[0]}.csv`
    };
    
    return new NextResponse(csvContent, { headers });
  } catch (error) {
    console.error('Error generating export:', error);
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}
