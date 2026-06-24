'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Download, ToggleLeft, ToggleRight } from 'lucide-react';

const DATASETS = {
  enrollments: {
    label: 'Session Enrollments',
    describe: 'One row per booked seat, grouped by session.',
    hasWeek: true,
    hasCancelled: true,
  },
  students: {
    label: 'Students',
    describe: 'Student directory with course progress.',
    hasWeek: false,
    hasCancelled: false,
  },
  bookings: {
    label: 'Bookings',
    describe: 'One row per booking with full status detail.',
    hasWeek: true,
    hasCancelled: true,
  },
};

export default function ExportDataSheet() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('enrollments');
  const [studentStatus, setStudentStatus] = useState('active');
  const [week, setWeek] = useState('all');
  const [includeCancelled, setIncludeCancelled] = useState(false);

  const config = DATASETS[type];

  const handleDownload = () => {
    const params = new URLSearchParams({ type, studentStatus });
    if (config.hasWeek) params.set('week', week);
    if (config.hasCancelled) params.set('includeCancelled', String(includeCancelled));
    window.open(`/api/instructor/export?${params.toString()}`, '_blank');
    setOpen(false);
  };

  const statusLabel = { active: 'active', inactive: 'inactive', all: 'all' }[studentStatus];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="w-full sm:w-auto bg-transparent text-blue-100 border-blue-400 hover:bg-blue-800 hover:text-white"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-900" />
            Export Data
          </SheetTitle>
          <SheetDescription>
            Choose what to export and download it as a CSV file.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-5">
          {/* Dataset */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Dataset</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DATASETS).map(([key, d]) => (
                  <SelectItem key={key} value={key}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">{config.describe}</p>
          </div>

          {/* Student status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Student status</Label>
            <Select value={studentStatus} onValueChange={setStudentStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="inactive">Inactive only</SelectItem>
                <SelectItem value="all">All students</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Week scope */}
          {config.hasWeek && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Week</Label>
              <Select value={week} onValueChange={setWeek}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All weeks</SelectItem>
                  <SelectItem value="current">Current week only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Include cancelled */}
          {config.hasCancelled && (
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Include cancelled bookings</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIncludeCancelled(v => !v)}
                className={`shrink-0 ${includeCancelled ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {includeCancelled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                <span className="ml-1 text-xs">{includeCancelled ? 'Yes' : 'No'}</span>
              </Button>
            </div>
          )}

          {/* Summary + action */}
          <div className="rounded-md bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800">
            Exporting <span className="font-medium">{config.label}</span> for{' '}
            <span className="font-medium">{statusLabel}</span> students
            {config.hasWeek && (week === 'current' ? ', current week' : ', all weeks')}
            {config.hasCancelled && (includeCancelled ? ', including cancelled' : ', excluding cancelled')}.
          </div>

          <Button onClick={handleDownload} className="w-full bg-blue-900 hover:bg-blue-800">
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
