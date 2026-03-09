// file: src/components/SessionCalendar.js
// description: This component displays a calendar for selecting session days and times. It uses custom hooks to manage bookings and sessions, and includes loading and error states for better user experience.


'use client';

import { useState, useEffect } from 'react';
import { DAY_NAMES } from '@/app/lib/constants';
import { useSessionData } from '@/app/hooks/useSessionData';
import SessionCard from './SessionCard';
import { RefreshCw, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SessionCalendar() {
  const {
    sessions,
    sessionsByDay,
    loading: sessionsLoading,
    fetchAllData: refreshSessions,
    error,
    isDayBooked,
    remainingSlots,
    lastAction,
    maxDaysPerWeek
  } = useSessionData();
  
  const [selectedDay, setSelectedDay] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Handle day selection
  const handleDaySelect = (day) => {
    setSelectedDay(day === selectedDay ? null : day);
  };
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSessions();
    setIsRefreshing(false);
  };
  
  // Auto select first available day if none selected
  useEffect(() => {
    if (!selectedDay && !sessionsLoading && Object.keys(sessionsByDay).length > 0) {
      // Get days that are not fully booked
      const availableDays = Object.keys(sessionsByDay).filter(
        day => !isDayBooked(day)
      );
      
      if (availableDays.length > 0) {
        setSelectedDay(availableDays[0]);
      } else {
        // If all days are booked, just select the first day
        setSelectedDay(Object.keys(sessionsByDay)[0]);
      }
    }
  }, [selectedDay, sessionsLoading, sessionsByDay, isDayBooked]);
  
  // Reset selected day if currently selected day becomes booked via booking action
  useEffect(() => {
    if (lastAction && lastAction.type === 'BOOK' && selectedDay) {
      const bookedSession = sessions.find(s => s.id === lastAction.sessionId);
      if (bookedSession && bookedSession.day === selectedDay) {
        // Find another day to select
        const availableDays = Object.keys(sessionsByDay).filter(
          day => !isDayBooked(day) && day !== selectedDay
        );
        
        if (availableDays.length > 0) {
          setSelectedDay(availableDays[0]);
        }
      }
    }
  }, [lastAction, selectedDay, sessions, sessionsByDay, isDayBooked]);
  
  // Get all available days
  const days = Object.keys(sessionsByDay);
  
  // Get sessions for selected day
  const daySessions = selectedDay ? sessionsByDay[selectedDay] : [];
  
  // Check if the user has reached their booking limit
  const hasReachedBookingLimit = remainingSlots <= 0;
  
  // Render loading state
  if (sessionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
        </div>
        <p className="text-center text-gray-500">Loading available sessions...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="space-y-4 text-center py-8">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <p className="text-gray-700">Unable to load sessions</p>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="mt-2"
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </>
          )}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Booking Status */}
      <div className="bg-blue-900/5 p-4 rounded-lg border border-blue-900/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-blue-900">
              Your Weekly Bookings
            </h3>
            <p className="text-sm text-blue-700">
              {remainingSlots > 0
                ? `You can select ${remainingSlots} more day${
                    remainingSlots !== 1 ? "s" : ""
                  }`
                : `You have selected all ${maxDaysPerWeek} available days`}
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              {[...Array(maxDaysPerWeek)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < maxDaysPerWeek - remainingSlots ? 'bg-blue-900' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="ml-2 text-2xl font-bold text-blue-900">
              {maxDaysPerWeek - remainingSlots} / {maxDaysPerWeek}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Refresh Button */}
      <div className="flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Day Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Select Day</h3>
          <span className="text-sm text-gray-500">
            {Object.keys(sessionsByDay).length} days available
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {days.map((day) => {
            const isBooked = isDayBooked(day);
            const isSelected = day === selectedDay;
            const availableSlots = sessionsByDay[day].filter(s => s.isAvailable).length;
            const hasAvailableSlots = availableSlots > 0;

            return (
              <Button
                key={day}
                variant={isSelected ? "default" : "outline"}
                onClick={() => handleDaySelect(day)}
                disabled={!hasAvailableSlots && !isBooked}
                className={`
                  h-auto p-3 flex flex-col items-center gap-1
                  ${isSelected
                    ? "bg-blue-900 hover:bg-blue-800 text-white"
                    : isBooked
                      ? "bg-green-50 text-green-800 border-green-300 hover:bg-green-100 hover:text-green-900"
                      : hasAvailableSlots
                        ? "text-slate-700 hover:bg-blue-50 hover:text-blue-900 hover:border-blue-200"
                        : "text-gray-400 opacity-60"
                  }
                `}
              >
                <span className="text-sm font-medium">
                  {DAY_NAMES[day]}
                </span>
                {isBooked && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-blue-800 text-blue-100' : 'bg-green-200 text-green-800'
                  }`}>
                    Booked
                  </span>
                )}
                {!isBooked && (
                  <span className={`text-xs ${isSelected ? 'text-blue-200' : hasAvailableSlots ? 'text-slate-500' : 'text-gray-400'}`}>
                    {availableSlots} slot{availableSlots !== 1 ? 's' : ''}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Time Slot Selector */}
      {selectedDay && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              <Calendar className="w-5 h-5 inline mr-2 text-blue-900" />
              {DAY_NAMES[selectedDay]} Sessions
            </h3>
            <span className="text-sm text-gray-500">
              {daySessions.filter(s => s.isAvailable).length} available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {daySessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
              />
            ))}
          </div>

          {hasReachedBookingLimit && !isDayBooked(selectedDay) && (
            <div className="mt-4 bg-amber-50 p-3 rounded-md text-amber-700 text-sm border border-amber-200">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              You have already selected {maxDaysPerWeek} days. To select this day, you need to
              cancel one of your existing bookings.
            </div>
          )}
        </div>
      )}

      {!selectedDay && (
        <div className="text-center py-6 text-gray-500">
          Select a day to view available sessions
        </div>
      )}
    </div>
  );
}
