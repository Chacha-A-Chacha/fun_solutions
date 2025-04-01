'use client';

import { useState } from 'react';
import { TIME_SLOT_NAMES } from '@/app/lib/constants';
import useBookings from '@/app/hooks/useBookings';

export default function SessionCard({ session, refreshSessions }) {
    const { bookSession, isSessionBooked, remainingSlots, bookingInProgress } = useBookings();
    const [isBooking, setIsBooking] = useState(false);
  
  const {
    id,
    timeSlot,
    capacity,
    availableSpots,
    isAvailable,
  } = session;
  
  const isBooked = isSessionBooked(id);
  const canBook = isAvailable && !isBooked && remainingSlots > 0;
  
  // Handle booking
  const handleBooking = async () => {
    if (!canBook || isBooking) return;
    
    setIsBooking(true);
    try {
      const success = await bookSession(id);
      if (success && refreshSessions) {
        refreshSessions(); // Use it here with a safety check
      }
    } finally {
      setIsBooking(false);
    }
  };
  
  // Determine card background color based on availability
  const getBackgroundColor = () => {
    if (isBooked) return 'bg-green-100 border-green-500';
    if (!isAvailable) return 'bg-gray-100 border-gray-300';
    return 'bg-white border-gray-200 hover:border-blue-300';
  };
  
  // Get availability text and color
  const getAvailabilityInfo = () => {
    if (isBooked) {
      return {
        text: 'Booked',
        color: 'text-green-700'
      };
    }
    
    if (availableSpots === 0) {
      return {
        text: 'Full',
        color: 'text-red-600'
      };
    }
    
    return {
      text: `${availableSpots}/${capacity} available`,
      color: availableSpots < 2 ? 'text-orange-600' : 'text-blue-600'
    };
  };
  
  const availabilityInfo = getAvailabilityInfo();
  
  return (
    <div 
      className={`${getBackgroundColor()} p-4 border rounded-lg transition duration-200 ease-in-out ${canBook ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={handleBooking}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">{TIME_SLOT_NAMES[timeSlot]}</h3>
        <span className={`text-sm font-medium ${availabilityInfo.color}`}>
          {availabilityInfo.text}
        </span>
      </div>
      
      {isBooked && (
        <div className="flex items-center mt-2">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Your Selection
          </span>
        </div>
      )}
      
      {canBook && (
        <button
          className="mt-2 w-full px-3 py-1 text-sm text-blue-700 border border-blue-300 rounded-md hover:bg-blue-50"
          disabled={isBooking || bookingInProgress}
        >
          {isBooking ? 'Booking...' : 'Select This Session'}
        </button>
      )}
    </div>
  );
}
