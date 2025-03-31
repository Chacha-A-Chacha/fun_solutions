// file: src/app/hooks/useAuth.js
// description: This file contains the AuthProvider and useAuth hook for managing authentication state in a React application. It uses Context API to provide authentication state and methods to the rest of the app.

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
  const [loginInProgress, setLoginInProgress] = useState(false);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/auth');
        setStudent(data.student);
        // Don't show success toast on initial auth check - only for explicit login
      } catch (error) {
        // Not authenticated
        setStudent(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function - immediately navigate and show loader in dashboard
  const login = async (credentials) => {
    try {
      setLoginInProgress(true);
      
      // First navigate to dashboard with loading state
      router.push('/dashboard');
      
      // Then perform the login request
      const { data } = await axios.post('/api/auth', credentials);
      setStudent(data.student);
      toast.success(data.message);
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      // Navigate back to login page on failure
      router.push('/');
      return false;
    } finally {
      setLoginInProgress(false);
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
    loginInProgress,
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
