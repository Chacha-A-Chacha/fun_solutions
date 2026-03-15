import { NextResponse } from "next/server";
import prisma from "@/app/lib/db/prisma-client";
import { withRole } from "@/app/lib/utils/auth";
import { getCurrentWeekMonday } from "@/app/lib/utils/dates";

/**
 * Core archive logic — shared by cron (GET) and manual trigger (POST)
 */
async function archiveStaleBookings(trigger = 'cron') {
  const currentWeekMonday = getCurrentWeekMonday();

  const staleBooked = await prisma.booking.findMany({
    where: { status: 'BOOKED', weekOf: { lt: currentWeekMonday } },
    select: { id: true }
  });

  const staleAttended = await prisma.booking.findMany({
    where: { status: 'ATTENDED', weekOf: { lt: currentWeekMonday } },
    select: { id: true }
  });

  const bookedIds = staleBooked.map(b => b.id);
  const attendedIds = staleAttended.map(b => b.id);

  if (bookedIds.length === 0 && attendedIds.length === 0) {
    await prisma.systemLog.create({
      data: {
        action: "BOOKING_ARCHIVE",
        message: "No stale bookings to archive.",
        data: { count: 0, trigger },
      },
    });

    return { message: "No stale bookings to archive.", booked: 0, attended: 0 };
  }

  const now = new Date();
  const txOps = [];

  if (bookedIds.length > 0) {
    txOps.push(
      prisma.booking.updateMany({
        where: { id: { in: bookedIds } },
        data: { status: 'CANCELLED', cancelledAt: now }
      }),
      ...bookedIds.map(bookingId =>
        prisma.bookingStatusHistory.create({
          data: {
            bookingId,
            fromStatus: 'BOOKED',
            toStatus: 'CANCELLED',
            reason: 'Weekly archive — booking not attended'
          }
        })
      )
    );
  }

  if (attendedIds.length > 0) {
    txOps.push(
      prisma.booking.updateMany({
        where: { id: { in: attendedIds } },
        data: { status: 'INCOMPLETE' }
      }),
      ...attendedIds.map(bookingId =>
        prisma.bookingStatusHistory.create({
          data: {
            bookingId,
            fromStatus: 'ATTENDED',
            toStatus: 'INCOMPLETE',
            reason: 'Weekly archive — attendance not finalized'
          }
        })
      )
    );
  }

  await prisma.$transaction(txOps, { timeout: 30000 });

  const message = `Archived ${bookedIds.length} stale booked, ${attendedIds.length} stale attended.`;

  await prisma.systemLog.create({
    data: {
      action: "BOOKING_ARCHIVE",
      message,
      data: { booked: bookedIds.length, attended: attendedIds.length, trigger },
    },
  });

  return { message, booked: bookedIds.length, attended: attendedIds.length };
}

/**
 * GET /api/admin/reset-bookings — Vercel cron trigger
 */
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await archiveStaleBookings('cron');
    return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    await prisma.systemLog.create({
      data: {
        action: "BOOKING_ARCHIVE_FAILED",
        message: String(error.message || 'Unknown error').slice(0, 191),
        data: { error: error.stack, trigger: 'cron' },
      },
    });
    console.error("Booking archive failed:", error);
    return NextResponse.json({ error: "Archive failed" }, { status: 500 });
  }
}

/**
 * POST /api/admin/reset-bookings — Manual trigger (admin only)
 */
export const POST = withRole('ADMIN')(async function POST() {
  try {
    const result = await archiveStaleBookings('manual');
    return NextResponse.json({ ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    await prisma.systemLog.create({
      data: {
        action: "BOOKING_ARCHIVE_FAILED",
        message: String(error.message || 'Unknown error').slice(0, 191),
        data: { error: error.stack, trigger: 'manual' },
      },
    });
    console.error("Booking archive failed:", error);
    return NextResponse.json({ error: "Archive failed" }, { status: 500 });
  }
});
