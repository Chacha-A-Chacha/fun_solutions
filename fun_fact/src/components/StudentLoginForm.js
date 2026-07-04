'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/app/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2 } from 'lucide-react';

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
    const ok = await login(data);
    if (ok) {
      reset();
      // Leave the form disabled on success: login() has already triggered the
      // redirect to /dashboard, and this form stays mounted until that route
      // loads. Re-enabling here makes the page look idle mid-redirect.
    } else {
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
          inputMode="text"
          autoComplete="username"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
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
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
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
        {disabled ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <LogIn className="w-4 h-4 mr-2" />
        )}
        {isSubmitting ? 'Signing you in…' : disabled ? 'Please wait…' : 'Continue'}
      </Button>
    </form>
  );
}
