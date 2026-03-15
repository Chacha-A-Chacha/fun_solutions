'use client';

import { useState, useEffect } from 'react';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Loader2, Pencil } from 'lucide-react';

const editStudentSchema = z.object({
  id: z.string()
    .min(1, { message: 'Student ID is required' })
    .regex(/^DR-\d{4,5}-\d{2}$/, {
      message: 'Student ID must be in format DR-XXXX-XX'
    }),
  name: z.string().min(1, { message: 'Name is required' }).max(100),
  email: z.string().email({ message: 'Invalid email address' }),
  phoneNumber: z.string().optional(),
});

export default function EditStudentSheet({ student, open, onOpenChange, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      id: '',
      name: '',
      email: '',
      phoneNumber: '',
    },
  });

  // Reset form when student changes
  useEffect(() => {
    if (student && open) {
      form.reset({
        id: student.id || '',
        name: student.name || '',
        email: student.email || '',
        phoneNumber: student.phoneNumber || '',
      });
    }
  }, [student, open, form]);

  const onSubmit = async (data) => {
    if (!student) return;
    try {
      setIsSubmitting(true);
      const response = await axios.patch(`/api/instructor/students/${student.id}`, data);
      toast.success('Student updated successfully');
      if (typeof onSuccess === 'function') {
        onSuccess(response.data.student);
      }
      onOpenChange(false);
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update student';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-blue-600" />
            Edit Student
          </SheetTitle>
          <SheetDescription>
            {student?.id} — Update student details
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
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
                        placeholder="+254 7XX XXX XXX"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
