import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Printer,
    ChevronLeft,
    Loader,
    AlertCircle,
    Activity,
    Stethoscope,
    ClipboardPlus,
    Pill,
    Microscope,
    MapPin,
    Phone,
    Mail
} from "lucide-react";

const TreatmentPrint = () => {
    const { id, treatmentId } = useParams(); // id is patientId
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [patient, setPatient] = useState(null);
    const [treatment, setTreatment] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [labRequests, setLabRequests] = useState([]);
    const [triage, setTriage] = useState(null);

    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // We fetch patient details and all treatments/prescriptions/labs to filter client side
                // easier than creating new backend endpoints for single treatment view with relations if not existing
                // Ideally we would have GET /treatments/{id} with all relations

                const token = localStorage.getItem('token');
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };

                const [pRes, tRes, presRes, labRes, triagesRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/patients/${id}`, config),
                    axios.get(`${API_BASE_URL}/patients/${id}/treatments`, config),
                    axios.get(`${API_BASE_URL}/prescriptions`, config),
                    axios.get(`${API_BASE_URL}/lab/requests/patient/${id}`, config),
                    axios.get(`${API_BASE_URL}/triages/patient/${id}`, config)
                ]);

                setPatient(pRes.data);

                // Find the specific treatment
                const treatments = tRes.data || [];
                const specificTreatment = treatments.find(t => t.id === parseInt(treatmentId));

                if (specificTreatment) {
                    setTreatment(specificTreatment);

                    // Filter Prescriptions for this treatment
                    setPrescriptions(
                        (presRes.data || []).filter(p => p.treatment_id === parseInt(treatmentId))
                    );

                    // Filter Lab Requests for this treatment
                    setLabRequests(
                        (labRes.data || []).filter(lr => lr.treatment_id === parseInt(treatmentId))
                    );

                    // Find Triage close to treatment time (optional logic, for now maybe just fetch all and let user see context? 
                    // Or simpler: usually triage is done just before.
                    // Let's try to find a triage created same day or within reason.
                    // For now, let's just pick the latest one BEFORE the treatment if possible, or just don't show specific triage unless linked.
                    // The current data model doesn't seem to explicitly link triage to treatment ID in the frontend code I saw, 
                    // but PatientDetails fetches latest triage. 
                    // Let's try to match by date or just leave it out if not strictly linked. 
                    // Actually, let's look for a triage on the same visit_date.

                    const visitDate = specificTreatment.visit_date.split('T')[0];
                    const matchingTriage = (triagesRes.data || []).find(t => t.created_at.startsWith(visitDate));
                    if (matchingTriage) {
                        setTriage(matchingTriage);
                    }
                } else {
                    setError("Treatment not found");
                }

            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, treatmentId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">Loading treatment details...</p>
                </div>
            </div>
        );
    }

    if (error || !treatment || !patient) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center text-red-600">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-lg font-semibold">{error || "Record not found"}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans print:bg-white">
            {/* Navbar / Controls - Hidden on Print */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm sticky top-0 z-20 print:hidden">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            title="Back"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-800">
                            Print Treatment Details
                        </h1>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors shadow-sm font-medium"
                    >
                        <Printer size={18} />
                        Print Record
                    </button>
                </div>
            </div>

            {/* Printable Content */}
            <div className="max-w-4xl mx-auto p-6 md:p-8 print:p-0 print:max-w-none">
                <div className="bg-white shadow-lg rounded-xl overflow-hidden print:shadow-none print:rounded-none">

                    {/* Pro Letterhead */}
                    <div className="p-6 border-b-4 border-blue-900 relative overflow-hidden print:p-4">
                        <div className="flex justify-between items-center relative z-10">
                            <div>
                                <h1 className="text-3xl font-sans font-black text-blue-900 tracking-tight uppercase leading-none mb-1">
                                    Naitiri Jambo HMS
                                </h1>
                                <h2 className="text-xl font-sans font-bold text-gray-600 tracking-wide uppercase">
                                    Healthcare HMIS
                                </h2>
                                <p className="text-xs text-blue-800 mt-2 font-semibold tracking-widest uppercase">Excellence in Care</p>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="flex items-center justify-end gap-2 text-gray-600 text-sm">
                                    <span>Tongaren, Bungoma</span>
                                    <div className="p-1 bg-blue-50 rounded-full"><MapPin size={14} className="text-blue-900" /></div>
                                </div>
                                <div className="flex items-center justify-end gap-2 text-gray-600 text-sm">
                                    <span>+254 792 100336</span>
                                    <div className="p-1 bg-blue-50 rounded-full"><Phone size={14} className="text-blue-900" /></div>
                                </div>
                                <div className="flex items-center justify-end gap-2 text-gray-600 text-sm">
                                    <span>info@naitirijambohms.com</span>
                                    <div className="p-1 bg-blue-50 rounded-full"><Mail size={14} className="text-blue-900" /></div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-50 rounded-full opacity-50 z-0"></div>
                    </div>

                    {/* Document Title Bar */}
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-2 flex justify-between items-center print:bg-gray-100 print:px-4 print:py-1">
                        <h3 className="text-base font-bold text-gray-800 uppercase tracking-wide">Medical Treatment Record</h3>
                        <span className="text-xs font-mono text-gray-500">REF: {treatment.id.toString().padStart(6, '0')}</span>
                    </div>

                    {/* Patient Info Grid */}
                    <div className="p-6 border-b border-gray-200 print:p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patient Name</p>
                                <p className="font-bold text-gray-900 text-sm">{patient.first_name} {patient.last_name}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patient ID (UPID)</p>
                                <p className="font-medium text-gray-800 font-mono text-sm">{patient.upid || "N/A"}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gender / Age</p>
                                <p className="font-medium text-gray-800 text-sm">{patient.gender}, {patient.age || "?"} yrs</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact</p>
                                <p className="font-medium text-gray-800 text-sm">{patient.phone || "N/A"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Treatment Details Body */}
                    <div className="p-6 space-y-4 print:p-4 print:space-y-4">

                        {/* Visit Metadata & Vitals - Compressed */}
                        <div className="border-b border-gray-200 pb-2 mb-2">
                            <div className="flex justify-between items-end mb-1">
                                <div className="text-xs text-gray-500">
                                    <span className="mr-4"><span className="font-bold uppercase tracking-wider text-gray-400">Date:</span> {new Date(treatment.visit_date).toLocaleDateString()}</span>
                                    <span><span className="font-bold uppercase tracking-wider text-gray-400">Time:</span> {new Date(treatment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                    <span className="font-bold uppercase tracking-wider text-gray-400">Physician:</span> {treatment.doctor ? `Dr. ${treatment.doctor.first_name} ${treatment.doctor.last_name}` : (treatment.attending_doctor || "Unknown")}
                                </div>
                            </div>

                            {triage && (
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500 items-center">
                                    <span className="font-bold uppercase tracking-wider text-gray-400"><Activity size={10} className="inline mr-1" /> Vitals:</span>
                                    {triage.blood_pressure_systolic && <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">BP: <strong className="text-gray-700">{triage.blood_pressure_systolic}/{triage.blood_pressure_diastolic}</strong></span>}
                                    {triage.temperature && <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">Temp: <strong className="text-gray-700">{triage.temperature}°C</strong></span>}
                                    {triage.pulse_rate && <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">Pulse: <strong className="text-gray-700">{triage.pulse_rate}</strong></span>}
                                    {triage.respiratory_rate && <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">Resp: <strong className="text-gray-700">{triage.respiratory_rate}</strong></span>}
                                    {triage.weight && <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">Wt: <strong className="text-gray-700">{triage.weight} kg</strong></span>}
                                    {triage.oxygen_saturation && <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">SpO2: <strong className="text-gray-700">{triage.oxygen_saturation}%</strong></span>}
                                </div>
                            )}
                        </div>

                        {/* Clinical Assessment Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Column 1: Notes (Expanded) */}
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-2 flex items-center gap-2 border-b border-gray-200 pb-1">
                                        <Stethoscope size={14} /> Clinical Notes
                                    </h4>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Chief Complaint', value: treatment.chief_complaint },
                                            { label: 'Premedication', value: treatment.premedication },
                                            { label: 'Past Medical History', value: treatment.past_medical_history },
                                            { label: 'Systemic Review', value: treatment.systemic_review },
                                            { label: 'Impression', value: treatment.impression },
                                        ].map((item, idx) => (
                                            <div key={idx} className="block">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                                                <div className={`text-sm ${item.value ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}`}>
                                                    {item.value || "—"}
                                                </div>
                                            </div>
                                        ))}
                                        {treatment.treatment_notes && (
                                            <div className="block pt-1">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Treatment Plan / Notes</p>
                                                <div className="text-sm text-gray-900 font-medium whitespace-pre-wrap leading-relaxed">
                                                    {treatment.treatment_notes}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Diagnosis */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-2 flex items-center gap-2 border-b border-gray-200 pb-1">
                                        <ClipboardPlus size={14} /> Diagnosis
                                    </h4>
                                    <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Primary Diagnosis</p>
                                        <p className="text-base font-bold text-blue-900 leading-tight mb-2">{treatment.diagnosis || "Pending Evaluation"}</p>
                                        {treatment.diagnosis_status && (
                                            <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-blue-100 text-blue-800">
                                                {treatment.diagnosis_status.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Prescriptions Table */}
                        {prescriptions.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 border-b border-gray-200 pb-1">
                                    <Pill size={14} className="text-blue-900" /> Prescribed Medication
                                </h4>
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="text-gray-500 border-b border-gray-300">
                                            <th className="py-1 pr-4 font-semibold uppercase">Drug Name / Item</th>
                                            <th className="py-1 px-4 font-semibold uppercase">Dosage</th>
                                            <th className="py-1 px-4 font-semibold uppercase">Freq.</th>
                                            <th className="py-1 px-4 font-semibold uppercase">Dur.</th>
                                            <th className="py-1 pl-4 text-right font-semibold uppercase">Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {prescriptions.map(pres => (
                                            (pres.items || []).map((item, idx) => (
                                                <tr key={`${pres.id}-${idx}`} className="group">
                                                    <td className="py-2 pr-4 font-bold text-gray-900">{item.name}</td>
                                                    <td className="py-2 px-4 text-gray-700">{item.dosage || "—"}</td>
                                                    <td className="py-2 px-4 text-gray-700">{item.frequency || "—"}</td>
                                                    <td className="py-2 px-4 text-gray-700">{item.duration || "—"}</td>
                                                    <td className="py-2 pl-4 text-right font-mono font-medium text-gray-900">{item.quantity}</td>
                                                </tr>
                                            ))
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Lab Results */}
                        {labRequests.length > 0 && (
                            <div className="mt-4 page-break-inside-avoid">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 border-b border-gray-200 pb-1">
                                    <Microscope size={14} className="text-blue-900" /> Laboratory Orders & Results
                                </h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {labRequests.map(req => (
                                        <div key={req.id} className="border border-gray-200 rounded-lg overflow-hidden flex flex-col md:flex-row print:flex-row print:border-gray-300 text-xs">
                                            <div className="bg-gray-50 p-2 min-w-[120px] border-r border-gray-200 flex flex-col justify-center print:bg-white">
                                                <span className="font-bold text-gray-800">REQ #{req.request_number}</span>
                                                <span className="text-[10px] text-gray-500 mt-0.5">{new Date(req.request_date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="p-2 flex-1 bg-white">
                                                {req.tests && req.tests.map((test, tIdx) => (
                                                    <div key={tIdx} className="mb-1 last:mb-0 border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                                                        <div className="flex justify-between items-start">
                                                            <p className="font-semibold text-gray-900">{test.template?.name || "Test"}</p>
                                                            {!test.result && <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase">Pending</span>}
                                                        </div>
                                                        {test.result && (
                                                            <div className="mt-0.5 bg-blue-50/50 p-1.5 rounded text-xs print:bg-transparent print:p-0">
                                                                <div className="flex gap-2">
                                                                    <span className="font-bold text-blue-900 text-[10px] uppercase w-10 pt-0.5">Result:</span>
                                                                    <span className="font-mono text-gray-800">
                                                                        {typeof test.result.result_value === 'object'
                                                                            ? JSON.stringify(test.result.result_value)
                                                                            : test.result.result_value}
                                                                    </span>
                                                                </div>
                                                                {test.result.remarks && (
                                                                    <div className="flex gap-2 mt-0.5">
                                                                        <span className="font-bold text-gray-400 text-[10px] uppercase w-10">Note:</span>
                                                                        <span className="italic text-gray-600 text-[10px]">{test.result.remarks}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pro Footer */}
                    <div className="p-4 mt-auto border-t-2 border-gray-800 flex flex-col items-center mb-0 print:mb-0">
                        <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest mb-0.5">Confidential Medical Record</p>
                        <div className="text-[9px] text-gray-500 flex gap-4">
                            <span>Generated: {new Date().toLocaleString()}</span>
                            <span>•</span>
                            <span>Naitiri Jambo HMS Healthcare HMIS</span>
                            <span>•</span>
                            <span>Page 1 of 1</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @media print {
          @page { margin: 0.5cm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; font-size: 12px; }
          .page-break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
        </div>
    );
};

export default TreatmentPrint;
