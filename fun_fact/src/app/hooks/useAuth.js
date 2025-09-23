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
        // Add a retry mechanism for better reliability
        const maxRetries = 3;
        let attempts = 0;
        let success = false;
        
        while (attempts < maxRetries && !success) {
          try {
            const { data } = await axios.get('/api/auth', {
              // Prevent caching issues
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            
            setStudent(data.student);
            success = true;
            // Don't show success toast on initial auth check
          } catch (error) {
            attempts++;

            // Handle 401 (not authenticated) - this is expected on first visit
            if (error.response?.status === 401) {
              setStudent(null);
              success = true; // Don't retry for 401
              // Don't log this as an error - it's expected behavior
              break;
            }

            // For other errors, retry if we haven't hit max attempts
            if (attempts >= maxRetries) {
              throw error;
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (error) {
        // Only log actual errors, not 401s
        if (error.response?.status !== 401) {
          console.error('Auth check failed:', error);
        }

        // Only clear student state if we get a clear "not authenticated" response
        if (error.response?.status === 401) {
          setStudent(null);
        }
        // For other errors, we don't clear the state to prevent unnecessary logouts
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
      // Don't show error toast for logout failures - just redirect
      console.error('Logout error:', error);
      setStudent(null); // Clear state anyway
      router.push('/');
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
