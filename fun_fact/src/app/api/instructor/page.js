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
  Clock
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

// Custom components
import CreateStudentForm from '@/components/CreateStudentForm';
import SessionToggleDialog from '@/components/SessionToggleDialog';
import StudentsList from '@/components/StudentsList';

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

  // Fetch data on initial load
  useEffect(() => {
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

  // Handle student creation success
  const handleStudentCreated = (student) => {
    toast.success(`Student ${student.name} created successfully`);
    fetchData();
  };

  // Loading state - matching SessionCalendar loading style
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <header className="bg-white shadow sticky top-0 z-10">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header - matching existing header style */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
              <p className="text-sm text-gray-600">
                Manage sessions and students
              </p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              {/* Create Student Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
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

              {/* Export Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        window.open('/api/instructor/export?instructor_key=demo_instructor_access', '_blank');
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
                variant="ghost"
                size="icon"
                disabled={refreshing}
                onClick={fetchData}
                className="hidden sm:flex"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
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
              <div className="border-b bg-gray-50/50">
                <TabsList className="h-auto bg-transparent p-0 w-full justify-start">
                  <TabsTrigger
                    value="sessions"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm h-12 px-6 flex items-center space-x-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Sessions</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="students"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm h-12 px-6 flex items-center space-x-2"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Students</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Sessions Tab Content */}
              <TabsContent value="sessions" className="p-6 space-y-6">
                {/* Analytics Summary - matching SessionCalendar analytics style */}
                {analytics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <BarChart3 className="mr-2 w-5 h-5 text-blue-600" />
                        Session Analytics
                      </h3>
                      <span className="text-sm text-gray-500">
                        Overview of all sessions
                      </span>
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
                            <Badge variant={analytics.overallFillRate > 75 ? "default" : "outline"} className="bg-blue-100 text-blue-800 hover:bg-blue-100">
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
                              ~{analytics.averageSessionsPerStudent} avg
                            </Badge>
                          </div>
                          <div className="mt-3 text-xs text-gray-500">
                            {analytics.averageSessionsPerStudent < 3
                              ? "Some students haven't booked all sessions"
                              : "All students active"}
                          </div>
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
                              {analytics.totalSessions} sessions
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-3">
                            {analytics.availableSpots > 10
                              ? "Plenty of capacity"
                              : "Limited availability"}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
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
                      <TabsList className="mb-4">
                        {Object.entries(DAY_NAMES).map(([day, dayName]) => (
                          <TabsTrigger key={day} value={day}>
                            {dayName}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {Object.entries(sessionsByDay).map(([day, daySessions]) => (
                        <TabsContent key={day} value={day} className="space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {daySessions.map(session => (
                              <SessionCard
                                key={session.id}
                                session={session}
                                isExpanded={expandedSessions[session.id]}
                                toggleExpansion={() => toggleSessionExpansion(session.id)}
                                onToggleStatus={() => handleSessionToggle(session)}
                              />
                            ))}
                          </div>
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
                            className="text-xs"
                          >
                            {dayName.slice(0, 3)}
                          </Button>
                        ))}
                        {selectedDay && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDay(null)}
                            className="text-xs"
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

                                <div className="flex items-center space-x-2">
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

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleSessionExpansion(session.id)}
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
                                      <div
                                        key={student.bookingId}
                                        className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                                      >
                                        <div className="font-medium text-gray-900">
                                          {student.name}
                                        </div>
                                        <div className="text-xs text-gray-600 space-y-1">
                                          <div>ID: {student.id}</div>
                                          <div>Email: {student.email}</div>
                                          {student.phoneNumber && (
                                            <div>Phone: {student.phoneNumber}</div>
                                          )}
                                        </div>
                                      </div>
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
                <StudentsList />
              </TabsContent>
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
    </div>
  );
}

// Session Card Component for Desktop View - matching SessionCard styling
function SessionCard({ session, isExpanded, toggleExpansion, onToggleStatus }) {
  const isDisabled = session.isEnabled === false;

  return (
    <Card className={`border-gray-200 ${isDisabled ? "border-red-200 bg-red-50/30" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center">
            {session.dayName} - {session.timeSlotName}
            {isDisabled && (
              <Badge variant="outline" className="ml-2 text-red-600 border-red-200 bg-red-50">
                Disabled
              </Badge>
            )}
          </CardTitle>
          <div className="flex space-x-2">
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

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpansion}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <CardDescription>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-1" />
              <span>Capacity: {session.capacity}</span>
            </div>
            <Badge
              variant={session.fillPercentage > 75 ? "default" : "outline"}
              className={`${
                session.fillPercentage > 75 
                  ? "bg-green-100 text-green-800 hover:bg-green-100" 
                  : "bg-blue-50 text-blue-800"
              }`}
            >
              {session.enrolledCount}/{session.capacity} enrolled
            </Badge>
          </div>
          <Progress
            value={(session.enrolledCount / session.capacity) * 100}
            className="h-2"
          />
        </CardDescription>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="text-sm font-medium mb-3">Enrolled Students:</div>
          {session.students.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {session.students.map((student) => (
                <div
                  key={student.bookingId}
                  className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                >
                  <div className="font-medium text-gray-900">
                    {student.name}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 text-xs text-gray-600 gap-1 mt-1">
                    <div>ID: {student.id}</div>
                    <div>Email: {student.email}</div>
                    {student.phoneNumber && (
                      <div className="sm:col-span-2">Phone: {student.phoneNumber}</div>
                    )}
                  </div>
                </div>
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
