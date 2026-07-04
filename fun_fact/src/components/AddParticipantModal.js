'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, Users, Info } from 'lucide-react';

export default function AddParticipantModal({ session, onClose, onParticipantAdded }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(true);

  // Fetch students eligible for this specific session (class-aware, weekly limits)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setFetchingStudents(true);
        const { data } = await axios.get(`/api/instructor/students?sessionId=${session.id}`);
        if (!cancelled) setStudents(data.students || []);
      } catch (error) {
        console.error('Error fetching students:', error);
        if (!cancelled) toast.error('Failed to load eligible students');
      } finally {
        if (!cancelled) setFetchingStudents(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session.id]);

  const handleSubmit = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }
    if (loading) return;

    try {
      setLoading(true);
      await axios.post('/api/instructor/bookings', {
        studentId: selectedStudent,
        sessionId: session.id,
      });
      toast.success('Participant added');
      if (typeof onParticipantAdded === 'function') await onParticipantAdded();
      onClose();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to add participant';
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !loading) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add student to session</DialogTitle>
          <DialogDescription>
            {DAY_NAMES[session.day]} · {TIME_SLOT_NAMES[session.timeSlot]}
          </DialogDescription>
        </DialogHeader>

        {/* Session summary */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
          <Badge variant="outline" className="border-blue-200 bg-white text-blue-700">
            Class {session.category}
          </Badge>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {session.enrolledCount}/{session.capacity} enrolled
          </span>
        </div>

        {/* Eligible-student picker */}
        <div className="space-y-2">
          <Label htmlFor="add-participant-student">Eligible student</Label>
          {fetchingStudents ? (
            <div className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding eligible students…
            </div>
          ) : students.length > 0 ? (
            <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={loading}>
              <SelectTrigger id="add-participant-student" className="w-full">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                No eligible class {session.category} students. They may already be booked this day,
                at their weekly limit, or already in this session.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || fetchingStudents || !selectedStudent}
            className="bg-blue-900 hover:bg-blue-800"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Adding…</> : 'Add student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
