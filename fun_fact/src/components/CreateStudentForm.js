'use client';

import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

// Validation schema
const studentFormSchema = z.object({
  id: z.string()
    .min(1, { message: 'Student ID is required' })
    .regex(/^DR-\d{4,5}-\d{2}$/, { 
      message: 'Student ID must be in format DR-XXXX-XX' 
    }),
  name: z.string()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name is too long' }),
  email: z.string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
  phoneNumber: z.string().optional(),
});

export default function CreateStudentForm({ onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      id: '',
      name: '',
      email: '',
      phoneNumber: '',
    },
  });

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const response = await axios.post('/api/instructor/students/create', data);
      
      // Reset form
      form.reset();
      
      // Call success callback
      if (typeof onSuccess === 'function') {
        onSuccess(response.data.student);
      }
      
      toast.success('Student created successfully');
    } catch (error) {
      console.error('Error creating student:', error);
      const message = error.response?.data?.error || 'Failed to create student';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-8 space-y-6">
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student ID*</FormLabel>
              <FormControl>
                <Input placeholder="DR-XXXX-XX" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                Format: DR-1234-56
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name*</FormLabel>
              <FormControl>
                <Input placeholder="Full Name" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address*</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="email@example.com" 
                  {...field} 
                  disabled={isSubmitting} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="+1 (123) 456-7890" 
                  {...field} 
                  disabled={isSubmitting} 
                />
              </FormControl>
              <FormDescription>
                Optional contact number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Student'
          )}
        </Button>
      </form>
    </Form>
  );
}
