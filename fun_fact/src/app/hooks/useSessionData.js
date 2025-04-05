'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from './useAuth';
import { DAY_NAMES, TIME_SLOT_NAMES, SESSION_CONSTRAINTS } from '@/app/lib/constants';

// Create context
const SessionDataContext = createContext(null);

// Provider component
export function SessionDataProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Group sessions by day - derived state
  const sessionsByDay = sessions.reduce((acc, session) => {
    if (!acc[session.day]) {
      acc[session.day] = [];
    }
    acc[session.day].push(session);
    return acc;
  }, {});

  // Fetch all data in one request to reduce API calls and improve performance
  const fetchAllData = useCallback(async () => {
    if (!isAuthenticated) {
      setBookings([]);
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch data in parallel
      const [bookingsResponse, sessionsResponse] = await Promise.all([
        axios.get('/api/bookings'),
        axios.get('/api/sessions')
      ]);
      
      setBookings(bookingsResponse.data.bookings);
      setSessions(sessionsResponse.data.sessions);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load session data');
      toast.error('Failed to load session data');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Book a session with optimistic UI update
  const bookSession = async (session) => {
    try {
      setBookingInProgress(true);
      
      // Validate constraints client-side
      if (bookings.length >= SESSION_CONSTRAINTS.MAX_DAYS_PER_STUDENT) {
        toast.error(`You can only book up to ${SESSION_CONSTRAINTS.MAX_DAYS_PER_STUDENT} sessions`);
        return false;
      }
      
      // Check if already booked on this day
      if (isDayBooked(session.day)) {
        toast.error('You already have a booking for this day');
        return false;
      }
      
      // Create optimistic booking
      const optimisticBooking = {
        id: `temp-${Date.now()}`,
        sessionId: session.id,
        day: session.day,
        timeSlot: session.timeSlot,
        isOptimistic: true
      };
      
      // Update bookings state optimistically
      setBookings(prevBookings => [...prevBookings, optimisticBooking]);
      
      // Update sessions state optimistically
      setSessions(prevSessions => 
        prevSessions.map(s => {
          if (s.id === session.id) {
            return {
              ...s,
              isBooked: true,
              availableSpots: Math.max(0, s.availableSpots - 1),
              bookings: [
                ...s.bookings, 
                { id: optimisticBooking.id, isCurrentStudent: true }
              ]
            };
          }
          return s;
        })
      );
      
      // Make API request
      const { data } = await axios.post('/api/bookings', { sessionId: session.id });
      
      // Update with real data
      setBookings(prevBookings => 
        prevBookings
          .filter(b => b.id !== optimisticBooking.id)
          .concat(data.booking)
      );
      
      toast.success(data.message);
      return true;
    } catch (error) {
      console.error('Booking error:', error);
      
      // Revert optimistic updates
      setBookings(prevBookings => 
        prevBookings.filter(b => !b.isOptimistic)
      );
      
      // Revert session changes
      setSessions(prevSessions => 
        prevSessions.map(s => {
          if (s.id === session.id) {
            return {
              ...s,
              isBooked: false,
              availableSpots: s.availableSpots + 1,
              bookings: s.bookings.filter(b => !b.id.startsWith('temp-'))
            };
          }
          return s;
        })
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
      
      // Update bookings state optimistically
      setBookings(prevBookings => 
        prevBookings.filter(booking => booking.id !== bookingId)
      );
      
      // Update sessions state optimistically
      setSessions(prevSessions => 
        prevSessions.map(s => {
          if (s.id === bookingToCancel.sessionId) {
            return {
              ...s,
              isBooked: false,
              availableSpots: s.availableSpots + 1,
              bookings: s.bookings.filter(b => !b.isCurrentStudent)
            };
          }
          return s;
        })
      );
      
      // Make API request
      const { data } = await axios.delete(`/api/bookings/${bookingId}`);
      
      toast.success(data.message);
      return true;
    } catch (error) {
      console.error('Cancellation error:', error);
      
      // Revert optimistic updates
      fetchAllData(); // Refetch to restore correct state
      
      toast.error('Failed to cancel booking');
      return false;
    } finally {
      setBookingInProgress(false);
    }
  };

  // Utility functions
  const isDayBooked = (day) => {
    return bookings.some(booking => booking.day === day);
  };

  const isSessionBooked = (sessionId) => {
    return bookings.some(booking => booking.sessionId === sessionId);
  };

  const getBookingForDay = (day) => {
    return bookings.find(booking => booking.day === day);
  };

  const getBookedDays = () => {
    return bookings.map(booking => booking.day);
  };

  // Format helpers
  const formatBooking = (booking) => {
    const dayName = DAY_NAMES[booking.day];
    const timeSlotName = TIME_SLOT_NAMES[booking.timeSlot];
    return `${dayName}, ${timeSlotName}`;
  };

  const formatSession = (session) => {
    const dayName = DAY_NAMES[session.day];
    const timeSlotName = TIME_SLOT_NAMES[session.timeSlot];
    return `${dayName}, ${timeSlotName}`;
  };

  // Fetch data on component mount or auth change
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Context value
  const value = {
    // Data
    bookings,
    sessions,
    sessionsByDay,
    
    // Status
    loading,
    error,
    bookingInProgress,
    lastRefresh,
    
    // Actions
    fetchAllData,
    bookSession,
    cancelBooking,
    
    // Utilities
    isDayBooked,
    isSessionBooked,
    getBookingForDay,
    getBookedDays,
    formatBooking,
    formatSession,
    
    // Derived data
    remainingSlots: SESSION_CONSTRAINTS.MAX_DAYS_PER_STUDENT - bookings.length
  };

  return (
    <SessionDataContext.Provider value={value}>
      {children}
    </SessionDataContext.Provider>
  );
}

// Custom hook to use context
export function useSessionData() {
  const context = useContext(SessionDataContext);
  if (!context) {
    throw new Error('useSessionData must be used within a SessionDataProvider');
  }
  return context;
}
