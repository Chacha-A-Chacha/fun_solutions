// file: src/app/dashboard/page.js
// description: This component serves as the dashboard for students, displaying their selected sessions and available sessions for booking. It includes a header with user information, a session calendar, and a list of selected sessions. The component uses React hooks for state management and Next.js for routing. It also integrates with a toast notification system for error handling.
//     const timeSlotName = TIME_SLOT_NAMES[session.timeSlot];

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { useSessionData } from '@/app/hooks/useSessionData';
import { useSettings } from '@/app/hooks/useSettings';
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
  Clock,
  History
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import SessionCalendar from '@/components/SessionCalendar';
import SelectedSessions from '@/components/SelectedSessions';
import StudentHistorySheet from '@/components/StudentHistorySheet';
import Image from 'next/image';
import PoweredByFooter from '@/components/PoweredByFooter';

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
  const { settings } = useSettings();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Guidelines start open on desktop, collapsed on mobile (less scroll to the calendar).
  // Computed once client-side — this screen renders after the auth gate, so no SSR mismatch.
  const [guidelinesDefault] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches ? 'guidelines' : undefined
  );
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

  // Format the last refresh time (auto-updates every 30s)
  const [formattedLastRefresh, setFormattedLastRefresh] = useState('Never');
  useEffect(() => {
    const formatRefresh = () => {
      if (!lastRefresh) return 'Never';
      const diffMs = Date.now() - new Date(lastRefresh).getTime();
      if (diffMs < 60000) return 'Just now';
      if (diffMs < 3600000) {
        const minutes = Math.floor(diffMs / 60000);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      }
      return new Date(lastRefresh).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    setFormattedLastRefresh(formatRefresh());
    const interval = setInterval(() => setFormattedLastRefresh(formatRefresh()), 30000);
    return () => clearInterval(interval);
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

  // Show a layout-shaped skeleton while auth resolves (better perceived speed on mobile)
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-blue-900 h-16 pt-[env(safe-area-inset-top)] shadow-lg" />
        <main className="container mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-900 shadow-lg sticky top-0 z-10 pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-3">
          <div className="flex items-center space-x-2 min-w-0">
            <CalendarCheck className="w-6 h-6 text-blue-200 shrink-0" />
            <h1 className="text-lg font-bold text-white truncate">Session Scheduler</h1>
          </div>

          {/* Last refresh indicator */}
          <div className="hidden md:flex items-center text-sm text-blue-200">
            <Clock className="w-4 h-4 mr-1" />
            <span>Last updated: {formattedLastRefresh}</span>
            <Button
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="ml-1 h-6 w-6 bg-transparent text-blue-200 hover:text-white hover:bg-blue-800 shadow-none"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* History & Profile */}
          <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setHistoryOpen(true)}
            className="border-blue-300 bg-transparent text-blue-100 hover:text-white hover:bg-blue-800 hover:border-white shadow-none"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">My Progress</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {avatarUrl && !avatarError ? (
                <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer ring-2 ring-blue-300">
                  <Image
                    src={avatarUrl}
                    alt={`${student.name}'s avatar`}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                </div>
              ) : (
                <Button size="icon" className="rounded-full w-10 h-10 bg-blue-800 text-white hover:bg-blue-700 border border-blue-300">
                  {nameAbbreviation}
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center space-x-3">
                  {avatarUrl && !avatarError ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <Image
                        src={avatarUrl}
                        alt={`${student.name}'s avatar`}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
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
                    {student.category && (
                      <div className="text-xs text-blue-600 font-medium mt-0.5">Class {student.category}</div>
                    )}
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
        </div>
      </header>

      {/* Booking History Sheet */}
      <StudentHistorySheet selfMode open={historyOpen} onOpenChange={setHistoryOpen} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Instructions — collapsible on mobile to keep the calendar within reach */}
        <Accordion type="single" collapsible defaultValue={guidelinesDefault} className="w-full">
          <AccordionItem value="guidelines" className="border rounded-lg bg-card shadow-sm">
            <AccordionTrigger className="px-4 sm:px-6 hover:no-underline">
              <span className="flex items-center gap-2 font-semibold">
                <Info className="w-5 h-5 text-blue-900" />
                Booking Guidelines
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Session Rules</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Select up to {settings.max_days_per_week} days per week
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    {settings.max_sessions_per_day === 1 ? 'One session per day allowed' : `Up to ${settings.max_sessions_per_day} sessions per day`}
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    You only see sessions for your licence class{student?.category ? ` (${student.category})` : ''}
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Modify selections while spots are open
                  </li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">How It Works</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Pick a day from the calendar below
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Choose an available time slot
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Cancel bookings anytime before the session
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2">•</span>
                    Each session is 2 hours long
                  </li>
                </ul>
              </div>
            </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

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
            <CardTitle className="flex items-center gap-2">
              Available Sessions
              {student?.category && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Class {student.category}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Choose your practical sessions — only slots for your licence class are shown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionCalendar />
          </CardContent>
        </Card>
      </main>

      <PoweredByFooter variant="light" />
    </div>
  );
}
