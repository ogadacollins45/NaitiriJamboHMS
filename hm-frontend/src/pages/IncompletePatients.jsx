import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Preloader from "../components/Preloader";
import DashboardLayout from "../layout/DashboardLayout";
import { Bell, ChevronLeft, ChevronRight, AlertCircle, Calendar } from "lucide-react";

const IncompletePatients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationData, setPaginationData] = useState({
        total: 0,
        per_page: 20,
        current_page: 1,
        last_page: 1,
        from: 0,
        to: 0
    });

    // Fetch incomplete patients from Laravel API
    const fetchIncompletePatients = async (page = 1) => {
        try {
            setLoading(true);
            const res = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/patients/incomplete?page=${page}`
            );
            setPatients(res.data.data);
            setPaginationData({
                total: res.data.total,
                per_page: res.data.per_page,
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                from: res.data.from,
                to: res.data.to
            });
        } catch (error) {
            console.error("Error fetching incomplete patients:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchIncompletePatients(1);
    }, []);

    // Handle page changes
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        fetchIncompletePatients(newPage);
    };

    // Helper function to render incomplete item badges
    const renderIncompleteBadges = (incompleteItems) => {
        if (!incompleteItems || incompleteItems.length === 0) {
            return <span className="text-gray-400 text-xs">-</span>;
        }

        const badgeConfig = {
            diagnosis: { label: 'Diagnosis', color: 'bg-red-100 text-red-700' },
            prescription: { label: 'Prescription', color: 'bg-orange-100 text-orange-700' },
            dispensation: { label: 'Dispensation', color: 'bg-yellow-100 text-yellow-700' },
            lab: { label: 'Lab', color: 'bg-purple-100 text-purple-700' }
        };

        return (
            <div className="flex flex-wrap gap-1">
                {incompleteItems.map((item, index) => {
                    const config = badgeConfig[item] || { label: item, color: 'bg-gray-100 text-gray-700' };
                    return (
                        <span
                            key={index}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                        >
                            {config.label}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen pt-12">
                <div className="max-w-full">
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                        {/* Header Section */}
                        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-4 md:px-8 py-4 md:py-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-2">
                                        <Bell className="w-6 h-6 md:w-8 md:h-8" />
                                        Incomplete Patients
                                    </h1>
                                    <p className="text-orange-100 text-xs md:text-sm">
                                        Patients with incomplete treatment workflows
                                    </p>
                                </div>
                                <Link
                                    to="/patients"
                                    className="bg-white text-orange-600 px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-orange-50 transition-all shadow-lg flex items-center gap-2 font-semibold text-sm md:text-base"
                                >
                                    <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                                    Back to Patients
                                </Link>
                            </div>
                        </div>

                        {/* Info Banner */}
                        <div className="px-4 md:px-8 py-3 bg-orange-50 border-b border-orange-200">
                            <div className="flex items-start gap-2 text-xs md:text-sm text-orange-800">
                                <AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 mt-0.5" />
                                <p>
                                    These patients have active treatments that are missing one or more steps:
                                    <strong> Diagnosis, Prescription, Dispensation, or Lab Results</strong>.
                                    Click "View" to complete the missing steps.
                                </p>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="p-4 md:p-8">
                            {loading ? (
                                <Preloader />
                            ) : (
                                <div className="overflow-x-auto -mx-4 md:mx-0">
                                    <table className="w-full text-left border-collapse min-w-[640px]">
                                        <thead>
                                            <tr className="border-b-2 border-gray-200 bg-gray-50">
                                                <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700">#</th>
                                                <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700">UPID</th>
                                                <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Patient Name</th>
                                                <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Gender</th>
                                                <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700 hidden md:table-cell">Phone</th>
                                                <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700 hidden lg:table-cell">Treatment Date</th>
                                                <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Incomplete Items</th>
                                                <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700 text-center">Action</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {patients.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-12">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center">
                                                                <Bell className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                                                            </div>
                                                            <p className="text-gray-500 font-medium text-sm md:text-base">
                                                                Great! No incomplete patients found.
                                                            </p>
                                                            <p className="text-gray-400 text-xs md:text-sm">
                                                                All active treatments have been fully processed
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                patients.map((patient, index) => (
                                                    <tr
                                                        key={patient.id}
                                                        className="border-b border-gray-100 hover:bg-orange-50 transition-colors"
                                                    >
                                                        <td className="py-3 px-3 md:py-4 md:px-4 text-gray-600 text-xs md:text-sm">
                                                            {paginationData.from + index}
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4 text-gray-700 text-xs md:text-sm font-medium">
                                                            {patient.upid || "-"}
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4 font-medium text-gray-800 text-xs md:text-sm">
                                                            {patient.first_name} {patient.last_name}
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4">
                                                            <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${patient.gender === 'Male'
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : 'bg-pink-100 text-pink-700'
                                                                }`}>
                                                                {patient.gender}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4 text-gray-700 text-xs md:text-sm hidden md:table-cell">
                                                            {patient.phone || "-"}
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4 text-gray-600 text-xs md:text-sm hidden lg:table-cell">
                                                            {patient.latest_treatment_date ? (
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-gray-700">
                                                                        {new Date(patient.latest_treatment_date).toLocaleDateString()}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {new Date(patient.latest_treatment_date).toLocaleTimeString([], {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </span>
                                                                </div>
                                                            ) : "-"}
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4">
                                                            {renderIncompleteBadges(patient.incomplete_items)}
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4 text-center">
                                                            <Link
                                                                to={`/patients/${patient.id}`}
                                                                className="inline-block bg-orange-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-orange-700 transition-all text-xs md:text-sm font-medium shadow-sm"
                                                            >
                                                                View
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Footer with Pagination */}
                        {!loading && patients.length > 0 && (
                            <div className="px-4 md:px-8 py-3 md:py-4 bg-gray-50 border-t border-gray-200">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                                    <p className="text-xs md:text-sm text-gray-600">
                                        Showing <span className="font-semibold text-gray-800">{paginationData.from}</span> to{" "}
                                        <span className="font-semibold text-gray-800">{paginationData.to}</span> of{" "}
                                        <span className="font-semibold text-gray-800">{paginationData.total}</span> incomplete patients
                                    </p>

                                    {paginationData.last_page > 1 && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className={`px-3 py-2 rounded-lg flex items-center gap-1 text-sm font-medium transition-all ${currentPage === 1
                                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                                                    }`}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                <span className="hidden sm:inline">Previous</span>
                                            </button>

                                            <div className="flex items-center gap-1">
                                                {[...Array(paginationData.last_page)].map((_, i) => {
                                                    const pageNum = i + 1;
                                                    // Show first page, last page, current page, and pages around current
                                                    if (
                                                        pageNum === 1 ||
                                                        pageNum === paginationData.last_page ||
                                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                                    ) {
                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => handlePageChange(pageNum)}
                                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${pageNum === currentPage
                                                                        ? "bg-orange-600 text-white shadow-md"
                                                                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                                                                    }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                                        return (
                                                            <span key={pageNum} className="px-2 text-gray-400">
                                                                ...
                                                            </span>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </div>

                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === paginationData.last_page}
                                                className={`px-3 py-2 rounded-lg flex items-center gap-1 text-sm font-medium transition-all ${currentPage === paginationData.last_page
                                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                                                    }`}
                                            >
                                                <span className="hidden sm:inline">Next</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default IncompletePatients;
