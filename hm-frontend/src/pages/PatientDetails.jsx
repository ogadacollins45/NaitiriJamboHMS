import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../layout/DashboardLayout";
import AddPrescriptionModal from "../components/AddPrescriptionModal";
import AddDiagnosisModal from "../components/AddDiagnosisModal";
import TriageForm from "../components/TriageForm";
import { AuthContext } from "../context/AuthContext";
import { SERVICE_CATEGORIES } from "../data/serviceCategories";
import { TREATMENT_CATEGORIES } from "../data/treatmentCategories";
import {
  CalendarPlus,
  Edit,
  PlusCircle,
  ChevronLeft,
  User,
  Cake,
  Phone,
  Mail,
  MapPin,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  FileText,
  Clock,
  Stethoscope,
  Pill,
  ClipboardPlus,
  Microscope,
  Activity,
  ChevronDown,
  ChevronUp,
  Printer,
  Trash2,
  CreditCard,
  BedDouble,
} from "lucide-react";


const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [searchParams] = new URLSearchParams(window.location.search);

  const [patient, setPatient] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [deletedPrescriptions, setDeletedPrescriptions] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [currentDoctor, setCurrentDoctor] = useState(null); // 👈 Logged-in doctor's profile (if role=doctor)

  const [showForm, setShowForm] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showTriageForm, setShowTriageForm] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingTreatment, setSavingTreatment] = useState(false);
  const [scheduleLater, setScheduleLater] = useState(false);
  const [expandedPrescriptions, setExpandedPrescriptions] = useState({});
  const [expandedTreatments, setExpandedTreatments] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const treatmentsPerPage = 10;
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Print modal states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDateFrom, setPrintDateFrom] = useState("");
  const [printDateTo, setPrintDateTo] = useState("");
  const [mohFieldsExpanded, setMohFieldsExpanded] = useState(false);

  const [newTreatment, setNewTreatment] = useState({
    visit_date: "",
    diagnosis: "",
    treatment_notes: "",
    chief_complaint: "",
    premedication: "",
    past_medical_history: "",
    systemic_review: "",
    impression: "",
    attending_doctor: "",
    doctor_id: "",

    // NEW MOH fields (all optional)
    visit_type: "",
    service_category: "",
    service_subcategory: "",
    treatment_category: "",
    treatment_subcategory: "",
    disposition: "",
    payment_type: "", // Mode of payment
  });

  // Lab request states
  const [sendToLab, setSendToLab] = useState(false);
  const [selectedTests, setSelectedTests] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [labPriority, setLabPriority] = useState('routine');

  // Lab results states
  const [labRequests, setLabRequests] = useState([]);
  const [expandedLabResults, setExpandedLabResults] = useState({});
  const [selectedLabResult, setSelectedLabResult] = useState(null);
  const [activeTab, setActiveTab] = useState('treatments'); // 'treatments', 'lab-results', or 'vitals-history'
  const [latestTriage, setLatestTriage] = useState(null);
  const [allTriages, setAllTriages] = useState([]);

  // Lab test modal states (for adding tests to existing treatment)
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [selectedTreatmentForLab, setSelectedTreatmentForLab] = useState(null);
  const [modalSelectedTests, setModalSelectedTests] = useState([]);
  const [modalLabPriority, setModalLabPriority] = useState('routine');

  // Diagnosis mode state
  const [diagnosisMode, setDiagnosisMode] = useState('primary'); // 'primary' or 'additional'

  // ===== INPATIENT ADMISSION STATE =====
  const [activeAdmission, setActiveAdmission] = useState(null);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [savingAdmission, setSavingAdmission] = useState(false);
  const [admissionForm, setAdmissionForm] = useState({
    ward: "",
    bed: "",
    admission_type: "general",
    payment_type: "",
    reason: "",
    doctor_id: "",
  });
  // ======================================

  const [newAppointment, setNewAppointment] = useState({
    doctor_id: "",
    appointment_time: "",
  });

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Optimized: Single patient call now includes treatments, appointments, prescriptions via eager loading
      const [pRes, dRes, labRes, delPresRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/patients/${id}`), // Now includes treatments, appointments, bills with eager loading
        axios.get(`${API_BASE_URL}/doctors`),
        axios.get(`${API_BASE_URL}/lab/requests/patient/${id}`),
        axios.get(`${API_BASE_URL}/patients/${id}/deleted-prescriptions`),
      ]);

      // Fetch latest triage (optional - may not exist)
      try {
        const triageRes = await axios.get(`${API_BASE_URL}/triages/${id}/latest`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (triageRes.data && triageRes.data.id) {
          setLatestTriage(triageRes.data);
        }
      } catch (err) {
        // No triage data - that's okay
        setLatestTriage(null);
      }

      // Fetch all triages for history
      try {
        const allTriagesRes = await axios.get(`${API_BASE_URL}/triages/patient/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAllTriages(allTriagesRes.data || []);
      } catch (err) {
        setAllTriages([]);
      }

      // Extract data from the optimized patient response
      const patientData = pRes.data;
      setPatient(patientData);

      // Fetch active admission (inpatient check)
      try {
        const admRes = await axios.get(`${API_BASE_URL}/patients/${id}/active-admission`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setActiveAdmission(admRes.data.admission || null);
      } catch {
        setActiveAdmission(null);
      }

      // Treatments are now included in the patient response with eager loading
      setTreatments(
        (patientData.treatments || []).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
      );

      // Appointments are included in patient response
      setAppointments(patientData.appointments || []);

      // Extract prescriptions from treatments (they're already eager-loaded)
      const allPrescriptions = [];
      (patientData.treatments || []).forEach(treatment => {
        if (treatment.prescriptions && treatment.prescriptions.length > 0) {
          allPrescriptions.push(...treatment.prescriptions);
        }
      });

      // If no prescriptions found from eager loading, fetch separately as fallback
      if (allPrescriptions.length === 0) {
        console.log('⚠️ No prescriptions from eager loading, fetching separately...');
        try {
          const presRes = await axios.get(`${API_BASE_URL}/prescriptions`);
          const patientPrescriptions = (presRes.data || [])
            .filter((p) => p.patient_id === parseInt(id));
          console.log('✅ Fallback prescriptions fetched:', patientPrescriptions);
          setPrescriptions(
            patientPrescriptions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          );
        } catch (err) {
          console.error('Error fetching prescriptions:', err);
          setPrescriptions([]);
        }
      } else {
        console.log('✅ Prescriptions from eager loading:', allPrescriptions);
        console.log('First prescription items:', allPrescriptions[0]?.items);
        setPrescriptions(
          allPrescriptions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        );
      }

      setDoctors(dRes.data || []);
      setLabRequests(labRes.data || []);
      setDeletedPrescriptions(delPresRes.data || []);

      // 🔎 Resolve logged-in doctor's profile (if role is doctor)
      if (user?.role === "doctor" && Array.isArray(dRes.data)) {
        const meDoc =
          dRes.data.find(
            (d) =>
              (d.email || "").toLowerCase() ===
              (user.email || "").toLowerCase()
          ) || null;
        setCurrentDoctor(meDoc);
      } else {
        setCurrentDoctor(null);
      }
    } catch (err) {
      console.error("Error fetching patient details:", err);
      setError("Failed to fetch patient data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Check if coming from queue with openTreatment param
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openTreatment') === 'true') {
      setShowForm(true);
      // Set today's date
      setNewTreatment(prev => ({
        ...prev,
        visit_date: new Date().toISOString().split('T')[0]
      }));
      // Remove the query param from URL
      window.history.replaceState({}, '', `/patients/${id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load available lab tests
  useEffect(() => {
    const loadLabTests = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/lab/tests/available`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        // Flatten grouped tests
        const allTests = Object.values(response.data).flat();
        setAvailableTests(allTests);
      } catch (err) {
        console.error('Error loading lab tests:', err);
      }
    };
    loadLabTests();
  }, []);

  const flashMessage = (setter, message) => {
    setter(message);
    setTimeout(() => setter(""), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTreatment((prev) => ({ ...prev, [name]: value }));
  };

  const handleAppointmentChange = (e) => {
    const { name, value } = e.target;
    setNewAppointment((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavingTreatment(true);
    try {
      if (scheduleLater) {
        // 🗓 Appointment
        if (newAppointment.doctor_id && newAppointment.appointment_time) {
          await axios.post(`${API_BASE_URL}/appointments`, {
            patient_id: id,
            doctor_id: newAppointment.doctor_id,
            appointment_time: newAppointment.appointment_time,
          });
          flashMessage(setSuccess, "Appointment scheduled successfully.");
        } else {
          flashMessage(
            setError,
            "Please select a doctor and a date for the appointment."
          );
          return;
        }
      } else {
        // 💊 Treatment
        let payload = {
          visit_date: newTreatment.visit_date,
          diagnosis: newTreatment.diagnosis,
          treatment_notes: newTreatment.treatment_notes,
          chief_complaint: newTreatment.chief_complaint,
          premedication: newTreatment.premedication,
          past_medical_history: newTreatment.past_medical_history,
          systemic_review: newTreatment.systemic_review,
          impression: newTreatment.impression,
          payment_type: newTreatment.payment_type,
        };

        if (user?.role === "admin" || user?.role === "reception") {
          if (!newTreatment.doctor_id) {
            flashMessage(setError, "Please assign a doctor.");
            return;
          }
          payload.doctor_id = newTreatment.doctor_id;
        } else if (user?.role === "doctor") {
          // 👨‍⚕️ Ensure doctor_id is included when a doctor is logged in
          if (currentDoctor?.id) {
            payload.doctor_id = currentDoctor.id;
          }
          // (Backend still auto-resolves by session as a fallback)
        }

        const treatmentResponse = await axios.post(`${API_BASE_URL}/patients/${id}/treatments`, payload);
        const newlyCreatedTreatment = treatmentResponse.data.treatment; // Use treatment from response!

        // Create lab request if sendToLab is checked
        if (sendToLab && selectedTests.length > 0) {
          const labRequestPayload = {
            patient_id: parseInt(id),
            treatment_id: newlyCreatedTreatment.id, // Use the ID from the response
            priority: labPriority,
            clinical_notes: newTreatment.diagnosis,
            test_ids: selectedTests
          };

          // Only include doctor_id for admin/reception roles
          // For doctors, backend will auto-resolve from logged-in user
          if (user?.role === 'admin' || user?.role === 'reception') {
            if (payload.doctor_id) {
              labRequestPayload.doctor_id = parseInt(payload.doctor_id);
            }
          }

          await axios.post(`${API_BASE_URL}/lab/requests`, labRequestPayload, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
        }

        flashMessage(setSuccess, "New treatment record saved." + (sendToLab ? " Lab request created." : ""));
      }

      await fetchAllData();
      setShowForm(false);
      setNewTreatment({
        visit_date: "",
        diagnosis: "",
        treatment_notes: "",
        chief_complaint: "",
        premedication: "",
        past_medical_history: "",
        systemic_review: "",
        impression: "",
        attending_doctor: "",
        doctor_id: "",

        // Reset MOH fields
        visit_type: "",
        service_category: "",
        service_subcategory: "",
        treatment_category: "",
        treatment_subcategory: "",
        disposition: "",
        payment_type: "", // Reset payment type
      });
      setNewAppointment({ doctor_id: "", appointment_time: "" });
      setScheduleLater(false);
    } catch (err) {
      console.error("Error saving record:", err);

      // Extract detailed error message from backend response
      let errorMessage = "Error saving record. Please check your input.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        // If there are validation errors, show them
        const errors = Object.values(err.response.data.errors).flat();
        errorMessage = errors.join(', ');
      } else if (err.message) {
        errorMessage = err.message;
      }

      flashMessage(setError, errorMessage);
    } finally {
      setSavingTreatment(false);
    }
  };

  const completeAppointment = async (appt) => {
    try {
      await axios.post(`${API_BASE_URL}/patients/${id}/treatments`, {
        visit_date: new Date(appt.appointment_time).toISOString().slice(0, 10),
        diagnosis: "",
        treatment_notes: `Created from appointment on ${new Date(
          appt.appointment_time
        ).toLocaleString()}`,
        doctor_id: appt.doctor_id,
      });
      await axios.put(`${API_BASE_URL}/appointments/${appt.id}`, {
        status: "completed",
      });
      await fetchAllData();
      flashMessage(
        setSuccess,
        "Appointment marked as complete and treatment record created."
      );
    } catch {
      flashMessage(setError, "Error completing appointment.");
    }
  };

  const openPrescriptionModal = (t) => {
    setSelectedTreatment(t);
    setShowPrescriptionModal(true);
  };


  const getPrescriptionSummary = (treatmentId) => {
    const related = prescriptions.filter((p) => p.treatment_id === treatmentId);
    if (!related.length) return null;

    return (
      <div className="mt-4 space-y-3">
        <h4 className="font-semibold text-gray-700">Prescriptions</h4>
        {related.map((p) => (
          <div
            key={p.id}
            className="bg-gray-50 border border-gray-200 rounded-lg p-3"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <p className="font-medium text-indigo-700">
                  Prescription #{p.id}
                </p>
                {!!p.is_manual_dispensation && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Manual Dispensation
                  </span>
                )}
              </div>
              <span className="text-xs bg-indigo-100 px-2 py-0.5 rounded-full text-indigo-700">
                {p.items?.length || 0} items
              </span>
              {p.pharmacy_status !== 'dispensed' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePrescription(p.id);
                  }}
                  className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded-full"
                  title="Delete Prescription"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            {expandedPrescriptions[p.id] ? (
              <div className="space-y-3 text-sm">
                {p.items && p.items.length > 0 ? (
                  p.items.map((item, idx) => {
                    // Determine dispensing status based on mapping and pharmacy_status
                    const hasMapping = item.mapped_drug_id != null;
                    const isDispensed = p.pharmacy_status === 'dispensed';
                    const dispensedQty = item.mapped_quantity || item.quantity;

                    // Three states:
                    // 1. Not mapped (not in stock) - amber theme
                    // 2. Mapped but not dispensed yet - blue theme
                    // 3. Mapped and dispensed - purple/green theme

                    let statusBadge, colorTheme;

                    if (!hasMapping) {
                      // State 1: Not in stock
                      statusBadge = {
                        text: '⚠ Not in Stock',
                        class: 'bg-amber-600 text-white'
                      };
                      colorTheme = {
                        border: 'border-amber-400',
                        bg: 'bg-amber-50',
                        text: 'text-amber-900',
                        divider: 'border-amber-200'
                      };
                    } else if (!isDispensed) {
                      // State 2: Mapped but awaiting dispensing
                      statusBadge = {
                        text: '⏳ Not Dispensed Yet',
                        class: 'bg-blue-100 text-blue-800'
                      };
                      colorTheme = {
                        border: 'border-blue-400',
                        bg: 'bg-blue-50',
                        text: 'text-blue-900',
                        divider: 'border-blue-200'
                      };
                    } else {
                      // State 3: Dispensed
                      statusBadge = {
                        text: '✓ Dispensed',
                        class: 'bg-green-100 text-green-800'
                      };
                      colorTheme = {
                        border: 'border-purple-400',
                        bg: 'bg-purple-50',
                        text: 'text-purple-900',
                        divider: 'border-purple-200'
                      };
                    }

                    return (
                      <div
                        key={idx}
                        className={`border-l-4 p-3 rounded ${colorTheme.border} ${colorTheme.bg}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className={`font-semibold ${colorTheme.text}`}>
                            {item.name}
                          </p>
                          {/* Status Badge */}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.class}`}>
                            {statusBadge.text}
                          </span>
                        </div>

                        {/* Notification for non-stock items */}
                        {!hasMapping && (
                          <div className="mb-3 p-2 bg-amber-100 border border-amber-300 rounded text-xs">
                            <p className="text-amber-800 font-medium flex items-start">
                              <span className="mr-1.5">ℹ️</span>
                              <span>
                                <strong>Prescribed but not in stock.</strong> This medication was recommended by the doctor but was not available in our pharmacy inventory.
                              </span>
                            </p>
                          </div>
                        )}

                        {/* Notification for pending dispensing */}
                        {hasMapping && !isDispensed && (
                          <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded text-xs">
                            <p className="text-blue-800 font-medium flex items-start">
                              <span className="mr-1.5">ℹ️</span>
                              <span>
                                <strong>Awaiting pharmacy processing.</strong> This medication is mapped and ready to be dispensed by the pharmacy.
                              </span>
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {item.dosage && (
                            <div>
                              <span className="font-medium text-gray-600">Dosage:</span>
                              <p className="text-gray-800">{item.dosage}</p>
                            </div>
                          )}
                          {item.frequency && (
                            <div>
                              <span className="font-medium text-gray-600">Frequency:</span>
                              <p className="text-gray-800">{item.frequency}</p>
                            </div>
                          )}
                          {item.duration && (
                            <div>
                              <span className="font-medium text-gray-600">Duration:</span>
                              <p className="text-gray-800">{item.duration}</p>
                            </div>
                          )}
                          {/* Show quantity for dispensed items */}
                          {isDispensed && hasMapping && dispensedQty && (
                            <div>
                              <span className="font-medium text-gray-600">Quantity Dispensed:</span>
                              <p className="text-gray-800">{dispensedQty}</p>
                            </div>
                          )}
                        </div>
                        {item.instructions && (
                          <div className={`mt-2 pt-2 border-t ${colorTheme.divider}`}>
                            <span className="font-medium text-gray-600 text-xs">Instructions:</span>
                            <p className="text-gray-700 text-xs italic">{item.instructions}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-xs">No items</p>
                )}
                <button
                  onClick={() =>
                    setExpandedPrescriptions((prev) => ({
                      ...prev,
                      [p.id]: !prev[p.id],
                    }))
                  }
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Show less ▲
                </button>
              </div>
            ) : (
              <button
                onClick={() =>
                  setExpandedPrescriptions((prev) => ({
                    ...prev,
                    [p.id]: !prev[p.id],
                  }))
                }
                className="text-xs text-indigo-600 hover:underline"
              >
                View details ▼
              </button>
            )}
          </div>
        ))
        }
      </div >
    );
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (!window.confirm("Are you sure you want to delete this prescription? This action cannot be undone.")) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/prescriptions/${prescriptionId}`);
      flashMessage(setSuccess, "Prescription deleted successfully.");
      fetchAllData();
    } catch (err) {
      console.error("Error deleting prescription:", err);
      flashMessage(setError, err.response?.data?.message || "Failed to delete prescription.");
    }
  };

  // Open lab test modal for a specific treatment
  const openLabTestModal = (treatment) => {
    setSelectedTreatmentForLab(treatment);
    setModalSelectedTests([]);
    setModalLabPriority('routine');
    setShowLabTestModal(true);
  };

  // Open diagnosis modal
  const openDiagnosisModal = (treatment, mode = 'primary') => {
    setSelectedTreatment(treatment);
    setDiagnosisMode(mode);
    setShowDiagnosisModal(true);
  };

  // Delete additional diagnosis
  const handleDeleteDiagnosis = async (diagnosisId) => {
    if (!window.confirm('Are you sure you want to delete this diagnosis?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/diagnoses/${diagnosisId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      flashMessage(setSuccess, 'Diagnosis deleted successfully');
      await fetchAllData();
    } catch (err) {
      console.error('Error deleting diagnosis:', err);
      flashMessage(setError, 'Failed to delete diagnosis. Please try again.');
    }
  };

  // Handle submitting lab tests for an existing treatment
  const handleAddLabTestToTreatment = async (e) => {
    e.preventDefault();

    if (modalSelectedTests.length === 0) {
      flashMessage(setError, "Please select at least one test.");
      return;
    }

    try {
      const labRequestPayload = {
        patient_id: parseInt(id),
        treatment_id: selectedTreatmentForLab.id,
        priority: modalLabPriority,
        clinical_notes: selectedTreatmentForLab.diagnosis || '',
        test_ids: modalSelectedTests
      };

      // Include doctor_id for admin/reception roles
      if (user?.role === 'admin' || user?.role === 'reception') {
        if (selectedTreatmentForLab.doctor_id) {
          labRequestPayload.doctor_id = parseInt(selectedTreatmentForLab.doctor_id);
        }
      }

      await axios.post(`${API_BASE_URL}/lab/requests`, labRequestPayload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      flashMessage(setSuccess, "Lab tests added successfully!");
      await fetchAllData();
      setShowLabTestModal(false);
      setModalSelectedTests([]);
      setModalLabPriority('routine');
      setSelectedTreatmentForLab(null);
    } catch (err) {
      console.error("Error adding lab tests:", err);
      flashMessage(setError, err.response?.data?.message || "Failed to add lab tests. Please try again.");
    }
  };


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader className="animate-spin h-10 w-10 text-indigo-500" />
          <p className="ml-3 text-lg text-gray-600">Loading patient data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 pt-6">
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full">
            <div className="p-6 sm:p-8">
              {/* Notifications */}
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

              {/* Patient Name and Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-300"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                  </button>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {patient.first_name} {patient.last_name}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate(`/patients/${id}/edit`)}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-sm"
                  >
                    <Edit size={16} className="mr-2" /> Edit Patient
                  </button>
                  <button
                    onClick={() => navigate(`/patients/${id}/print-log`)}
                    className="flex items-center px-4 py-2 bg-blue-600 border border-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-sm"
                  >
                    <Printer size={16} className="mr-2" /> Print Patient Log
                  </button>
                  {(user?.role === "admin" || user?.role === "reception" || user?.role === "doctor") && (
                    <>
                      <button
                        onClick={() => setShowTriageForm(true)}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-all duration-300 shadow-md"
                      >
                        <Activity size={16} className="mr-2" /> Record Vitals
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await axios.post(`${API_BASE_URL}/queue`, {
                              patient_id: id,
                            });
                            flashMessage(setSuccess, "Patient added to queue");
                          } catch (err) {
                            if (err.response?.status === 422) {
                              flashMessage(setError, "Patient is already in queue");
                            } else {
                              flashMessage(setError, "Failed to add patient to queue");
                            }
                          }
                        }}
                        className="flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md"
                      >
                        <ClipboardPlus size={16} className="mr-2" /> Add to Queue
                      </button>

                      {/* ==== INPATIENT ADMIT BUTTON ==== */}
                      {activeAdmission ? (
                        <button
                          onClick={() => navigate(`/inpatient/${activeAdmission.id}`)}
                          className="flex items-center px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-all duration-300 shadow-md"
                        >
                          <BedDouble size={16} className="mr-2" /> View Inpatient
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowAdmissionModal(true)}
                          className="flex items-center px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-all duration-300 shadow-md"
                        >
                          <BedDouble size={16} className="mr-2" /> Admit
                        </button>
                      )}
                      {/* =============================== */}
                    </>
                  )}
                  <button
                    onClick={() => {
                      if (!showForm) {
                        // Auto-fill today's date when opening form
                        setNewTreatment(prev => ({
                          ...prev,
                          visit_date: new Date().toISOString().split('T')[0]
                        }));
                      }
                      setShowForm(!showForm);
                    }}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md"
                  >
                    {showForm ? (
                      <X size={16} className="mr-2" />
                    ) : (
                      <PlusCircle size={16} className="mr-2" />
                    )}
                    {showForm ? "Cancel" : (() => {
                      // Check if patient has treatment today
                      const today = new Date().toISOString().split('T')[0];
                      const hasTreatmentToday = treatments.some(t =>
                        new Date(t.visit_date).toISOString().split('T')[0] === today
                      );
                      return hasTreatmentToday ? "Add Revisit" : "New Treatment";
                    })()}
                  </button>
                </div>
              </div>

              {/* ===================================== */}
              {/* FORM SECTION (Treatment / Appointment) */}
              {/* ===================================== */}
              {showForm && (
                <div className="bg-gray-50 p-6 rounded-xl shadow-inner mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    {scheduleLater
                      ? "Schedule New Appointment"
                      : "Add New Treatment Record"}
                  </h3>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Treatment section */}
                    {!scheduleLater && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                          icon={<CalendarPlus className="w-5 h-5 text-gray-400" />}
                          type="date"
                          name="visit_date"
                          value={newTreatment.visit_date}
                          onChange={handleChange}
                          required
                        />

                        {/* Role-based doctor logic */}
                        {user?.role === "doctor" ? (
                          <InputField
                            icon={<User className="w-5 h-5 text-gray-400" />}
                            name="attending_doctor"
                            value={
                              currentDoctor
                                ? `Dr. ${currentDoctor.first_name} ${currentDoctor.last_name}`
                                : `Dr. ${user.name || user.email}`
                            }
                            readOnly
                            placeholder="Attending Doctor"
                          />
                        ) : (
                          <SelectField
                            icon={<Stethoscope className="w-5 h-5 text-gray-400" />}
                            name="doctor_id"
                            value={newTreatment.doctor_id}
                            onChange={handleChange}
                            options={[
                              { value: "", label: "Assign Doctor" },
                              ...doctors.map((doc) => ({
                                value: doc.id,
                                label: `Dr. ${doc.first_name} ${doc.last_name} (${doc.specialization || "General"})`,
                              })),
                            ]}
                            required
                            label="Assign Doctor"
                          />
                        )}

                        {/* Mode of Payment */}
                        <SelectField
                          icon={<CreditCard className="w-5 h-5 text-gray-400" />}
                          name="payment_type"
                          value={newTreatment.payment_type}
                          onChange={handleChange}
                          options={[
                            { value: "", label: "Select Payment Type" },
                            { value: "Cash", label: "Cash" },
                            { value: "Mobile Money", label: "Mobile Money (Mpesa/Airtel Money)" },
                            { value: "Bank Transfer", label: "Bank Transfer" },
                            { value: "Insurance", label: "Insurance" },
                            { value: "Other", label: "Other" },
                          ]}
                          label="Payment Type"
                          required
                        />

                        <div className="md:col-span-2 space-y-4">
                          {/* Notes from Reception */}
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <label className="block text-xs font-semibold text-blue-900 mb-1">
                              Notes from Reception
                              {latestTriage?.created_at && (
                                <span className="ml-2 text-blue-600 font-normal">
                                  ({new Date(latestTriage.created_at).toLocaleDateString()})
                                </span>
                              )}
                            </label>
                            <p className="text-sm text-blue-800">
                              {latestTriage?.notes || "N/A"}
                            </p>
                          </div>

                          {/* MOH FIELDS - Optional for reporting */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200" style={{ display: 'none' }}>
                            <button
                              type="button"
                              onClick={() => setMohFieldsExpanded(!mohFieldsExpanded)}
                              className="w-full flex items-center justify-between text-left hover:bg-green-100 hover:bg-opacity-50 rounded-lg p-2 -m-2 transition-colors"
                            >
                              <h4 className="text-sm font-semibold text-gray-800 flex items-center">
                                <FileText className="w-4 h-4 mr-2 text-green-600" />
                                MOH Reporting Fields
                                <span className="ml-2 text-xs font-normal text-gray-500">(Optional - for MOH 705)</span>
                              </h4>
                              {mohFieldsExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                              )}
                            </button>

                            {mohFieldsExpanded && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                {/* Visit Type */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Visit Type <span className="text-green-600">(Recommended)</span>
                                  </label>
                                  <select
                                    name="visit_type"
                                    value={newTreatment.visit_type}
                                    onChange={handleChange}
                                    className="w-full p-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                  >
                                    <option value="">-- Not Specified --</option>
                                    <option value="new">New Visit (First time for this condition)</option>
                                    <option value="revisit">Revisit (Follow-up)</option>
                                  </select>
                                </div>

                                {/* Service Category */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Service Type</label>
                                  <select
                                    name="service_category"
                                    value={newTreatment.service_category}
                                    onChange={(e) => setNewTreatment({
                                      ...newTreatment,
                                      service_category: e.target.value,
                                      service_subcategory: ""
                                    })}
                                    className="w-full p-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                  >
                                    <option value="">-- Not Specified --</option>
                                    {Object.keys(SERVICE_CATEGORIES).map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Service Subcategory */}
                                {newTreatment.service_category && (
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Specific Service</label>
                                    <select
                                      name="service_subcategory"
                                      value={newTreatment.service_subcategory}
                                      onChange={handleChange}
                                      className="w-full p-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    >
                                      <option value="">-- Not Specified --</option>
                                      {SERVICE_CATEGORIES[newTreatment.service_category].map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                {/* Treatment Category */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Treatment Given</label>
                                  <select
                                    name="treatment_category"
                                    value={newTreatment.treatment_category}
                                    onChange={(e) => setNewTreatment({
                                      ...newTreatment,
                                      treatment_category: e.target.value,
                                      treatment_subcategory: ""
                                    })}
                                    className="w-full p-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                  >
                                    <option value="">-- Not Specified --</option>
                                    {Object.keys(TREATMENT_CATEGORIES).map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Treatment Subcategory */}
                                {newTreatment.treatment_category && (
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Treatment Type</label>
                                    <select
                                      name="treatment_subcategory"
                                      value={newTreatment.treatment_subcategory}
                                      onChange={handleChange}
                                      className="w-full p-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    >
                                      <option value="">-- Not Specified --</option>
                                      {TREATMENT_CATEGORIES[newTreatment.treatment_category].map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                {/* Disposition */}
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">How did this visit end?</label>
                                  <select
                                    name="disposition"
                                    value={newTreatment.disposition}
                                    onChange={handleChange}
                                    className="w-full p-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                  >
                                    <option value="">-- Not Specified --</option>
                                    <option value="treated_sent_home">Treated & Sent Home</option>
                                    <option value="admitted">Admitted</option>
                                    <option value="referred_out">Referred Out</option>
                                    <option value="transferred">Transferred</option>
                                    <option value="pending">Pending</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Chief Complaint <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              name="chief_complaint"
                              placeholder="Patient's primary reason for visit"
                              rows="2"
                              value={newTreatment.chief_complaint}
                              onChange={handleChange}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Premedication <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              name="premedication"
                              placeholder="Current medications and dosages"
                              rows="2"
                              value={newTreatment.premedication}
                              onChange={handleChange}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Past Medical History <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              name="past_medical_history"
                              placeholder="Relevant past medical conditions, surgeries, hospitalizations"
                              rows="2"
                              value={newTreatment.past_medical_history}
                              onChange={handleChange}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Systemic Review <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              name="systemic_review"
                              placeholder="Review of systems - cardiovascular, respiratory, gastrointestinal, etc."
                              rows="2"
                              value={newTreatment.systemic_review}
                              onChange={handleChange}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Impression <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              name="impression"
                              placeholder="Clinical impression and assessment"
                              rows="2"
                              value={newTreatment.impression}
                              onChange={handleChange}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </div>
                        </div>

                        {/* Note: Diagnosis is now added after treatment creation via the Add Diagnosis modal */}
                      </div>
                    )}

                    {/* Appointment section */}
                    <div className="pt-4 border-t border-gray-200">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={scheduleLater}
                          onChange={(e) => setScheduleLater(e.target.checked)}
                          className="form-checkbox h-4 w-4 text-indigo-600"
                        />
                        <span>Schedule appointment for later instead</span>
                      </label>
                      {scheduleLater && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <SelectField
                            icon={<Stethoscope className="w-5 h-5 text-gray-400" />}
                            name="doctor_id"
                            value={newAppointment.doctor_id}
                            onChange={handleAppointmentChange}
                            options={[
                              { value: "", label: "Select Doctor" },
                              ...doctors.map((doc) => ({
                                value: doc.id,
                                label: `Dr. ${doc.first_name} ${doc.last_name}`,
                              })),
                            ]}
                            label="Select Doctor"
                            required
                          />
                          <InputField
                            icon={<Clock className="w-5 h-5 text-gray-400" />}
                            type="datetime-local"
                            name="appointment_time"
                            value={newAppointment.appointment_time}
                            onChange={handleAppointmentChange}
                            required
                          />
                        </div>
                      )}
                    </div>

                    {/* Lab Request section */}
                    {!scheduleLater && (
                      <div className="pt-4 border-t border-gray-200">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sendToLab}
                            onChange={(e) => setSendToLab(e.target.checked)}
                            className="form-checkbox h-4 w-4 text-indigo-600"
                          />
                          <Microscope className="w-4 h-4" />
                          <span>Send to Laboratory</span>
                        </label>
                        {sendToLab && (
                          <div className="grid grid-cols-1 gap-4 mt-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                Select Tests
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
                                {availableTests.map((test) => (
                                  <label
                                    key={test.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedTests.includes(test.id)
                                      ? 'border-indigo-500 bg-indigo-50'
                                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                                      }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedTests.includes(test.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedTests([...selectedTests, test.id]);
                                        } else {
                                          setSelectedTests(selectedTests.filter(id => id !== test.id));
                                        }
                                      }}
                                      className="mt-0.5 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 text-sm">{test.name}</p>
                                      {test.category?.name && (
                                        <p className="text-xs text-gray-500 mt-0.5">{test.category.name}</p>
                                      )}
                                    </div>
                                  </label>
                                ))}
                              </div>
                              {selectedTests.length > 0 && (
                                <p className="text-xs text-indigo-600 mt-2 font-medium">
                                  {selectedTests.length} test{selectedTests.length > 1 ? 's' : ''} selected
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Priority
                              </label>
                              <select
                                value={labPriority}
                                onChange={(e) => setLabPriority(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="routine">Routine</option>
                                <option value="urgent">Urgent</option>
                                <option value="stat">STAT</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingTreatment}
                        className="flex items-center justify-center px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md disabled:bg-indigo-400 disabled:cursor-not-allowed"
                      >
                        {savingTreatment ? (
                          <>
                            <Loader className="animate-spin h-4 w-4 mr-2" />
                            Saving...
                          </>
                        ) : (
                          scheduleLater ? "Schedule Appointment" : "Save Treatment"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Patient Info */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                  <Info
                    icon={<User className="w-5 h-5 text-gray-400" />}
                    label="Gender"
                    value={patient.gender}
                  />
                  <Info
                    icon={<Cake className="w-5 h-5 text-gray-400" />}
                    label="Date of Birth"
                    value={patient.dob}
                  />
                  <Info
                    icon={<User className="w-5 h-5 text-gray-400" />}
                    label="Age"
                    value={(() => {
                      const birthDate = new Date(patient.dob);
                      const today = new Date();
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const monthDiff = today.getMonth() - birthDate.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }
                      return `${age} years`;
                    })()}
                  />
                  <Info
                    icon={<Phone className="w-5 h-5 text-gray-400" />}
                    label="Phone"
                    value={patient.phone}
                  />
                  <Info
                    icon={<Mail className="w-5 h-5 text-gray-400" />}
                    label="Email"
                    value={patient.email || "—"}
                  />
                  <Info
                    icon={<MapPin className="w-5 h-5 text-gray-400" />}
                    label="Address"
                    value={patient.address || "—"}
                  />
                  <Info
                    icon={<Clock className="w-5 h-5 text-gray-400" />}
                    label="Registered On"
                    value={new Date(patient.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  />
                </div>
              </div>

              {/* Latest Vital Signs (Triage) */}
              {latestTriage && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-md p-6 mb-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-600" />
                      Latest Vital Signs
                    </h3>
                    <p className="text-sm text-gray-500">
                      Recorded {new Date(latestTriage.created_at).toLocaleDateString()} by {latestTriage.recorder ? `${latestTriage.recorder.first_name} ${latestTriage.recorder.last_name} (${latestTriage.recorder.role})` : 'Staff'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                    {latestTriage.blood_pressure_systolic && latestTriage.blood_pressure_diastolic && (
                      <VitalSign
                        label="Blood Pressure"
                        value={`${latestTriage.blood_pressure_systolic}/${latestTriage.blood_pressure_diastolic} mmHg`}
                        className="text-red-700"
                      />
                    )}
                    {latestTriage.temperature && (
                      <VitalSign
                        label="Temperature"
                        value={`${latestTriage.temperature}°C`}
                        className="text-orange-700"
                      />
                    )}
                    {latestTriage.pulse_rate && (
                      <VitalSign
                        label="Pulse Rate"
                        value={`${latestTriage.pulse_rate} bpm`}
                        className="text-pink-700"
                      />
                    )}
                    {latestTriage.respiratory_rate && (
                      <VitalSign
                        label="Respiratory Rate"
                        value={`${latestTriage.respiratory_rate}/min`}
                        className="text-blue-700"
                      />
                    )}
                    {latestTriage.weight && (
                      <VitalSign
                        label="Weight"
                        value={`${latestTriage.weight} kg`}
                        className="text-purple-700"
                      />
                    )}
                    {latestTriage.height && (
                      <VitalSign
                        label="Height"
                        value={`${latestTriage.height} cm`}
                        className="text-green-700"
                      />
                    )}
                    {latestTriage.oxygen_saturation && (
                      <VitalSign
                        label="SpO2"
                        value={`${latestTriage.oxygen_saturation}%`}
                        className="text-cyan-700"
                      />
                    )}
                  </div>
                  {latestTriage.chief_complaint && (
                    <div className="mt-4 p-3 bg-white rounded-lg">
                      <p className="text-sm font-semibold text-gray-700">Chief Complaint:</p>
                      <p className="text-sm text-gray-600">{latestTriage.chief_complaint}</p>
                    </div>
                  )}
                  {latestTriage.notes && (
                    <div className="mt-2 p-3 bg-white rounded-lg">
                      <p className="text-sm font-semibold text-gray-700">Notes:</p>
                      <p className="text-sm text-gray-600">{latestTriage.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Treatments & Lab Results Tabs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area with Tabs */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Tab Buttons */}
                  <div className="flex gap-2 border-b">
                    <button
                      onClick={() => setActiveTab('treatments')}
                      className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'treatments'
                        ? 'text-indigo-700 border-b-2 border-indigo-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      Treatment History ({treatments.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('lab-results')}
                      className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'lab-results'
                        ? 'text-indigo-700 border-b-2 border-indigo-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      Lab Results ({labRequests.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('vitals-history')}
                      className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'vitals-history'
                        ? 'text-indigo-700 border-b-2 border-indigo-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      Vitals History ({allTriages.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('deleted-prescriptions')}
                      className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'deleted-prescriptions'
                        ? 'text-red-700 border-b-2 border-red-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      Deleted Prescriptions ({deletedPrescriptions.length})
                    </button>
                  </div>

                  {/* Treatment History Tab Content */}
                  {activeTab === 'treatments' && (
                    <>
                      {treatments.length > 0 ? (
                        <>
                          {/* Pagination Info */}
                          <div className="mb-4 flex justify-between items-center">
                            <p className="text-sm text-gray-600">
                              Showing {((currentPage - 1) * treatmentsPerPage) + 1} -{" "}
                              {Math.min(currentPage * treatmentsPerPage, treatments.length)} of {treatments.length} treatments
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded transition-colors"
                              >
                                Previous
                              </button>
                              <span className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded font-medium">
                                Page {currentPage} of {Math.ceil(treatments.length / treatmentsPerPage)}
                              </span>
                              <button
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(treatments.length / treatmentsPerPage), p + 1))}
                                disabled={currentPage >= Math.ceil(treatments.length / treatmentsPerPage)}
                                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded transition-colors"
                              >
                                Next
                              </button>
                            </div>
                          </div>

                          {/* Treatment Cards */}
                          {treatments
                            .slice((currentPage - 1) * treatmentsPerPage, currentPage * treatmentsPerPage)
                            .map((t) => {
                              // Get lab requests for this treatment
                              const treatmentLabRequests = labRequests.filter(lr => lr.treatment_id === t.id);

                              return (
                                <div
                                  key={t.id}
                                  className={`border-2 bg-white rounded-lg p-4 shadow-sm mb-3 transition-all ${t.diagnosis_status === 'confirmed'
                                    ? 'border-green-300 bg-green-50/30'
                                    : 'border-yellow-300 bg-yellow-50/30'
                                    }`}
                                >
                                  {/* Collapsed Header - Always Visible */}
                                  <button
                                    onClick={() => setExpandedTreatments(prev => ({
                                      ...prev,
                                      [t.id]: !prev[t.id]
                                    }))}
                                    className="w-full text-left"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                          <p className="font-bold text-indigo-700 text-lg">
                                            {new Date(t.visit_date).toLocaleDateString()}
                                          </p>
                                          {t.treatment_type === 'revisit' && (
                                            <span className="px-2 py-1 text-xs font-semibold text-orange-700 bg-orange-100 border border-orange-300 rounded-full">
                                              REVISIT
                                            </span>
                                          )}
                                          <span className="text-xs text-gray-500">
                                            Added: {new Date(t.created_at).toLocaleString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-700">
                                          <strong>Doctor:</strong>{" "}
                                          {t.doctor
                                            ? `Dr. ${t.doctor.first_name} ${t.doctor.last_name}`
                                            : t.attending_doctor || "N/A"}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {/* Diagnosis Status Badge */}
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${t.diagnosis_status === 'confirmed'
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-yellow-100 text-yellow-700'
                                          }`}>
                                          {t.diagnosis_status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                                        </span>
                                        {/* Treatment Status Badge */}
                                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                          {t.status || "Active"}
                                        </span>
                                        {/* Expand Icon */}
                                        <span className="text-indigo-600 font-bold text-lg">
                                          {expandedTreatments[t.id] ? '▲' : '▼'}
                                        </span>
                                      </div>
                                    </div>
                                  </button>

                                  {/* Expanded Content */}
                                  {expandedTreatments[t.id] && (
                                    <div className="mt-4 pt-4 border-t-2 border-gray-200 space-y-4">

                                      {/* Treatment Notes Section */}
                                      <div>
                                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                                          <FileText size={14} />
                                          Treatment Notes
                                        </h4>
                                        <div className="space-y-2">
                                          {/* Chief Complaint */}
                                          <div className="bg-gray-50 p-2 rounded border-l-2 border-indigo-500">
                                            <p className="text-xs font-semibold text-gray-700 mb-0.5">Chief Complaint</p>
                                            <p className={`text-xs ${t.chief_complaint ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                                              {t.chief_complaint || 'Not recorded'}
                                            </p>
                                          </div>

                                          {/* Premedication */}
                                          <div className="bg-gray-50 p-2 rounded border-l-2 border-indigo-500">
                                            <p className="text-xs font-semibold text-gray-700 mb-0.5">Premedication</p>
                                            <p className={`text-xs ${t.premedication ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                                              {t.premedication || 'Not recorded'}
                                            </p>
                                          </div>

                                          {/* Past Medical History */}
                                          <div className="bg-gray-50 p-2 rounded border-l-2 border-indigo-500">
                                            <p className="text-xs font-semibold text-gray-700 mb-0.5">Past Medical History</p>
                                            <p className={`text-xs ${t.past_medical_history ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                                              {t.past_medical_history || 'Not recorded'}
                                            </p>
                                          </div>

                                          {/* Systemic Review */}
                                          <div className="bg-gray-50 p-2 rounded border-l-2 border-indigo-500">
                                            <p className="text-xs font-semibold text-gray-700 mb-0.5">Systemic Review</p>
                                            <p className={`text-xs ${t.systemic_review ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                                              {t.systemic_review || 'Not recorded'}
                                            </p>
                                          </div>

                                          {/* Impression */}
                                          <div className="bg-gray-50 p-2 rounded border-l-2 border-indigo-500">
                                            <p className="text-xs font-semibold text-gray-700 mb-0.5">Impression</p>
                                            <p className={`text-xs ${t.impression ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                                              {t.impression || 'Not recorded'}
                                            </p>
                                          </div>

                                          {/* Payment Type */}
                                          <div className="bg-green-50 p-2 rounded border-l-2 border-green-500">
                                            <p className="text-xs font-semibold text-gray-700 mb-0.5">Mode of Payment</p>
                                            <p className={`text-xs ${t.payment_type ? 'text-gray-800 font-medium' : 'text-gray-400 italic'}`}>
                                              {t.payment_type || 'Not recorded'}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Lab Requests for this Treatment */}
                                      {treatmentLabRequests.length > 0 && (
                                        <div>
                                          <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                              <Microscope size={16} />
                                              Lab Requests ({treatmentLabRequests.length})
                                            </h4>
                                            <button
                                              onClick={async () => {
                                                setLoading(true);
                                                await fetchAllData();
                                                setLoading(false);
                                              }}
                                              className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors"
                                              disabled={loading}
                                            >
                                              {loading ? (
                                                <>
                                                  <Loader className="w-3 h-3 animate-spin" />
                                                  Refreshing...
                                                </>
                                              ) : (
                                                <>
                                                  <Activity className="w-3 h-3" />
                                                  Refresh Status
                                                </>
                                              )}
                                            </button>
                                          </div>
                                          <div className="space-y-3">
                                            {treatmentLabRequests.map((labRequest) => (
                                              <div
                                                key={labRequest.id}
                                                className="border border-gray-200 bg-white rounded-lg p-3 shadow-sm"
                                              >
                                                <div className="flex justify-between items-start mb-2">
                                                  <div>
                                                    <p className="font-semibold text-sm text-indigo-700">
                                                      Request #{labRequest.request_number}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                      {new Date(labRequest.request_date).toLocaleDateString()}
                                                    </p>
                                                  </div>
                                                  <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${labRequest.status === 'completed'
                                                      ? 'bg-green-100 text-green-700'
                                                      : labRequest.status === 'processing'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                      }`}>
                                                      {labRequest.status}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded ${labRequest.priority === 'stat'
                                                      ? 'bg-red-100 text-red-700'
                                                      : labRequest.priority === 'urgent'
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                      }`}>
                                                      {labRequest.priority}
                                                    </span>
                                                  </div>
                                                </div>

                                                {labRequest.clinical_notes && (
                                                  <p className="text-xs text-gray-600 mb-2">
                                                    <strong>Clinical Notes:</strong> {labRequest.clinical_notes}
                                                  </p>
                                                )}

                                                <div className="space-y-2">
                                                  <p className="text-xs font-medium text-gray-700">Tests:</p>
                                                  {labRequest.tests?.map((test) => (
                                                    <div
                                                      key={test.id}
                                                      className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs"
                                                    >
                                                      <div>
                                                        <p className="font-medium">{test.template?.name || 'Unknown Test'}</p>
                                                        {test.template?.category && (
                                                          <p className="text-gray-500">{test.template.category.name}</p>
                                                        )}
                                                      </div>
                                                      {test.result ? (
                                                        <button
                                                          onClick={() => setSelectedLabResult(test.result)}
                                                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                                                        >
                                                          View Results
                                                        </button>
                                                      ) : (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                                          Pending
                                                        </span>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}


                                      {/* Diagnosis Section */}
                                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border-2 border-indigo-300 shadow-sm">
                                        <h4 className="font-semibold text-indigo-900 mb-2 text-sm flex items-center gap-2">
                                          <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                                          Diagnosis
                                        </h4>

                                        {/* Primary Diagnosis */}
                                        <p className="text-sm mb-2">
                                          <span className={t.diagnosis ? "text-indigo-900 font-medium" : "text-gray-400 italic"}>
                                            {t.diagnosis || "Not yet diagnosed"}
                                          </span>
                                        </p>

                                        {/* Category & Subcategory Badges */}
                                        {t.diagnosis_category && (
                                          <div className="flex gap-2 flex-wrap mb-3">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white shadow-sm">
                                              {t.diagnosis_category}
                                            </span>
                                            {t.diagnosis_subcategory && (
                                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-600 text-white shadow-sm">
                                                {t.diagnosis_subcategory}
                                              </span>
                                            )}
                                          </div>
                                        )}

                                        {/* Additional Diagnoses */}
                                        {t.diagnoses && t.diagnoses.length > 0 && (
                                          <div className="mt-3 pt-3 border-t border-indigo-200">
                                            <p className="text-xs font-semibold text-indigo-700 mb-2">Additional Diagnoses:</p>
                                            <div className="space-y-2">
                                              {t.diagnoses.map((d, idx) => (
                                                <div key={d.id} className="flex items-start justify-between bg-white p-2 rounded border border-indigo-200">
                                                  <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-800">
                                                      {idx + 2}. {d.diagnosis}
                                                    </p>
                                                    <div className="flex gap-2 mt-1">
                                                      <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                                                        {d.diagnosis_category}
                                                      </span>
                                                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                                        {d.diagnosis_subcategory}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <button
                                                    onClick={() => handleDeleteDiagnosis(d.id)}
                                                    className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                                                    title="Delete diagnosis"
                                                  >
                                                    <X size={16} />
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Prescriptions */}
                                      {getPrescriptionSummary(t.id)}

                                      {/* Action Buttons */}
                                      <div className="flex gap-2 pt-3 border-t border-gray-200">
                                        {t.diagnosis_status === 'pending' ? (
                                          <button
                                            onClick={() => openDiagnosisModal(t, 'primary')}
                                            className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors shadow-sm font-medium"
                                          >
                                            <FileText size={14} className="mr-2" /> Add Diagnosis
                                          </button>
                                        ) : (
                                          <>
                                            <button
                                              onClick={() => openDiagnosisModal(t, 'additional')}
                                              className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors shadow-sm font-medium"
                                            >
                                              <FileText size={14} className="mr-2" /> Add Another Diagnosis
                                            </button>
                                            <button
                                              onClick={() => openPrescriptionModal(t)}
                                              className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors shadow-sm font-medium"
                                            >
                                              <Pill size={14} className="mr-2" /> Add Prescription
                                            </button>
                                          </>
                                        )}

                                        <button
                                          onClick={() => openLabTestModal(t)}
                                          className="flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded text-sm transition-colors shadow-sm font-medium"
                                        >
                                          <Microscope size={14} className="mr-2" /> Add Lab Test
                                        </button>
                                        <button
                                          onClick={() => navigate(`/patients/${id}/treatments/${t.id}/print`)}
                                          className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors shadow-sm font-medium ml-auto"
                                        >
                                          <Printer size={14} className="mr-2" /> Print Details
                                        </button>
                                      </div>
                                    </div>
                                  )
                                  }
                                </div>
                              );
                            })}
                        </>
                      ) : (
                        <p className="text-gray-500">No treatment history found.</p>
                      )}
                    </>
                  )}

                  {/* Lab Results Tab Content */}
                  {activeTab === 'lab-results' && (
                    <>
                      {labRequests.length > 0 ? (
                        labRequests.map((labRequest) => (
                          <div
                            key={labRequest.id}
                            className="border border-gray-200 bg-white rounded-lg p-4 shadow-sm"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-semibold text-indigo-700">
                                  Request #{labRequest.request_number}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Requested: {new Date(labRequest.request_date).toLocaleDateString()}
                                </p>
                                {labRequest.treatment && (
                                  <p className="text-xs text-gray-500">
                                    Treatment: {new Date(labRequest.treatment.visit_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${labRequest.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : labRequest.status === 'processing'
                                      ? 'bg-blue-100 text-blue-700'
                                      : labRequest.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                  {labRequest.status}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${labRequest.priority === 'stat'
                                    ? 'bg-red-100 text-red-700'
                                    : labRequest.priority === 'urgent'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                  {labRequest.priority}
                                </span>
                              </div>
                            </div>

                            {labRequest.clinical_notes && (
                              <p className="text-sm text-gray-600 mb-3">
                                <strong>Clinical Notes:</strong> {labRequest.clinical_notes}
                              </p>
                            )}

                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">Tests:</p>
                              {labRequest.tests?.map((test) => (
                                <div
                                  key={test.id}
                                  className="flex justify-between items-center bg-gray-50 p-2 rounded"
                                >
                                  <div>
                                    <p className="text-sm font-medium">
                                      {test.template?.name || 'Unknown Test'}
                                    </p>
                                    {test.template?.category && (
                                      <p className="text-xs text-gray-500">
                                        {test.template.category.name}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {test.result ? (
                                      <>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                          Results Available
                                        </span>
                                        <button
                                          onClick={() => setSelectedLabResult(test.result)}
                                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
                                        >
                                          View Results
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No lab requests found.</p>
                      )}
                    </>
                  )}

                  {/* Vitals History Tab Content */}
                  {activeTab === 'vitals-history' && (
                    <>
                      {allTriages.length > 0 ? (
                        allTriages.map((triage) => (
                          <div
                            key={triage.id}
                            className="border border-gray-200 bg-white rounded-lg p-4 shadow-sm"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-semibold text-purple-700">
                                  {new Date(triage.created_at).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Recorded by: {triage.recorder ? `${triage.recorder.first_name} ${triage.recorder.last_name} (${triage.recorder.role})` : 'Staff'}
                                </p>
                              </div>
                            </div>

                            {/* Vital Signs Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                              {triage.blood_pressure_systolic && triage.blood_pressure_diastolic && (
                                <div className="bg-red-50 p-2 rounded">
                                  <p className="text-xs text-gray-600">Blood Pressure</p>
                                  <p className="font-semibold text-red-700">
                                    {triage.blood_pressure_systolic}/{triage.blood_pressure_diastolic} mmHg
                                  </p>
                                </div>
                              )}
                              {triage.temperature && (
                                <div className="bg-orange-50 p-2 rounded">
                                  <p className="text-xs text-gray-600">Temperature</p>
                                  <p className="font-semibold text-orange-700">{triage.temperature}°C</p>
                                </div>
                              )}
                              {triage.pulse_rate && (
                                <div className="bg-pink-50 p-2 rounded">
                                  <p className="text-xs text-gray-600">Pulse Rate</p>
                                  <p className="font-semibold text-pink-700">{triage.pulse_rate} bpm</p>
                                </div>
                              )}
                              {triage.respiratory_rate && (
                                <div className="bg-blue-50 p-2 rounded">
                                  <p className="text-xs text-gray-600">Respiratory Rate</p>
                                  <p className="font-semibold text-blue-700">{triage.respiratory_rate}/min</p>
                                </div>
                              )}
                              {triage.weight && (
                                <div className="bg-purple-50 p-2 rounded">
                                  <p className="text-xs text-gray-600">Weight</p>
                                  <p className="font-semibold text-purple-700">{triage.weight} kg</p>
                                </div>
                              )}
                              {triage.height && (
                                <div className="bg-green-50 p-2 rounded">
                                  <p className="text-xs text-gray-600">Height</p>
                                  <p className="font-semibold text-green-700">{triage.height} cm</p>
                                </div>
                              )}
                              {triage.oxygen_saturation && (
                                <div className="bg-cyan-50 p-2 rounded">
                                  <p className="text-xs text-gray-600">SpO2</p>
                                  <p className="font-semibold text-cyan-700">{triage.oxygen_saturation}%</p>
                                </div>
                              )}
                            </div>

                            {/* Chief Complaint and Notes */}
                            {triage.chief_complaint && (
                              <div className="mt-3 p-2 bg-gray-50 rounded">
                                <p className="text-xs font-semibold text-gray-700">Chief Complaint:</p>
                                <p className="text-sm text-gray-600">{triage.chief_complaint}</p>
                              </div>
                            )}
                            {triage.notes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded">
                                <p className="text-xs font-semibold text-gray-700">Notes:</p>
                                <p className="text-sm text-gray-600">{triage.notes}</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500">No vitals history found.</p>
                      )}
                    </>
                  )}

                  {/* Deleted Prescriptions Tab Content */}
                  {activeTab === 'deleted-prescriptions' && (
                    <div className="space-y-4">
                      {deletedPrescriptions.length > 0 ? (
                        deletedPrescriptions.map((dp) => (
                          <div key={dp.id} className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm relative">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-red-900">
                                  Prescription #{dp.id} (Deleted)
                                </p>
                                <p className="text-sm text-red-700">
                                  Deleted on: {new Date(dp.deleted_at).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Originally prescribed: {new Date(dp.created_at).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Doctor: {dp.doctor_name}
                                </p>
                              </div>
                            </div>

                            <div className="mt-2 space-y-2">
                              <p className="text-xs font-semibold text-red-800">Prescribed Items:</p>
                              {dp.items && dp.items.length > 0 ? (
                                dp.items.map((item, idx) => (
                                  <div key={idx} className="bg-white p-2 rounded border border-red-100 text-xs">
                                    <p className="font-medium text-gray-800">{item.name}</p>
                                    <p className="text-gray-600">
                                      Qty: {item.quantity} {item.dosage ? `- ${item.dosage}` : ''}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-gray-500 italic">No items recorded</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                          <Trash2 className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                          <p className="text-gray-500">No deleted prescriptions found.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Appointments */}
                <div className="lg:col-span-1">
                  <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
                    Scheduled Appointments
                  </h2>
                  {appointments.length > 0 ? (
                    <ul className="space-y-3">
                      {appointments.map((a) => (
                        <li
                          key={a.id}
                          className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                        >
                          <p className="text-sm">
                            <strong>Doctor:</strong>{" "}
                            {a.doctor
                              ? `Dr. ${a.doctor.first_name} ${a.doctor.last_name}`
                              : "N/A"}
                          </p>
                          <p className="text-sm">
                            <strong>Date:</strong>{" "}
                            {new Date(a.appointment_time).toLocaleString()}
                          </p>
                          <p className="text-sm">
                            <strong>Status:</strong>{" "}
                            <span
                              className={`${a.status === "completed"
                                ? "text-green-600"
                                : a.status === "cancelled"
                                  ? "text-red-600"
                                  : "text-blue-600"
                                }`}
                            >
                              {a.status}
                            </span>
                          </p>
                          {a.status !== "completed" && (
                            <button
                              onClick={() => completeAppointment(a)}
                              className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded"
                            >
                              Complete Appointment
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No appointments scheduled.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {showPrescriptionModal && selectedTreatment && (
          <AddPrescriptionModal
            patientId={id}
            treatmentId={selectedTreatment.id}
            doctorId={
              doctors.find(
                (d) =>
                  `Dr. ${d.first_name} ${d.last_name}` ===
                  selectedTreatment.attending_doctor
              )?.id || null
            }
            onClose={() => setShowPrescriptionModal(false)}
            onSaved={fetchAllData}
          />
        )}

        {/* Lab Result Detail Modal */}
        {selectedLabResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">
                  Laboratory Test Results
                </h3>
                <button
                  onClick={() => setSelectedLabResult(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                {/* Test Information */}
                <div className="mb-6">
                  <h4 className="font-semibold text-lg text-gray-800 mb-3">
                    {selectedLabResult.template?.name || (
                      <span className="text-gray-500 italic">Test No Longer Available</span>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Status:</p>
                      <p className="font-medium">{selectedLabResult.status}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Performed Date:</p>
                      <p className="font-medium">
                        {selectedLabResult.performed_at
                          ? new Date(selectedLabResult.performed_at).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                    {selectedLabResult.verified_at && (
                      <div>
                        <p className="text-gray-600">Verified Date:</p>
                        <p className="font-medium">
                          {new Date(selectedLabResult.verified_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Test Parameters */}
                {selectedLabResult.parameters && selectedLabResult.parameters.length > 0 && (
                  <div className="mb-6">
                    <h5 className="font-semibold text-gray-800 mb-3">Test Parameters</h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Parameter
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Value
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Reference Range
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedLabResult.parameters.map((param, idx) => (
                            <tr
                              key={idx}
                              className={param.is_abnormal ? 'bg-red-50' : ''}
                            >
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                {param.parameter?.name || 'Unknown'}
                                {param.parameter?.result_type === 'binary' && (
                                  <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                    Pos/Neg
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {param.value} {param.parameter?.result_type === 'range' ? (param.parameter?.unit || '') : ''}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {param.parameter?.result_type === 'binary'
                                  ? 'N/A'
                                  : (param.parameter?.reference_range || 'N/A')}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {param.parameter?.result_type === 'binary' ? (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                    -
                                  </span>
                                ) : param.is_abnormal ? (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                    Abnormal
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                    Normal
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Overall Comments */}
                {selectedLabResult.overall_comment && (
                  <div className="mb-6">
                    <h5 className="font-semibold text-gray-800 mb-2">Overall Comments</h5>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {selectedLabResult.overall_comment}
                    </p>
                  </div>
                )}

                {/* Add Note Section */}
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h5 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    Add Note to Treatment
                  </h5>
                  <p className="text-xs text-yellow-700 mb-3">
                    Notes will be added to the treatment record for diagnosis reference
                  </p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const note = formData.get('lab_note');

                    if (!note.trim()) {
                      flashMessage(setError, 'Please enter a note');
                      return;
                    }

                    try {
                      // Find the treatment associated with this lab result
                      const labRequest = labRequests.find(lr =>
                        lr.tests?.some(t => t.result?.id === selectedLabResult.id)
                      );

                      if (!labRequest?.treatment_id) {
                        flashMessage(setError, 'Cannot find associated treatment');
                        return;
                      }

                      const treatment = treatments.find(t => t.id === labRequest.treatment_id);

                      if (!treatment) {
                        flashMessage(setError, 'Treatment not found');
                        return;
                      }

                      // Append note to existing treatment notes
                      const timestamp = new Date().toLocaleString();
                      const newNote = `\n\n[Lab Note - ${timestamp}]\n${note}`;
                      const updatedNotes = (treatment.treatment_notes || '') + newNote;

                      await axios.put(`${API_BASE_URL}/treatments/${treatment.id}`, {
                        treatment_notes: updatedNotes,
                      }, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                      });

                      flashMessage(setSuccess, 'Note added to treatment record');
                      e.target.reset();
                      await fetchAllData();
                    } catch (error) {
                      flashMessage(setError, 'Failed to add note');
                    }
                  }}>
                    <textarea
                      name="lab_note"
                      rows="3"
                      className="w-full p-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                      placeholder="Add observation or note based on these results..."
                    />
                    <button
                      type="submit"
                      className="mt-2 px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm flex items-center gap-2"
                    >
                      <FileText size={14} />
                      Add to Treatment Notes
                    </button>
                  </form>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setSelectedLabResult(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lab Test Modal - Add tests to existing treatment */}
        {showLabTestModal && selectedTreatmentForLab && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Add Lab Tests to Treatment
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Treatment from {new Date(selectedTreatmentForLab.visit_date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowLabTestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddLabTestToTreatment} className="p-6">
                {/* Test Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Tests <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
                    {availableTests.map((test) => (
                      <label
                        key={test.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${modalSelectedTests.includes(test.id)
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={modalSelectedTests.includes(test.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setModalSelectedTests([...modalSelectedTests, test.id]);
                            } else {
                              setModalSelectedTests(modalSelectedTests.filter(id => id !== test.id));
                            }
                          }}
                          className="mt-0.5 h-5 w-5 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{test.name}</p>
                          {test.category?.name && (
                            <p className="text-xs text-gray-500 mt-0.5">{test.category.name}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  {modalSelectedTests.length > 0 && (
                    <p className="text-xs text-teal-600 mt-2 font-medium">
                      {modalSelectedTests.length} test{modalSelectedTests.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Priority Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={modalLabPriority}
                    onChange={(e) => setModalLabPriority(e.target.value)}
                    className="w-full md:w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowLabTestModal(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                  >
                    <Microscope size={16} />
                    Add Tests
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}



        {/* Add Diagnosis Modal */}
        {showDiagnosisModal && selectedTreatment && (
          <AddDiagnosisModal
            treatment={{ ...selectedTreatment, patient }}
            mode={diagnosisMode}
            onClose={() => setShowDiagnosisModal(false)}
            onSaved={async () => {
              await fetchAllData();
              flashMessage(setSuccess, 'Diagnosis added successfully!');
            }}
          />
        )}

        {/* Triage Form Modal */}
        {showTriageForm && (
          <TriageForm
            patientId={id}
            patient={patient}
            onClose={() => setShowTriageForm(false)}
            onSaved={() => {
              fetchAllData(); // Refresh all data including triages
              flashMessage(setSuccess, "Vital signs recorded successfully");
              setShowTriageForm(false);
            }}
          />
        )}

        {/* ===== ADMISSION MODAL ===== */}
        {showAdmissionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-teal-600" />
                  <h2 className="text-xl font-bold text-gray-800">Admit Patient</h2>
                </div>
                <button
                  onClick={() => setShowAdmissionModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSavingAdmission(true);
                  try {
                    const payload = {
                      patient_id: id,
                      ward: admissionForm.ward,
                      bed: admissionForm.bed,
                      admission_type: admissionForm.admission_type,
                      payment_type: admissionForm.payment_type,
                      reason: admissionForm.reason,
                      doctor_id: admissionForm.doctor_id || undefined,
                    };
                    const res = await axios.post(`${API_BASE_URL}/admissions`, payload, {
                      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                    });
                    const newAdmission = res.data.admission;
                    setShowAdmissionModal(false);
                    setAdmissionForm({ ward: "", bed: "", admission_type: "general", payment_type: "", reason: "", doctor_id: "" });
                    // Navigate to inpatient page immediately
                    navigate(`/inpatient/${newAdmission.id}`);
                  } catch (err) {
                    flashMessage(setError, err.response?.data?.message || "Failed to admit patient.");
                  } finally {
                    setSavingAdmission(false);
                  }
                }}
                className="p-5 space-y-4"
              >
                {/* Ward */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ward <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={admissionForm.ward}
                      onChange={(e) => setAdmissionForm(prev => ({ ...prev, ward: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm"
                    >
                      <option value="">Select ward...</option>
                      {["Medical", "Surgical", "Maternity", "Pediatric", "ICU", "HDU", "Other"].map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bed / Room</label>
                    <input
                      type="text"
                      placeholder="e.g. Bed 3, Room 5B"
                      value={admissionForm.bed}
                      onChange={(e) => setAdmissionForm(prev => ({ ...prev, bed: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm"
                    />
                  </div>
                </div>

                {/* Admission Type & Payment */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admission Type <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={admissionForm.admission_type}
                      onChange={(e) => setAdmissionForm(prev => ({ ...prev, admission_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm"
                    >
                      <option value="general">General Inpatient</option>
                      <option value="maternity">Maternity</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                    <select
                      value={admissionForm.payment_type}
                      onChange={(e) => setAdmissionForm(prev => ({ ...prev, payment_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm"
                    >
                      <option value="">Select...</option>
                      <option value="cash">Cash</option>
                      <option value="nhif">NHIF</option>
                      <option value="insurance">Insurance</option>
                      <option value="corporate">Corporate</option>
                      <option value="waiver">Waiver</option>
                    </select>
                  </div>
                </div>

                {/* Doctor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admitting / Attending Doctor</label>
                  <select
                    value={admissionForm.doctor_id}
                    onChange={(e) => setAdmissionForm(prev => ({ ...prev, doctor_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm"
                  >
                    <option value="">Select doctor...</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name}</option>
                    ))}
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Provisional Diagnosis</label>
                  <textarea
                    rows={3}
                    placeholder="Chief complaint or provisional diagnosis..."
                    value={admissionForm.reason}
                    onChange={(e) => setAdmissionForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-sm resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdmissionModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAdmission}
                    className="px-5 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium"
                  >
                    {savingAdmission ? "Admitting..." : "Admit Patient"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* ========================= */}

      </div>
    </DashboardLayout >
  );
};

/* Utility Components */
const Info = ({ icon, label, value }) => (
  <div className="flex items-start">
    <div className="flex-shrink-0 mr-3 mt-1">{icon}</div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{label}</p>
      <p className="text-gray-800 font-semibold">{value}</p>
    </div>
  </div>
);

const InputField = ({
  icon,
  name,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  readOnly = false,
}) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      {icon}
    </div>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      className={`w-full pl-10 p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 ${readOnly ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
      placeholder={placeholder || label}
      required={required}
    />
  </div>
);

const SelectField = ({
  icon,
  name,
  label,
  value,
  onChange,
  options,
  required = false,
}) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      {icon}
    </div>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full pl-10 p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 appearance-none"
      required={required}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
      <svg
        className="fill-current h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
      >
        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
      </svg>
    </div>
  </div>
);

const VitalSign = ({ label, value, className }) => (
  <div className="bg-white p-3 rounded-lg shadow-sm">
    <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
    <p className={`text-base font-bold ${className}`}>{value}</p>
  </div>
);

export default PatientDetails;
