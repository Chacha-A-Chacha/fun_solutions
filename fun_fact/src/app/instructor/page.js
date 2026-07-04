// file: src/app/instructor/page.js
// description: Updated instructor dashboard with coherent design matching existing components

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Filter,
  Plus,
  RefreshCcw,
  Info,
  UserPlus,
  UserPlus2,
  GraduationCap,
  BarChart3,
  Clock,
  LogOut,
  Settings,
  Save,
  AlertTriangle,
  UserX,
  Zap,
  SlidersHorizontal,
  Loader2,
  CheckCircle2,
  Download,
  MoreVertical,
} from 'lucide-react';
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
import { DAY_NAMES, TIME_SLOT_NAMES, LICENCE_CLASSES, LICENCE_CLASS_NAMES } from '@/app/lib/constants';

// Shadcn components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Custom components
import CreateStudentForm from '@/components/CreateStudentForm';
import AddInstructorForm from '@/components/AddInstructorForm';
import AddParticipantModal from '@/components/AddParticipantModal';
import SessionTimetable from '@/components/SessionTimetable';
import StudentsList from '@/components/StudentsList';
import ExportDataSheet from '@/components/ExportDataSheet';
import SessionCapacityMatrix from '@/components/SessionCapacityMatrix';
import PoweredByFooter from '@/components/PoweredByFooter';

