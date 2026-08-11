"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  History,
  Archive,
  Loader2,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_STYLES = {
  BOOKED: { bg: "bg-blue-100 text-blue-800", icon: Calendar },
  ATTENDED: { bg: "bg-green-100 text-green-800", icon: CheckCircle },
  NO_SHOW: { bg: "bg-red-100 text-red-800", icon: XCircle },
  COMPLETED: { bg: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
  INCOMPLETE: { bg: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  CANCELLED: { bg: "bg-gray-100 text-gray-500", icon: XCircle },
};

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatWeek(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return `Week of ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function StudentHistorySheet({
  studentId,
  studentName,
  selfMode = false,
  isAdmin = false,
  onStatusChange,
  open,
  onOpenChange,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // On phones, present as a bottom sheet (the expected mobile pattern); side drawer on larger screens.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (open && (selfMode || studentId)) {
      setLoading(true);
      setError(null);
      const url = selfMode
        ? "/api/bookings/history"
        : `/api/instructor/students/${studentId}`;
      axios
        .get(url)
        .then(({ data }) => setData(data))
        .catch(() => setError("Failed to load booking history"))
        .finally(() => setLoading(false));
    }
  }, [open, studentId, selfMode]);

  const isInactive = data?.student?.status === "INACTIVE";
  const isArchived = data?.student?.status === "ARCHIVED";

  // Archiving is permanent and releases the student number — admin only, and
  // never in selfMode (a student viewing their own history).
  const canArchive = !selfMode && isAdmin && data?.student && !isArchived;

  const handleArchive = async () => {
    if (!data?.student) return;
    setArchiving(true);
    try {
      const { data: res } = await axios.patch(
        `/api/instructor/students/${data.student.id}/status`,
        { status: "ARCHIVED" },
      );
      toast.success(res.message || "Student archived");
      setArchiveConfirmOpen(false);
      if (typeof onStatusChange === "function") onStatusChange();
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to archive student");
    } finally {
      setArchiving(false);
    }
  };

  // Group bookings by weekOf
  const bookingsByWeek =
    data?.bookings?.reduce((acc, b) => {
      const key = b.weekOf;
      if (!acc[key]) acc[key] = [];
      acc[key].push(b);
      return acc;
    }, {}) || {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "h-[88vh] rounded-t-2xl overflow-y-auto"
            : "w-full sm:max-w-lg overflow-y-auto"
        }
      >
        <SheetHeader className="pr-10">
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-900" />
            {selfMode ? "My Booking History" : "Student History"}
          </SheetTitle>
          <SheetDescription>
            {selfMode
              ? "Your course progress and session history"
              : studentName || studentId}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Loading */}
          {loading && (
            <div className="space-y-4 pt-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-10 w-10 text-red-400 mb-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Content */}
          {!loading && !error && data && (
            <>
              {/* Student Info */}
              <Card>
                <CardContent className="pt-4 pb-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{data.student.name}</span>
                    <span className="text-gray-400">({data.student.studentNumber || data.student.id})</span>
                    {data.student.category && (
                      <Badge
                        variant="outline"
                        className="border-blue-200 bg-blue-50 text-blue-700 text-xs"
                      >
                        Class {data.student.category}
                      </Badge>
                    )}
                    {isInactive && (
                      <Badge
                        variant="secondary"
                        className="bg-gray-200 text-gray-600 text-xs"
                      >
                        Inactive
                      </Badge>
                    )}
                    {isArchived && (
                      <Badge
                        variant="outline"
                        className="border-gray-300 bg-gray-100 text-gray-500 text-xs"
                      >
                        Archived
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {data.student.email}
                  </div>
                  {data.student.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {data.student.phoneNumber}
                    </div>
                  )}
                  {canArchive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setArchiveConfirmOpen(true)}
                      className="mt-1 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Archive className="w-3 h-3 mr-1" />
                      Archive &amp; release number
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Progress */}
              {data.summary.totalRequired && (
                <Card
                  className={
                    data.summary.isComplete
                      ? "border-emerald-300 bg-emerald-50"
                      : ""
                  }
                >
                  <CardContent className="pt-4 pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Course Progress
                      </span>
                      <span
                        className={`text-sm font-bold ${data.summary.isComplete ? "text-emerald-700" : "text-blue-700"}`}
                      >
                        {data.summary.completed}/{data.summary.totalRequired}{" "}
                        practicals
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-200 rounded-full">
                      <div
                        className={`h-2.5 rounded-full transition-all ${data.summary.isComplete ? "bg-emerald-500" : "bg-blue-500"}`}
                        style={{ width: `${data.summary.progressPercent}%` }}
                      />
                    </div>
                    {data.summary.isComplete && (
                      <div className="mt-2 text-xs font-medium text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Course completed
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-emerald-800">
                    {data.summary.completed}
                  </div>
                  <div className="text-xs text-emerald-600">Completed</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-800">
                    {data.summary.attended}
                  </div>
                  <div className="text-xs text-green-600">Attended</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-red-800">
                    {data.summary.noShows}
                  </div>
                  <div className="text-xs text-red-600">No-Shows</div>
                </div>
              </div>

              {/* Bookings by Week */}
              {Object.keys(bookingsByWeek).length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <Calendar className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No booking history</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(bookingsByWeek).map(([weekOf, bookings]) => (
                    <div key={weekOf}>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatWeek(weekOf)}
                      </div>
                      <div className="space-y-2">
                        {bookings.map((booking) => {
                          const style =
                            STATUS_STYLES[booking.status] ||
                            STATUS_STYLES.BOOKED;
                          const StatusIcon = style.icon;
                          return (
                            <div
                              key={booking.id}
                              className="bg-gray-50 border border-gray-100 rounded-lg p-3"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                  <div className="font-medium text-sm text-gray-900 flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span>{booking.dayName} - {booking.timeSlotName}</span>
                                    {booking.category && (
                                      <Badge
                                        variant="outline"
                                        className="border-blue-200 bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0"
                                      >
                                        {booking.category}
                                      </Badge>
                                    )}
                                  </div>
                                  {booking.markedBy && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      Marked by {booking.markedBy}
                                    </div>
                                  )}
                                  {booking.notes && (
                                    <div className="text-xs text-gray-500 mt-1 italic">
                                      {booking.notes}
                                    </div>
                                  )}
                                </div>
                                <Badge
                                  className={`shrink-0 text-xs flex items-center gap-1 ${style.bg}`}
                                >
                                  <StatusIcon className="w-3 h-3" />
                                  {booking.status}
                                </Badge>
                              </div>

                              {/* Status timeline */}
                              {booking.statusHistory &&
                                booking.statusHistory.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-gray-100">
                                    <div className="text-xs text-gray-400 mb-1">
                                      Status changes:
                                    </div>
                                    {booking.statusHistory.map((h, i) => (
                                      <div
                                        key={i}
                                        className="text-xs text-gray-500 ml-2 mb-1 last:mb-0"
                                      >
                                        <div className="flex items-start gap-1">
                                          <span className="text-gray-300 leading-5">
                                            &#8226;
                                          </span>
                                          <span className="font-medium text-gray-600">
                                            {h.fromStatus || "NEW"} → {h.toStatus}
                                          </span>
                                        </div>
                                        <div className="ml-3 text-gray-400 flex flex-wrap gap-x-2">
                                          {h.changedBy && <span>by {h.changedBy}</span>}
                                          <span>{formatDate(h.createdAt)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Archive & release number — permanent */}
        <AlertDialog
          open={archiveConfirmOpen}
          onOpenChange={(o) => { if (!archiving) setArchiveConfirmOpen(o); }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <Archive className="mr-2 h-5 w-5 text-red-500" />
                Archive &amp; release number
              </AlertDialogTitle>
              <AlertDialogDescription>
                This permanently archives{" "}
                <span className="font-medium">{data?.student?.name}</span>{" "}
                ({data?.student?.studentNumber || data?.student?.id}) and frees their student
                number so it can be given to a new student. Their history is kept, but this{" "}
                <span className="font-medium">cannot be undone</span> — they can&apos;t be
                reactivated afterwards. To pause a student temporarily, deactivate them instead.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={archiving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); handleArchive(); }}
                disabled={archiving}
                className="bg-red-600 hover:bg-red-700"
              >
                {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Archive & release"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
