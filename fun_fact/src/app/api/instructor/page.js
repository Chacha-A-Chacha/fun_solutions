// file: src/app/api/instructor/page.js
// description: This API route handles the instructor dashboard, fetching session data and analytics for the instructor's sessions. It also provides functionality to filter sessions by day and export session data as a CSV file.

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
  Info
} from 'lucide-react';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';

// Shadcn components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
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

export default function InstructorDashboard() {
  // State management
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [expandedSessions, setExpandedSessions] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDisableSessionDialog, setShowDisableSessionDialog] = useState(false);
  const [sessionToToggle, setSessionToToggle] = useState(null);

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
    // Optionally refresh data
    fetchData();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex flex-col items-center justify-center p-4">
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
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
              <p className="text-sm text-gray-600">
                View and manage student session enrollments
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              {/* Create Student Button/Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
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
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Analytics Summary */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 w-5 h-5 text-blue-600" />
                Session Analytics
              </CardTitle>
              <CardDescription>
                Overview of all session enrollments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xs font-medium text-blue-800">Total Enrollment</div>
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-2xl font-bold text-blue-900">
                        {analytics.totalEnrolled}/{analytics.totalCapacity}
                      </div>
                      <Badge variant={analytics.overallFillRate > 75 ? "default" : "outline"}>
                        {analytics.overallFillRate}% filled
                      </Badge>
                    </div>
                    <Progress 
                      value={analytics.overallFillRate} 
                      className="h-2 mt-2" 
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xs font-medium text-green-800">Participating Students</div>
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-2xl font-bold text-green-900">
                        {analytics.uniqueStudentCount}
                      </div>
                      <Badge variant="outline" className="text-green-700">
                        ~{analytics.averageSessionsPerStudent} sessions/student
                      </Badge>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                      {analytics.averageSessionsPerStudent < 3 
                        ? "Some students haven't booked all sessions" 
                        : "All students have booked their sessions"}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-xs font-medium text-purple-800">Available Spots</div>
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-2xl font-bold text-purple-900">
                        {analytics.availableSpots}
                      </div>
                      <Badge variant="outline" className="text-purple-700">
                        across {analytics.totalSessions} sessions
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-4">
                      {analytics.availableSpots > 10 
                        ? "Plenty of spots available" 
                        : "Limited availability remaining"}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Day Selector & Sessions View - Tabs for Desktop */}
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

        {/* Mobile Filter & Session List */}
        <div className="md:hidden space-y-4">
          {/* Filter Card */}
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

          {/* Sessions List */}
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
                <div className="text-center p-4 text-gray-500">
                  No sessions found
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
                                className="bg-gray-100 p-3 rounded-lg"
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
                            <div className="text-sm text-gray-500 italic">
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

// Session Card Component for Desktop View
function SessionCard({ session, isExpanded, toggleExpansion, onToggleStatus }) {
  const isDisabled = session.isEnabled === false;
  
  return (
    <Card className={isDisabled ? "border-red-200" : ""}>
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
          <div className="flex justify-between items-center">
            <span>Capacity: {session.capacity}</span>
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
            className="h-1 mt-2" 
          />
        </CardDescription>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="text-sm font-medium mb-2">Enrolled Students:</div>
          {session.students.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
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
            <div className="text-sm text-gray-500 italic py-4 text-center">
              No students enrolled
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
