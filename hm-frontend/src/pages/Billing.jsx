import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import Preloader from "../components/Preloader";
import {
  ChevronLeft,
  Search,
  Filter,
  Loader,
  AlertCircle,
  CheckCircle,
  Eye,
  Receipt,
  Ban,
  Wallet,
} from "lucide-react";

const Billing = () => {
  const [view, setView] = useState("pending"); // "pending", "cleared", or "all"
  const [bills, setBills] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  const flashMessage = (setter, message) => {
    setter(message);
    setTimeout(() => setter(""), 3000);
  };

  const fetchBills = async (page = 1, query = "") => {
    setLoading(true);
    setError("");
    try {
      let endpoint;
      if (view === "pending") endpoint = `${API_BASE_URL}/billing/pending`;
      else if (view === "cleared") endpoint = `${API_BASE_URL}/billing/cleared`;
      else endpoint = `${API_BASE_URL}/bills`;

      const res = await axios.get(endpoint, { params: { page, search: query } });

      const sorted = res.data.data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setBills(sorted);
      setMeta({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total,
      });
    } catch (err) {
      console.error("Error fetching bills:", err);
      flashMessage(setError, "Failed to fetch billing data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(1);
  }, [view]);

  // Auto-search for patient if navigated from dashboard with patient info
  useEffect(() => {
    if (location.state?.patientName) {
      setSearch(location.state.patientName);
      fetchBills(1, location.state.patientName);
      // Clear the location state to prevent re-searching on subsequent navigations
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    fetchBills(1, q);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= meta.last_page) fetchBills(page, search);
  };

  const statusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "partial":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-red-100 text-red-700";
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-300 mr-4"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Billing Management</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full">
            <div className="p-6 sm:p-8">
              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg flex items-center shadow-md">
                  <AlertCircle className="w-6 h-6 mr-3" />
                  <div>
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}
              {success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg flex items-center shadow-md">
                  <CheckCircle className="w-6 h-6 mr-3" />
                  <div>
                    <p className="font-bold">Success</p>
                    <p>{success}</p>
                  </div>
                </div>
              )}

              {/* Top Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="relative flex-grow max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search bills..."
                    value={search}
                    onChange={handleSearch}
                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  />
                </div>

                {/* View Switch */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {["pending", "cleared", "all"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all duration-300 ${view === v ? "bg-blue-500 text-white shadow" : "text-gray-500 hover:bg-gray-200"}`}
                    >
                      {v === "pending"
                        ? "Pending Bills"
                        : v === "cleared"
                        ? "Cleared Bills"
                        : "All Bills"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <Preloader />
              ) : bills.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Wallet className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-xl font-semibold">
                    {view === "pending"
                      ? "No pending bills found."
                      : view === "cleared"
                      ? "No cleared bills found."
                      : "No bills available."}
                  </p>
                  <p>Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-xl shadow-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (KES)</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bills.map((bill, i) => (
                        <tr key={bill.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {(meta.current_page - 1) * 10 + (i + 1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {bill.patient?.first_name} {bill.patient?.last_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {bill.doctor
                              ? `Dr. ${bill.doctor.first_name} ${bill.doctor.last_name}`
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(bill.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {Number(bill.total_amount || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor(
                                bill.status
                              )}`}
                            >
                              {bill.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => navigate(`/bills/${bill.id}`)}
                                className="text-blue-500 hover:text-blue-700 transition-colors duration-200 flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-1" /> View
                              </button>
                              <button
                                onClick={() => navigate(`/bills/${bill.id}/receipt`)}
                                className="text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center"
                              >
                                <Receipt className="w-4 h-4 mr-1" /> Receipt
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {meta.total > 0 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {((meta.current_page - 1) * 10) + 1} to {Math.min(meta.current_page * 10, meta.total)} of {meta.total} results
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(meta.current_page - 1)}
                      disabled={meta.current_page === 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(meta.current_page + 1)}
                      disabled={meta.current_page === meta.last_page}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Billing;