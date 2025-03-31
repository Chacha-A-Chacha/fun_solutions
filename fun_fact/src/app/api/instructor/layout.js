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