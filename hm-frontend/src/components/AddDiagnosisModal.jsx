import React, { useState } from "react";
import axios from "axios";
import { X, FileText, Loader, AlertCircle, CheckCircle } from "lucide-react";
import { DIAGNOSIS_CATEGORIES } from "../data/diagnosisCategories";

const AddDiagnosisModal = ({ treatment, mode = 'primary', onClose, onSaved }) => {
    const [diagnosis, setDiagnosis] = useState(treatment.diagnosis || "");
    const [diagnosisCategory, setDiagnosisCategory] = useState(
        treatment.diagnosis_category || ""
    );
    const [diagnosisSubcategory, setDiagnosisSubcategory] = useState(
        treatment.diagnosis_subcategory || ""
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState();

    const flashMessage = (setter, message) => {
        setter(message);
        setTimeout(() => setter(""), 3000);
    };

    const handleSubmit = async () => {
        if (!diagnosis.trim()) {
            flashMessage(setError, "Please enter a diagnosis");
            return;
        }

        if (!diagnosisCategory) {
            flashMessage(setError, "Please select a diagnosis category");
            return;
        }

        if (!diagnosisSubcategory) {
            flashMessage(setError, "Please select a diagnosis subcategory");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

            if (mode === 'additional') {
                // Create new diagnosis record
                await axios.post(`${API_BASE_URL}/treatments/${treatment.id}/diagnoses`, {
                    diagnosis: diagnosis.trim(),
                    diagnosis_category: diagnosisCategory,
                    diagnosis_subcategory: diagnosisSubcategory,
                }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
            } else {
                // Update primary diagnosis in treatment
                await axios.put(`${API_BASE_URL}/treatments/${treatment.id}`, {
                    diagnosis: diagnosis.trim(),
                    diagnosis_category: diagnosisCategory,
                    diagnosis_subcategory: diagnosisSubcategory,
                });
            }

            flashMessage(setSuccess, "Diagnosis added successfully!");
            setTimeout(() => {
                onSaved();
                onClose();
            }, 1500);
        } catch (err) {
            console.error("Error adding diagnosis:", err);
            flashMessage(
                setError,
                err.response?.data?.message || "Failed to add diagnosis"
            );
        } finally {
            setLoading(false);
        }
    };

    const availableSubcategories = diagnosisCategory
        ? DIAGNOSIS_CATEGORIES[diagnosisCategory] || []
        : [];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 flex justify-between items-center rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <FileText size={24} />
                        <h2 className="text-2xl font-bold">Add Diagnosis</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                            <CheckCircle size={20} />
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Treatment Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">
                            <strong>Patient:</strong> {treatment.patient ? `${treatment.patient.first_name} ${treatment.patient.last_name}` : "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Visit Date:</strong>{" "}
                            {new Date(treatment.visit_date).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Diagnosis Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Diagnosis <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            placeholder="Enter diagnosis (e.g., Hypertension, Type 2 Diabetes)"
                            rows="3"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    {/* Category Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Diagnosis Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={diagnosisCategory}
                            onChange={(e) => {
                                setDiagnosisCategory(e.target.value);
                                setDiagnosisSubcategory(""); // Reset subcategory when category changes
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">-- Select Category --</option>
                            {Object.keys(DIAGNOSIS_CATEGORIES).map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subcategory Dropdown (shows only after category selected) */}
                    {diagnosisCategory && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Diagnosis Subcategory <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={diagnosisSubcategory}
                                onChange={(e) => setDiagnosisSubcategory(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="">-- Select Subcategory --</option>
                                {availableSubcategories.map((subcategory) => (
                                    <option key={subcategory} value={subcategory}>
                                        {subcategory}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader className="animate-spin" size={18} />
                                Saving...
                            </>
                        ) : (
                            "Save Diagnosis"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddDiagnosisModal;
