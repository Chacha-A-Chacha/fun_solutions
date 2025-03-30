'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import SessionCalendar from '@/components/SessionCalendar';
import SelectedSessions from '@/components/SelectedSessions';

export default function Dashboard() {
  const { isAuthenticated, student, loading, logout } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading state
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Session Scheduler</h1>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              <span className="font-medium">
                Student ID: {student?.id}
              </span>
            </div>
            
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Session Booking Instructions</h2>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Select 3 different days for your practical sessions</li>
              <li>• You can choose one session per day</li>
              <li>• Each session has a capacity of 4 students</li>
              <li>• You can change your selections at any time, as long as spaces are available</li>
            </ul>
          </div>
          
          {/* Current selections */}
          <SelectedSessions />
          
          {/* Session selection calendar */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Available Sessions</h2>
            <SessionCalendar />
          </div>
        </div>
      </main>
    </div>
  );
}
