'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create Auth Context
const AuthContext = createContext({});

// Auth Provider Component
export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await axios.get('/api/auth');
        setStudent(data.student);
      } catch (error) {
        // Not authenticated
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      const { data } = await axios.post('/api/auth', credentials);
      setStudent(data.student);
      toast.success(data.message);
      router.push('/dashboard');
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await axios.delete('/api/auth');
      setStudent(null);
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Logout failed');
    } finally {
      setLoading(false);
    }
  };

  // Auth context value
  const value = {
    student,
    loading,
    login,
    logout,
    isAuthenticated: !!student
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
