'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Filter 
} from 'lucide-react';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function InstructorDashboard() {
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [expandedSessions, setExpandedSessions] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch session data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/instructor/sessions');
        setSessions(data.sessions);
        setAnalytics(data.analytics);
        setError(null);
      } catch (err) {
        console.error('Error fetching session data:', err);
        setError('Failed to load session data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter sessions by selected day
  const filteredSessions = selectedDay
    ? sessions.filter(session => session.day === selectedDay)
    : sessions;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Calendar className="mx-auto mb-4 w-12 h-12 text-blue-600 animate-pulse" />
          <p className="text-gray-600 animate-pulse">Loading session data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex flex-col items-center justify-center p-4">
        <div className="text-center bg-white shadow-lg rounded-lg p-8">
          <Users className="mx-auto mb-4 w-12 h-12 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            variant="destructive"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <Calendar className="mr-2 w-5 h-5 text-blue-600" />
              Instructor Dashboard
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Session enrollment management
            </p>
          </div>
          
          <a 
            href="/api/instructor/export?instructor_key=demo_instructor_access" 
            className="inline-flex items-center text-sm text-white bg-green-600 hover:bg-green-700 p-2 rounded-md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </a>
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
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-xs font-medium text-blue-800">Total Enrollment</h3>
                  <div className="mt-2 flex justify-between items-end">
                    <p className="text-xl font-bold text-blue-900">
                      {analytics.totalEnrolled}/{analytics.totalCapacity}
                    </p>
                    <p className="text-xs text-blue-700">{analytics.overallFillRate}% filled</p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-xs font-medium text-green-800">Participating Students</h3>
                  <div className="mt-2 flex justify-between items-end">
                    <p className="text-xl font-bold text-green-900">
                      {analytics.uniqueStudentCount}
                    </p>
                    <p className="text-xs text-green-700">
                      ~{analytics.averageSessionsPerStudent} sessions/student
                    </p>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-xs font-medium text-purple-800">Available Spots</h3>
                  <div className="mt-2 flex justify-between items-end">
                    <p className="text-xl font-bold text-purple-900">
                      {analytics.availableSpots}
                    </p>
                    <p className="text-xs text-purple-700">
                      across {analytics.totalSessions} sessions
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Day Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 w-5 h-5 text-blue-600" />
              Filter by Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {Object.entries(DAY_NAMES).map(([day, dayName]) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDaySelect(day)}
                >
                  {isMobile ? dayName.slice(0, 3) : dayName}
                </Button>
              ))}
              {selectedDay && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setSelectedDay(null)}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sessions List/Table */}
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
                    {/* Mobile & Desktop Friendly Session Display */}
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {session.dayName} - {session.timeSlotName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {session.enrolledCount}/{session.capacity} enrolled
                        </div>
                      </div>
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
      </main>
    </div>
  );
}
