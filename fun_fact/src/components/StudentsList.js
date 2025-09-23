// file: src/components/StudentsList.js
// description: Students List component with design coherent to existing session management components

'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  Search,
  Users,
  Mail,
  Phone,
  Calendar,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  UserCheck,
  UserX,
  Clock,
  GraduationCap,
  AlertTriangle
} from 'lucide-react';

// Shadcn components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function StudentsList() {
  // State management
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [studentsPerPage, setStudentsPerPage] = useState(25);

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Fetch students data
  const fetchStudents = useCallback(async (page = 1, search = '', limit = studentsPerPage) => {
    try {
      setSearching(search !== '');
      if (page === 1) setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });

      const { data } = await axios.get(`/api/instructor/students?${params}`);

      setStudents(data.students);
      setPagination(data.pagination);
      setAnalytics(data.analytics);
      setError(null);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [studentsPerPage]);

  // Handle search with debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchStudents(1, value, studentsPerPage);
    }, 300);

    setSearchTimeout(timeout);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchStudents(newPage, searchQuery, studentsPerPage);
  };

  // Handle students per page change
  const handleLimitChange = (newLimit) => {
    setStudentsPerPage(parseInt(newLimit));
    setCurrentPage(1);
    fetchStudents(1, searchQuery, parseInt(newLimit));
  };

  // Refresh data
  const refreshData = () => {
    fetchStudents(currentPage, searchQuery, studentsPerPage);
  };

  // Format student registration date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Initial load
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Loading state
  if (loading && currentPage === 1) {
    return (
      <div className="space-y-6">
        {/* Analytics skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full max-w-md mb-6" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{error}</h3>
        <Button onClick={refreshData} variant="outline">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview - Matching SessionCalendar style */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Students */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs font-medium text-blue-800 uppercase tracking-wide">Total Students</div>
              <div className="mt-2 flex justify-between items-center">
                <div className="text-2xl font-bold text-blue-900">
                  {analytics.totalStudents}
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students with Bookings */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs font-medium text-green-800 uppercase tracking-wide">With Bookings</div>
              <div className="mt-2 flex justify-between items-center">
                <div className="text-2xl font-bold text-green-900">
                  {analytics.studentsWithBookings}
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {analytics.totalStudents > 0
                  ? Math.round((analytics.studentsWithBookings / analytics.totalStudents) * 100)
                  : 0}% participation
              </div>
            </CardContent>
          </Card>

          {/* Students without Bookings */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs font-medium text-amber-800 uppercase tracking-wide">No Bookings</div>
              <div className="mt-2 flex justify-between items-center">
                <div className="text-2xl font-bold text-amber-900">
                  {analytics.studentsWithoutBookings}
                </div>
                <div className="p-2 bg-amber-100 rounded-full">
                  <UserX className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Need to register
              </div>
            </CardContent>
          </Card>

          {/* Average Bookings */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-xs font-medium text-purple-800 uppercase tracking-wide">Avg Sessions</div>
              <div className="mt-2 flex justify-between items-center">
                <div className="text-2xl font-bold text-purple-900">
                  {analytics.averageBookingsPerStudent}
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                per student
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Students Directory */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            <div>
              <CardTitle className="flex items-center">
                <Users className="mr-2 w-5 h-5 text-blue-600" />
                Students Directory
              </CardTitle>
              <CardDescription>
                {pagination?.totalCount || 0} registered students
              </CardDescription>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={refreshData}
              disabled={loading || searching}
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${(loading || searching) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, ID, email, or phone..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <RefreshCcw className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            <Select value={studentsPerPage.toString()} onValueChange={handleLimitChange}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Students Table - Desktop */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Info</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">ID: {student.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="w-3 h-3 mr-1 text-gray-400" />
                          {student.email}
                        </div>
                        {student.phoneNumber && (
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                            {student.phoneNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          variant={student.bookingCount > 0 ? "default" : "outline"}
                          className={student.bookingCount === 0 ? "text-amber-600 border-amber-200 bg-amber-50" : "bg-blue-100 text-blue-800 hover:bg-blue-100"}
                        >
                          {student.bookingCount} session{student.bookingCount !== 1 ? 's' : ''}
                        </Badge>
                        {student.bookingCount > 0 && (
                          <div className="text-xs text-gray-500">
                            {student.bookedDays}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {formatDate(student.createdAt)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Students Cards - Mobile (matching SessionCard style) */}
          <div className="md:hidden space-y-4">
            {students.map((student) => (
              <Card key={student.id} className="border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">ID: {student.id}</div>
                      </div>
                      <Badge
                        variant={student.bookingCount > 0 ? "default" : "outline"}
                        className={student.bookingCount === 0 ? "text-amber-600 border-amber-200 bg-amber-50" : "bg-blue-100 text-blue-800 hover:bg-blue-100"}
                      >
                        {student.bookingCount} session{student.bookingCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {student.email}
                      </div>
                      {student.phoneNumber && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {student.phoneNumber}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        Registered {formatDate(student.createdAt)}
                      </div>
                    </div>

                    {student.bookingCount > 0 && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md border border-gray-100">
                        <div className="font-medium mb-1">Booked Sessions:</div>
                        {student.bookedDays}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State - matching SessionCalendar style */}
          {!loading && students.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No students found' : 'No students registered'}
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {searchQuery
                  ? 'Try adjusting your search criteria or check the spelling'
                  : 'Students will appear here once they register for the system'}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    fetchStudents(1, '', studentsPerPage);
                  }}
                  className="mt-3"
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}

          {/* Pagination - matching instructor dashboard style */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-gray-200 space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-500">
                Showing {((pagination.currentPage - 1) * studentsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * studentsPerPage, pagination.totalCount)} of{' '}
                {pagination.totalCount} students
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="text-sm text-gray-600 px-3 py-1 bg-gray-50 rounded-md border">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
