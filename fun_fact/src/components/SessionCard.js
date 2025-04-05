// file: src/components/SessionCard.js
// description: This component represents a session card that displays session details and allows users to book or cancel sessions. It uses custom hooks for managing bookings and sessions, and includes loading states for better user experience.


'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Clock, CheckCircle } from 'lucide-react';
import { TIME_SLOT_NAMES } from '@/app/lib/constants';
import useBookings from '@/app/hooks/useBookings';

export default function SessionCard({ session }) {
  const { bookSession, isSessionBooked, isDayBooked, remainingSlots, bookingInProgress } = useBookings();
  const [isBooking, setIsBooking] = useState(false);
  
  // Check if this specific session is booked
  const booked = isSessionBooked(session.id);
  
  // Check if another session on the same day is booked
  const dayAlreadyBooked = !booked && isDayBooked(session.day);
  
  // Check if the user has reached their booking limit
  const hasReachedBookingLimit = remainingSlots <= 0;
  
  // Calculate availability
  const spotsRemaining = session.capacity - session.bookings.length;
  const isFull = spotsRemaining <= 0;
  
  // Check if the button should be disabled
  const disabled = isFull || booked || dayAlreadyBooked || hasReachedBookingLimit || isBooking || bookingInProgress;
  
  // Handle booking
  const handleBook = async () => {
    if (disabled) return;
    
    setIsBooking(true);
    try {
      await bookSession(session);
      // No need to refresh sessions, handled by optimistic UI
    } finally {
      setIsBooking(false);
    }
  };
  
  return (
    <Card className={`${booked ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium">
            {TIME_SLOT_NAMES[session.timeSlot]}
          </h3>
          
          {booked && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              Booked
            </span>
          )}
        </div>
        
        <div className="space-y-2 mb-3">
          {/* Availability indicator */}
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            <span>
              {isFull 
                ? 'Full' 
                : `${spotsRemaining} spot${spotsRemaining !== 1 ? 's' : ''} left`}
            </span>
          </div>
          
          {/* Duration indicator */}
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            <span>2 hours</span>
          </div>
        </div>
        
        {/* Book/Booked button */}
        <div className="mt-2">
          {booked ? (
            <Button 
              variant="outline" 
              className="w-full bg-green-50 text-green-800 border-green-200 hover:bg-green-100 hover:text-green-900" 
              disabled
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Booked
            </Button>
          ) : (
            <Button
              variant={dayAlreadyBooked ? "outline" : "default"}
              className="w-full"
              disabled={disabled}
              onClick={handleBook}
            >
              {isBooking ? 'Booking...' : 'Book Session'}
            </Button>
          )}
        </div>
        
        {/* Show explanation if day is already booked */}
        {dayAlreadyBooked && (
          <p className="text-xs text-amber-600 mt-2">
            You already have a session on this day
          </p>
        )}
        
        {/* Show explanation if max bookings reached */}
        {!dayAlreadyBooked && hasReachedBookingLimit && !booked && (
          <p className="text-xs text-amber-600 mt-2">
            You've reached your session limit
          </p>
        )}
      </CardContent>
    </Card>
  );
}
