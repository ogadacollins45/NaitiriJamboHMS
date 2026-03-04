import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../layout/DashboardLayout';
import { Microscope, Clock, AlertTriangle, ChevronRight, Search, Calendar } from 'lucide-react';

const LabQueue = () => {
    const [requests, setRequests] = useState({ data: [], current_page: 1, last_page: 1, total: 0, from: 0, to: 0 });
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [showTodayOnly, setShowTodayOnly] = useState(false);
    const [pageJumpValue, setPageJumpValue] = useState('');

    const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;
    const token = localStorage.getItem('token');

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Load requests when filters or debounced search changes
    useEffect(() => {
        loadRequests(1); // Reset to page 1 on filter/search change
    }, [debouncedSearch, statusFilter, priorityFilter, showTodayOnly]); // Added showTodayOnly

    const loadRequests = async (page = 1) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/lab/processing/pending`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page,
                    per_page: 20,
                    search: debouncedSearch,
                    status: statusFilter,
                    priority: priorityFilter,
                    today_only: showTodayOnly // Added today_only parameter
                }
            });
            setRequests(response.data);
        } catch (err) {
            console.error('Error loading lab requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityBadge = (priority) => {
        const styles = {
            stat: 'bg-red-100 text-red-700 border-red-300',
            urgent: 'bg-orange-100 text-orange-700 border-orange-300',
            routine: 'bg-blue-100 text-blue-700 border-blue-300'
        };
        return styles[priority] || styles.routine;
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700',
            sample_collected: 'bg-blue-100 text-blue-700',
            processing: 'bg-purple-100 text-purple-700',
            completed: 'bg-green-100 text-green-700'
        };
        return styles[status] || styles.pending;
    };

    // No client-side filtering needed - all filtering is server-side now
    const filteredRequests = requests.data || [];

    // Page navigation helpers
    const goToPage = (page) => {
        if (page >= 1 && page <= requests.last_page) {
            loadRequests(page);
            setPageJumpValue('');
        }
    };

    const handlePageJump = (e) => {
        e.preventDefault();
        const page = parseInt(pageJumpValue);
        if (!isNaN(page)) {
            goToPage(page);
        }
    };

    // Generate smart page numbers with ellipsis
    const getPageNumbers = () => {
        const pages = [];
        const current = requests.current_page;
        const last = requests.last_page;

        if (last <= 7) {
            // Show all pages if 7 or fewer
            for (let i = 1; i <= last; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            // Add ellipsis and middle pages
            if (current > 3) {
                pages.push('...');
            }

            // Show pages around current
            const start = Math.max(2, current - 1);
            const end = Math.min(last - 1, current + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            // Add ellipsis and last page
            if (current < last - 2) {
                pages.push('...');
            }
            pages.push(last);
        }

        return pages;
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 pt-24 p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <Microscope className="w-8 h-8 text-indigo-600 mr-3" />
                        Laboratory Queue
                    </h1>
                    <p className="text-gray-600 mt-2">Pending lab test requests</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    {/* Today Button */}
                    <div className="mb-4 flex gap-2">
                        <button
                            onClick={() => setShowTodayOnly(!showTodayOnly)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${showTodayOnly
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            {showTodayOnly ? "Showing Today's Requests" : "Show Today Only"}
                        </button>
                        {showTodayOnly && (
                            <button
                                onClick={() => setShowTodayOnly(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Search className="w-4 h-4 inline mr-1" />
                                Search
                            </label>
                            <input
                                type="text"
                                placeholder="Patient name, UPID, or request #"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="sample_collected">Sample Collected</option>
                                <option value="processing">Processing</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">All Priorities</option>
                                <option value="stat">STAT</option>
                                <option value="urgent">Urgent</option>
                                <option value="routine">Routine</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => loadRequests(1)}
                                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white rounded-xl shadow-md">
                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                <p className="text-gray-600 mt-2">Loading requests...</p>
                            </div>
                        ) : filteredRequests?.length === 0 ? (
                            <div className="text-center py-12">
                                <Microscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600">No pending lab requests</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Request #</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">UPID</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Patient</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Doctor</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tests</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Priority</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredRequests?.map((request) => (
                                            <tr key={request.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-mono text-gray-800">
                                                    {request.request_number}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-700">
                                                    {request.patient?.upid || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800">
                                                    {request.patient?.first_name} {request.patient?.last_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    Dr. {request.doctor?.first_name || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {request.tests?.length || 0} test(s)
                                                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                                                        {request.tests?.slice(0, 2).map((t, idx) => (
                                                            <div key={idx} className="flex items-center gap-1">
                                                                <span>{t.template?.name}</span>
                                                                {t.template?.parameters?.some(p => p.result_type === 'binary') && (
                                                                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px]">
                                                                        Pos/Neg
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {request.tests?.length > 2 && <div>...</div>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityBadge(request.priority)}`}>
                                                        {request.priority?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(request.status)}`}>
                                                        {request.status?.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <Clock className="w-4 h-4 mr-1" />
                                                        {new Date(request.request_date).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => window.location.href = `/lab/processing/${request.id}`}
                                                        className="bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition flex items-center text-sm"
                                                    >
                                                        Process
                                                        <ChevronRight className="w-4 h-4 ml-1" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Enhanced Pagination */}
                    {requests.last_page > 0 && (
                        <div className="px-6 py-4 border-t bg-gray-50">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                {/* Result count */}
                                <div className="text-sm text-gray-600">
                                    {requests.total > 0 ? (
                                        <>
                                            Showing <span className="font-medium">{requests.from}</span> to{' '}
                                            <span className="font-medium">{requests.to}</span> of{' '}
                                            <span className="font-medium">{requests.total}</span> results
                                        </>
                                    ) : (
                                        'No results'
                                    )}
                                </div>

                                {/* Pagination controls */}
                                {requests.last_page > 1 && (
                                    <div className="flex items-center gap-2">
                                        {/* First button */}
                                        <button
                                            onClick={() => goToPage(1)}
                                            disabled={requests.current_page === 1}
                                            className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 transition-colors"
                                            title="First page"
                                        >
                                            First
                                        </button>

                                        {/* Previous button */}
                                        <button
                                            onClick={() => goToPage(requests.current_page - 1)}
                                            disabled={requests.current_page === 1}
                                            className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 transition-colors"
                                        >
                                            Previous
                                        </button>

                                        {/* Page numbers */}
                                        <div className="hidden md:flex items-center gap-1">
                                            {getPageNumbers().map((page, index) => (
                                                page === '...' ? (
                                                    <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                                                        ...
                                                    </span>
                                                ) : (
                                                    <button
                                                        key={page}
                                                        onClick={() => goToPage(page)}
                                                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${requests.current_page === page
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'border border-gray-300 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                )
                                            ))}
                                        </div>

                                        {/* Current page indicator (mobile) */}
                                        <div className="md:hidden px-3 py-2 text-sm font-medium text-gray-700">
                                            Page {requests.current_page} of {requests.last_page}
                                        </div>

                                        {/* Next button */}
                                        <button
                                            onClick={() => goToPage(requests.current_page + 1)}
                                            disabled={requests.current_page === requests.last_page}
                                            className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 transition-colors"
                                        >
                                            Next
                                        </button>

                                        {/* Last button */}
                                        <button
                                            onClick={() => goToPage(requests.last_page)}
                                            disabled={requests.current_page === requests.last_page}
                                            className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 transition-colors"
                                            title="Last page"
                                        >
                                            Last
                                        </button>

                                        {/* Page jump */}
                                        <form onSubmit={handlePageJump} className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-gray-300">
                                            <label className="text-sm text-gray-600">Jump to:</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={requests.last_page}
                                                value={pageJumpValue}
                                                onChange={(e) => setPageJumpValue(e.target.value)}
                                                placeholder={requests.current_page.toString()}
                                                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                            <button
                                                type="submit"
                                                className="px-3 py-1 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                            >
                                                Go
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LabQueue;
