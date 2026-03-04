import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useDebounce } from "use-debounce";
import Preloader from "../components/Preloader";
import DashboardLayout from "../layout/DashboardLayout";
import { Search, Clock, X, ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const TodaysTreatments = () => {
    const [treatments, setTreatments] = useState([]);
    const [search, setSearch] = useState("");
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

    // Fetch today's treatments from Laravel API
    const fetchTreatments = async (query = "", page = 1) => {
        try {
            setLoading(true);
            const res = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/treatments/today?search=${query}&page=${page}`
            );
            setTreatments(res.data.data);
            setPaginationData({
                total: res.data.total,
                per_page: res.data.per_page,
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                from: res.data.from,
                to: res.data.to
            });
        } catch (error) {
            console.error("Error fetching today's treatments:", error);
        } finally {
            setLoading(false);
        }
    };

    const [debouncedSearch] = useDebounce(search, 400);

    // Initial load and debounced search
    useEffect(() => {
        setCurrentPage(1);
        fetchTreatments(debouncedSearch, 1);
    }, [debouncedSearch]);

    // Handle page changes
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        fetchTreatments(debouncedSearch, newPage);
    };

    // Helper function to get treatment type badge styling
    const getTreatmentTypeBadge = (treatmentType) => {
        if (treatmentType === 'revisit') {
            return (
                <span className="px-2 md:px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                    Revisit
                </span>
            );
        }
        return (
            <span className="px-2 md:px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                New
            </span>
        );
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen pt-12">
                <div className="max-w-full">
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                        {/* Header Section */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 md:px-8 py-4 md:py-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-2">
                                        <Clock className="w-6 h-6 md:w-8 md:h-8" />
                                        Today's Treatments
                                    </h1>
                                    <p className="text-blue-100 text-xs md:text-sm">
                                        All treatments performed on {new Date().toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <Link
                                    to="/patients"
                                    className="bg-white text-blue-600 px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2 font-semibold text-sm md:text-base"
                                >
                                    <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                                    Back to Patients
                                </Link>
                            </div>
                        </div>

                        {/* Search Section */}
                        <div className="px-4 md:px-8 py-4 md:py-5 bg-gray-50 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search by patient name, UPID, National ID, phone..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="bg-white border border-gray-300 text-gray-800 rounded-lg pl-9 md:pl-10 pr-4 py-2 md:py-3 w-full shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all placeholder-gray-400 text-sm md:text-base"
                                    />
                                </div>

                                {search && (
                                    <button
                                        onClick={() => setSearch("")}
                                        className="px-3 md:px-4 py-2 md:py-3 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-700 transition-all flex items-center gap-2 font-medium text-sm md:text-base"
                                    >
                                        <X className="w-4 h-4" />
                                        <span className="hidden sm:inline">Clear</span>
                                    </button>
                                )}
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
                                                <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Type</th>
                                                <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700 hidden lg:table-cell">Doctor</th>
                                                <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700 hidden lg:table-cell">Diagnosis</th>
                                                <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700 hidden md:table-cell">Visit Time</th>
                                                <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700 text-center">Action</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {treatments.length === 0 ? (
                                                <tr>
                                                    <td colSpan="10" className="text-center py-12">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                                                <Clock className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                                                            </div>
                                                            <p className="text-gray-500 font-medium text-sm md:text-base">
                                                                No treatments found for today.
                                                            </p>
                                                            <p className="text-gray-400 text-xs md:text-sm">
                                                                {search ? "Try adjusting your search criteria" : "Treatments will appear here once created"}
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                treatments.map((treatment, index) => (
                                                    <tr
                                                        key={treatment.id}
                                                        className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                                                    >
                                                        <td className="py-3 px-3 md:py-4 md:px-4 text-gray-600 text-xs md:text-sm">
                                                            {paginationData.from + index}
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4 text-gray-700 text-xs md:text-sm font-medium">
                                                            {treatment.patient?.upid || "-"}
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4 font-medium text-gray-800 text-xs md:text-sm">
                                                            {treatment.patient?.first_name} {treatment.patient?.last_name}
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4">
                                                            <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${treatment.patient?.gender === 'Male'
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : 'bg-pink-100 text-pink-700'
                                                                }`}>
                                                                {treatment.patient?.gender}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4 text-gray-700 text-xs md:text-sm hidden md:table-cell">
                                                            {treatment.patient?.phone || "-"}
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4">
                                                            {getTreatmentTypeBadge(treatment.treatment_type)}
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4 text-gray-700 text-xs md:text-sm hidden lg:table-cell">
                                                            {treatment.attending_doctor || treatment.doctor?.first_name + ' ' + treatment.doctor?.last_name || "-"}
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4 text-gray-700 text-xs md:text-sm hidden lg:table-cell">
                                                            <div className="max-w-xs truncate" title={treatment.diagnosis}>
                                                                {treatment.diagnosis ||
                                                                    (treatment.diagnoses && treatment.diagnoses.length > 0
                                                                        ? treatment.diagnoses[0].diagnosis
                                                                        : "-")}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4 text-gray-600 text-xs md:text-sm hidden md:table-cell">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-gray-700">
                                                                    {new Date(treatment.visit_date).toLocaleDateString()}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(treatment.created_at).toLocaleTimeString([], {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 md:py-4 md:px-4 text-center">
                                                            <Link
                                                                to={`/patients/${treatment.patient_id}`}
                                                                className="inline-block bg-blue-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-blue-700 transition-all text-xs md:text-sm font-medium shadow-sm"
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
                        {!loading && treatments.length > 0 && (
                            <div className="px-4 md:px-8 py-3 md:py-4 bg-gray-50 border-t border-gray-200">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                                    <p className="text-xs md:text-sm text-gray-600">
                                        Showing <span className="font-semibold text-gray-800">{paginationData.from}</span> to{" "}
                                        <span className="font-semibold text-gray-800">{paginationData.to}</span> of{" "}
                                        <span className="font-semibold text-gray-800">{paginationData.total}</span> treatments
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
                                                                        ? "bg-blue-600 text-white shadow-md"
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

export default TodaysTreatments;
