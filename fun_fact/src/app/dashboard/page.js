// file: src/app/dashboard/page.js
// description: This component serves as the dashboard for students, displaying their selected sessions and available sessions for booking. It includes a header with user information, a session calendar, and a list of selected sessions. The component uses React hooks for state management and Next.js for routing. It also integrates with a toast notification system for error handling.
//     const timeSlotName = TIME_SLOT_NAMES[session.timeSlot];

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { useSessionData } from '@/app/hooks/useSessionData';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  CalendarCheck, 
  Info, 
  Phone, 
  RefreshCw,
  Clock
} from 'lucide-react';
import SessionCalendar from '@/components/SessionCalendar';
import SelectedSessions from '@/components/SelectedSessions';
import Image from 'next/image';

// Function to generate avatar abbreviation
const getNameAbbreviation = (name = '') => {
  if (!name) return 'UN';
  
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Function to generate avatar URL
const getAvatarUrl = (student) => {
  if (student?.avatarUrl) return student.avatarUrl;

  if (student?.name) {
    const name = encodeURIComponent(student.name);
    return `https://ui-avatars.com/api/?name=${name}&background=0D8AFD&color=fff&size=128`;
  }

  return null;
};

export default function Dashboard() {
  const { isAuthenticated, student, loading: authLoading, logout } = useAuth();
  const { 
    loading: dataLoading, 
    lastRefresh, 
    fetchAllData, 
    remainingSlots
  } = useSessionData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Generate name abbreviation
  const nameAbbreviation = useMemo(() => 
    getNameAbbreviation(student?.name), 
    [student]
  );

  // Generate avatar URL
  const avatarUrl = useMemo(() => 
    getAvatarUrl(student), 
    [student]
  );

  // Format the last refresh time
  const formattedLastRefresh = useMemo(() => {
    if (!lastRefresh) return 'Never';
    
    // If within the last minute, show "Just now"
    const diffMs = Date.now() - new Date(lastRefresh).getTime();
    if (diffMs < 60000) return 'Just now';
    
    // If within the last hour, show minutes
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Otherwise show time
    return new Date(lastRefresh).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [lastRefresh]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setIsRefreshing(false);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  // Show loading state
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CalendarCheck className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900">Session Scheduler</h1>
          </div>
          
          {/* Last refresh indicator */}
          <div className="hidden md:flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>Last updated: {formattedLastRefresh}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="ml-1 h-6 w-6 text-gray-400 hover:text-gray-600"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {/* Student Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {avatarUrl ? (
                <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer">
                  <Image 
                    src={avatarUrl} 
                    alt={`${student.name}'s avatar`} 
                    width={40} 
                    height={40} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.parentNode.innerHTML = `
                        <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                          ${nameAbbreviation}
                        </div>
                      `;
                    }}
                  />
                </div>
              ) : (
                <Button variant="outline" size="icon" className="rounded-full w-10 h-10 bg-blue-100 text-blue-800 hover:bg-blue-200">
                  {nameAbbreviation}
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center space-x-3">
                  {avatarUrl ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <Image 
                        src={avatarUrl} 
                        alt={`${student.name}'s avatar`} 
                        width={48} 
                        height={48} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.parentNode.innerHTML = `
                            <div class="w-12 h-12 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xl font-bold">
                              ${nameAbbreviation}
                            </div>
                          `;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xl font-bold">
                      {nameAbbreviation}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{student.name}</div>
                    <div className="text-xs text-gray-500">Student ID: {student.id}</div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{student.phoneNumber || 'No phone number'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onSelect={logout}
                className="text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <LogOut className="mr-2 w-4 h-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Booking Guidelines
            </CardTitle>
            <CardDescription>
              Key information for session selection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Session Rules</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Select sessions on 2 different days
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    One session per day allowed
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Maximum 4 students per session
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Modify selections while spots are open
                  </li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Session Times</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Weekdays: 8-10am, 10am-12pm
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Weekdays: 1-3pm, 3-5pm
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Weekends: 9-11am, 11am-1pm
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Weekends: 2-4pm, 4-6pm
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Selections */}
        <Card>
          <CardHeader>
            <CardTitle>Your Selected Sessions</CardTitle>
            <CardDescription>
              Review and manage your booked sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SelectedSessions />
          </CardContent>
        </Card>

        {/* Session Selection Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Available Sessions</CardTitle>
            <CardDescription>
              Choose your practical sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionCalendar />
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="mt-8 mb-4 text-center">
        <div className="flex justify-center items-center space-x-4">
          <a 
            href="https://www.chach-a.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="text-xs text-gray-600 group-hover:text-gray-800 transition-colors">
              Powered by
            </span>
            <img 
              src="https://www.chach-a.com/logoMark.svg" 
              alt="Chacha Technologies Logo" 
              className="transform h-7 w-auto group-hover:scale-110 transition-transform duration-300" 
            />
            <span className="text-sm font-medium text-gray-800 group-hover:text-black">
              Chacha Technologies
            </span>
          </a>
        </div>
      </footer>
    </div>
  );
}
