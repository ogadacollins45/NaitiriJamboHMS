import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../layout/DashboardLayout';
import ManualDispensationModal from '../components/ManualDispensationModal';
import {
    Pill,
    CheckCircle,
    AlertCircle,
    Search,
    Calendar,
    FileText,
    Loader,
    ChevronRight,
    X,
    Package,
    PlusCircle,
} from 'lucide-react';

const PharmacyReview = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [availableDrugs, setAvailableDrugs] = useState({});
    const [searchTerms, setSearchTerms] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pharmacistNotes, setPharmacistNotes] = useState('');
    const [itemMappings, setItemMappings] = useState({});
    const [showConfirmDispense, setShowConfirmDispense] = useState(false);
    const [searchTimers, setSearchTimers] = useState({});
    const [searchLoading, setSearchLoading] = useState({});
    const [dispensing, setDispensing] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);

    // Add Drug Modal State
    const [showAddDrugModal, setShowAddDrugModal] = useState(false);
    const [drugSearchQuery, setDrugSearchQuery] = useState('');
    const [searchedDrugs, setSearchedDrugs] = useState([]);
    const [selectedDrugToAdd, setSelectedDrugToAdd] = useState(null);
    const [quantityToAdd, setQuantityToAdd] = useState(1);
    const [addingDrug, setAddingDrug] = useState(false);

    const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchPendingPrescriptions();
    }, []);



    const fetchPendingPrescriptions = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/pharmacy/review/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPrescriptions(response.data);
        } catch (err) {
            console.error('Error fetching prescriptions:', err);
            setError('Failed to load pending prescriptions');
        } finally {
            setLoading(false);
        }
    };

    const searchDrugs = async (itemId, query) => {
        if (!query || query.length < 3) {
            setAvailableDrugs(prev => ({ ...prev, [itemId]: [] }));
            setSearchLoading(prev => ({ ...prev, [itemId]: false }));
            return;
        }

        setSearchLoading(prev => ({ ...prev, [itemId]: true }));

        try {
            const response = await axios.get(`${API_BASE}/pharmacy/review/drugs/available`, {
                params: { search: query },
                headers: { Authorization: `Bearer ${token}` }
            });
            setAvailableDrugs(prev => ({ ...prev, [itemId]: response.data }));
        } catch (err) {
            console.error('Error searching drugs:', err);
            setAvailableDrugs(prev => ({ ...prev, [itemId]: [] }));
        } finally {
            setSearchLoading(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const handleSearchChange = (itemId, value) => {
        // Update search term immediately
        setSearchTerms(prev => ({ ...prev, [itemId]: value }));

        // Clear previous timer for this item
        if (searchTimers[itemId]) {
            clearTimeout(searchTimers[itemId]);
        }

        // Set new timer with debounce
        const timerId = setTimeout(() => {
            searchDrugs(itemId, value);
        }, 300); // 300ms debounce

        setSearchTimers(prev => ({ ...prev, [itemId]: timerId }));
    };

    const handleSelectPrescription = async (prescription) => {
        setSelectedPrescription(prescription);
        setPharmacistNotes('');

        // Initialize mappings with existing data
        const mappings = {};
        prescription.items?.forEach(item => {
            mappings[item.id] = {
                mapped_drug_id: item.mapped_drug_id || '',
                mapped_quantity: item.mapped_quantity || item.quantity || 1,
                mapped_drug: item.mapped_drug || null,
            };
        });
        setItemMappings(mappings);
    };

    const handleMapItem = async (itemId, drug, quantity) => {
        try {
            await axios.post(
                `${API_BASE}/pharmacy/review/items/${itemId}/map`,
                {
                    mapped_drug_id: drug.id,
                    mapped_quantity: quantity
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            flashMessage(setSuccess, 'Item mapped successfully');

            // Update local state
            setItemMappings(prev => ({
                ...prev,
                [itemId]: {
                    mapped_drug_id: drug.id,
                    mapped_quantity: quantity,
                    mapped_drug: drug
                }
            }));

            // Clear search for this specific item
            setSearchTerms(prev => ({ ...prev, [itemId]: '' }));
            setAvailableDrugs(prev => ({ ...prev, [itemId]: [] }));
        } catch (err) {
            console.error('Error mapping item:', err);
            flashMessage(setError, 'Failed to map item');
        }
    };

    const handleUnmapItem = async (itemId) => {
        try {
            await axios.delete(
                `${API_BASE}/pharmacy/review/items/${itemId}/unmap`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            flashMessage(setSuccess, 'Item unmapped successfully');

            // Update local state
            setItemMappings(prev => ({
                ...prev,
                [itemId]: {
                    mapped_drug_id: '',
                    mapped_quantity: prev[itemId]?.mapped_quantity || 1,
                    mapped_drug: null
                }
            }));
        } catch (err) {
            console.error('Error unmapping item:', err);
            flashMessage(setError, 'Failed to unmap item');
        }
    };

    const handleDispense = async () => {
        if (!selectedPrescription) return;

        // Validate that all mapped items have quantities
        const mappedItems = Object.values(itemMappings).filter(m => m.mapped_drug_id);
        const hasEmptyQuantity = mappedItems.some(m => !m.mapped_quantity || m.mapped_quantity === '');

        if (hasEmptyQuantity) {
            flashMessage(setError, 'Please enter quantities for all mapped drugs before dispensing');
            return;
        }

        // No longer require all items to be mapped - allow dispensing with unmapped items (not in stock)

        setDispensing(true);
        try {
            await axios.post(
                `${API_BASE}/pharmacy/review/${selectedPrescription.id}/dispense`,
                { pharmacist_notes: pharmacistNotes },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            flashMessage(setSuccess, 'Prescription dispensed successfully! Stock levels updated.');

            // Refresh list and clear selection
            await fetchPendingPrescriptions();
            setSelectedPrescription(null);
            setItemMappings({});
            setPharmacistNotes('');
            setShowConfirmDispense(false);
        } catch (err) {
            console.error('Error dispensing:', err);
            const errorMsg = err.response?.data?.message || 'Failed to dispense prescription';
            flashMessage(setError, errorMsg);
            setShowConfirmDispense(false);
        } finally {
            setDispensing(false);
        }
    };

    // Search drugs for adding to prescription
    const handleSearchDrugs = async (query) => {
        setDrugSearchQuery(query);
        if (query.length < 2) {
            setSearchedDrugs([]);
            return;
        }

        try {
            const response = await axios.get(`${API_BASE}/pharmacy/review/drugs/available`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { search: query }
            });
            setSearchedDrugs(response.data);
        } catch (err) {
            console.error('Error searching drugs:', err);
        }
    };

    // Add drug to prescription
    const handleAddDrugToPrescription = async () => {
        if (!selectedDrugToAdd || !selectedPrescription) {
            alert('Please select a drug');
            return;
        }

        setAddingDrug(true);
        try {
            await axios.post(
                `${API_BASE}/pharmacy/manual/prescriptions/${selectedPrescription.id}/add-drug`,
                {
                    drug_id: selectedDrugToAdd.id,
                    quantity: quantityToAdd
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            flashMessage(setSuccess, 'Drug added to prescription successfully');

            // Refresh prescription data
            const response = await axios.get(`${API_BASE}/pharmacy/review/${selectedPrescription.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedPrescription(response.data);

            // Update prescriptions list
            setPrescriptions(prescriptions.map(p =>
                p.id === selectedPrescription.id ? response.data : p
            ));

            // Update itemMappings with the new drug's quantity from backend
            const updatedMappings = { ...itemMappings };
            response.data.items?.forEach(item => {
                if (item.mapped_drug_id) {
                    updatedMappings[item.id] = {
                        mapped_drug_id: item.mapped_drug_id,
                        mapped_quantity: item.mapped_quantity,
                        mapped_drug: item.mapped_drug
                    };
                }
            });
            setItemMappings(updatedMappings);

            // Reset modal
            setShowAddDrugModal(false);
            setSelectedDrugToAdd(null);
            setDrugSearchQuery('');
            setSearchedDrugs([]);
            setQuantityToAdd(1);
        } catch (error) {
            console.error('Error adding drug:', error);
            flashMessage(setError, error.response?.data?.message || 'Failed to add drug to prescription');
        } finally {
            setAddingDrug(false);
        }
    };

    const flashMessage = (setter, message) => {
        setter(message);
        setTimeout(() => setter(''), 4000);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-screen">
                    <Loader className="animate-spin h-10 w-10 text-indigo-500" />
                    <p className="ml-3 text-lg text-gray-600">Loading prescriptions...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 p-6 pt-24">
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                            <Pill className="w-8 h-8 text-indigo-600 mr-3" />
                            Pharmacy Review & Dispensing
                        </h1>
                        <p className="text-gray-600 mt-2">Review prescriptions, map to stock, and dispense</p>
                    </div>
                    <button
                        onClick={() => setShowManualModal(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
                    >
                        <PlusCircle size={20} />
                        Manual Dispensation
                    </button>
                </div>

                {/* Notifications */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg flex items-center">
                        <AlertCircle className="w-6 h-6 mr-3" />
                        <p>{error}</p>
                    </div>
                )}
                {success && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-lg flex items-center">
                        <CheckCircle className="w-6 h-6 mr-3" />
                        <p>{success}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - Pending Prescriptions List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                Pending ({prescriptions.length})
                            </h2>

                            {prescriptions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No pending prescriptions</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {prescriptions.map(prescription => (
                                        <button
                                            key={prescription.id}
                                            onClick={() => handleSelectPrescription(prescription)}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedPrescription?.id === prescription.id
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-indigo-300 bg-white'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-800">
                                                        {prescription.patient?.first_name} {prescription.patient?.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Dr. {prescription.doctor?.first_name || 'Unknown'}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div className="flex items-center text-xs text-gray-500 gap-3">
                                                <span className="flex items-center">
                                                    <FileText className="w-3 h-3 mr-1" />
                                                    {prescription.items?.length || 0} items
                                                </span>
                                                <span className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {new Date(prescription.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Review Interface */}
                    <div className="lg:col-span-2">
                        {selectedPrescription ? (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <div className="border-b border-gray-200 pb-4 mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                        Review & Dispense Prescription
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Patient:</span>
                                            <p className="font-semibold">
                                                {selectedPrescription.patient?.first_name} {selectedPrescription.patient?.last_name}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Doctor:</span>
                                            <p className="font-semibold">
                                                Dr. {selectedPrescription.doctor?.first_name || 'Unknown'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Prescription Items with Mapping */}
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-gray-800">Prescription Items</h3>
                                        <button
                                            onClick={() => setShowAddDrugModal(true)}
                                            className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            <PlusCircle size={16} />
                                            Add Drug
                                        </button>
                                    </div>

                                    {selectedPrescription.items?.map((item, index) => {
                                        const mapping = itemMappings[item.id] || {};
                                        const isMapped = mapping.mapped_drug_id;

                                        return (
                                            <div key={item.id} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                                                {/* Original Prescription */}
                                                <div className="mb-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-gray-800 text-lg">
                                                            #{index + 1} {item.drug_name_text || item.name}
                                                        </h4>
                                                        {/* Status Badge */}
                                                        {isMapped ? (
                                                            item.source === 'manual' ? (
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                    ✓ Manually Added
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    ✓ Auto-mapped
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                                ⚠ Not in Stock
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-700">
                                                        {item.dosage_text && <div><span className="font-medium">Dosage:</span> {item.dosage_text}</div>}
                                                        {item.frequency_text && <div><span className="font-medium">Frequency:</span> {item.frequency_text}</div>}
                                                        {item.duration_text && <div><span className="font-medium">Duration:</span> {item.duration_text}</div>}
                                                        {item.instructions_text && <div className="col-span-2"><span className="font-medium">Instructions:</span> {item.instructions_text}</div>}
                                                    </div>
                                                </div>

                                                {/* Mapped Drug Display */}
                                                {isMapped && mapping.mapped_drug ? (
                                                    <div className="bg-green-50 border border-green-300 rounded-lg p-3 mb-3">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center mb-2">
                                                                    <Package className="w-5 h-5 text-green-600 mr-2" />
                                                                    <span className="font-semibold text-green-800">Mapped to Stock</span>
                                                                </div>
                                                                <p className="text-sm font-medium text-gray-800">{mapping.mapped_drug.generic_name}</p>
                                                                <p className="text-xs text-gray-600">
                                                                    {mapping.mapped_drug.dosage_form} - {mapping.mapped_drug.strength} {mapping.mapped_drug.unit_of_measure}
                                                                </p>
                                                                {/* Stock Level Indicator */}
                                                                <div className="mt-1">
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${(mapping.mapped_drug.current_stock || 0) > 50
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : (mapping.mapped_drug.current_stock || 0) > 10
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : 'bg-red-100 text-red-800'
                                                                        }`}>
                                                                        📦 Stock: {mapping.mapped_drug.current_stock || 0} available
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <label className="text-sm text-gray-700 font-medium">Quantity:</label>
                                                                    <input
                                                                        type="text"
                                                                        value={mapping.mapped_quantity ?? ''}
                                                                        onChange={async (e) => {
                                                                            const value = e.target.value;
                                                                            // Allow empty or positive numbers only
                                                                            if (value === '' || /^[0-9]+$/.test(value)) {
                                                                                const newQty = value === '' ? '' : parseInt(value);
                                                                                setItemMappings({
                                                                                    ...itemMappings,
                                                                                    [item.id]: { ...mapping, mapped_quantity: newQty }
                                                                                });
                                                                                // Only update backend if value is not empty
                                                                                if (value !== '') {
                                                                                    try {
                                                                                        await axios.post(
                                                                                            `${API_BASE}/pharmacy/review/items/${item.id}/map`,
                                                                                            {
                                                                                                mapped_drug_id: mapping.mapped_drug_id,
                                                                                                mapped_quantity: newQty
                                                                                            },
                                                                                            { headers: { Authorization: `Bearer ${token}` } }
                                                                                        );
                                                                                    } catch (err) {
                                                                                        console.error('Error updating quantity:', err);
                                                                                    }
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-sm font-semibold"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleUnmapItem(item.id)}
                                                                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* No mapping interface - drug not in stock */
                                                    <div className="border-t border-gray-300 pt-3">
                                                        <p className="text-sm text-gray-600 italic">
                                                            This drug is not available in pharmacy stock
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pharmacist Notes */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Pharmacist Notes
                                    </label>
                                    <textarea
                                        value={pharmacistNotes}
                                        onChange={(e) => setPharmacistNotes(e.target.value)}
                                        placeholder="Add any notes about this dispensing..."
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        rows="3"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setSelectedPrescription(null);
                                            setItemMappings({});
                                            setPharmacistNotes('');
                                        }}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => setShowConfirmDispense(true)}
                                        disabled={dispensing}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md flex items-center disabled:bg-green-400 disabled:cursor-not-allowed"
                                    >
                                        {dispensing ? (
                                            <>
                                                <Loader className="animate-spin w-5 h-5 mr-2" />
                                                Dispensing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                Dispense Now
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-md p-12 text-center">
                                <Pill className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 text-lg">Select a prescription to review</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Confirmation Modal */}
                {showConfirmDispense && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Dispensing</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to dispense this prescription? This will deduct stock from inventory and mark the prescription as dispensed.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowConfirmDispense(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDispense}
                                    disabled={dispensing}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center"
                                >
                                    {dispensing ? (
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

                {/* Add Drug Modal */}
                {showAddDrugModal && selectedPrescription && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="flex justify-between items-center px-6 py-4 border-b">
                                <h3 className="text-xl font-bold text-gray-800">Add Drug to Prescription</h3>
                                <button
                                    onClick={() => {
                                        setShowAddDrugModal(false);
                                        setSelectedDrugToAdd(null);
                                        setDrugSearchQuery('');
                                        setSearchedDrugs([]);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Search Input */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Drug</label>
                                    <input
                                        type="text"
                                        value={drugSearchQuery}
                                        onChange={(e) => handleSearchDrugs(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Type drug name..."
                                    />
                                </div>

                                {/* Drug Search Results */}
                                {drugSearchQuery.length >= 2 && searchedDrugs.length > 0 && !selectedDrugToAdd && (
                                    <div className="border rounded-lg max-h-60 overflow-y-auto mb-4">
                                        {searchedDrugs.map((drug) => (
                                            <div
                                                key={drug.id}
                                                onClick={() => setSelectedDrugToAdd(drug)}
                                                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                                            >
                                                <p className="font-medium">{drug.generic_name}</p>
                                                <p className="text-sm text-gray-600">
                                                    {drug.dosage_form} - {drug.strength} {drug.unit_of_measure}
                                                </p>
                                                <p className="text-xs text-gray-500">Stock: {drug.current_stock}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Selected Drug */}
                                {selectedDrugToAdd && (
                                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-800">{selectedDrugToAdd.generic_name}</p>
                                                <p className="text- text-gray-600">
                                                    {selectedDrugToAdd.dosage_form} - {selectedDrugToAdd.strength} {selectedDrugToAdd.unit_of_measure}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Available: {selectedDrugToAdd.current_stock} units
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedDrugToAdd(null)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        {/* Quantity Selector */}
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={selectedDrugToAdd.current_stock}
                                                value={quantityToAdd}
                                                onChange={(e) => setQuantityToAdd(parseInt(e.target.value))}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 border-t flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowAddDrugModal(false);
                                        setSelectedDrugToAdd(null);
                                        setDrugSearchQuery('');
                                        setSearchedDrugs([]);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddDrugToPrescription}
                                    disabled={!selectedDrugToAdd || addingDrug}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {addingDrug ? (
                                        <>
                                            <Loader className="animate-spin w-4 h-4" />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add to Prescription'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manual Dispensation Modal */}
                <ManualDispensationModal
                    isOpen={showManualModal}
                    onClose={() => setShowManualModal(false)}
                    onSuccess={() => {
                        setShowManualModal(false);
                        fetchPendingPrescriptions(); // Refresh list
                    }}
                />
            </div>
        </DashboardLayout>
    );
};

export default PharmacyReview;
