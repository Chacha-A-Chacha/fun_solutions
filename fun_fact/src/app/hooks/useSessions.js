'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from './useAuth';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/lib/constants';

export default function useSessions() {
  const { isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/sessions');
      setSessions(data.sessions);
      setError(null);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to fetch sessions');
      toast.error('Failed to fetch available sessions');
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

  // Get sessions grouped by day
  const sessionsByDay = sessions.reduce((acc, session) => {
    if (!acc[session.day]) {
      acc[session.day] = [];
    }
    acc[session.day].push(session);
    return acc;
  }, {});

  // Format session for display
  const formatSession = (session) => {
    const dayName = DAY_NAMES[session.day];
    const timeSlotName = TIME_SLOT_NAMES[session.timeSlot];
    return `${dayName}, ${timeSlotName}`;
  };

  // Check if a day is fully booked
  const isDayFullyBooked = (day) => {
    return sessionsByDay[day]?.every(session => !session.isAvailable);
  };

  // Get booked days
  const getBookedDays = () => {
    return sessions
      .filter(session => session.isBooked)
      .map(session => session.day);
  };

  // Get available sessions (with capacity and not already booked)
  const getAvailableSessions = () => {
    return sessions.filter(session => 
      session.isAvailable && !session.isBooked
    );
  };

  // Get sessions with at least one spot available for a specific day
  const getAvailableSessionsForDay = (day) => {
    return sessions.filter(session => 
      session.day === day && session.isAvailable && !session.isBooked
    );
  };

  return {
    sessions,
    sessionsByDay,
    loading,
    error,
    fetchSessions,
    formatSession,
    isDayFullyBooked,
    getBookedDays,
    getAvailableSessions,
    getAvailableSessionsForDay
  };
}
