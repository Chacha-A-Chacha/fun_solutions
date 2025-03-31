'use client';

import { useState } from 'react';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';
import useBookings from '@/app/hooks/useBookings';

export default function SelectedSessions() {
  const { bookings, cancelBooking, loading, bookingInProgress, formatBooking } = useBookings();
  const [cancelingId, setCancelingId] = useState(null);

  // Handle booking cancellation
  const handleCancel = async (bookingId) => {
    if (bookingInProgress) return;
    
    setCancelingId(bookingId);
    try {
      await cancelBooking(bookingId);
    } finally {
      setCancelingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Your Selected Sessions</h2>
        <div className="text-center py-8">
          <p className="text-gray-500">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Your Selected Sessions</h2>
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500">You haven't selected any sessions yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Select up to 3 days from the calendar below
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Your Selected Sessions</h2>
      
      <div className="space-y-3">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <div>
              <h3 className="font-medium text-green-800">
                {DAY_NAMES[booking.day]}
              </h3>
              <p className="text-sm text-green-700">
                {TIME_SLOT_NAMES[booking.timeSlot]}
              </p>
            </div>
            
            <button
              onClick={() => handleCancel(booking.id)}
              disabled={cancelingId === booking.id || bookingInProgress}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition"
            >
              {cancelingId === booking.id ? 'Canceling...' : 'Cancel'}
            </button>
          </div>
        ))}
      </div>
      
      {bookings.length < 3 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          You have selected {bookings.length} of 3 possible sessions
        </div>
      )}
      
      {bookings.length === 3 && (
        <div className="mt-4 text-sm text-green-600 text-center">
          You have selected all 3 required sessions
        </div>
      )}
    </div>
  );
}
