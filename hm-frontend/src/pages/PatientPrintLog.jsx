import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Printer, X, ChevronLeft } from "lucide-react";

const PatientPrintLog = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [patient, setPatient] = useState(null);
    const [treatments, setTreatments] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [labRequests, setLabRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [pRes, tRes, presRes, labRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/patients/${id}`),
                    axios.get(`${API_BASE_URL}/patients/${id}/treatments`),
                    axios.get(`${API_BASE_URL}/prescriptions`),
                    axios.get(`${API_BASE_URL}/lab/requests/patient/${id}`),
                ]);

                setPatient(pRes.data);
                setTreatments(
                    tRes.data.sort(
                        (a, b) => new Date(b.created_at) - new Date(a.created_at)
                    )
                );
                setPrescriptions(
                    (presRes.data || [])
                        .filter((p) => p.patient_id === parseInt(id))
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                );
                setLabRequests(labRes.data || []);
            } catch (err) {
                console.error("Error fetching patient data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Filter treatments by date range
    const filteredTreatments = treatments.filter((t) => {
        if (!dateFrom && !dateTo) return true;
        const visitDate = new Date(t.visit_date);
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;
        if (from && visitDate < from) return false;
        if (to && visitDate > to) return false;
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-gray-600">Loading patient data...</p>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-red-600">Patient not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header - Hidden when printing */}
            <div className="bg-white border-b border-gray-200 p-4 print:hidden sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/patients/${id}`)}
                            className="p-2 rounded-full hover:bg-gray-100"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800">
                            Patient Log - {patient.first_name} {patient.last_name}
                        </h1>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Printer size={18} />
                        Print
                    </button>
                </div>
            </div>

            {/* Date Filter - Hidden when printing */}
            <div className="max-w-7xl mx-auto p-4 print:hidden">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Filter by Date Range (Optional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    {(dateFrom || dateTo) && (
                        <button
                            onClick={() => {
                                setDateFrom("");
                                setDateTo("");
                            }}
                            className="mt-3 text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                            <X size={14} />
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* Print Content */}
            <div className="max-w-7xl mx-auto p-4">
                <div className="bg-white p-8 rounded-lg shadow-sm">
                    {/* Patient Header */}
                    <div className="border-b-2 border-gray-300 pb-4 mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Patient Medical Record
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="font-semibold text-gray-600">Name:</span>{" "}
                                <span className="text-gray-800">
                                    {patient.first_name} {patient.last_name}
                                </span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-600">UPID:</span>{" "}
                                <span className="text-gray-800">{patient.upid || "N/A"}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-600">Gender:</span>{" "}
                                <span className="text-gray-800">{patient.gender}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-600">Age:</span>{" "}
                                <span className="text-gray-800">{patient.age || "N/A"}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-600">Phone:</span>{" "}
                                <span className="text-gray-800">{patient.phone}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-600">Email:</span>{" "}
                                <span className="text-gray-800">{patient.email || "N/A"}</span>
                            </div>
                            {patient.national_id && (
                                <div>
                                    <span className="font-semibold text-gray-600">
                                        National ID:
                                    </span>{" "}
                                    <span className="text-gray-800">{patient.national_id}</span>
                                </div>
                            )}
                            {patient.address && (
                                <div className="md:col-span-2">
                                    <span className="font-semibold text-gray-600">Address:</span>{" "}
                                    <span className="text-gray-800">{patient.address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Visit History */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            Visit History
                            {(dateFrom || dateTo) && (
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    ({dateFrom || "Start"} to {dateTo || "End"})
                                </span>
                            )}
                        </h3>

                        {filteredTreatments.length === 0 ? (
                            <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded">
                                No visits found in selected date range
                            </p>
                        ) : (
                            filteredTreatments.map((t, index) => (
                                <div
                                    key={t.id}
                                    className="border border-gray-300 rounded-lg p-4 mb-4 page-break-inside-avoid"
                                >
                                    <div className="flex justify-between items-start mb-3 border-b border-gray-200 pb-2">
                                        <h4 className="font-bold text-gray-800 text-base">
                                            Visit #{filteredTreatments.length - index}
                                        </h4>
                                        <span className="text-sm text-gray-600 font-medium">
                                            {new Date(t.visit_date).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {t.doctor && (
                                        <p className="text-sm mb-2">
                                            <span className="font-semibold text-gray-700">
                                                Doctor:
                                            </span>{" "}
                                            <span className="text-gray-800">
                                                Dr. {t.doctor.first_name} {t.doctor.last_name}
                                            </span>
                                        </p>
                                    )}
                                    {t.diagnosis && (
                                        <p className="text-sm mb-2">
                                            <span className="font-semibold text-gray-700">
                                                Diagnosis:
                                            </span>{" "}
                                            <span className="text-gray-800">{t.diagnosis}</span>
                                        </p>
                                    )}
                                    {t.chief_complaint && (
                                        <p className="text-sm mb-2">
                                            <span className="font-semibold text-gray-700">
                                                Chief Complaint:
                                            </span>{" "}
                                            <span className="text-gray-800">{t.chief_complaint}</span>
                                        </p>
                                    )}
                                    {t.treatment_notes && (
                                        <p className="text-sm mb-2">
                                            <span className="font-semibold text-gray-700">
                                                Treatment Notes:
                                            </span>{" "}
                                            <span className="text-gray-800">{t.treatment_notes}</span>
                                        </p>
                                    )}

                                    {/* Prescriptions */}
                                    {prescriptions
                                        .filter((p) => p.treatment_id === t.id)
                                        .map((p) => (
                                            <div
                                                key={p.id}
                                                className="mt-3 bg-blue-50 p-3 rounded border border-blue-200"
                                            >
                                                <p className="text-sm font-semibold text-blue-900 mb-2">
                                                    Prescription #{p.id}
                                                </p>
                                                {p.items && p.items.length > 0 ? (
                                                    p.items.map((item, idx) => (
                                                        <div key={idx} className="text-xs text-blue-800 ml-3 mb-1">
                                                            • {item.name} - {item.dosage} - {item.frequency}
                                                            {item.duration && ` for ${item.duration}`}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-blue-700">No items</p>
                                                )}
                                            </div>
                                        ))}

                                    {/* Lab Results */}
                                    {labRequests
                                        .filter((lr) => lr.treatment_id === t.id)
                                        .map((lr) => (
                                            <div
                                                key={lr.id}
                                                className="mt-3 bg-purple-50 p-3 rounded border border-purple-200"
                                            >
                                                <p className="text-sm font-semibold text-purple-900 mb-1">
                                                    Lab Request #{lr.request_number}
                                                </p>
                                                <p className="text-xs text-purple-800">
                                                    Status:{" "}
                                                    <span className="font-medium capitalize">
                                                        {lr.status?.replace("_", " ")}
                                                    </span>
                                                </p>
                                                {lr.tests && lr.tests.length > 0 && (
                                                    <div className="mt-2">
                                                        {lr.tests.map((test, idx) => (
                                                            <div key={idx} className="text-xs text-purple-700 ml-3">
                                                                • {test.template?.name || "Test"}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer - Print info */}
                    <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
                        <p>
                            This record was generated on{" "}
                            {new Date().toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
        </div>
    );
};

export default PatientPrintLog;
