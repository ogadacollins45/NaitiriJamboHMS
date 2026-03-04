import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../layout/DashboardLayout";
import { AuthContext } from "../context/AuthContext";
import {
    Users,
    Clock,
    Trash2,
    Stethoscope,
    Loader,
    AlertCircle,
    CheckCircle,
    ClipboardList,
    TrendingUp,
} from "lucide-react";

const Queue = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const role = user?.role || localStorage.getItem("role");

    const [queueItems, setQueueItems] = useState([]);
    const [attendedStats, setAttendedStats] = useState({
        attended_today: 0,
        attended_this_week: 0,
        attended_this_month: 0,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

    const fetchQueue = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/queue`);
            setQueueItems(res.data);
        } catch (err) {
            console.error("Error fetching queue:", err);
            setError("Failed to fetch queue data");
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendedStats = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/queue/attended-stats`);
            setAttendedStats(res.data);
        } catch (err) {
            console.error("Error fetching attended stats:", err);
        }
    };

    useEffect(() => {
        fetchQueue();
        fetchAttendedStats();
        // No polling - manual refresh only for cost optimization
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const flashMessage = (setter, message) => {
        setter(message);
        setTimeout(() => setter(""), 3000);
    };

    const handleAttend = async (item) => {
        try {
            await axios.post(`${API_BASE_URL}/queue/${item.id}/attend`);
            // Navigate to patient details page with query param to auto-open treatment form
            navigate(`/patients/${item.patient_id}?openTreatment=true`);
        } catch (err) {
            console.error("Error attending patient:", err);
            flashMessage(setError, "Failed to attend patient");
        }
    };



    const openRemoveModal = (item) => {
        setSelectedItem(item);
        setShowConfirmModal(true);
    };

    const confirmRemove = async () => {
        if (!selectedItem) return;

        try {
            await axios.delete(`${API_BASE_URL}/queue/${selectedItem.id}`);
            flashMessage(setSuccess, "Patient removed from queue");
            fetchQueue();
            setShowConfirmModal(false);
            setSelectedItem(null);
        } catch (err) {
            console.error("Error removing patient:", err);
            flashMessage(setError, "Failed to remove patient from queue");
        }
    };

    const getWaitTime = (createdAt) => {
        const created = new Date(createdAt);
        const now = new Date();
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) {
            return `${diffMins} min${diffMins !== 1 ? "s" : ""}`;
        }

        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    };

    const waitingItems = queueItems.filter((item) => item.status === "waiting");

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-screen">
                    <Loader className="animate-spin h-10 w-10 text-indigo-500" />
                    <p className="ml-3 text-lg text-gray-600">Loading queue...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 pt-24 p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <ClipboardList className="w-8 h-8 text-indigo-600" />
                        <h1 className="text-3xl font-bold text-gray-800">Patient Queue</h1>
                    </div>
                    <p className="text-gray-600">
                        {waitingItems.length} patient{waitingItems.length !== 1 ? "s" : ""}{" "}
                        waiting
                    </p>
                    <button
                        onClick={async () => {
                            setRefreshing(true);
                            try {
                                await Promise.all([fetchQueue(), fetchAttendedStats()]);
                            } finally {
                                setRefreshing(false);
                            }
                        }}
                        disabled={refreshing}
                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg
                            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {refreshing ? 'Refreshing...' : 'Refresh Queue'}
                    </button>
                </div>

                {/* Notifications */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg flex items-center shadow-md">
                        <AlertCircle className="w-6 h-6 mr-3" />
                        <p>{error}</p>
                    </div>
                )}
                {success && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg flex items-center shadow-md">
                        <CheckCircle className="w-6 h-6 mr-3" />
                        <p>{success}</p>
                    </div>
                )}

                {/* Queue Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Waiting</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {waitingItems.length}
                                </p>
                            </div>
                            <Users className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total in Queue</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {queueItems.length}
                                </p>
                            </div>
                            <ClipboardList className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                </div>

                {/* Attended Patients Statistics */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md p-6 mb-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-6 h-6" />
                        <h2 className="text-xl font-bold">Patients Attended To</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                            <p className="text-sm opacity-90">Today</p>
                            <p className="text-3xl font-bold">{attendedStats.attended_today}</p>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                            <p className="text-sm opacity-90">This Week</p>
                            <p className="text-3xl font-bold">{attendedStats.attended_this_week}</p>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                            <p className="text-sm opacity-90">This Month</p>
                            <p className="text-3xl font-bold">{attendedStats.attended_this_month}</p>
                        </div>
                    </div>
                </div>

                {/* Queue List */}
                {queueItems.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            No Patients in Queue
                        </h3>
                        <p className="text-gray-600">
                            The queue is empty. Patients will appear here when added.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {queueItems.map((item, index) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-lg shadow-md p-5 transition-all hover:shadow-lg border-l-4 border-blue-500"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Queue Number */}
                                        <div className="bg-indigo-100 text-indigo-700 font-bold rounded-full w-10 h-10 flex items-center justify-center text-lg">
                                            {index + 1}
                                        </div>

                                        {/* Patient Info */}
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {item.patient?.first_name} {item.patient?.last_name}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                UPID: {item.patient?.upid || "N/A"}
                                            </p>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Waiting: {getWaitTime(item.created_at)}
                                                </span>
                                            </div>
                                            {item.notes && (
                                                <p className="text-sm text-gray-600 mt-2 italic">
                                                    Note: {item.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {/* Doctor and Admin Actions */}
                                        {(role === "doctor" || role === "admin") && (
                                            <>
                                                {item.status === "waiting" && (
                                                    <button
                                                        onClick={() => handleAttend(item)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                                    >
                                                        <Stethoscope className="w-4 h-4" />
                                                        Attend to Patient
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {/* Admin/Reception can only Remove */}
                                        {(role === "admin" || role === "reception") && (
                                            <button
                                                onClick={() => openRemoveModal(item)}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Confirmation Modal */}
                {showConfirmModal && selectedItem && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">
                                Confirm Removal
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to remove{" "}
                                <strong>
                                    {selectedItem.patient?.first_name}{" "}
                                    {selectedItem.patient?.last_name}
                                </strong>{" "}
                                from the queue?
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setSelectedItem(null);
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRemove}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Queue;