export default function InstructorDashboard() {
  // State management
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [addParticipantSession, setAddParticipantSession] = useState(null);
  const [rosterSessionId, setRosterSessionId] = useState(null);
  const [activeTab, setActiveTab] = useState('sessions');
  const [userRole, setUserRole] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  // Header action sheets — controlled so both desktop buttons and the mobile overflow menu can open them
  const [createStudentOpen, setCreateStudentOpen] = useState(false);
  const [addInstructorOpen, setAddInstructorOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const isAdmin = userRole === 'ADMIN';

  // Fetch session data (optionally scoped to a licence class)
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const params = categoryFilter ? `?category=${categoryFilter}` : '';
      const { data } = await axios.get(`/api/instructor/sessions${params}`);
      setSessions(data.sessions);
      setAnalytics(data.analytics);
      setError(null);
    } catch (err) {
      console.error('Error fetching session data:', err);
      setError('Failed to load session data');
      toast.error('Failed to load session data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Fetch user role once on mount
  useEffect(() => {
    axios.get('/api/auth/staff')
      .then(({ data }) => setUserRole(data.user?.role || null))
      .catch(() => setUserRole(null));
  }, []);

  // Roster opens as a bottom sheet on phones (field-friendly), side drawer on desktop
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // (Re)fetch sessions on mount and whenever the class filter changes
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  // Filter sessions by selected day
  const filteredSessions = selectedDay
    ? sessions.filter(session => session.day === selectedDay)
    : sessions;

  // Group sessions by day for the mobile list view
  const sessionsByDay = sessions.reduce((acc, session) => {
    if (!acc[session.day]) {
      acc[session.day] = [];
    }
    acc[session.day].push(session);
    return acc;
  }, {});

  // Live session backing the roster Sheet (re-derived so it reflects refreshes)
  const rosterSession = sessions.find((s) => s.id === rosterSessionId) || null;
  const rosterBooked = rosterSession ? rosterSession.students.filter((s) => s.status === 'BOOKED').length : 0;

  // Handle day selection
  const handleDaySelect = (day) => {
    setSelectedDay(day === selectedDay ? null : day);
  };

  // Handle staff logout
  const handleLogout = async () => {
    try {
      await axios.delete('/api/auth/staff');
      toast.success('Logged out successfully');
      window.location.href = '/?tab=staff';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/?tab=staff';
    }
  };

  // Handle booking status update
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await axios.patch(`/api/instructor/bookings/${bookingId}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update status';
      toast.error(msg);
    }
  };

  // Bulk: mark every still-BOOKED student in a session as ATTENDED, then refresh once
  const handleBulkAttend = async (session) => {
    const booked = (session.students || []).filter((s) => s.status === 'BOOKED');
    if (booked.length === 0) return;
    try {
      const results = await Promise.allSettled(
        booked.map((s) => axios.patch(`/api/instructor/bookings/${s.bookingId}`, { status: 'ATTENDED' }))
      );
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - ok;
      toast.success(`Marked ${ok} attended${failed ? `, ${failed} failed` : ''}`);
    } catch {
      toast.error('Some updates failed');
    } finally {
      fetchData();
    }
  };

  // Handle student creation success
  const handleStudentCreated = (student) => {
    toast.success(`Student ${student.name} created successfully`);
    fetchData();
  };

  // Loading state - matching SessionCalendar loading style
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-blue-900 shadow-lg sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex space-x-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Error state - matching existing error patterns
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <Info className="mr-2 h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => {
                setLoading(true);
                fetchData();
              }}
              variant="destructive"
              className="w-full"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-900 shadow-lg sticky top-0 z-10 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-3">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-white truncate">Instructor Dashboard</h1>
              <p className="hidden sm:block text-sm text-blue-200">
                Manage sessions and students
              </p>
            </div>

            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              {isAdmin && (
                <Button onClick={() => setCreateStudentOpen(true)} className="bg-white text-blue-900 hover:bg-blue-50">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Student
                </Button>
              )}
              {isAdmin && (
                <Button variant="outline" onClick={() => setAddInstructorOpen(true)} className="bg-transparent border-blue-300 text-white hover:bg-blue-800 hover:text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Instructor
                </Button>
              )}
              <Button variant="outline" onClick={() => setExportOpen(true)} className="bg-transparent text-blue-100 border-blue-400 hover:bg-blue-800 hover:text-white">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button size="icon" disabled={refreshing} onClick={fetchData} className="bg-transparent text-blue-200 hover:text-white hover:bg-blue-800 shadow-none">
                <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button size="icon" onClick={handleLogout} className="bg-transparent text-blue-200 hover:text-white hover:bg-blue-800 shadow-none">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile: refresh + overflow menu (keeps the top bar compact) */}
            <div className="flex sm:hidden items-center gap-1 shrink-0">
              <Button size="icon" disabled={refreshing} onClick={fetchData} className="bg-transparent text-blue-200 hover:text-white hover:bg-blue-800 shadow-none">
                <RefreshCcw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" className="bg-transparent text-blue-100 hover:text-white hover:bg-blue-800 shadow-none">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {isAdmin && (
                    <DropdownMenuItem onSelect={() => setCreateStudentOpen(true)}>
                      <UserPlus className="mr-2 h-4 w-4" /> Create Student
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onSelect={() => setAddInstructorOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Add Instructor
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => setExportOpen(true)}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} className="text-red-600 focus:text-red-700">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Header action sheets (controlled — opened from desktop buttons or the mobile menu) */}
      {isAdmin && (
        <Sheet open={createStudentOpen} onOpenChange={setCreateStudentOpen}>
          <SheetContent side="right" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Create New Student</SheetTitle>
              <SheetDescription>Add a new student to the system</SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <CreateStudentForm onSuccess={(s) => { handleStudentCreated(s); setCreateStudentOpen(false); }} />
            </div>
          </SheetContent>
        </Sheet>
      )}
      {isAdmin && (
        <Sheet open={addInstructorOpen} onOpenChange={setAddInstructorOpen}>
          <SheetContent side="right" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Add Staff Member</SheetTitle>
              <SheetDescription>Create a new instructor or admin account</SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <AddInstructorForm onSuccess={() => { toast.success('Staff member added'); setAddInstructorOpen(false); }} />
            </div>
          </SheetContent>
        </Sheet>
      )}
      <ExportDataSheet open={exportOpen} onOpenChange={setExportOpen} showTrigger={false} />

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="p-4 pb-0">
                <TabsList className="w-full h-11 bg-transparent border border-slate-200 p-1 rounded-lg">
                  <TabsTrigger
                    value="sessions"
                    className="flex-1 h-full px-5 text-slate-500 data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    <Calendar className="w-4 h-4 mr-1.5" />
                    Sessions
                  </TabsTrigger>
                  <TabsTrigger
                    value="students"
                    className="flex-1 h-full px-5 text-slate-500 data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    <GraduationCap className="w-4 h-4 mr-1.5" />
                    Students
                  </TabsTrigger>
                  {isAdmin && (
                    <TabsTrigger
                      value="settings"
                      className="flex-1 h-full px-5 text-slate-500 data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
                    >
                      <Settings className="w-4 h-4 mr-1.5" />
                      Settings
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              {/* Sessions Tab Content */}
              <TabsContent value="sessions" className="p-6 space-y-6">
                {/* Licence class filter — staff can view any class's sessions */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Licence class</span>
                  </div>
                  <Select
                    value={categoryFilter || 'all'}
                    onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}
                  >
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All classes</SelectItem>
                      {LICENCE_CLASSES.map((c) => (
                        <SelectItem key={c} value={c}>{LICENCE_CLASS_NAMES[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* No open slots for the selected class */}
                {categoryFilter && !refreshing && sessions.length === 0 && (
                  <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      No slots are open for class {categoryFilter}. Open some in{' '}
                      <button className="underline font-medium" onClick={() => setActiveTab('settings')}>
                        Settings → Session capacity
                      </button>{isAdmin ? '.' : ' (admin only).'}
                    </span>
                  </div>
                )}

                {/* Analytics Summary */}
                {analytics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <BarChart3 className="mr-2 w-5 h-5 text-blue-600" />
                        Session Analytics
                      </h3>
                      {analytics.disabledSessionsCount > 0 && (
                        <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                          {analytics.disabledSessionsCount} disabled
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Total Enrollment */}
                      <Card className="border-blue-200">
                        <CardContent className="pt-6">
                          <div className="text-xs font-medium text-blue-800 uppercase tracking-wide">Total Enrollment</div>
                          <div className="mt-2 flex justify-between items-center">
                            <div className="text-2xl font-bold text-blue-900">
                              {analytics.totalEnrolled}/{analytics.totalCapacity}
                            </div>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                              {analytics.overallFillRate}% filled
                            </Badge>
                          </div>
                          <Progress
                            value={analytics.overallFillRate}
                            className="h-2 mt-3"
                          />
                        </CardContent>
                      </Card>

                      {/* Participating Students */}
                      <Card className="border-green-200">
                        <CardContent className="pt-6">
                          <div className="text-xs font-medium text-green-800 uppercase tracking-wide">Participating Students</div>
                          <div className="mt-2 flex justify-between items-center">
                            <div className="text-2xl font-bold text-green-900">
                              {analytics.uniqueStudentCount}
                            </div>
                            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                              ~{analytics.averageSessionsPerStudent} sessions each
                            </Badge>
                          </div>
                          <Progress
                            value={analytics.uniqueStudentCount > 0 ? Math.min((analytics.averageSessionsPerStudent / analytics.totalSessions) * 100, 100) : 0}
                            className="h-2 mt-3"
                          />
                        </CardContent>
                      </Card>

                      {/* Available Spots */}
                      <Card className="border-purple-200">
                        <CardContent className="pt-6">
                          <div className="text-xs font-medium text-purple-800 uppercase tracking-wide">Available Spots</div>
                          <div className="mt-2 flex justify-between items-center">
                            <div className="text-2xl font-bold text-purple-900">
                              {analytics.availableSpots}
                            </div>
                            <Badge variant="outline" className="text-purple-700 border-purple-200 bg-purple-50">
                              across {analytics.totalSessions} sessions
                            </Badge>
                          </div>
                          <Progress
                            value={analytics.totalCapacity > 0 ? ((analytics.totalCapacity - analytics.availableSpots) / analytics.totalCapacity) * 100 : 0}
                            className="h-2 mt-3"
                          />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Highlights row — most/least popular + busiest day */}
                    {(analytics.mostPopularSession || analytics.dayPopularity?.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {analytics.mostPopularSession && (
                          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                            <ChevronUp className="w-4 h-4 text-green-600 shrink-0" />
                            <span className="text-gray-700">
                              <span className="font-medium text-green-800">Most popular:</span>{' '}
                              {analytics.mostPopularSession.day} {analytics.mostPopularSession.timeSlot} ({analytics.mostPopularSession.fillRate}%)
                            </span>
                          </div>
                        )}
                        {analytics.leastPopularSession && (
                          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                            <ChevronDown className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-gray-700">
                              <span className="font-medium text-amber-800">Least popular:</span>{' '}
                              {analytics.leastPopularSession.day} {analytics.leastPopularSession.timeSlot} ({analytics.leastPopularSession.fillRate}%)
                            </span>
                          </div>
                        )}
                        {analytics.dayPopularity?.length > 0 && (
                          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="text-gray-700">
                              <span className="font-medium text-blue-800">Busiest day:</span>{' '}
                              {analytics.dayPopularity[0].dayName} ({analytics.dayPopularity[0].fillRate}% full)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Weekly timetable — click a class chip to open its roster */}
                <Card className="hidden md:block">
                  <CardHeader>
                    <CardTitle>Weekly Schedule</CardTitle>
                    <CardDescription>
                      Every offered class slot this week. Click a class to view its roster and mark attendance.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sessions.length > 0 ? (
                      <SessionTimetable
                        sessions={sessions}
                        onOpenSession={(s) => setRosterSessionId(s.id)}
                      />
                    ) : (
                      <div className="text-center py-10 text-gray-500">
                        <Calendar className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-sm">No offered sessions{categoryFilter ? ` for class ${categoryFilter}` : ''}.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Mobile Filter & Session List - matching SessionCalendar mobile style */}
                <div className="md:hidden space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-sm">
                        <Filter className="mr-2 w-4 h-4 text-blue-600" />
                        Filter by Day
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(DAY_NAMES).map(([day, dayName]) => (
                          <Button
                            key={day}
                            variant={selectedDay === day ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleDaySelect(day)}
                            className={
                              selectedDay === day
                                ? 'bg-blue-900 text-white hover:bg-blue-800'
                                : 'text-slate-700 hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200'
                            }
                          >
                            {dayName.slice(0, 3)}
                          </Button>
                        ))}
                        {selectedDay && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDay(null)}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {selectedDay
                          ? `Sessions for ${DAY_NAMES[selectedDay]}`
                          : 'All Sessions'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {filteredSessions.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">
                          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                          <p>No sessions found</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {filteredSessions.map((session) => (
                            <button
                              key={session.id}
                              type="button"
                              onClick={() => setRosterSessionId(session.id)}
                              className="w-full text-left p-4 min-h-[56px] hover:bg-gray-50 active:bg-gray-100 transition-colors flex justify-between items-center gap-3"
                            >
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                                  <span className="truncate">{session.dayName} - {session.timeSlotName}</span>
                                  {session.category && (
                                    <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                                      {session.category}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 flex items-center mt-0.5">
                                  <Users className="w-3 h-3 mr-1" />
                                  {session.enrolledCount}/{session.capacity} enrolled
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Students Tab Content */}
              <TabsContent value="students" className="p-6">
                <StudentsList isAdmin={isAdmin} />
              </TabsContent>

              {/* Settings Tab Content (Admin only) */}
              {isAdmin && (
                <TabsContent value="settings" className="p-6">
                  <SettingsPanel />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Add Participant modal (class-aware) */}
      {addParticipantSession && (
        <AddParticipantModal
          session={addParticipantSession}
          onClose={() => setAddParticipantSession(null)}
          onParticipantAdded={fetchData}
        />
      )}

      {/* Roster Sheet — opened from the timetable (desktop) or the session list (mobile) */}
      <Sheet open={!!rosterSession} onOpenChange={(o) => { if (!o) setRosterSessionId(null); }}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={isMobile ? 'h-[85vh] rounded-t-2xl overflow-y-auto' : 'w-full sm:max-w-md overflow-y-auto'}
        >
          {rosterSession && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {rosterSession.dayName} · {rosterSession.timeSlotName}
                  <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                    {rosterSession.category}
                  </Badge>
                </SheetTitle>
                <SheetDescription>
                  {rosterSession.enrolledCount}/{rosterSession.capacity} enrolled · {rosterSession.fillPercentage}% full
                </SheetDescription>
              </SheetHeader>

              <div className="px-4 pb-6 space-y-3">
                {rosterBooked > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-green-700 border-green-200 hover:bg-green-50"
                    onClick={() => handleBulkAttend(rosterSession)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Mark all {rosterBooked} attended
                  </Button>
                )}

                {rosterSession.students.length > 0 ? (
                  <div className="space-y-2">
                    {rosterSession.students.map((student) => (
                      <StudentRow key={student.bookingId} student={student} onStatusUpdate={handleStatusUpdate} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <div className="text-sm text-gray-500">No students enrolled</div>
                  </div>
                )}

                {rosterSession.availableSpots > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-blue-700 border-blue-200 hover:bg-blue-50"
                    onClick={() => setAddParticipantSession(rosterSession)}
                  >
                    <UserPlus2 className="w-4 h-4 mr-1.5" />
                    Add student to this session
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <PoweredByFooter variant="light" />
    </div>
  );
}

// Status badge color mapping and labels
const STATUS_STYLES = {
  BOOKED: 'bg-blue-100 text-blue-800',
  ATTENDED: 'bg-green-100 text-green-800',
  NO_SHOW: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  INCOMPLETE: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS = {
  BOOKED: 'Booked',
  ATTENDED: 'Attended',
  NO_SHOW: 'No Show',
  COMPLETED: 'Completed',
  INCOMPLETE: 'Incomplete',
  CANCELLED: 'Cancelled',
};

// Student row with status badge and action buttons.
// On phones the action buttons drop below the student info and go full-width
// (bigger tap targets); on desktop they sit inline on the right.
function StudentRow({ student, onStatusUpdate }) {
  const hasActions = student.status === 'BOOKED' || student.status === 'ATTENDED';
  return (
    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
        <div className="min-w-0">
          <div className="font-medium text-gray-900 flex items-center gap-2 flex-wrap">
            {student.name}
            {student.status !== 'BOOKED' && (
              <Badge className={`text-xs ${STATUS_STYLES[student.status] || ''}`}>
                {STATUS_LABELS[student.status] || student.status}
              </Badge>
            )}
          </div>
          <div className="text-xs text-gray-600 space-y-0.5 mt-1">
            <div className="truncate">{student.email}</div>
            {student.phoneNumber && (
              <div>{student.phoneNumber}</div>
            )}
            {student.markedBy && (
              <div className="text-gray-400">Marked by: {student.markedBy}</div>
            )}
          </div>
        </div>
        {hasActions && (
          <div className="flex gap-2 sm:flex-shrink-0">
            {student.status === 'BOOKED' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none h-9 text-xs border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => onStatusUpdate(student.bookingId, 'ATTENDED')}
                >
                  Attended
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none h-9 text-xs border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => onStatusUpdate(student.bookingId, 'NO_SHOW')}
                >
                  No-Show
                </Button>
              </>
            )}
            {student.status === 'ATTENDED' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none h-9 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => onStatusUpdate(student.bookingId, 'COMPLETED')}
                >
                  Completed
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none h-9 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  onClick={() => onStatusUpdate(student.bookingId, 'INCOMPLETE')}
                >
                  Incomplete
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Settings Panel Component (Admin only)
// Presentation metadata for known settings: icon, helper text, units, and
// (for booleans) the two radio choices with their own descriptions.
const SETTING_META = {
  max_capacity_per_session: {
    icon: Users,
    description: 'Default capacity applied when opening a new class slot. Per-slot capacity is set in the matrix below.',
    unit: 'students',
  },
  max_days_per_week: {
    icon: Calendar,
    description: 'Different days a student may book within one week.',
    unit: 'days',
  },
  max_sessions_per_day: {
    icon: Clock,
    description: 'Sessions a student may book on a single day.',
    unit: 'sessions',
  },
  total_practicals_required: {
    icon: GraduationCap,
    description: 'Completed practicals required to finish the course.',
    unit: 'practicals',
  },
  auto_deactivate_on_completion: {
    icon: UserX,
    description: 'What happens once a student completes all required practicals.',
    options: [
      {
        value: 'true',
        title: 'Deactivate automatically',
        description: 'Revoke access as soon as the student is complete. Their data and history are kept.',
      },
      {
        value: 'false',
        title: 'Keep active',
        description: 'The student stays active until an admin deactivates them manually.',
      },
    ],
  },
};

function SettingsPanel() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [numericEdits, setNumericEdits] = useState({});
  const [savingAll, setSavingAll] = useState(false);
  const [savingKey, setSavingKey] = useState({});
  const [archiving, setArchiving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  useEffect(() => {
    axios.get('/api/admin/settings')
      .then(({ data }) => setSettings(data.rows || []))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const numericSettings = settings.filter((s) => s.type !== 'boolean');
  const toggleSettings = settings.filter((s) => s.type === 'boolean');

  const setNumeric = (key, val) => setNumericEdits((p) => ({ ...p, [key]: val }));
  const numericValue = (s) => (numericEdits[s.key] !== undefined ? numericEdits[s.key] : s.value);
  const changedNumeric = numericSettings.filter(
    (s) => numericEdits[s.key] !== undefined && numericEdits[s.key] !== '' && numericEdits[s.key] !== s.value
  );

  // Booking rules save as a single batch
  const handleSaveAll = async () => {
    if (changedNumeric.length === 0) return;
    setSavingAll(true);
    const payload = Object.fromEntries(changedNumeric.map((s) => [s.key, numericEdits[s.key]]));
    try {
      await axios.patch('/api/admin/settings', payload);
      setSettings((prev) => prev.map((s) => (payload[s.key] !== undefined ? { ...s, value: String(payload[s.key]) } : s)));
      setNumericEdits({});
      toast.success(`Saved ${changedNumeric.length} change${changedNumeric.length !== 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSavingAll(false);
    }
  };

  // Boolean/automation settings auto-save on change
  const handleToggleSave = async (key, value) => {
    setSavingKey((p) => ({ ...p, [key]: true }));
    try {
      await axios.patch('/api/admin/settings', { [key]: value });
      setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
      toast.success('Setting updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update setting');
    } finally {
      setSavingKey((p) => ({ ...p, [key]: false }));
    }
  };

  const handleArchive = async () => {
    setShowArchiveConfirm(false);
    setArchiving(true);
    try {
      const { data } = await axios.post('/api/admin/reset-bookings');
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Archive failed');
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const subTab = (value, Icon, label, short) => (
    <TabsTrigger
      value={value}
      className="flex-1 h-full px-2 sm:px-4 text-xs sm:text-sm text-slate-500 data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
    >
      <Icon className="w-4 h-4 mr-1 sm:mr-1.5 shrink-0" />
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{label}</span>
    </TabsTrigger>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-1">
          <Settings className="mr-2 w-5 h-5 text-blue-600" />
          System Settings
        </h3>
        <p className="text-sm text-gray-500">
          Configure how booking and student management behaves.
        </p>
      </div>

      <Tabs defaultValue="capacity" className="w-full">
        <TabsList className="w-full h-11 bg-transparent border border-slate-200 p-1 rounded-lg">
          {subTab('capacity', SlidersHorizontal, 'Schedule & capacity', 'Capacity')}
          {subTab('rules', BarChart3, 'Booking rules', 'Rules')}
          {subTab('automation', Zap, 'Automation', 'Auto')}
          {subTab('maintenance', RefreshCcw, 'Maintenance', 'Archive')}
        </TabsList>

        {/* Primary: per-class capacity is how offerings are controlled */}
        <TabsContent value="capacity" className="pt-4">
          <SessionCapacityMatrix />
        </TabsContent>

        {/* Booking rules — batch save */}
        <TabsContent value="rules" className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {numericSettings.map((setting) => (
              <SettingCard
                key={setting.key}
                setting={setting}
                value={numericValue(setting)}
                onChange={setNumeric}
              />
            ))}
          </div>
          <div className="flex items-center justify-end gap-3 border-t pt-4">
            {changedNumeric.length > 0 && (
              <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                {changedNumeric.length} unsaved
              </Badge>
            )}
            <Button
              onClick={handleSaveAll}
              disabled={savingAll || changedNumeric.length === 0}
              className="bg-blue-900 hover:bg-blue-800"
            >
              {savingAll
                ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</>
                : <><Save className="w-4 h-4 mr-1.5" /> Save changes</>}
            </Button>
          </div>
        </TabsContent>

        {/* Automation — auto-save toggles */}
        <TabsContent value="automation" className="pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {toggleSettings.map((setting) => (
              <SettingCard
                key={setting.key}
                setting={setting}
                saving={savingKey[setting.key]}
                onSave={handleToggleSave}
              />
            ))}
          </div>
        </TabsContent>

        {/* Maintenance — weekly archive */}
        <TabsContent value="maintenance" className="pt-4">
          <div className="rounded-lg border border-gray-200 p-5">
            <h3 className="text-base font-medium text-gray-900 flex items-center mb-1">
              <RefreshCcw className="mr-2 w-5 h-5 text-blue-600" />
              Weekly Archive
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Archive stale bookings from past weeks. Runs automatically every Sunday — use this to trigger manually if needed.
            </p>
            <Button
              variant="outline"
              disabled={archiving}
              onClick={() => setShowArchiveConfirm(true)}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              {archiving ? (
                <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Archiving...</>
              ) : (
                <><RefreshCcw className="mr-2 w-4 h-4" /> Run Archive Now</>
              )}
            </Button>
          </div>

          <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                  Archive Stale Bookings
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently update the status of all unresolved bookings from past weeks. This action cannot be undone.
                </AlertDialogDescription>
                <div className="space-y-3 text-sm">
                  <div className="bg-amber-50 p-3 rounded-md border border-amber-200 space-y-1">
                    <div className="text-amber-800 font-medium">The following changes will be made:</div>
                    <ul className="list-disc list-inside text-amber-700 mt-1">
                      <li>BOOKED (not attended) will be set to CANCELLED</li>
                      <li>ATTENDED (not finalized) will be set to INCOMPLETE</li>
                    </ul>
                  </div>
                  <div className="text-muted-foreground">
                    Only bookings from previous weeks are affected — current week bookings will not be changed.
                  </div>
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchive} className="bg-red-600 hover:bg-red-700">
                  Archive Now
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Small header shared by every setting card: icon chip + label + description
function SettingCardHeader({ Icon, label, description, htmlFor, saving }) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Label htmlFor={htmlFor} className="text-sm font-semibold text-gray-900">
            {label}
          </Label>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
        </div>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

// Individual setting card.
// Boolean settings auto-save (onSave). Numeric settings are controlled by the
// parent (value/onChange) and saved together via the batch "Save changes" bar.
function SettingCard({ setting, value, onChange, saving, onSave }) {
  const meta = SETTING_META[setting.key] || {};
  const Icon = meta.icon;

  // Boolean settings render as a radio group with two described choices
  if (setting.type === 'boolean') {
    const current = setting.value;
    const options = meta.options || [
      { value: 'true', title: 'Enabled', description: 'Turn this behavior on.' },
      { value: 'false', title: 'Disabled', description: 'Turn this behavior off.' },
    ];
    const handleChange = (next) => {
      if (next === current) return;
      onSave(setting.key, next);
    };
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <SettingCardHeader Icon={Icon} label={setting.label} description={meta.description} saving={saving} />
          <RadioGroup value={current} onValueChange={handleChange} disabled={saving} className="gap-2">
            {options.map((opt) => {
              const active = current === opt.value;
              const id = `${setting.key}-${opt.value}`;
              return (
                <label
                  key={opt.value}
                  htmlFor={id}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    active
                      ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-200'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <RadioGroupItem id={id} value={opt.value} className="mt-0.5" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900">{opt.title}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">{opt.description}</span>
                  </span>
                </label>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>
    );
  }

  // Numeric setting — controlled, batch-saved by the parent
  const changed = value !== setting.value;
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-5 space-y-3">
        <SettingCardHeader Icon={Icon} label={setting.label} description={meta.description} htmlFor={setting.key} />
        <div className="relative">
          <Input
            id={setting.key}
            type="number"
            value={value}
            onChange={(e) => onChange(setting.key, e.target.value)}
            className={`${meta.unit ? 'pr-20' : ''} ${changed ? 'border-blue-400 ring-1 ring-blue-100' : ''}`}
            min={0}
          />
          {meta.unit && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {meta.unit}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

