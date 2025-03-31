// file: src/app/api/instructor/layout.js
// description: This file defines the layout for the instructor dashboard, including the metadata and the Toaster component for notifications.

import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Instructor Dashboard - Student Session Scheduler',
  description: 'View and manage student session enrollments',
};

export default function InstructorLayout({ children }) {
  return (
    <>
      <Toaster position="top-right" />
      {children}
    </>
  );
}