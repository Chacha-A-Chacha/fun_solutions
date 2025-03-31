'use client';

import { useState } from 'react';
import { DAY_NAMES } from '@/app/lib/constants';
import SessionCard from './SessionCard';
import useBookings from '@/app/hooks/useBookings';
import useSessions from '@/app/hooks/useSessions';

export default function SessionCalendar() {
  const { sessions, sessionsByDay, loading: sessionsLoading } = useSessions();
  const { isDayBooked, getBookedDays, remainingSlots } = useBookings();
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Handle day selection
  const handleDaySelect = (day) => {
    setSelectedDay(day === selectedDay ? null : day);
  };
  
  // Get all available days
  const days = Object.keys(sessionsByDay);
  
  // Get sessions for selected day
  const daySessions = selectedDay ? sessionsByDay[selectedDay] : [];
  
  // Check if the user has reached their booking limit
  const hasReachedBookingLimit = remainingSlots <= 0;
  
  if (sessionsLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-600">Loading available sessions...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Booking Status */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-blue-800">Your Session Bookings</h3>
            <p className="text-sm text-blue-600">
              {remainingSlots > 0
                ? `You can select ${remainingSlots} more day${remainingSlots !== 1 ? 's' : ''}`
                : 'You have selected all 3 available days'}
            </p>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {3 - remainingSlots} / 3
          </div>
        </div>
      </div>
      
      {/* Day Selector */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Select Day</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {days.map((day) => {
            const isBooked = isDayBooked(day);
            const isSelected = day === selectedDay;
            
            return (
              <button
                key={day}
                onClick={() => handleDaySelect(day)}
                className={`
                  p-3 rounded-md text-center transition-colors
                  ${isSelected ? 'bg-blue-600 text-white' : ''}
                  ${!isSelected && isBooked ? 'bg-green-100 text-green-800 border border-green-300' : ''}
                  ${!isSelected && !isBooked ? 'bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100' : ''}
                `}
              >
                <span className="block text-sm font-medium">{DAY_NAMES[day]}</span>
                {isBooked && (
                  <span className="text-xs mt-1 inline-block">
                    ✓ Booked
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Time Slot Selector */}
      {selectedDay && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Available Sessions for {DAY_NAMES[selectedDay]}</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {daySessions.map((session) => (
              <SessionCard key={session.id} session={session} refreshSessions={refreshSessions} />
            ))}
          </div>
          
          {hasReachedBookingLimit && !isDayBooked(selectedDay) && (
            <div className="mt-4 bg-amber-50 p-3 rounded-md text-amber-700 text-sm">
              You have already selected 3 days. To select this day, you need to cancel one of your existing bookings.
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
