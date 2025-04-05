// file: src/app/hooks/useBookings.js
// description: This custom hook manages booking data, including fetching, booking, and canceling sessions. It uses React hooks for state management and Axios for API requests. It also integrates with a toast notification system for error handling and provides utility functions for checking booking status and formatting booking information.
//     const timeSlotName = TIME_SLOT_NAMES[session.timeSlot];

'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from './useAuth';
import { DAY_NAMES, TIME_SLOT_NAMES, SESSION_CONSTRAINTS } from '@/app/lib/constants';

export default function useBookings() {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [lastAction, setLastAction] = useState({ type: null, timestamp: null });

  // Fetch student's bookings
  const fetchBookings = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        setBookings([]);
        return [];
      }

      setLoading(true);
      const { data } = await axios.get('/api/bookings');
      setBookings(data.bookings);
      return data.bookings;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch your bookings');
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Book a session with optimistic UI update
  const bookSession = async (session) => {
    try {
      setBookingInProgress(true);
      
      // Validate constraints client-side before submitting
      if (bookings.length >= SESSION_CONSTRAINTS.MAX_DAYS_PER_STUDENT) {
        toast.error(`You can only book up to ${SESSION_CONSTRAINTS.MAX_DAYS_PER_STUDENT} sessions`);
        return false;
      }
      
      // Check if already booked on this day
      if (isDayBooked(session.day)) {
        toast.error('You already have a booking for this day');
        return false;
      }
      
      // Create optimistic booking (before server response)
      const optimisticBooking = {
        id: `temp-${Date.now()}`, // Temporary ID
        sessionId: session.id,
        day: session.day,
        timeSlot: session.timeSlot,
        isOptimistic: true // Flag to identify optimistic updates
      };
      
      // Update state optimistically
      setBookings(prevBookings => [...prevBookings, optimisticBooking]);
      
      // Make API request
      const { data } = await axios.post('/api/bookings', { sessionId: session.id });
      
      // Replace optimistic booking with real one
      setBookings(prevBookings => 
        prevBookings
          .filter(b => b.id !== optimisticBooking.id) // Remove optimistic booking
          .concat(data.booking) // Add real booking
      );
      
      // Set last action to help coordinate with useSessions
      setLastAction({ 
        type: 'BOOK', 
        sessionId: session.id, 
        timestamp: Date.now() 
      });
      
      toast.success(data.message);
      return true;
    } catch (error) {
      console.error('Booking error:', error);
      
      // Remove optimistic booking on error
      setBookings(prevBookings => 
        prevBookings.filter(b => !b.isOptimistic)
      );
      
      const errorMessage = error.response?.data?.error || 'Failed to book session';
      toast.error(errorMessage);
      return false;
    } finally {
      setBookingInProgress(false);
    }
  };

  // Cancel a booking with optimistic UI update
  const cancelBooking = async (bookingId) => {
    try {
      setBookingInProgress(true);
      
      // Find the booking to cancel
      const bookingToCancel = bookings.find(b => b.id === bookingId);
      if (!bookingToCancel) {
        toast.error('Booking not found');
        return false;
      }
      
      // Update state optimistically before API call
      setBookings(prevBookings => 
        prevBookings.filter(booking => booking.id !== bookingId)
      );
      
      // Make API request
      await axios.delete(`/api/bookings/${bookingId}`);
      
      // Set last action to help coordinate with useSessions
      setLastAction({ 
        type: 'CANCEL', 
        bookingId, 
        day: bookingToCancel.day, 
        timestamp: Date.now() 
      });
      
      toast.success('Booking cancelled successfully');
      return true;
    } catch (error) {
      console.error('Cancellation error:', error);
      
      // Revert UI if API call fails
      fetchBookings(); // Refetch to restore correct state
      
      toast.error('Failed to cancel booking');
      return false;
    } finally {
      setBookingInProgress(false);
    }
  };

  // Format booking for display
  const formatBooking = (booking) => {
    const dayName = DAY_NAMES[booking.day];
    const timeSlotName = TIME_SLOT_NAMES[booking.timeSlot];
    return `${dayName}, ${timeSlotName}`;
  };

  // Check if a day is already booked
  const isDayBooked = (day) => {
    return bookings.some(booking => booking.day === day);
  };

  // Check if this specific session is booked
  const isSessionBooked = (sessionId) => {
    return bookings.some(booking => booking.sessionId === sessionId);
  };

  // Get the booking for a specific day
  const getBookingForDay = (day) => {
    return bookings.find(booking => booking.day === day);
  };

  // Get already booked days
  const getBookedDays = () => {
    return bookings.map(booking => booking.day);
  };

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    bookingInProgress,
    bookSession,
    cancelBooking,
    fetchBookings,
    formatBooking,
    isDayBooked,
    isSessionBooked,
    getBookingForDay,
    getBookedDays,
    lastAction,
    remainingSlots: SESSION_CONSTRAINTS.MAX_DAYS_PER_STUDENT - bookings.length
  };
}
