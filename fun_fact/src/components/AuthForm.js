'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/app/hooks/useAuth';

export default function AuthForm() {
  const { login, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();
  
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await login(data);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Student Session Scheduler
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">
            Student ID
          </label>
          <input
            id="id"
            type="text"
            {...register('id', { 
              required: 'Student ID is required',
              pattern: {
                value: /^DR-\d{4}-\d{2}$/,
                message: 'Invalid ID format. Use format: DR-XXXX-XX'
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. DR-4824-25"
            disabled={isSubmitting || loading}
          />
          {errors.id && (
            <p className="mt-1 text-sm text-red-600">{errors.id.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email address"
            disabled={isSubmitting || loading}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting || loading ? 'Please wait...' : 'Continue'}
        </button>
      </form>
      
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>
          Enter your Student ID and Email to access the session booking system.
        </p>
      </div>
    </div>
  );
}
