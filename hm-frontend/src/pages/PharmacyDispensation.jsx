import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, User, Package, AlertCircle, CheckCircle, Pill, Users } from 'lucide-react';
import DashboardLayout from '../layout/DashboardLayout';
import './PharmacyDispensation.css';

const PharmacyDispensation = () => {
    const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [pharmacists, setPharmacists] = useState([]);
    const [selectedPharmacist, setSelectedPharmacist] = useState('');
    const [dispensationItems, setDispensationItems] = useState([]);
    const [counselingNotes, setCounselingNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

    useEffect(() => {
        fetchPendingPrescriptions();
        fetchPharmacists();
    }, []);

    const fetchPendingPrescriptions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE}/pharmacy/dispensations/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingPrescriptions(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            showMessage('error', 'Failed to load pending prescriptions');
        }
    };

    const fetchPharmacists = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE}/staff`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const pharmacistList = response.data.data?.filter(s => s.role === 'pharmacist') || [];
            setPharmacists(pharmacistList);
        } catch (error) {
            console.error('Error fetching pharmacists:', error);
        }
    };

    const selectPrescription = (prescription) => {
        setSelectedPrescription(prescription);
        // Initialize dispensation items
        const items = prescription.items.map(item => ({
            prescription_item_id: item.id,
            drug: item.drug,
            quantity_prescribed: item.quantity_prescribed,
            quantity_remaining: item.quantity_remaining,
            quantity_to_dispense: Math.min(item.quantity_remaining, item.quantity_prescribed),
            dosage: item.dosage,
            frequency: item.frequency,
            duration_text: item.duration_text,
        }));
        setDispensationItems(items);
    };

    const updateItemQuantity = (index, quantity) => {
        const updated = [...dispensationItems];
        updated[index].quantity_to_dispense = Math.min(
            parseInt(quantity) || 0,
            updated[index].quantity_remaining
        );
        setDispensationItems(updated);
    };

    const handleDispense = async () => {
        if (!selectedPharmacist) {
            showMessage('error', 'Please select a pharmacist');
            return;
        }

        if (dispensationItems.some(item => item.quantity_to_dispense <= 0)) {
            showMessage('error', 'All quantities must be greater than 0');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                prescription_id: selectedPrescription.id,
                assigned_pharmacist_id: parseInt(selectedPharmacist),
                items: dispensationItems.map(item => ({
                    prescription_item_id: item.prescription_item_id,
                    quantity: item.quantity_to_dispense,
                })),
                counseling_notes: counselingNotes,
            };

            const response = await axios.post(
                `${API_BASE}/pharmacy/dispensations/dispense`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showMessage('success', response.data.message || 'Dispensation successful');

            // Reset form
            setSelectedPrescription(null);
            setSelectedPharmacist('');
            setDispensationItems([]);
            setCounselingNotes('');

            // Refresh pending prescriptions
            fetchPendingPrescriptions();
        } catch (error) {
            console.error('Dispensation error:', error);
            showMessage('error', error.response?.data?.error || 'Failed to dispense');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            stat: 'bg-red-100 text-red-800',
            urgent: 'bg-orange-100 text-orange-800',
            routine: 'bg-blue-100 text-blue-800',
        };
        return colors[priority] || colors.routine;
    };

    return (
        <DashboardLayout>
            <div className="pharmacy-dispensation">
                <div className="page-header">
                    <div className="header-content">
                        <Pill className="header-icon" />
                        <div>
                            <h1>Pharmacy Dispensation</h1>
                            <p>Admin dispenses and assigns pharmacist</p>
                        </div>
                    </div>
                </div>

                {message.text && (
                    <div className={`message message-${message.type}`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span>{message.text}</span>
                    </div>
                )}

                <div className="dispensation-layout">
                    {/* Pending Prescriptions */}
                    <div className="pending-section">
                        <h2>Pending Prescriptions ({pendingPrescriptions.length})</h2>
                        <div className="prescriptions-list">
                            {pendingPrescriptions.map(prescription => (
                                <div
                                    key={prescription.id}
                                    className={`prescription-card ${selectedPrescription?.id === prescription.id ? 'selected' : ''}`}
                                    onClick={() => selectPrescription(prescription)}
                                >
                                    <div className="prescription-header">
                                        <span className={`priority-badge ${getPriorityBadge(prescription.priority)}`}>
                                            {prescription.priority.toUpperCase()}
                                        </span>
                                        <span className="prescription-number">#{prescription.prescription_number}</span>
                                    </div>

                                    <div className="prescription-info">
                                        <div className="info-row">
                                            <User size={16} />
                                            <span>{prescription.patient?.first_name} {prescription.patient?.last_name}</span>
                                        </div>
                                        <div className="info-row">
                                            <Calendar size={16} />
                                            <span>{new Date(prescription.prescribing_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="info-row">
                                            <Package size={16} />
                                            <span>{prescription.items?.filter(i => i.status !== 'fully_dispensed').length || 0} items pending</span>
                                        </div>
                                    </div>

                                    {prescription.diagnosis && (
                                        <div className="diagnosis">
                                            <strong>Diagnosis:</strong> {prescription.diagnosis}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {pendingPrescriptions.length === 0 && (
                                <div className="empty-state">
                                    <Pill size={48} />
                                    <p>No pending prescriptions</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dispensation Form */}
                    <div className="dispensation-form-section">
                        {selectedPrescription ? (
                            <>
                                <div className="form-header">
                                    <h2>Dispense Prescription #{selectedPrescription.prescription_number}</h2>
                                    <div className="patient-details">
                                        <strong>Patient:</strong> {selectedPrescription.patient?.first_name} {selectedPrescription.patient?.last_name}
                                        {selectedPrescription.allergies_noted && (
                                            <div className="allergies-warning">
                                                <AlertCircle size={16} />
                                                <span>Allergies: {selectedPrescription.allergies_noted}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pharmacist Selection */}
                                <div className="form-group pharmacist-selection">
                                    <label>
                                        <Users size={18} />
                                        <span>Assign Pharmacist *</span>
                                    </label>
                                    <select
                                        value={selectedPharmacist}
                                        onChange={(e) => setSelectedPharmacist(e.target.value)}
                                        className="form-select"
                                        required
                                    >
                                        <option value="">-- Select Pharmacist --</option>
                                        {pharmacists.map(pharmacist => (
                                            <option key={pharmacist.id} value={pharmacist.id}>
                                                {pharmacist.first_name} {pharmacist.last_name}
                                            </option>
                                        ))}
                                    </select>
                                    <small>The pharmacist who will be accountable for this dispensation</small>
                                </div>

                                {/* Items to Dispense */}
                                <div className="items-section">
                                    <h3>Items to Dispense</h3>
                                    {dispensationItems.map((item, index) => (
                                        <div key={index} className="dispense-item">
                                            <div className="item-header">
                                                <strong>{item.drug?.generic_name}</strong>
                                                {item.drug?.brand_names?.length > 0 && (
                                                    <span className="brand-name">({item.drug.brand_names[0]})</span>
                                                )}
                                            </div>

                                            <div className="item-details">
                                                <div className="detail-row">
                                                    <span className="label">Dosage:</span>
                                                    <span>{item.dosage}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">Frequency:</span>
                                                    <span>{item.frequency}</span>
                                                </div>
                                                {item.duration_text && (
                                                    <div className="detail-row">
                                                        <span className="label">Duration:</span>
                                                        <span>{item.duration_text}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="quantity-control">
                                                <div className="quantity-info">
                                                    <span>Prescribed: <strong>{item.quantity_prescribed}</strong></span>
                                                    <span>Remaining: <strong>{item.quantity_remaining}</strong></span>
                                                </div>
                                                <div className="quantity-input-group">
                                                    <label>Dispense Quantity:</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={item.quantity_remaining}
                                                        value={item.quantity_to_dispense}
                                                        onChange={(e) => updateItemQuantity(index, e.target.value)}
                                                        className="quantity-input"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Counseling Notes */}
                                <div className="form-group">
                                    <label>Counseling Notes</label>
                                    <textarea
                                        value={counselingNotes}
                                        onChange={(e) => setCounselingNotes(e.target.value)}
                                        placeholder="Patient counseling notes, instructions, warnings..."
                                        rows={4}
                                        className="form-textarea"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="form-actions">
                                    <button
                                        onClick={() => setSelectedPrescription(null)}
                                        className="btn btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDispense}
                                        disabled={loading || !selectedPharmacist}
                                        className="btn btn-primary"
                                    >
                                        {loading ? 'Dispensing...' : 'Dispense Medication'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">
                                <Package size={48} />
                                <p>Select a prescription to dispense</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PharmacyDispensation;
