import { NextResponse } from "next/server";
import prisma from "@/app/lib/db/prisma-client";
import { getCurrentWeekMonday } from "@/app/lib/utils/dates";

export async function GET(request) {
  // Security check — only allow Vercel cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const currentWeekMonday = getCurrentWeekMonday();

    // Find all BOOKED entries from past weeks (not yet attended/completed)
    const staleBookings = await prisma.booking.findMany({
      where: {
        status: 'BOOKED',
        weekOf: { lt: currentWeekMonday }
      },
      select: { id: true }
    });

    if (staleBookings.length === 0) {
      await prisma.systemLog.create({
        data: {
          action: "BOOKING_ARCHIVE",
          message: "No stale bookings to archive.",
          data: { count: 0 },
        },
      });

      return NextResponse.json({
        message: "No stale bookings to archive.",
        timestamp: new Date().toISOString(),
      });
    }

    const staleIds = staleBookings.map(b => b.id);

    // Archive: set status to CANCELLED, record history
    await prisma.$transaction([
      prisma.booking.updateMany({
        where: { id: { in: staleIds } },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      }),
      ...staleIds.map(bookingId =>
        prisma.bookingStatusHistory.create({
          data: {
            bookingId,
            fromStatus: 'BOOKED',
            toStatus: 'CANCELLED',
            reason: 'Weekly archive — booking not attended'
          }
        })
      )
    ]);

    await prisma.systemLog.create({
      data: {
        action: "BOOKING_ARCHIVE",
        message: `Archived ${staleIds.length} stale bookings.`,
        data: { count: staleIds.length },
      },
    });

    return NextResponse.json({
      message: `Archived ${staleIds.length} stale bookings.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    await prisma.systemLog.create({
      data: {
        action: "BOOKING_ARCHIVE_FAILED",
        message: error.message,
        data: { error: error.stack },
      },
    });

    console.error("Booking archive failed:", error);
    return NextResponse.json({ error: "Archive failed" }, { status: 500 });
  }
}
