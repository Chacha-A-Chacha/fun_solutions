'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';

export default function SessionToggleDialog({ 
  session, 
  open, 
  onOpenChange, 
  onConfirm 
}) {
  if (!session) return null;
  
  // Determine current status
  const isCurrentlyEnabled = session.isEnabled !== false;
  
  // Format session details
  const dayName = session.dayName || DAY_NAMES[session.day];
  const timeSlotName = session.timeSlotName || TIME_SLOT_NAMES[session.timeSlot];
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            {isCurrentlyEnabled ? (
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            ) : (
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
            )}
            {isCurrentlyEnabled ? 'Disable Session' : 'Enable Session'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="font-medium flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-blue-600" />
                {dayName} - {timeSlotName}
              </div>
              {session.enrolledCount > 0 && isCurrentlyEnabled && (
                <div className="text-sm mt-2 text-amber-600">
                  This session has {session.enrolledCount} enrolled student(s).
                </div>
              )}
            </div>
            
            {isCurrentlyEnabled ? (
              <p>
                Disabling this session will prevent new students from booking it. 
                {session.enrolledCount > 0 && (
                  ' Existing bookings will remain, but you may want to contact the enrolled students.'
                )}
              </p>
            ) : (
              <p>
                Enabling this session will make it available for students to book.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(session.id, !isCurrentlyEnabled)}
            className={isCurrentlyEnabled ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {isCurrentlyEnabled ? 'Disable Session' : 'Enable Session'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
