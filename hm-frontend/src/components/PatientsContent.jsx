import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useDebounce } from "use-debounce";
import Preloader from "./Preloader";
import { Search, UserPlus, X, Calendar, ChevronLeft, ChevronRight, Clock, Bell } from "lucide-react";

const PatientsContent = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [todayOnly, setTodayOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState({
    total: 0,
    per_page: 20,
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0
  });

  // ✅ Fetch patients from Laravel API (with optional search, pagination, and today filter)
  const fetchPatients = async (query = "", page = 1, today = false) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/patients?search=${query}&page=${page}&today=${today}`
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
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const [debouncedSearch] = useDebounce(search, 400);

  // ✅ Initial load and debounced search
  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search or filter changes
    fetchPatients(debouncedSearch, 1, todayOnly);
  }, [debouncedSearch, todayOnly]);

  // ✅ Handle page changes
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchPatients(debouncedSearch, newPage, todayOnly);
  };

  return (
    <div className="min-h-screen pt-12">
      <div className="max-w-full">
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 md:px-8 py-4 md:py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Patients Directory</h1>
                <p className="text-blue-100 text-xs md:text-sm">Manage and view all patient records</p>
              </div>
              <Link
                to="/patients/add"
                className="bg-white text-blue-600 px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2 font-semibold text-sm md:text-base"
              >
                <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">New Patient</span>
                <span className="sm:hidden">New</span>
              </Link>
            </div>
          </div>

          {/* Search & Filter Section */}
          <div className="px-4 md:px-8 py-4 md:py-5 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <input
                  type="text"
                  placeholder="Search by name, phone, email, National ID, UPID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-800 rounded-lg pl-9 md:pl-10 pr-4 py-2 md:py-3 w-full shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all placeholder-gray-400 text-sm md:text-base"
                />
              </div>

              <Link
                to="/treatments/today"
                className="px-4 py-2 md:py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium text-sm md:text-base bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
              >
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Today's Treatments</span>
                <span className="sm:hidden">Treatments</span>
              </Link>

              <button
                onClick={() => setTodayOnly(!todayOnly)}
                className={`px-4 py-2 md:py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium text-sm md:text-base ${todayOnly
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Today's Patients</span>
                <span className="sm:hidden">Today</span>
              </button>

              <Link
                to="/patients/incomplete"
                className="px-4 py-2 md:py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium text-sm md:text-base bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Incomplete</span>
                <span className="sm:hidden">!</span>
              </Link>

              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                  }}
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
                      <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700">National ID</th>
                      <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Name</th>
                      <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Gender</th>
                      <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Phone</th>
                      <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700 hidden lg:table-cell">Email</th>
                      <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700 hidden md:table-cell">Registered</th>
                      <th className="py-3 px-3 md:py-4 md:px-4 text-xs md:text-sm font-semibold text-gray-700 text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {patients.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                              {todayOnly ? (
                                <Calendar className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                              ) : (
                                <Search className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                              )}
                            </div>
                            <p className="text-gray-500 font-medium text-sm md:text-base">
                              {todayOnly ? "No patients registered today." : "No patients found."}
                            </p>
                            <p className="text-gray-400 text-xs md:text-sm">
                              {todayOnly ? "Try viewing all patients" : "Try adjusting your search criteria"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      patients.map((p, index) => (
                        <tr
                          key={p.id}
                          className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                        >
                          <td className="py-3 px-3 md:py-4 md:px-4 text-gray-600 text-xs md:text-sm">
                            {paginationData.from + index}
                          </td>
                          <td className="py-3 px-3 md:py-4 md:px-4 text-gray-700 text-xs md:text-sm font-medium">{p.upid || "-"}</td>
                          <td className="py-3 px-3 md:py-4 md:px-4 text-gray-700 text-xs md:text-sm">{p.national_id || "-"}</td>
                          <td className="py-3 px-3 md:py-4 md:px-4 font-medium text-gray-800 text-xs md:text-sm">
                            {p.first_name} {p.last_name}
                          </td>
                          <td className="py-3 px-3 md:py-4 md:px-4">
                            <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${p.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                              }`}>
                              {p.gender}
                            </span>
                          </td>
                          <td className="py-3 px-3 md:py-4 md:px-4 text-gray-700 text-xs md:text-sm">{p.phone}</td>
                          <td className="py-3 px-3 md:py-4 md:px-4 text-gray-700 text-xs md:text-sm hidden lg:table-cell">{p.email}</td>
                          <td className="py-3 px-3 md:py-4 md:px-4 text-gray-600 text-xs md:text-sm hidden md:table-cell">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-700">{new Date(p.created_at).toLocaleDateString()}</span>
                              <span className="text-xs text-gray-500">{new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 md:py-4 md:px-4 text-center">
                            <Link
                              to={`/patients/${p.id}`}
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
          {!loading && patients.length > 0 && (
            <div className="px-4 md:px-8 py-3 md:py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-xs md:text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-800">{paginationData.from}</span> to{" "}
                  <span className="font-semibold text-gray-800">{paginationData.to}</span> of{" "}
                  <span className="font-semibold text-gray-800">{paginationData.total}</span> patients
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
  );
};

export default PatientsContent;
