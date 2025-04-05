// file: src/app/hooks/useSessions.js
// description: This custom hook manages session data, including fetching, formatting, and filtering sessions. It uses React hooks for state management and Axios for API requests. It also integrates with a toast notification system for error handling.
//           include: { session: true }

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from './useAuth';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';
import useBookings from './useBookings'; // Import useBookings for coordination

export default function useSessions() {
  const { isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { lastAction, bookings } = useBookings(); // Get booking state

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/sessions');
      
      setSessions(data.sessions);
      setError(null);
      return data.sessions;
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to fetch sessions');
      toast.error('Failed to fetch available sessions');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch sessions when component mounts or auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions();
    }
  }, [isAuthenticated, fetchSessions]);
  
  // Local optimistic update of sessions based on booking actions
  useEffect(() => {
    if (!lastAction || !lastAction.type) return;
    
    // Don't refetch, just update the local state
    setSessions(prevSessions => {
      // Create a copy to avoid mutation
      const updatedSessions = [...prevSessions];
      
      if (lastAction.type === 'BOOK') {
        // Find the session that was booked
        const sessionIndex = updatedSessions.findIndex(s => s.id === lastAction.sessionId);
        if (sessionIndex >= 0) {
          // Update availability count and marking as booked
          updatedSessions[sessionIndex] = {
            ...updatedSessions[sessionIndex],
            availableSpots: Math.max(0, updatedSessions[sessionIndex].availableSpots - 1),
            isBooked: true
          };
        }
      } 
      else if (lastAction.type === 'CANCEL') {
        // Find the session for the day that was cancelled
        const sessionIndex = updatedSessions.findIndex(s => 
          s.id === lastAction.sessionId || 
          (s.day === lastAction.day && bookings.some(b => b.sessionId === s.id))
        );
        
        if (sessionIndex >= 0) {
          // Update availability count and marking as not booked
          updatedSessions[sessionIndex] = {
            ...updatedSessions[sessionIndex],
            availableSpots: updatedSessions[sessionIndex].availableSpots + 1,
            isBooked: false
          };
        }
      }
      
      return updatedSessions;
    });
  }, [lastAction, bookings]);
  
  // Refresh sessions - actually fetch from server when needed
  const refreshSessions = useCallback(() => {
    if (isAuthenticated) {
      fetchSessions();
    }
  }, [isAuthenticated, fetchSessions]);

  // Get sessions grouped by day - memoized to prevent recalculation
  const sessionsByDay = useMemo(() => {
    return sessions.reduce((acc, session) => {
      if (!acc[session.day]) {
        acc[session.day] = [];
      }
      acc[session.day].push(session);
      return acc;
    }, {});
  }, [sessions]);

  // Format session for display
  const formatSession = (session) => {
    const dayName = DAY_NAMES[session.day];
    const timeSlotName = TIME_SLOT_NAMES[session.timeSlot];
    return `${dayName}, ${timeSlotName}`;
  };

  // Check if a day is fully booked
  const isDayFullyBooked = useCallback((day) => {
    return sessionsByDay[day]?.every(session => !session.isAvailable);
  }, [sessionsByDay]);

  // Get available sessions (with capacity and not already booked)
  const getAvailableSessions = useCallback(() => {
    return sessions.filter(session => 
      session.isAvailable && !session.isBooked
    );
  }, [sessions]);

  // Get sessions with at least one spot available for a specific day
  const getAvailableSessionsForDay = useCallback((day) => {
    return sessions.filter(session => 
      session.day === day && session.isAvailable && !session.isBooked
    );
  }, [sessions]);

  return {
    sessions,
    sessionsByDay,
    loading,
    error,
    fetchSessions,
    refreshSessions,
    formatSession,
    isDayFullyBooked,
    getAvailableSessions,
    getAvailableSessionsForDay
  };
}
