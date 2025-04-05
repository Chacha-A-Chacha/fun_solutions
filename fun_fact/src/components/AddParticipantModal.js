'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { DAY_NAMES, TIME_SLOT_NAMES } from '@/app/lib/constants';

export default function AddParticipantModal({ session, onClose, onParticipantAdded }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(true);

  // Fetch available students (those not already in this session)
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setFetchingStudents(true);
        const { data } = await axios.get(`/api/instructor/students?sessionId=${session.id}`);
        setStudents(data.students);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load available students');
      } finally {
        setFetchingStudents(false);
      }
    };

    fetchStudents();
  }, [session.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    if (loading) {
      return; // Prevent multiple submissions
    }

    try {
      setLoading(true);
      
      await axios.post('/api/instructor/bookings', {
        studentId: selectedStudent,
        sessionId: session.id
      });
      
      toast.success('Participant added successfully');
      
      // First call the callback to refresh data
      if (typeof onParticipantAdded === 'function') {
        await onParticipantAdded();
      }
      
      // Then close the modal after a short delay to ensure state updates properly
      setTimeout(() => {
        if (typeof onClose === 'function') {
          onClose();
        }
      }, 300);
      
    } catch (error) {
      console.error('Error adding participant:', error);
      const message = error.response?.data?.error || 'Failed to add participant';
      toast.error(message);
      setLoading(false); // Only reset loading on error
    }
  };

  // Reset the "Create New Student" button functionality
  const handleCreateNewStudent = () => {
    // Just close this modal - the parent will handle opening the create student modal
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Participant</h2>
          <button 
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Session Details:</span>
          </p>
          <p className="text-sm text-blue-800">
            Day: <span className="font-medium">{DAY_NAMES[session.day]}</span>
          </p>
          <p className="text-sm text-blue-800">
            Time: <span className="font-medium">{TIME_SLOT_NAMES[session.timeSlot]}</span>
          </p>
          <p className="text-sm text-blue-800">
            Current enrollment: <span className="font-medium">{session.enrolledCount}/{session.capacity}</span>
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-1">
              Select Student
            </label>
            {fetchingStudents ? (
              <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
            ) : students.length > 0 ? (
              <select
                id="student"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">-- Select a student --</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.id})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                No eligible students found for this session. Students might already be booked for this day or have reached their maximum sessions.
              </div>
            )}
          </div>
          
          <div className="mt-2 text-sm text-gray-500">
            <p>Eligible students must:</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>Not already be registered for this session</li>
              <li>Not have another session on the same day</li>
              <li>Have fewer than 3 total sessions booked</li>
            </ul>
          </div>
          
          <div className="flex justify-between space-x-3 mt-6">
            <button
              type="button"
              onClick={handleCreateNewStudent}
              disabled={loading}
              className="px-4 py-2 text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 disabled:opacity-50"
            >
              Create New Student
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                disabled={loading || fetchingStudents || students.length === 0 || !selectedStudent}
              >
                {loading ? 'Adding...' : 'Add Participant'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
