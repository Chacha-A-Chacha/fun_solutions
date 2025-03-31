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

  // Fetch student's bookings
  const fetchBookings = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        setBookings([]);
        return;
      }

      setLoading(true);
      const { data } = await axios.get('/api/bookings');
      setBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch your bookings');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Book a session
  const bookSession = async (sessionId) => {
    try {
      setBookingInProgress(true);
      
      // Validate constraints client-side before submitting
      if (bookings.length >= SESSION_CONSTRAINTS.MAX_DAYS_PER_STUDENT) {
        toast.error(`You can only book up to ${SESSION_CONSTRAINTS.MAX_DAYS_PER_STUDENT} sessions`);
        return false;
      }
      
      const { data } = await axios.post('/api/bookings', { sessionId });
      
      // Update local bookings state
      await fetchBookings();
      
      toast.success(data.message);
      return true;
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to book session';
      toast.error(errorMessage);
      return false;
    } finally {
      setBookingInProgress(false);
    }
  };

  // Cancel a booking
  const cancelBooking = async (bookingId) => {
    try {
      setBookingInProgress(true);
      
      await axios.delete(`/api/bookings/${bookingId}`);
      
      // Update local bookings state
      setBookings(prevBookings => 
        prevBookings.filter(booking => booking.id !== bookingId)
      );
      
      toast.success('Booking cancelled successfully');
      return true;
    } catch (error) {
      console.error('Cancellation error:', error);
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
    remainingSlots: SESSION_CONSTRAINTS.MAX_DAYS_PER_STUDENT - bookings.length
  };
}
