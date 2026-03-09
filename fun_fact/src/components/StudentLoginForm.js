'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/app/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export default function StudentLoginForm() {
  const { login, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
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

  const disabled = isSubmitting || loading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="student-id">Student ID</Label>
        <Input
          id="student-id"
          type="text"
          placeholder="e.g. DR-4824-25"
disabled={disabled}
          {...register('id', {
            required: 'Student ID is required',
            pattern: {
              value: /^DR-\d{4,5}-\d{2}$/,
              message: 'Invalid ID format. Use format: DR-XXXXX-XX',
            },
          })}
        />
        {errors.id && (
          <p className="text-sm text-red-600">{errors.id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="student-email">Email Address</Label>
        <Input
          id="student-email"
          type="email"
          placeholder="Enter your email address"
disabled={disabled}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white" disabled={disabled}>
        <LogIn className="w-4 h-4 mr-2" />
        {disabled ? 'Please wait...' : 'Continue'}
      </Button>
    </form>
  );
}
