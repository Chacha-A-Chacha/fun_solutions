'use client';

import { useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import StudentLoginForm from '@/components/StudentLoginForm';
import StaffLoginForm from '@/components/StaffLoginForm';
import { GraduationCap, ShieldCheck } from 'lucide-react';

export default function LoginTabs() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'staff' ? 'staff' : 'student';

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="w-full h-11 bg-transparent border border-slate-200 p-1 rounded-lg">
        <TabsTrigger
          value="student"
          className="flex-1 h-full text-slate-500 data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
        >
          <GraduationCap className="w-4 h-4 mr-1.5" />
          Student
        </TabsTrigger>
        <TabsTrigger
          value="staff"
          className="flex-1 h-full text-slate-500 data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
        >
          <ShieldCheck className="w-4 h-4 mr-1.5" />
          Staff
        </TabsTrigger>
      </TabsList>
      <TabsContent value="student" className="mt-4">
        <StudentLoginForm />
      </TabsContent>
      <TabsContent value="staff" className="mt-4">
        <StaffLoginForm />
      </TabsContent>
    </Tabs>
  );
}
