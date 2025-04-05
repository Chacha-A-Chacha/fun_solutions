// file: src/components/SelectedSessions.js
// description: This component displays the user's selected sessions, allowing them to cancel bookings. It uses a custom hook to manage bookings and session data, and includes loading and error states for better user experience.
//         timeSlotName: TIME_SLOT_NAMES[session.timeSlot]


'use client';

import { useState } from 'react';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';
import useBookings from '@/app/hooks/useBookings';
import { AlertTriangle, Calendar, Clock, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SelectedSessions() {
  const { bookings, cancelBooking, loading, bookingInProgress } = useBookings();
  const [cancelingId, setCancelingId] = useState(null);

  // Handle booking cancellation with optimistic UI update
  const handleCancel = async (bookingId) => {
    if (bookingInProgress) return;
    
    setCancelingId(bookingId);
    try {
      await cancelBooking(bookingId);
      // No need for explicit refresh with optimistic UI
    } finally {
      setCancelingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No sessions selected yet</p>
        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
          Please select up to 3 days from the calendar below to book your practical sessions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => {
        const isOptimistic = booking.isOptimistic;
        
        return (
          <div
            key={booking.id}
            className={`
              flex justify-between items-center p-4 rounded-lg
              ${isOptimistic ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'}
              ${cancelingId === booking.id ? 'opacity-60' : ''}
              transition-all duration-200
            `}
          >
            <div className="flex gap-3">
              <div className={`p-2 rounded-full ${isOptimistic ? 'bg-blue-100' : 'bg-green-100'}`}>
                {isOptimistic ? (
                  <Clock className="w-5 h-5 text-blue-600" />
                ) : (
                  <Calendar className="w-5 h-5 text-green-600" />
                )}
              </div>
              
              <div>
                <h3 className={`font-medium ${isOptimistic ? 'text-blue-800' : 'text-green-800'}`}>
                  {DAY_NAMES[booking.day]}
                  {isOptimistic && <span className="ml-2 text-xs">(Processing...)</span>}
                </h3>
                <p className="text-sm text-gray-600">
                  {TIME_SLOT_NAMES[booking.timeSlot]}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCancel(booking.id)}
              disabled={cancelingId === booking.id || bookingInProgress}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {cancelingId === booking.id ? (
                <span className="text-xs">Cancelling...</span>
              ) : (
                <>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </>
              )}
            </Button>
          </div>
        );
      })}
      
      <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Selected sessions:</span>
          </div>
          <div className="flex items-center">
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < bookings.length ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm font-medium">
              {bookings.length}/3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
