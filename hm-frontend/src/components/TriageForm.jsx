import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    X,
    Activity,
    Thermometer,
    Heart,
    Wind,
    Scale,
    Ruler,
    Droplet,
    FileText,
    Loader,
} from "lucide-react";

const TriageForm = ({ patientId, patient, onClose, onSaved }) => {
    const [loading, setLoading] = useState(false);
    const [existingTriage, setExistingTriage] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [showErrorBanner, setShowErrorBanner] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [formData, setFormData] = useState({
        blood_pressure_systolic: "",
        blood_pressure_diastolic: "",
        temperature: "",
        pulse_rate: "",
        respiratory_rate: "",
        weight: "",
        height: "",
        oxygen_saturation: "",
        notes: "",
    });

    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

    useEffect(() => {
        fetchExistingTriage();
    }, [patientId]);

    const fetchExistingTriage = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_BASE_URL}/triages/${patientId}/latest`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.data) {
                setExistingTriage(res.data.data);
                setFormData({
                    blood_pressure_systolic: res.data.data.blood_pressure_systolic || "",
                    blood_pressure_diastolic: res.data.data.blood_pressure_diastolic || "",
                    temperature: res.data.data.temperature || "",
                    pulse_rate: res.data.data.pulse_rate || "",
                    respiratory_rate: res.data.data.respiratory_rate || "",
                    weight: res.data.data.weight || "",
                    height: res.data.data.height || "",
                    oxygen_saturation: res.data.data.oxygen_saturation || "",
                    notes: res.data.data.notes || "",
                });
            }
        } catch (err) {
            console.log("No existing triage found");
        }
    };

    // Check if patient is 13 years old or above
    const isPatientAbove13 = () => {
        if (!patient) {
            console.log('No patient data provided to TriageForm');
            return false;
        }

        // Check age field first
        if (patient.age !== null && patient.age !== undefined) {
            console.log('Patient age from age field:', patient.age, 'Required:', patient.age >= 13);
            return patient.age >= 13;
        }

        // Calculate from date of birth if available
        if (patient.dob) {
            const birthDate = new Date(patient.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            console.log('Patient age from DOB:', age, 'Required:', age >= 13);
            return age >= 13;
        }

        console.log('No age data available for patient');
        return false;
    };

    // Check if patient is 12 years old or below
    const isPatient12OrBelow = () => {
        if (!patient) {
            return false;
        }

        // Check age field first
        if (patient.age !== null && patient.age !== undefined) {
            console.log('Patient age (child check):', patient.age, 'Is child:', patient.age <= 12);
            return patient.age <= 12;
        }

        // Calculate from date of birth if available
        if (patient.dob) {
            const birthDate = new Date(patient.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            console.log('Patient age from DOB (child check):', age, 'Is child:', age <= 12);
            return age <= 12;
        }

        return false;
    };

    // Validate required fields based on patient age
    const validateForm = () => {
        const errors = {};

        if (isPatientAbove13()) {
            // For patients 13 and above
            if (!formData.blood_pressure_systolic || formData.blood_pressure_systolic === "") {
                errors.blood_pressure_systolic = "Blood pressure (systolic) is required";
            }
            if (!formData.blood_pressure_diastolic || formData.blood_pressure_diastolic === "") {
                errors.blood_pressure_diastolic = "Blood pressure (diastolic) is required";
            }
            if (!formData.temperature || formData.temperature === "") {
                errors.temperature = "Temperature is required";
            }
            if (!formData.pulse_rate || formData.pulse_rate === "") {
                errors.pulse_rate = "Pulse rate is required";
            }
            if (!formData.respiratory_rate || formData.respiratory_rate === "") {
                errors.respiratory_rate = "Respiratory rate is required";
            }
            if (!formData.weight || formData.weight === "") {
                errors.weight = "Weight is required";
            }
        } else if (isPatient12OrBelow()) {
            // For children 12 and below
            if (!formData.temperature || formData.temperature === "") {
                errors.temperature = "Temperature is required";
            }
            if (!formData.pulse_rate || formData.pulse_rate === "") {
                errors.pulse_rate = "Pulse rate is required";
            }
            if (!formData.weight || formData.weight === "") {
                errors.weight = "Weight is required";
            }
        }

        setValidationErrors(errors);

        if (Object.keys(errors).length > 0) {
            // Set error message based on age group
            if (isPatientAbove13()) {
                setErrorMessage('Please fill in all required vital signs for patients 13 years and above.');
            } else if (isPatient12OrBelow()) {
                setErrorMessage('Please fill in temperature, pulse rate, and weight for children 12 years and below.');
            }
            setShowErrorBanner(true);
        } else {
            setShowErrorBanner(false);
            setErrorMessage('');
        }

        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
        // Hide error banner if all errors are cleared
        if (Object.keys(validationErrors).length <= 1) {
            setShowErrorBanner(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form before submission
        if (!validateForm()) {
            // Error banner is already shown by validateForm()
            return;
        }
        setLoading(true);

        try {
            const token = localStorage.getItem("token");

            // Convert empty strings to null for numeric fields
            const payload = {
                patient_id: patientId,
                blood_pressure_systolic: formData.blood_pressure_systolic === "" ? null : Number(formData.blood_pressure_systolic),
                blood_pressure_diastolic: formData.blood_pressure_diastolic === "" ? null : Number(formData.blood_pressure_diastolic),
                temperature: formData.temperature === "" ? null : Number(formData.temperature),
                pulse_rate: formData.pulse_rate === "" ? null : Number(formData.pulse_rate),
                respiratory_rate: formData.respiratory_rate === "" ? null : Number(formData.respiratory_rate),
                weight: formData.weight === "" ? null : Number(formData.weight),
                height: formData.height === "" ? null : Number(formData.height),
                oxygen_saturation: formData.oxygen_saturation === "" ? null : Number(formData.oxygen_saturation),
                notes: formData.notes || null,
            };

            if (existingTriage) {
                // Update existing triage
                await axios.put(`${API_BASE_URL}/triages/${existingTriage.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                // Create new triage
                await axios.post(`${API_BASE_URL}/triages`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            onSaved?.();
            onClose();
        } catch (err) {
            console.error("Error saving triage:", err);
            console.error("Response data:", err.response?.data);

            let errorMessage = "Failed to save triage data. Please try again.";

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.errors) {
                const errors = Object.values(err.response.data.errors).flat();
                errorMessage = errors.join(", ");
            }

            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {existingTriage ? "Update" : "Record"} Vital Signs
                        </h2>
                        <p className="text-blue-100 text-sm">Patient Triage Assessment</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-all"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error Banner */}
                    {showErrorBanner && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-4 flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-red-800 mb-1">Required Fields Missing</h3>
                                <p className="text-sm text-red-700">{errorMessage}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowErrorBanner(false)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Vital Signs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Blood Pressure */}
                        <div className="md:col-span-2 lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Activity className="w-4 h-4 inline mr-2 text-red-500" />
                                Blood Pressure (mmHg)
                                {isPatientAbove13() && <span className="text-red-500 ml-1" title="Required for patients 13 years and above">*</span>}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    name="blood_pressure_systolic"
                                    value={formData.blood_pressure_systolic}
                                    onChange={handleChange}
                                    placeholder="Systolic"
                                    className={`w-1/2 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${validationErrors.blood_pressure_systolic
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-300'
                                        }`}
                                />
                                <span className="flex items-center text-gray-500">/</span>
                                <input
                                    type="number"
                                    name="blood_pressure_diastolic"
                                    value={formData.blood_pressure_diastolic}
                                    onChange={handleChange}
                                    placeholder="Diastolic"
                                    className={`w-1/2 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${validationErrors.blood_pressure_diastolic
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-300'
                                        }`}
                                />
                            </div>
                            {(validationErrors.blood_pressure_systolic || validationErrors.blood_pressure_diastolic) && (
                                <p className="text-red-500 text-xs mt-1">Blood pressure is required</p>
                            )}
                        </div>

                        {/* Temperature */}
                        <InputField
                            icon={<Thermometer className="w-4 h-4 text-orange-500" />}
                            label="Temperature (°C)"
                            name="temperature"
                            type="number"
                            step="0.1"
                            value={formData.temperature}
                            onChange={handleChange}
                            placeholder="e.g., 37.5"
                            required={isPatientAbove13() || isPatient12OrBelow()}
                            error={validationErrors.temperature}
                        />

                        {/* Pulse Rate */}
                        <InputField
                            icon={<Heart className="w-4 h-4 text-pink-500" />}
                            label="Pulse Rate (bpm)"
                            name="pulse_rate"
                            type="number"
                            value={formData.pulse_rate}
                            onChange={handleChange}
                            placeholder="e.g., 72"
                            required={isPatientAbove13() || isPatient12OrBelow()}
                            error={validationErrors.pulse_rate}
                        />

                        {/* Respiratory Rate */}
                        <InputField
                            icon={<Wind className="w-4 h-4 text-blue-500" />}
                            label="Respiratory Rate (breaths/min)"
                            name="respiratory_rate"
                            type="number"
                            value={formData.respiratory_rate}
                            onChange={handleChange}
                            placeholder="e.g., 16"
                            required={isPatientAbove13()}
                            error={validationErrors.respiratory_rate}
                        />

                        {/* Weight */}
                        <InputField
                            icon={<Scale className="w-4 h-4 text-purple-500" />}
                            label="Weight (kg)"
                            name="weight"
                            type="number"
                            step="0.1"
                            value={formData.weight}
                            onChange={handleChange}
                            placeholder="e.g., 70.5"
                            required={isPatientAbove13() || isPatient12OrBelow()}
                            error={validationErrors.weight}
                        />

                        {/* Height */}
                        <InputField
                            icon={<Ruler className="w-4 h-4 text-green-500" />}
                            label="Height (cm)"
                            name="height"
                            type="number"
                            step="0.1"
                            value={formData.height}
                            onChange={handleChange}
                            placeholder="e.g., 175"
                        />

                        {/* Oxygen Saturation */}
                        <InputField
                            icon={<Droplet className="w-4 h-4 text-cyan-500" />}
                            label="SpO2 (%)"
                            name="oxygen_saturation"
                            type="number"
                            value={formData.oxygen_saturation}
                            onChange={handleChange}
                            placeholder="e.g., 98"
                        />
                    </div>



                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Notes (Optional)
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="2"
                            placeholder="Any additional observations..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading && <Loader className="w-4 h-4 animate-spin" />}
                            {loading ? "Saving..." : existingTriage ? "Update Vitals" : "Save Vitals"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Reusable input field component
const InputField = ({ icon, label, required, error, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
            {icon && <span className="inline-block mr-2">{icon}</span>}
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
            {...props}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

export default TriageForm;
