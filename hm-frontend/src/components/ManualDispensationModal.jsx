import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Pill, Trash2, Loader } from 'lucide-react';
import axios from 'axios';
import { useDebounce } from 'use-debounce';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const ManualDispensationModal = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: Patient, 2: Drugs, 3: Summary
    const [patientMode, setPatientMode] = useState('search'); // 'search' or 'register'

    // Patient search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searching, setSearching] = useState(false);

    // Use debounce for search (same as PatientsContent)
    const [debouncedSearch] = useDebounce(searchQuery, 400);

    // New patient registration
    const [newPatient, setNewPatient] = useState({
        first_name: '',
        last_name: '',
        national_id: '',
        gender: '',
        dob: '',
        age: '',
        phone: '',
        email: '',
        address: '',
    });

    // Drug selection
    const [drugSearch, setDrugSearch] = useState('');
    const [availableDrugs, setAvailableDrugs] = useState([]);
    const [selectedDrugs, setSelectedDrugs] = useState([]);

    // Loading states
    const [loading, setLoading] = useState(false);
    const [showConfirmDispense, setShowConfirmDispense] = useState(false);
    const [notes, setNotes] = useState('');

    // AGE/DOB Sync Logic (EXACT copy from AddPatient.jsx)
    const calculateAgeFromDOB = (dob) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age >= 0 ? age : '';
    };

    const calculateDOBFromAge = (age) => {
        if (!age || isNaN(age)) return '';
        const today = new Date();
        const birthYear = today.getFullYear() - parseInt(age);
        const dob = new Date(birthYear, today.getMonth(), today.getDate());
        return dob.toISOString().split('T')[0];
    };

    const handlePatientChange = (e) => {
        const { name, value } = e.target;

        if (name === 'dob') {
            const newAge = calculateAgeFromDOB(value);
            setNewPatient((prev) => ({ ...prev, dob: value, age: newAge }));
        } else if (name === 'age') {
            const newDOB = calculateDOBFromAge(value);
            setNewPatient((prev) => ({ ...prev, age: value, dob: newDOB }));
        } else {
            setNewPatient((prev) => ({ ...prev, [name]: value }));
        }
    };

    // Search patients using debounced search (EXACT copy from PatientsContent logic)
    useEffect(() => {
        if (debouncedSearch.length >= 2) {
            const searchPatients = async () => {
                setSearching(true);
                try {
                    const response = await axios.get('/patients', {
                        params: { search: debouncedSearch }
                    });
                    setSearchResults(response.data.data || response.data);
                } catch (error) {
                    console.error('Error searching patients:', error);
                } finally {
                    setSearching(false);
                }
            };
            searchPatients();
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearch]);

    // Register new patient
    const handleRegisterPatient = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/patients', newPatient, {
                headers: { 'Content-Type': 'application/json' }
            });

            setSelectedPatient(response.data.data || response.data);
            setStep(2);
            alert('Patient registered successfully');
        } catch (error) {
            console.error('Error registering patient:', error);
            const errorMessage = error.response?.data?.errors
                ? Object.values(error.response.data.errors).flat().join(' ')
                : error.response?.data?.message || 'Failed to register patient';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Search available drugs
    useEffect(() => {
        if (drugSearch.length >= 2) {
            const timer = setTimeout(async () => {
                try {
                    const response = await axios.get('/pharmacy/review/drugs/available', {
                        params: { search: drugSearch }
                    });
                    setAvailableDrugs(response.data);
                } catch (error) {
                    console.error('Error searching drugs:', error);
                }
            }, 300);

            return () => clearTimeout(timer);
        } else {
            setAvailableDrugs([]);
        }
    }, [drugSearch]);

    // Add drug
    const handleAddDrug = (drug) => {
        if (selectedDrugs.some(d => d.drug_id === drug.id)) {
            alert('Drug already added');
            return;
        }

        setSelectedDrugs([...selectedDrugs, {
            drug_id: drug.id,
            name: drug.generic_name,
            dosage_form: drug.dosage_form,
            strength: drug.strength,
            unit: drug.unit_of_measure,
            current_stock: drug.current_stock,
            unit_price: parseFloat(drug.default_unit_price) || 0,
            quantity: 1,
        }]);
        // Clear search and dropdown to allow adding another drug
        setDrugSearch('');
        setAvailableDrugs([]);
    };

    // Remove drug
    const handleRemoveDrug = (drugId) => {
        setSelectedDrugs(selectedDrugs.filter(d => d.drug_id !== drugId));
    };

    // Update quantity
    const handleUpdateQuantity = (drugId, quantity) => {
        setSelectedDrugs(selectedDrugs.map(d =>
            d.drug_id === drugId ? { ...d, quantity: parseInt(quantity) || 1 } : d
        ));
    };

    // Calculate total
    const totalAmount = selectedDrugs.reduce((sum, drug) =>
        sum + (drug.unit_price * drug.quantity), 0
    );

    // Submit dispensation
    const handleSubmit = async () => {
        if (!selectedPatient) {
            alert('Please select a patient');
            return;
        }

        if (selectedDrugs.length === 0) {
            alert('Please add at least one drug');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                patient_id: selectedPatient.id,
                registered_on_the_fly: false,
                drugs: selectedDrugs.map(d => ({
                    drug_id: d.drug_id,
                    quantity: d.quantity
                })),
                notes: notes || 'Manual dispensation',
            };

            await axios.post('/pharmacy/manual/dispensation', payload);

            alert('Dispensation completed successfully');
            setShowConfirmDispense(false);
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Error creating dispensation:', error);
            alert(error.response?.data?.message || 'Failed to create dispensation');
            setShowConfirmDispense(false);
        } finally {
            setLoading(false);
        }
    };

    // Reset modal
    const handleClose = () => {
        setStep(1);
        setPatientMode('search');
        setSearchQuery('');
        setSearchResults([]);
        setSelectedPatient(null);
        setNewPatient({
            first_name: '',
            last_name: '',
            national_id: '',
            gender: '',
            dob: '',
            age: '',
            phone: '',
            email: '',
            address: '',
        });
        setDrugSearch('');
        setAvailableDrugs([]);
        setSelectedDrugs([]);
        setNotes('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Manual Dispensation</h2>
                    <button onClick={handleClose} className="text-white hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                {/* Progress */}
                <div className="flex border-b">
                    <div className={`flex-1 text-center py-3 ${step >= 1 ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500'}`}>
                        1. Select Patient
                    </div>
                    <div className={`flex-1 text-center py-3 ${step >= 2 ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500'}`}>
                        2. Select Drugs
                    </div>
                    <div className={`flex-1 text-center py-3 ${step >= 3 ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500'}`}>
                        3. Review & Dispense
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* STEP 1: Patient Selection */}
                    {step === 1 && (
                        <div className="space-y-4">
                            {/* Mode Toggle */}
                            <div className="flex gap-4 mb-6">
                                <button
                                    onClick={() => setPatientMode('search')}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${patientMode === 'search' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <Search className="inline mr-2" size={18} />
                                    Search Patient
                                </button>
                                <button
                                    onClick={() => setPatientMode('register')}
                                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${patientMode === 'register' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <UserPlus className="inline mr-2" size={18} />
                                    Register New
                                </button>
                            </div>

                            {/* Search Mode */}
                            {patientMode === 'search' && (
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Search by name, phone, email, ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                                    />
                                    {searching && <p className="text-sm text-gray-500">Searching...</p>}

                                    {searchResults.length > 0 && (
                                        <div className="border rounded-lg divide-y max-h-80 overflow-y-auto">
                                            {searchResults.map(patient => (
                                                <div
                                                    key={patient.id}
                                                    onClick={() => {
                                                        setSelectedPatient(patient);
                                                        setStep(2);
                                                    }}
                                                    className="p-4 hover:bg-gray-50 cursor-pointer"
                                                >
                                                    <p className="font-medium text-gray-900">
                                                        {patient.first_name} {patient.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {patient.phone || 'No phone'} • {patient.gender}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Register Mode */}
                            {patientMode === 'register' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        name="first_name"
                                        placeholder="First Name *"
                                        value={newPatient.first_name}
                                        onChange={handlePatientChange}
                                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="last_name"
                                        placeholder="Last Name *"
                                        value={newPatient.last_name}
                                        onChange={handlePatientChange}
                                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name="national_id"
                                        placeholder="National ID"
                                        value={newPatient.national_id}
                                        onChange={handlePatientChange}
                                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <select
                                        name="gender"
                                        value={newPatient.gender}
                                        onChange={handlePatientChange}
                                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">Select Gender *</option>
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                        <option value="O">Other</option>
                                    </select>
                                    <input
                                        type="date"
                                        name="dob"
                                        placeholder="Date of Birth"
                                        value={newPatient.dob}
                                        onChange={handlePatientChange}
                                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="number"
                                        name="age"
                                        placeholder="Age"
                                        value={newPatient.age}
                                        onChange={handlePatientChange}
                                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Phone"
                                        value={newPatient.phone}
                                        onChange={handlePatientChange}
                                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email"
                                        value={newPatient.email}
                                        onChange={handlePatientChange}
                                        className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <div className="col-span-2">
                                        <textarea
                                            name="address"
                                            placeholder="Address"
                                            value={newPatient.address}
                                            onChange={handlePatientChange}
                                            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                            rows="2"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <button
                                            onClick={handleRegisterPatient}
                                            disabled={loading || !newPatient.first_name || !newPatient.last_name || !newPatient.gender}
                                            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-medium"
                                        >
                                            {loading ? 'Registering...' : 'Register & Continue'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: Drug Selection */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-600">Patient</p>
                                <p className="font-medium text-gray-900">
                                    {selectedPatient?.first_name} {selectedPatient?.last_name}
                                </p>
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search drugs..."
                                    value={drugSearch}
                                    onChange={(e) => setDrugSearch(e.target.value)}
                                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                                />
                                {availableDrugs.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {availableDrugs.map(drug => (
                                            <div
                                                key={drug.id}
                                                onClick={() => handleAddDrug(drug)}
                                                className="p-3 hover:bg-gray-50 cursor-pointer"
                                            >
                                                <p className="font-medium">{drug.generic_name}</p>
                                                <p className="text-sm text-gray-600">
                                                    {drug.dosage_form} - {drug.strength} {drug.unit_of_measure}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Stock: {drug.current_stock} • Price: {parseFloat(drug.default_unit_price || 0).toFixed(2)} KSH
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <p className="font-medium mb-2">Selected Drugs</p>
                                {selectedDrugs.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No drugs added</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedDrugs.map(drug => (
                                            <div key={drug.drug_id} className="border rounded-lg p-4 flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium">{drug.name}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Stock: {drug.current_stock} • Price: {drug.unit_price} KSH
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={drug.current_stock}
                                                        value={drug.quantity}
                                                        onChange={(e) => handleUpdateQuantity(drug.drug_id, e.target.value)}
                                                        className="w-20 border rounded px-2 py-1"
                                                    />
                                                    <p className="font-medium">
                                                        {(drug.unit_price * drug.quantity).toFixed(2)} KSH
                                                    </p>
                                                    <button onClick={() => handleRemoveDrug(drug.drug_id)}>
                                                        <Trash2 size={18} className="text-red-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <textarea
                                placeholder="Notes (optional)"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                rows="2"
                            />
                        </div>
                    )}

                    {/* STEP 3: Summary */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border p-4 rounded-lg">
                                <p className="font-medium mb-2">Patient</p>
                                <p>{selectedPatient?.first_name} {selectedPatient?.last_name}</p>
                                <p className="text-sm text-gray-600">{selectedPatient?.phone}</p>
                            </div>

                            <div>
                                <p className="font-medium mb-2">Drugs</p>
                                <div className="border rounded-lg divide-y">
                                    {selectedDrugs.map(drug => (
                                        <div key={drug.drug_id} className="p-3 flex justify-between">
                                            <div>
                                                <p className="font-medium">{drug.name}</p>
                                                <p className="text-sm">Qty: {drug.quantity}</p>
                                            </div>
                                            <p className="font-medium">{(drug.unit_price * drug.quantity).toFixed(2)} KSH</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-50 border p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <p className="text-lg font-medium">Total</p>
                                    <p className="text-2xl font-bold text-indigo-600">{totalAmount.toFixed(2)} KSH</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t px-6 py-4 flex justify-between">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
                        className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={(step === 1 && !selectedPatient) || (step === 2 && selectedDrugs.length === 0)}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowConfirmDispense(true)}
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                        >
                            Dispense Now
                        </button>
                    )}
                </div>

                {/* Confirmation Modal */}
                {showConfirmDispense && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Dispensing</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to dispense these drugs? This will deduct stock from inventory and create a billing entry for the patient.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowConfirmDispense(false)}
                                    disabled={loading}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center"
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="animate-spin w-4 h-4 mr-2" />
                                            Dispensing...
                                        </>
                                    ) : (
                                        'Yes, Dispense'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManualDispensationModal;
