import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Search, Users, Stethoscope, Calendar, Clock, Loader, ChevronLeft, ChevronRight } from "lucide-react";

export default function CreateAppointmentModal({ onClose, onSuccess, userRole, userId, selectedDoctorId }) {
    const [step, setStep] = useState(1); // 1: Select Patient, 2: Set Details
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState("");
    const itemsPerPage = 20;

    const [formData, setFormData] = useState({
        patient_id: "",
        doctor_id: userRole === "doctor" ? userId : selectedDoctorId || "",
        appointment_time: "",
    });

    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

    // Fetch patients
    useEffect(() => {
        const fetchPatients = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/patients?search=${searchQuery}`);
                console.log("Patients API Response:", res);
                console.log("Patients Data:", res.data);
                // API returns paginated data: {data: {data: Array}}
                setPatients(res.data.data || []);
            } catch (err) {
                console.error("Failed to load patients", err);
                setError("Unable to load patients");
                setPatients([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, [searchQuery, API_BASE_URL]);

    // Fetch doctors (for admin or if doctor wants to schedule with another doctor)
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/doctors`);
                setDoctors(res.data || []);
            } catch (err) {
                console.error("Failed to load doctors", err);
            }
        };
        if (userRole === "admin") {
            fetchDoctors();
        }
    }, [userRole, API_BASE_URL]);

    // Pagination
    const totalPages = Math.ceil((Array.isArray(patients) ? patients.length : 0) / itemsPerPage);
    const paginatedPatients = Array.isArray(patients)
        ? patients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : [];

    const handlePatientSelect = (patientId) => {
        setFormData({ ...formData, patient_id: patientId });
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await axios.post(`${API_BASE_URL}/appointments`, formData);
            onSuccess();
        } catch (err) {
            console.error("Failed to create appointment", err);
            alert("Failed to create appointment. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // Get minimum date/time (current date/time)
    const getMinDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-6 h-6" />
                        {step === 1 ? "Select Patient" : "Schedule Appointment"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-center gap-4">
                        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                                1
                            </div>
                            <span className="text-sm font-medium hidden sm:inline">Select Patient</span>
                        </div>
                        <div className="w-12 h-0.5 bg-gray-300"></div>
                        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>
                                2
                            </div>
                            <span className="text-sm font-medium hidden sm:inline">Set Details</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    {step === 1 ? (
                        <>
                            {/* Search */}
                            <div className="mb-6">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search patients by name, phone, or ID..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1); // Reset to first page on search
                                        }}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Patient List */}
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader className="animate-spin h-8 w-8 text-indigo-500" />
                                </div>
                            ) : paginatedPatients.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No patients found. Try a different search.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {paginatedPatients.map((patient) => (
                                            <button
                                                key={patient.id}
                                                onClick={() => handlePatientSelect(patient.id)}
                                                className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <Users className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-gray-800 truncate">
                                                            {patient.first_name} {patient.last_name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">{patient.phone}</p>
                                                        <p className="text-xs text-gray-500">{patient.email}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="mt-6 flex justify-between items-center">
                                            <p className="text-sm text-gray-600">
                                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, patients.length)} of {patients.length}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                    disabled={currentPage === 1}
                                                    className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <span className="px-4 py-2 text-sm">
                                                    {currentPage} / {totalPages}
                                                </span>
                                                <button
                                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Selected Patient Info */}
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                <p className="text-sm text-indigo-700 mb-1">Selected Patient</p>
                                <p className="font-semibold text-gray-800">
                                    {patients.find(p => p.id === formData.patient_id)?.first_name}{" "}
                                    {patients.find(p => p.id === formData.patient_id)?.last_name}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 mt-2"
                                >
                                    Change Patient
                                </button>
                            </div>

                            {/* Doctor Selection (Admin only or doctor scheduling with another doctor) */}
                            {userRole === "admin" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Stethoscope className="inline-block w-4 h-4 mr-1" />
                                        Assign Doctor *
                                    </label>
                                    <select
                                        value={formData.doctor_id}
                                        onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    >
                                        <option value="">Select a doctor...</option>
                                        {doctors.map((doc) => (
                                            <option key={doc.id} value={doc.id}>
                                                Dr. {doc.first_name} {doc.last_name} - {doc.specialization || "General"}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Date & Time */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Clock className="inline-block w-4 h-4 mr-1" />
                                    Appointment Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.appointment_time}
                                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                                    min={getMinDateTime()}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all font-medium"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader className="animate-spin w-4 h-4" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Calendar className="w-4 h-4" />
                                            Schedule Appointment
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
