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
  Download,
  Filter,
  Plus,
  RefreshCcw,
  ToggleLeft,
  ToggleRight,
  Info,
  UserPlus,
  GraduationCap,
  BarChart3,
  Clock,
  LogOut,
  Settings,
  Save
} from 'lucide-react';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';

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
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Custom components
import CreateStudentForm from '@/components/CreateStudentForm';
import AddInstructorForm from '@/components/AddInstructorForm';
import SessionToggleDialog from '@/components/SessionToggleDialog';
import StudentsList from '@/components/StudentsList';
import PoweredByFooter from '@/components/PoweredByFooter';

export default function InstructorDashboard() {
  // State management
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSessions, setExpandedSessions] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDisableSessionDialog, setShowDisableSessionDialog] = useState(false);
  const [sessionToToggle, setSessionToToggle] = useState(null);
  const [activeTab, setActiveTab] = useState('sessions');
  const [userRole, setUserRole] = useState(null);

  const isAdmin = userRole === 'ADMIN';

  // Fetch session data
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const { data } = await axios.get('/api/instructor/sessions');
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

  // Fetch user role and session data on initial load
  useEffect(() => {
    axios.get('/api/auth/staff')
      .then(({ data }) => setUserRole(data.user?.role || null))
      .catch(() => setUserRole(null));
    fetchData();
  }, []);

  // Filter sessions by selected day
  const filteredSessions = selectedDay
    ? sessions.filter(session => session.day === selectedDay)
    : sessions;

  // Group sessions by day for the tabs view
  const sessionsByDay = sessions.reduce((acc, session) => {
    if (!acc[session.day]) {
      acc[session.day] = [];
    }
    acc[session.day].push(session);
    return acc;
  }, {});

  // Handle day selection
  const handleDaySelect = (day) => {
    setSelectedDay(day === selectedDay ? null : day);
  };

  // Toggle session expansion
  const toggleSessionExpansion = (sessionId) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  // Handle session toggle (enable/disable)
  const handleSessionToggle = (session) => {
    setSessionToToggle(session);
    setShowDisableSessionDialog(true);
  };

  // Handle session status change
  const handleSessionStatusChange = async (sessionId, isEnabled) => {
    try {
      await axios.patch(`/api/instructor/sessions/${sessionId}`, {
        isEnabled
      });

      // Update local state
      setSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === sessionId
            ? { ...session, isEnabled }
            : session
        )
      );

      toast.success(`Session ${isEnabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error updating session status:', error);
      toast.error('Failed to update session status');
    }

    setShowDisableSessionDialog(false);
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
      <header className="bg-blue-900 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-white">Instructor Dashboard</h1>
              <p className="text-sm text-blue-200">
                Manage sessions and students
              </p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              {/* Create Student Button (Admin only) */}
              {isAdmin && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className="w-full sm:w-auto bg-white text-blue-900 hover:bg-blue-50">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Student
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Create New Student</SheetTitle>
                      <SheetDescription>
                        Add a new student to the system
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                      <CreateStudentForm onSuccess={handleStudentCreated} />
                    </div>
                  </SheetContent>
                </Sheet>
              )}

              {/* Add Instructor Button (Admin only) */}
              {isAdmin && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto bg-transparent border-blue-300 text-white hover:bg-blue-800 hover:text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Instructor
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Add Staff Member</SheetTitle>
                      <SheetDescription>
                        Create a new instructor or admin account
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                      <AddInstructorForm onSuccess={() => toast.success('Staff member added')} />
                    </div>
                  </SheetContent>
                </Sheet>
              )}

              {/* Export Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto bg-transparent text-blue-100 border-blue-400 hover:bg-blue-800 hover:text-white"
                      onClick={() => {
                        window.open('/api/instructor/export', '_blank');
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download all session data as CSV</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Refresh Button */}
              <Button
                size="icon"
                disabled={refreshing}
                onClick={fetchData}
                className="hidden sm:flex bg-transparent text-blue-200 hover:text-white hover:bg-blue-800 shadow-none"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>

              {/* Logout Button */}
              <Button
                size="icon"
                onClick={handleLogout}
                className="bg-transparent text-blue-200 hover:text-white hover:bg-blue-800 shadow-none"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

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

                {/* Day Selector & Sessions View - matching SessionCalendar day selector */}
                <Card className="hidden md:block">
                  <CardHeader>
                    <CardTitle>Sessions by Day</CardTitle>
                    <CardDescription>
                      View and manage sessions for each day
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue={Object.keys(sessionsByDay)[0] || "none"}>
                      <TabsList className="w-full h-11 bg-transparent border border-slate-200 p-1 rounded-lg mb-4">
                        {Object.entries(DAY_NAMES).map(([day, dayName]) => (
                          <TabsTrigger key={day} value={day} className="flex-1 h-full text-slate-500 data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all">
                            {dayName}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {Object.entries(DAY_NAMES).map(([day]) => (
                        <TabsContent key={day} value={day} className="space-y-4">
                          {sessionsByDay[day]?.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {sessionsByDay[day].map(session => (
                                <SessionCard
                                  key={session.id}
                                  session={session}
                                  isExpanded={expandedSessions[session.id]}
                                  toggleExpansion={() => toggleSessionExpansion(session.id)}
                                  onToggleStatus={() => handleSessionToggle(session)}
                                  onStatusUpdate={handleStatusUpdate}
                                  isAdmin={isAdmin}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-10 text-gray-500">
                              <Calendar className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                              <p className="text-sm">No sessions on this day</p>
                            </div>
                          )}
                        </TabsContent>
                      ))}
                    </Tabs>
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
                            <div
                              key={session.id}
                              className="p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-semibold text-gray-900 flex items-center">
                                    {session.dayName} - {session.timeSlotName}
                                    {session.isEnabled === false && (
                                      <Badge variant="outline" className="ml-2 text-red-600 border-red-200 bg-red-50">
                                        Disabled
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600 flex items-center">
                                    <Users className="w-3 h-3 mr-1" />
                                    {session.enrolledCount}/{session.capacity} enrolled
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1">
                                  {isAdmin && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSessionToggle(session)}
                                    >
                                      {session.isEnabled !== false ? (
                                        <ToggleRight className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <ToggleLeft className="w-4 h-4 text-gray-400" />
                                      )}
                                    </Button>
                                  )}

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleSessionExpansion(session.id)}
                                    className="text-gray-400"
                                  >
                                    {expandedSessions[session.id] ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {/* Expanded Session Details */}
                              {expandedSessions[session.id] && (
                                <div className="mt-4 space-y-2">
                                  {session.students.length > 0 ? (
                                    session.students.map((student) => (
                                      <StudentRow
                                        key={student.bookingId}
                                        student={student}
                                        onStatusUpdate={handleStatusUpdate}
                                      />
                                    ))
                                  ) : (
                                    <div className="text-sm text-gray-500 italic p-4 text-center">
                                      No students enrolled
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
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

      {/* Session Toggle Dialog */}
      {showDisableSessionDialog && sessionToToggle && (
        <SessionToggleDialog
          session={sessionToToggle}
          open={showDisableSessionDialog}
          onOpenChange={setShowDisableSessionDialog}
          onConfirm={handleSessionStatusChange}
        />
      )}

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

// Student row with status badge and action buttons
function StudentRow({ student, onStatusUpdate }) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-gray-900 flex items-center gap-2">
            {student.name}
            {student.status !== 'BOOKED' && (
              <Badge className={`text-xs ${STATUS_STYLES[student.status] || ''}`}>
                {STATUS_LABELS[student.status] || student.status}
              </Badge>
            )}
          </div>
          <div className="text-xs text-gray-600 space-y-0.5 mt-1">
            <div>{student.email}</div>
            {student.phoneNumber && (
              <div>{student.phoneNumber}</div>
            )}
            {student.markedBy && (
              <div className="text-gray-400">Marked by: {student.markedBy}</div>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0 ml-2">
          {student.status === 'BOOKED' && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => onStatusUpdate(student.bookingId, 'ATTENDED')}
              >
                Attended
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-red-300 text-red-700 hover:bg-red-50"
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
                className="text-xs h-7 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                onClick={() => onStatusUpdate(student.bookingId, 'COMPLETED')}
              >
                Completed
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                onClick={() => onStatusUpdate(student.bookingId, 'INCOMPLETE')}
              >
                Incomplete
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Settings Panel Component (Admin only)
function SettingsPanel() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    axios.get('/api/admin/settings')
      .then(({ data }) => setSettings(data.rows || []))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key, value) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      await axios.patch('/api/admin/settings', { [key]: value });
      toast.success('Setting updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update setting');
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 flex items-center mb-1">
          <Settings className="mr-2 w-5 h-5 text-blue-600" />
          System Settings
        </h3>
        <p className="text-sm text-gray-500">
          Configure system-wide constraints. Changes take effect immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settings.map((setting) => (
          <SettingCard
            key={setting.key}
            setting={setting}
            saving={saving[setting.key]}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  );
}

// Individual setting card
function SettingCard({ setting, saving, onSave }) {
  const [value, setValue] = useState(setting.value);
  const hasChanged = value !== setting.value;

  return (
    <Card>
      <CardContent className="pt-6">
        <Label htmlFor={setting.key} className="text-sm font-medium text-gray-700">
          {setting.label}
        </Label>
        <div className="flex items-center gap-2 mt-2">
          <Input
            id={setting.key}
            type={setting.type === 'number' ? 'number' : 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1"
            min={setting.type === 'number' ? 1 : undefined}
          />
          <Button
            size="sm"
            disabled={!hasChanged || saving}
            onClick={() => onSave(setting.key, value)}
            className="shrink-0 bg-blue-900 hover:bg-blue-800"
          >
            {saving ? (
              <RefreshCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Key: {setting.key}
        </p>
      </CardContent>
    </Card>
  );
}

// Session Card Component for Desktop View - matching SessionCard styling
function SessionCard({ session, isExpanded, toggleExpansion, onToggleStatus, onStatusUpdate, isAdmin }) {
  const isDisabled = session.isEnabled === false;

  return (
    <Card className={`border-gray-200 ${isDisabled ? "border-red-200 bg-red-50/30" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {session.timeSlotName}
              {isDisabled && (
                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-xs">
                  Disabled
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
              <span className="flex items-center">
                <Users className="w-3.5 h-3.5 mr-1" />
                {session.enrolledCount}/{session.capacity} enrolled
              </span>
              <Badge
                variant="outline"
                className={
                  session.fillPercentage >= 80
                    ? "bg-green-50 text-green-700 border-green-200"
                    : session.fillPercentage >= 50
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }
              >
                {session.fillPercentage}% full
              </Badge>
            </div>
          </div>
          <div className="flex space-x-1">
            {isAdmin && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus();
                      }}
                    >
                      {session.isEnabled !== false ? (
                        <ToggleRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {session.isEnabled !== false
                      ? 'Disable this session'
                      : 'Enable this session'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpansion}
              className="text-gray-400 hover:text-gray-700"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span className="text-xs ml-1">{isExpanded ? 'Hide' : 'Students'}</span>
            </Button>
          </div>
        </div>
        <Progress
          value={(session.enrolledCount / session.capacity) * 100}
          className="h-1.5 mt-2"
        />
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {session.students.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {session.students.map((student) => (
                <StudentRow
                  key={student.bookingId}
                  student={student}
                  onStatusUpdate={onStatusUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
              <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <div className="text-sm text-gray-500">No students enrolled</div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
