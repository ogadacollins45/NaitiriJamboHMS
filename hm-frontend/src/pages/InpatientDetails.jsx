import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../layout/DashboardLayout";
import { AuthContext } from "../context/AuthContext";
import {
    ChevronLeft,
    Loader,
    AlertCircle,
    CheckCircle,
    X,
    BedDouble,
    User,
    Clock,
    Stethoscope,
    Activity,
    FileText,
    PlusCircle,
    ClipboardList,
    LogOut,
    CreditCard,
} from "lucide-react";

const WARDS = ["Medical", "Surgical", "Maternity", "Pediatric", "ICU", "HDU", "Other"];

const InpatientDetails = () => {
    const { id } = useParams(); // admission id
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [admission, setAdmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [activeTab, setActiveTab] = useState("summary");

    // Cardex entry form
    const [showEntryForm, setShowEntryForm] = useState(false);
    const [entryForm, setEntryForm] = useState({
        bp: "", pulse: "", temp: "", spo2: "", note: "", recorded_at: ""
    });
    const [savingEntry, setSavingEntry] = useState(false);

    // Discharge form
    const [showDischargeModal, setShowDischargeModal] = useState(false);
    const [dischargeNote, setDischargeNote] = useState("");
    const [discharging, setDischarging] = useState(false);

    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

    const flashMessage = (setter, message) => {
        setter(message);
        setTimeout(() => setter(""), 4000);
    };

    const fetchAdmission = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admissions/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setAdmission(res.data);
        } catch (err) {
            console.error("Error fetching admission:", err);
            setError("Failed to load admission data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmission();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleEntryChange = (e) => {
        const { name, value } = e.target;
        setEntryForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddEntry = async (e) => {
        e.preventDefault();
        setSavingEntry(true);
        try {
            await axios.post(
                `${API_BASE_URL}/admissions/${id}/entries`,
                entryForm,
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            flashMessage(setSuccess, "Entry recorded successfully.");
            setEntryForm({ bp: "", pulse: "", temp: "", spo2: "", note: "", recorded_at: "" });
            setShowEntryForm(false);
            await fetchAdmission();
        } catch (err) {
            flashMessage(setError, err.response?.data?.message || "Failed to save entry.");
        } finally {
            setSavingEntry(false);
        }
    };

    const handleDischarge = async () => {
        setDischarging(true);
        try {
            await axios.post(
                `${API_BASE_URL}/admissions/${id}/discharge`,
                { discharge_note: dischargeNote },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            flashMessage(setSuccess, "Patient discharged successfully.");
            setShowDischargeModal(false);
            await fetchAdmission();
        } catch (err) {
            flashMessage(setError, err.response?.data?.message || "Failed to discharge patient.");
        } finally {
            setDischarging(false);
        }
    };

    const formatDateTime = (dt) => {
        if (!dt) return "—";
        return new Date(dt).toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    const statusBadge = (status) => {
        const map = {
            active: "bg-green-100 text-green-700 border border-green-300",
            discharged: "bg-gray-100 text-gray-600 border border-gray-300",
            transferred: "bg-blue-100 text-blue-700 border border-blue-300",
        };
        return map[status] || "bg-gray-100 text-gray-600";
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-screen">
                    <Loader className="animate-spin h-10 w-10 text-indigo-500" />
                    <p className="ml-3 text-lg text-gray-600">Loading admission...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!admission) {
        return (
            <DashboardLayout>
                <div className="text-center py-20">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                    <p className="mt-4 text-gray-600">{error || "Admission not found."}</p>
                </div>
            </DashboardLayout>
        );
    }

    const patient = admission.patient;
    const doctor = admission.doctor;
    const entries = admission.entries || [];
    const isActive = admission.status === "active";

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 pt-6">
                <div className="w-full">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full">
                        <div className="p-6 sm:p-8">

                            {/* NOTIFICATIONS */}
                            {error && (
                                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg flex items-center shadow-md">
                                    <AlertCircle className="w-6 h-6 mr-3" />
                                    <div><p className="font-bold">Error</p><p>{error}</p></div>
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg flex items-center shadow-md">
                                    <CheckCircle className="w-6 h-6 mr-3" />
                                    <div><p className="font-bold">Success</p><p>{success}</p></div>
                                </div>
                            )}

                            {/* HEADER */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => navigate(`/patients/${patient?.id}`)}
                                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                                    >
                                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <BedDouble className="w-5 h-5 text-indigo-600" />
                                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                                {patient?.first_name} {patient?.last_name}
                                            </h1>
                                        </div>
                                        <p className="text-sm text-gray-500 ml-7">
                                            UPID: {patient?.upid} &bull; {patient?.gender} &bull; Age {patient?.age}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold uppercase ${statusBadge(admission.status)}`}>
                                        {admission.status === "active" ? "🏥 Active Inpatient" : admission.status.replace("_", " ")}
                                    </span>

                                    {/* View Bill Button */}
                                    {admission.bill && (
                                        <button
                                            onClick={() => navigate(`/bills/${admission.bill.id}`)}
                                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-sm"
                                        >
                                            <CreditCard size={15} className="mr-1.5" /> View Bill
                                        </button>
                                    )}

                                    {/* Discharge Button (only if active) */}
                                    {isActive && (user?.role === "admin" || user?.role === "doctor" || user?.role === "reception") && (
                                        <button
                                            onClick={() => setShowDischargeModal(true)}
                                            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm font-medium shadow-sm"
                                        >
                                            <LogOut size={15} className="mr-1.5" /> Discharge
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* TABS */}
                            <div className="flex gap-1 border-b border-gray-200 mb-6">
                                {[
                                    { key: "summary", label: "Admission Summary", icon: <ClipboardList size={14} /> },
                                    { key: "cardex", label: `Cardex / Timeline (${entries.length})`, icon: <Activity size={14} /> },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                                ? "border-indigo-600 text-indigo-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* ========== TAB: SUMMARY ========== */}
                            {activeTab === "summary" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Admission Info */}
                                    <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                                        <h3 className="text-base font-semibold text-indigo-800 mb-4 flex items-center gap-2">
                                            <BedDouble size={16} /> Admission Details
                                        </h3>
                                        <dl className="space-y-2.5 text-sm">
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500">Ward</dt>
                                                <dd className="font-medium text-gray-800">{admission.ward}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500">Bed / Room</dt>
                                                <dd className="font-medium text-gray-800">{admission.bed || "—"}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500">Type</dt>
                                                <dd className="font-medium text-gray-800 capitalize">{admission.admission_type}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500">Payment Type</dt>
                                                <dd className="font-medium text-gray-800 capitalize">{admission.payment_type || "—"}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500">Admitted At</dt>
                                                <dd className="font-medium text-gray-800">{formatDateTime(admission.admitted_at)}</dd>
                                            </div>
                                            {admission.discharged_at && (
                                                <div className="flex justify-between">
                                                    <dt className="text-gray-500">Discharged At</dt>
                                                    <dd className="font-medium text-gray-800">{formatDateTime(admission.discharged_at)}</dd>
                                                </div>
                                            )}
                                        </dl>
                                    </div>

                                    {/* Clinical Info */}
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <Stethoscope size={16} /> Clinical
                                        </h3>
                                        <dl className="space-y-2.5 text-sm">
                                            <div className="flex justify-between">
                                                <dt className="text-gray-500">Admitting Doctor</dt>
                                                <dd className="font-medium text-gray-800">
                                                    {doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : "—"}
                                                </dd>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <dt className="text-gray-500">Reason / Provisional Dx</dt>
                                                <dd className="font-medium text-gray-800 bg-white rounded p-2 border border-gray-200 mt-1">
                                                    {admission.reason || <span className="italic text-gray-400">None recorded</span>}
                                                </dd>
                                            </div>
                                            {admission.discharge_note && (
                                                <div className="flex flex-col gap-1 mt-2">
                                                    <dt className="text-gray-500 font-medium text-orange-700">Discharge Note</dt>
                                                    <dd className="font-medium text-gray-800 bg-orange-50 rounded p-2 border border-orange-200 mt-1">
                                                        {admission.discharge_note}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>
                                    </div>
                                </div>
                            )}

                            {/* ========== TAB: CARDEX ========== */}
                            {activeTab === "cardex" && (
                                <div>
                                    {/* Add Entry Button */}
                                    {isActive && (
                                        <div className="mb-5">
                                            <button
                                                onClick={() => setShowEntryForm((v) => !v)}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-sm"
                                            >
                                                <PlusCircle size={16} />
                                                {showEntryForm ? "Cancel" : "Add Cardex Entry"}
                                            </button>
                                        </div>
                                    )}

                                    {/* Entry Form */}
                                    {showEntryForm && (
                                        <form onSubmit={handleAddEntry} className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
                                            <h4 className="text-sm font-semibold text-indigo-800 mb-4">New Cardex Entry</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Blood Pressure</label>
                                                    <input
                                                        type="text"
                                                        name="bp"
                                                        placeholder="e.g. 120/80"
                                                        value={entryForm.bp}
                                                        onChange={handleEntryChange}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Pulse</label>
                                                    <input
                                                        type="text"
                                                        name="pulse"
                                                        placeholder="e.g. 72 bpm"
                                                        value={entryForm.pulse}
                                                        onChange={handleEntryChange}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Temperature</label>
                                                    <input
                                                        type="text"
                                                        name="temp"
                                                        placeholder="e.g. 36.6°C"
                                                        value={entryForm.temp}
                                                        onChange={handleEntryChange}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">SpO₂</label>
                                                    <input
                                                        type="text"
                                                        name="spo2"
                                                        placeholder="e.g. 98%"
                                                        value={entryForm.spo2}
                                                        onChange={handleEntryChange}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Recorded At (optional)</label>
                                                    <input
                                                        type="datetime-local"
                                                        name="recorded_at"
                                                        value={entryForm.recorded_at}
                                                        onChange={handleEntryChange}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Nursing Note / Observation</label>
                                                <textarea
                                                    name="note"
                                                    rows={3}
                                                    placeholder="Patient observation, nursing notes, condition update..."
                                                    value={entryForm.note}
                                                    onChange={handleEntryChange}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowEntryForm(false)}
                                                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={savingEntry}
                                                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                                                >
                                                    {savingEntry ? "Saving..." : "Save Entry"}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Entries Timeline */}
                                    {entries.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <Activity className="mx-auto h-12 w-12 mb-3 text-gray-300" />
                                            <p className="font-medium">No entries yet.</p>
                                            <p className="text-sm">Add a Cardex entry to start the inpatient timeline.</p>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            {/* Timeline line */}
                                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-indigo-100" />
                                            <div className="space-y-4 pl-10">
                                                {entries.map((entry) => (
                                                    <div key={entry.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 relative">
                                                        {/* Timeline dot */}
                                                        <div className="absolute -left-6 top-4 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow" />

                                                        {/* Header row */}
                                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <Clock size={12} />
                                                                <span className="font-medium text-gray-700">{formatDateTime(entry.recorded_at)}</span>
                                                                {entry.user && (
                                                                    <span className="text-gray-400">
                                                                        &bull; {entry.user.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Vitals */}
                                                        {(entry.bp || entry.pulse || entry.temp || entry.spo2) && (
                                                            <div className="flex flex-wrap gap-3 mb-3">
                                                                {entry.bp && (
                                                                    <div className="bg-red-50 text-red-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-red-100">
                                                                        ❤️ BP: {entry.bp}
                                                                    </div>
                                                                )}
                                                                {entry.pulse && (
                                                                    <div className="bg-pink-50 text-pink-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-pink-100">
                                                                        💓 Pulse: {entry.pulse}
                                                                    </div>
                                                                )}
                                                                {entry.temp && (
                                                                    <div className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-orange-100">
                                                                        🌡️ Temp: {entry.temp}
                                                                    </div>
                                                                )}
                                                                {entry.spo2 && (
                                                                    <div className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-blue-100">
                                                                        🫁 SpO₂: {entry.spo2}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Note */}
                                                        {entry.note && (
                                                            <p className="text-sm text-gray-700 leading-relaxed">{entry.note}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* ========== DISCHARGE MODAL ========== */}
            {showDischargeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <LogOut className="w-5 h-5 text-orange-600" />
                                <h2 className="text-xl font-bold text-gray-800">Discharge Patient</h2>
                            </div>
                            <button onClick={() => setShowDischargeModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-gray-600 mb-4">
                                You are about to discharge <strong>{patient?.first_name} {patient?.last_name}</strong> from
                                the <strong>{admission.ward}</strong> ward. An inpatient bill will be created and sent to billing.
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Summary / Note</label>
                                <textarea
                                    rows={4}
                                    placeholder="Discharge summary, follow-up instructions, final diagnosis..."
                                    value={dischargeNote}
                                    onChange={(e) => setDischargeNote(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none text-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDischargeModal(false)}
                                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDischarge}
                                    disabled={discharging}
                                    className="px-5 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
                                >
                                    {discharging ? "Discharging..." : "Confirm Discharge"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default InpatientDetails;
