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
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  UserCheck,
  UserX,
  GraduationCap,
  AlertTriangle,
  History,
  Pencil,
  Ban,
  RotateCcw,
  Loader2,
  Archive
} from 'lucide-react';

// Shadcn components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { LICENCE_CLASSES, LICENCE_CLASS_NAMES } from '@/app/lib/constants';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import StudentHistorySheet from '@/components/StudentHistorySheet';
import EditStudentSheet from '@/components/EditStudentSheet';

export default function StudentsList({ isAdmin = false }) {
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
  const [statusFilter, setStatusFilter] = useState('active');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Bulk selection (by student id) for bulk actions
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  // Student history sheet
  const [historyStudent, setHistoryStudent] = useState(null);

  // Edit student sheet
  const [editStudent, setEditStudent] = useState(null);

  // Deactivate/reactivate confirmation
  const [toggleStudent, setToggleStudent] = useState(null);

  // Archive & release-number confirmation (permanent)
  const [archiveStudent, setArchiveStudent] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Debounced search
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Fetch students data
  const fetchStudents = useCallback(async (page = 1, search = '', limit = studentsPerPage, status = statusFilter, category = categoryFilter) => {
    try {
      setSearching(search !== '');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
        ...(category && category !== 'all' && { category }),
        ...(search && { search })
      });

      const { data } = await axios.get(`/api/instructor/students?${params}`);

      setStudents(data.students);
      setPagination(data.pagination);
      setAnalytics(data.analytics);
      setSelectedIds(new Set()); // clear selection whenever the visible set changes
      setError(null);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [studentsPerPage, statusFilter, categoryFilter]);

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

  // Handle status filter change (active / inactive / all)
  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
    fetchStudents(1, searchQuery, studentsPerPage, newStatus, categoryFilter);
  };

  // Handle licence-class filter change
  const handleCategoryFilterChange = (newCategory) => {
    setCategoryFilter(newCategory);
    setCurrentPage(1);
    fetchStudents(1, searchQuery, studentsPerPage, statusFilter, newCategory);
  };

  // Selection helpers
  const allVisibleSelected = students.length > 0 && students.every((s) => selectedIds.has(s.id));
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (students.every((s) => prev.has(s.id))) return new Set();
      return new Set(students.map((s) => s.id));
    });
  };
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Bulk deactivate the selected active students (admin only)
  const handleBulkDeactivate = async () => {
    const targets = students.filter((s) => selectedIds.has(s.id) && s.status === 'ACTIVE');
    if (targets.length === 0) {
      toast.error('No active students selected');
      return;
    }
    setBulkBusy(true);
    try {
      const results = await Promise.allSettled(
        targets.map((s) => axios.patch(`/api/instructor/students/${s.id}/status`, { status: 'INACTIVE' }))
      );
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - ok;
      toast.success(`Deactivated ${ok}${failed ? `, ${failed} failed` : ''}`);
      refreshData();
    } catch {
      toast.error('Bulk deactivate failed');
      refreshData();
    } finally {
      setBulkBusy(false);
    }
  };

  // Refresh data
  const refreshData = () => {
    fetchStudents(currentPage, searchQuery, studentsPerPage, statusFilter);
  };

  // Archive a student & release their number (permanent, admin only)
  const handleArchive = async () => {
    if (!archiveStudent) return;
    setArchiving(true);
    try {
      const { data } = await axios.patch(
        `/api/instructor/students/${archiveStudent.id}/status`,
        { status: 'ARCHIVED' }
      );
      toast.success(data.message || 'Student archived');
      setArchiveStudent(null);
      refreshData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to archive student');
    } finally {
      setArchiving(false);
    }
  };

  // Deactivate / reactivate a student (admin only)
  const handleToggleStatus = async () => {
    if (!toggleStudent) return;
    const { id } = toggleStudent;
    const nextStatus = toggleStudent.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    setTogglingStatus(true);
    try {
      const { data: res } = await axios.patch(
        `/api/instructor/students/${id}/status`,
        { status: nextStatus }
      );
      toast.success(nextStatus === 'INACTIVE' ? 'Student deactivated' : 'Student reactivated');

      // Optimistic update so the change is visible immediately: flip the row's
      // status, and drop it if it no longer matches the active/inactive filter.
      setStudents(prev =>
        prev
          .map(s => (s.id === id
            ? { ...s, status: nextStatus, deactivatedAt: res.student?.deactivatedAt ?? null }
            : s))
          .filter(s => (
            statusFilter === 'active' ? s.status === 'ACTIVE'
              : statusFilter === 'inactive' ? s.status === 'INACTIVE'
                : true
          ))
      );

      setToggleStudent(null);
      refreshData(); // reconcile analytics, counts, and pagination with the server
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update student status');
    } finally {
      setTogglingStatus(false);
    }
  };

  // Initial load — runs once on mount. All other refetches are driven explicitly
  // by handleSearchChange / handlePageChange / handleLimitChange / refreshData,
  // so depending on fetchStudents here would just cause duplicate requests when
  // studentsPerPage changes (it's a useCallback dep).
  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <Card className="border-blue-200">
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
          <Card className="border-green-200">
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
          <Card className="border-amber-200">
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
                Haven't booked sessions yet
              </div>
            </CardContent>
          </Card>

          {/* Average Bookings */}
          <Card className="border-purple-200">
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
          <div className="mb-6 md:flex md:gap-4">
            <div className="relative md:flex-1 mb-3 md:mb-0">
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

            <div className="grid grid-cols-2 gap-2 md:flex md:gap-4">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {LICENCE_CLASSES.map((c) => (
                  <SelectItem key={c} value={c}>{LICENCE_CLASS_NAMES[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={studentsPerPage.toString()} onValueChange={handleLimitChange}>
              <SelectTrigger className="w-full md:w-32 col-span-2 md:col-span-1">
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
          </div>

          {/* Bulk action bar (admin) */}
          {isAdmin && selectedIds.size > 0 && (
            <div className="flex items-center justify-between mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
              <span className="text-sm font-medium text-blue-800">{selectedIds.size} selected</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} disabled={bulkBusy}>
                  Clear
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  disabled={bulkBusy}
                  onClick={handleBulkDeactivate}
                >
                  {bulkBusy
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Ban className="w-4 h-4 mr-1" /> Deactivate selected</>}
                </Button>
              </div>
            </div>
          )}

          {/* Students Table - Desktop */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && (
                    <TableHead className="w-8">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                  )}
                  <TableHead>Student</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} data-state={selectedIds.has(student.id) ? 'selected' : undefined}>
                    {isAdmin && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(student.id)}
                          onCheckedChange={() => toggleSelect(student.id)}
                          aria-label={`Select ${student.name}`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{student.name}</span>
                        {student.category && (
                          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-xs">
                            {student.category}
                          </Badge>
                        )}
                        {student.status === 'INACTIVE' && (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-600 text-xs">
                            Inactive
                          </Badge>
                        )}
                        {student.status === 'ARCHIVED' && (
                          <Badge variant="outline" className="border-gray-300 bg-gray-100 text-gray-500 text-xs">
                            Archived
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{student.studentNumber}</div>
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
                      {student.totalRequired ? (
                        <div className="flex items-center gap-2">
                          <Progress
                            value={Math.min(100, Math.round((student.completedSessions / student.totalRequired) * 100))}
                            className="h-1.5 max-w-[80px]"
                          />
                          <span className="text-xs text-gray-500">
                            {student.completedSessions}/{student.totalRequired}
                          </span>
                          {student.isComplete && (
                            <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                              Done
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => setHistoryStudent(student)}
                        >
                          History
                        </Button>
                        {isAdmin && student.status !== 'ARCHIVED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-500 hover:text-gray-800"
                            onClick={() => setEditStudent(student)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        )}
                        {isAdmin && student.status !== 'ARCHIVED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-xs ${student.status === 'INACTIVE' ? 'text-emerald-600 hover:text-emerald-800' : 'text-red-500 hover:text-red-700'}`}
                            onClick={() => setToggleStudent(student)}
                            title={student.status === 'INACTIVE' ? 'Reactivate student' : 'Deactivate student'}
                          >
                            {student.status === 'INACTIVE'
                              ? <RotateCcw className="w-3 h-3" />
                              : <Ban className="w-3 h-3" />}
                          </Button>
                        )}
                        {isAdmin && student.status !== 'ARCHIVED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-400 hover:text-red-700"
                            onClick={() => setArchiveStudent(student)}
                            title="Archive & release number"
                          >
                            <Archive className="w-3 h-3" />
                          </Button>
                        )}
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
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="font-medium text-gray-900">{student.name}</span>
                          {student.category && (
                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-xs">
                              {student.category}
                            </Badge>
                          )}
                          {student.status === 'INACTIVE' && (
                            <Badge variant="secondary" className="bg-gray-200 text-gray-600 text-xs">Inactive</Badge>
                          )}
                          {student.status === 'ARCHIVED' && (
                            <Badge variant="outline" className="border-gray-300 bg-gray-100 text-gray-500 text-xs">Archived</Badge>
                          )}
                        </div>
                        {student.isComplete && (
                          <Badge className="bg-emerald-100 text-emerald-800 text-xs shrink-0">Done</Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{student.studentNumber}</div>
                    </div>

                    {/* Progress bar */}
                    {student.totalRequired && (
                      <div className="flex items-center gap-2">
                        <Progress
                          value={Math.min(100, Math.round((student.completedSessions / student.totalRequired) * 100))}
                          className="h-2 flex-1"
                        />
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {student.completedSessions}/{student.totalRequired} practicals
                        </span>
                      </div>
                    )}

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
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs text-blue-600 border-blue-200"
                        onClick={() => setHistoryStudent(student)}
                      >
                        <History className="w-3 h-3 mr-1" />
                        History
                      </Button>
                      {isAdmin && student.status !== 'ARCHIVED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-gray-600 border-gray-200"
                          onClick={() => setEditStudent(student)}
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      )}
                      {isAdmin && student.status !== 'ARCHIVED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`text-xs ${student.status === 'INACTIVE' ? 'text-emerald-600 border-emerald-200' : 'text-red-600 border-red-200'}`}
                          onClick={() => setToggleStudent(student)}
                        >
                          {student.status === 'INACTIVE'
                            ? <><RotateCcw className="w-3 h-3 mr-1" />Reactivate</>
                            : <><Ban className="w-3 h-3 mr-1" />Deactivate</>}
                        </Button>
                      )}
                      {isAdmin && student.status !== 'ARCHIVED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-gray-500 border-gray-200"
                          onClick={() => setArchiveStudent(student)}
                          title="Archive & release number"
                        >
                          <Archive className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
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

      {/* Student History Slide-over */}
      <StudentHistorySheet
        studentId={historyStudent?.id}
        studentName={historyStudent?.name}
        isAdmin={isAdmin}
        onStatusChange={refreshData}
        open={!!historyStudent}
        onOpenChange={(open) => { if (!open) setHistoryStudent(null); }}
      />

      {/* Edit Student Slide-over */}
      <EditStudentSheet
        student={editStudent}
        open={!!editStudent}
        onOpenChange={(open) => { if (!open) setEditStudent(null); }}
        onSuccess={() => {
          setEditStudent(null);
          refreshData();
        }}
      />

      {/* Deactivate / Reactivate confirmation */}
      <AlertDialog open={!!toggleStudent} onOpenChange={(open) => { if (!open) setToggleStudent(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              {toggleStudent?.status === 'INACTIVE' ? (
                <RotateCcw className="mr-2 h-5 w-5 text-emerald-500" />
              ) : (
                <Ban className="mr-2 h-5 w-5 text-red-500" />
              )}
              {toggleStudent?.status === 'INACTIVE' ? 'Reactivate Student' : 'Deactivate Student'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleStudent?.status === 'INACTIVE' ? (
                <>This will restore access for <span className="font-medium">{toggleStudent?.name}</span> and show them in listings and stats again.</>
              ) : (
                <><span className="font-medium">{toggleStudent?.name}</span> will lose access to log in and book sessions. Their data and full history are kept and can still be viewed via the Inactive filter.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={togglingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleToggleStatus(); }}
              disabled={togglingStatus}
              className={toggleStudent?.status === 'INACTIVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {togglingStatus
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : toggleStudent?.status === 'INACTIVE' ? 'Reactivate' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive & release-number confirmation (permanent) */}
      <AlertDialog open={!!archiveStudent} onOpenChange={(open) => { if (!open) setArchiveStudent(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <Archive className="mr-2 h-5 w-5 text-red-500" />
              Archive &amp; release number
            </AlertDialogTitle>
            <AlertDialogDescription>
              This <span className="font-medium">permanently archives</span>{' '}
              <span className="font-medium">{archiveStudent?.name}</span> ({archiveStudent?.studentNumber}) and{' '}
              <span className="font-medium">frees their student number</span> so it can be given to a new student.
              Their history is kept, but this <span className="font-medium">cannot be undone</span> — they can&apos;t be reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleArchive(); }}
              disabled={archiving}
              className="bg-red-600 hover:bg-red-700"
            >
              {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Archive & release'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
