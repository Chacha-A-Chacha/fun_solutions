'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/lib/constants';

export default function InstructorDashboard() {
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading session data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                View and manage student session enrollments
              </p>
            </div>
            
            <div>
              <a 
                href="/api/instructor/export?instructor_key=demo_instructor_access" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                Export CSV
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Summary */}
        {analytics && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Session Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-blue-800">Total Enrollment</h3>
                <div className="mt-2 flex justify-between items-end">
                  <p className="text-2xl font-bold text-blue-900">{analytics.totalEnrolled}/{analytics.totalCapacity}</p>
                  <p className="text-sm text-blue-700">{analytics.overallFillRate}% filled</p>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-green-800">Participating Students</h3>
                <div className="mt-2 flex justify-between items-end">
                  <p className="text-2xl font-bold text-green-900">{analytics.uniqueStudentCount}</p>
                  <p className="text-sm text-green-700">~{analytics.averageSessionsPerStudent} sessions/student</p>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-purple-800">Available Spots</h3>
                <div className="mt-2 flex justify-between items-end">
                  <p className="text-2xl font-bold text-purple-900">{analytics.availableSpots}</p>
                  <p className="text-sm text-purple-700">across {analytics.totalSessions} sessions</p>
                </div>
              </div>
            </div>
            
            {/* Day & Time Popularity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium mb-2">Most Popular Days</h3>
                <div className="space-y-2">
                  {analytics.dayPopularity.slice(0, 3).map((day) => (
                    <div key={day.day} className="flex items-center">
                      <span className="w-24 text-gray-700">{day.dayName}</span>
                      <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${day.fillRate}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-600">{day.fillRate}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">Most Popular Time Slots</h3>
                <div className="space-y-2">
                  {analytics.timeSlotPopularity.slice(0, 3).map((slot) => (
                    <div key={slot.timeSlot} className="flex items-center">
                      <span className="w-36 text-sm text-gray-700">{slot.timeSlotName}</span>
                      <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-600 rounded-full"
                          style={{ width: `${slot.fillRate}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-600">{slot.fillRate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Day Selector */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium mb-4">Filter by Day</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {Object.entries(DAY_NAMES).map(([day, dayName]) => (
              <button
                key={day}
                onClick={() => handleDaySelect(day)}
                className={`
                  p-3 rounded-md text-center transition-colors
                  ${selectedDay === day ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-800'}
                `}
              >
                {dayName}
              </button>
            ))}
            {selectedDay && (
              <button
                onClick={() => setSelectedDay(null)}
                className="p-3 rounded-md text-center bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                Show All
              </button>
            )}
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">
              {selectedDay ? `Sessions for ${DAY_NAMES[selectedDay]}` : 'All Sessions'}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day & Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollment
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{session.dayName}</div>
                      <div className="text-sm text-gray-500">{session.timeSlotName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {session.enrolledCount}/{session.capacity}
                        </div>
                        <div className="ml-2 flex-1 max-w-xs">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                session.fillPercentage > 75 ? 'bg-green-600' : 
                                session.fillPercentage > 25 ? 'bg-blue-600' : 'bg-yellow-600'
                              }`}
                              style={{ width: `${session.fillPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {session.students.length > 0 ? (
                        <div className="max-h-40 overflow-y-auto">
                          {session.students.map((student) => (
                            <div key={student.bookingId} className="mb-2 text-sm">
                              <div className="font-medium text-gray-900">{student.name}</div>
                              <div className="text-gray-500">{student.id} | {student.email}</div>
                              {student.phoneNumber && (
                                <div className="text-gray-500">{student.phoneNumber}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">No students enrolled</div>
                      )}
                    </td>
                  </tr>
                ))}
                
                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                      No sessions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
