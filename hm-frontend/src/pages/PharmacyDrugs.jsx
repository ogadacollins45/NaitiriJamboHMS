import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Pill, Package, Loader, Send } from 'lucide-react';
import DashboardLayout from '../layout/DashboardLayout';
import './PharmacyDrugs.css';

const PharmacyDrugs = () => {
    const [drugs, setDrugs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low', 'out'
    const [showModal, setShowModal] = useState(false);
    const [editingDrug, setEditingDrug] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [formData, setFormData] = useState({
        generic_name: '',
        brand_names: [],
        dosage_form: 'tablet',
        strength: '',
        drug_category: '',
        default_unit_price: '',
        current_stock: '0',
        reorder_level: '10',
        reorder_quantity: '50',
        storage_conditions: '',
        requires_prescription: true,
    });

    // Stock replenishment states
    const [showStockModal, setShowStockModal] = useState(false);
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [incomingQuantity, setIncomingQuantity] = useState('');
    const [stockNotes, setStockNotes] = useState('');
    const [addingStock, setAddingStock] = useState(false);

    // Reorder states
    const [showReorderModal, setShowReorderModal] = useState(false);
    const [selectedReorderDrug, setSelectedReorderDrug] = useState(null);
    const [reorderQuantity, setReorderQuantity] = useState('');
    const [reorderNotes, setReorderNotes] = useState('');
    const [sendingReorder, setSendingReorder] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(50);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDrugs, setTotalDrugs] = useState(0);

    const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

    useEffect(() => {
        setCurrentPage(1); // Reset to page 1 when search or filter changes
    }, [searchTerm, stockFilter]);

    useEffect(() => {
        fetchDrugs();
    }, [searchTerm, currentPage, perPage, stockFilter]);

    const fetchDrugs = async () => {
        setFetchLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (stockFilter === 'low') params.append('low_stock', 'true');
            if (stockFilter === 'out') params.append('out_of_stock', 'true');
            params.append('page', currentPage);
            params.append('per_page', perPage);

            const response = await axios.get(`${API_BASE}/pharmacy/drugs?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Handle Laravel pagination response
            const data = response.data;
            setDrugs(data.data || []);
            setTotalPages(data.last_page || 1);
            setTotalDrugs(data.total || 0);
        } catch (error) {
            console.error('Error fetching drugs:', error);
        } finally {
            setFetchLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                default_unit_price: parseFloat(formData.default_unit_price),
                current_stock: parseInt(formData.current_stock) || 0,
                reorder_level: parseInt(formData.reorder_level),
                reorder_quantity: parseInt(formData.reorder_quantity),
            };

            if (editingDrug) {
                await axios.put(`${API_BASE}/pharmacy/drugs/${editingDrug.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_BASE}/pharmacy/drugs`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setShowModal(false);
            resetForm();
            fetchDrugs();
        } catch (error) {
            console.error('Error saving drug:', error);
            alert(error.response?.data?.message || 'Failed to save drug');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this drug?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE}/pharmacy/drugs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDrugs();
        } catch (error) {
            console.error('Error deleting drug:', error);
            alert('Failed to delete drug');
        }
    };

    const openEditModal = (drug) => {
        setEditingDrug(drug);
        setFormData({
            generic_name: drug.generic_name,
            brand_names: drug.brand_names || [],
            dosage_form: drug.dosage_form,
            strength: drug.strength || '',
            drug_category: drug.drug_category,
            default_unit_price: drug.default_unit_price,
            current_stock: drug.current_stock || 0,
            reorder_level: drug.reorder_level,
            reorder_quantity: drug.reorder_quantity,
            storage_conditions: drug.storage_conditions || '',
            requires_prescription: drug.requires_prescription,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            generic_name: '',
            brand_names: [],
            dosage_form: 'tablet',
            strength: '',
            drug_category: '',
            default_unit_price: '',
            current_stock: '0',
            reorder_level: '10',
            reorder_quantity: '50',
            storage_conditions: '',
            requires_prescription: true,
        });
        setEditingDrug(null);
    };

    const openStockModal = (drug) => {
        setSelectedDrug(drug);
        setIncomingQuantity('');
        setStockNotes('');
        setShowStockModal(true);
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        if (!selectedDrug || !incomingQuantity || parseInt(incomingQuantity) < 1) {
            alert('Please enter a valid quantity');
            return;
        }

        setAddingStock(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE}/pharmacy/drugs/${selectedDrug.id}/add-stock`,
                {
                    quantity: parseInt(incomingQuantity),
                    notes: stockNotes
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                });

            setShowStockModal(false);
            fetchDrugs();
            alert(`Successfully added ${incomingQuantity} units to ${selectedDrug.generic_name}`);
        } catch (error) {
            console.error('Error adding stock:', error);
            alert(error.response?.data?.message || 'Failed to add stock');
        } finally {
            setAddingStock(false);
        }
    };

    // Helper function to determine stock status
    const getStockStatus = (drug) => {
        const stock = drug.current_stock || 0;
        const reorderLevel = drug.reorder_level || 0;

        if (stock === 0) return 'out';
        if (stock < reorderLevel) return 'low';
        return 'normal';
    };

    const handleReorder = (drug) => {
        setSelectedReorderDrug(drug);
        setReorderQuantity(drug.reorder_quantity || '50');
        setReorderNotes('');
        setShowReorderModal(true);
    };

    const submitReorder = async (e) => {
        e.preventDefault();
        if (!selectedReorderDrug || !reorderQuantity || parseInt(reorderQuantity) < 1) {
            alert('Please enter a valid quantity');
            return;
        }

        setSendingReorder(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE}/pharmacy/drugs/${selectedReorderDrug.id}/reorder`, {
                quantity: parseInt(reorderQuantity),
                notes: reorderNotes
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowReorderModal(false);
            alert(`Reorder request for ${selectedReorderDrug.generic_name} sent to Main Store.`);
        } catch (error) {
            console.error('Error sending reorder request:', error);
            alert(error.response?.data?.message || 'Failed to send reorder request');
        } finally {
            setSendingReorder(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="pharmacy-drugs">
                <div className="page-header mt-8">
                    <div className="header-content ">
                        <Pill className="header-icon" />
                        <div className="header-text">
                            <h1>Pharmacy Store</h1>
                            <p>Manage drug catalogue and inventory</p>
                        </div>
                    </div>
                </div>

                <div className="search-bar">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search by drug name or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Stock Filter Buttons */}
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${stockFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setStockFilter('all')}
                        disabled={fetchLoading}
                    >
                        {fetchLoading && stockFilter === 'all' && <Loader className="animate-spin" size={14} />}
                        All Items
                    </button>
                    <button
                        className={`filter-btn filter-low ${stockFilter === 'low' ? 'active' : ''}`}
                        onClick={() => setStockFilter('low')}
                        disabled={fetchLoading}
                    >
                        {fetchLoading && stockFilter === 'low' && <Loader className="animate-spin" size={14} />}
                        Low Stock
                    </button>
                    <button
                        className={`filter-btn filter-out ${stockFilter === 'out' ? 'active' : ''}`}
                        onClick={() => setStockFilter('out')}
                        disabled={fetchLoading}
                    >
                        {fetchLoading && stockFilter === 'out' && <Loader className="animate-spin" size={14} />}
                        Out of Stock
                    </button>
                </div>

                {/* Drugs Grid with Loading Overlay */}
                <div style={{ position: 'relative', minHeight: '200px' }}>
                    {fetchLoading && (
                        <div className="loading-overlay">
                            <Loader className="animate-spin" size={40} />
                            <p>Loading drugs...</p>
                        </div>
                    )}
                    <div className={`drugs-grid ${fetchLoading ? 'loading' : ''}`}>
                        {drugs.map(drug => {
                            const stockStatus = getStockStatus(drug);
                            return (
                                <div key={drug.id} className={`drug-card stock-${stockStatus}`}>
                                    <div className="drug-header">
                                        <div>
                                            <h3>{drug.generic_name}</h3>
                                            {drug.brand_names?.length > 0 && (
                                                <p className="brand-names">{drug.brand_names.join(', ')}</p>
                                            )}
                                        </div>
                                        <span className="drug-code">{drug.drug_code}</span>
                                    </div>

                                    <div className="drug-details">
                                        <div className="detail-item">
                                            <span className="label">Form:</span>
                                            <span>{drug.dosage_form}</span>
                                        </div>
                                        {drug.strength && (
                                            <div className="detail-item">
                                                <span className="label">Strength:</span>
                                                <span>{drug.strength}</span>
                                            </div>
                                        )}
                                        <div className="detail-item">
                                            <span className="label">Category:</span>
                                            <span>{drug.drug_category}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Price:</span>
                                            <span className="price">KES {drug.default_unit_price}</span>
                                        </div>
                                    </div>

                                    <div className="stock-info">
                                        <div className="stock-item">
                                            <Package size={16} />
                                            <span>Stock: {drug.current_stock || 0}</span>
                                        </div>
                                        <div className="stock-item">
                                            <span>Reorder: {drug.reorder_level}</span>
                                        </div>
                                    </div>

                                    <div className="drug-actions">
                                        {['low', 'out'].includes(getStockStatus(drug)) && (
                                            <button
                                                onClick={() => handleReorder(drug)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
                                                title="Reorder from Main Store"
                                            >
                                                <Send size={14} />
                                                <span>Reorder</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pagination Controls */}
                {totalDrugs > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        {/* Per page selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#4a5568' }}>Show:</span>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(parseInt(e.target.value));
                                    setCurrentPage(1);
                                }}
                                disabled={fetchLoading}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '14px',
                                    opacity: fetchLoading ? 0.6 : 1,
                                    cursor: fetchLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="30">30</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            <span style={{ fontSize: '14px', color: '#718096' }}>
                                Showing {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalDrugs)} of {totalDrugs} drugs
                            </span>
                        </div>

                        {/* Page navigation */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', background: currentPage === 1 ? '#e2e8f0' : '#10b981', color: currentPage === 1 ? '#a0aec0' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}
                            >
                                First
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', background: currentPage === 1 ? '#e2e8f0' : '#10b981', color: currentPage === 1 ? '#a0aec0' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}
                            >
                                Previous
                            </button>
                            <span style={{ fontSize: '14px', color: '#4a5568', fontWeight: '600', minWidth: '100px', textAlign: 'center' }}>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', background: currentPage === totalPages ? '#e2e8f0' : '#10b981', color: currentPage === totalPages ? '#a0aec0' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}
                            >
                                Next
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', background: currentPage === totalPages ? '#e2e8f0' : '#10b981', color: currentPage === totalPages ? '#a0aec0' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}
                            >
                                Last
                            </button>
                        </div>
                    </div>
                )}

                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>{editingDrug ? 'Edit Drug' : 'Add New Drug'}</h2>

                            <form onSubmit={handleSubmit}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Generic Name *</label>
                                        <input
                                            type="text"
                                            value={formData.generic_name}
                                            onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Dosage Form *</label>
                                        <select
                                            value={formData.dosage_form}
                                            onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                                            required
                                        >
                                            <option value="tablet">Tablet</option>
                                            <option value="capsule">Capsule</option>
                                            <option value="syrup">Syrup</option>
                                            <option value="injection">Injection</option>
                                            <option value="cream">Cream/Ointment</option>
                                            <option value="drops">Drops</option>
                                            <option value="inhaler">Inhaler</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Strength</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 500mg, 5ml"
                                            value={formData.strength}
                                            onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Category *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Antibiotic, Analgesic"
                                            value={formData.drug_category}
                                            onChange={(e) => setFormData({ ...formData, drug_category: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Unit Price (KES) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.default_unit_price}
                                            onChange={(e) => setFormData({ ...formData, default_unit_price: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Current Stock *</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.current_stock}
                                            onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Reorder Level *</label>
                                        <input
                                            type="number"
                                            value={formData.reorder_level}
                                            onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Reorder Quantity *</label>
                                        <input
                                            type="number"
                                            value={formData.reorder_quantity}
                                            onChange={(e) => setFormData({ ...formData, reorder_quantity: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Storage Conditions</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Store in cool, dry place"
                                            value={formData.storage_conditions}
                                            onChange={(e) => setFormData({ ...formData, storage_conditions: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group checkbox-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.requires_prescription}
                                                onChange={(e) => setFormData({ ...formData, requires_prescription: e.target.checked })}
                                            />
                                            Requires Prescription
                                        </label>
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={loading} className="btn-primary">
                                        {loading ? 'Saving...' : editingDrug ? 'Update Drug' : 'Add Drug'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Stock Replenishment Modal */}
                {showStockModal && selectedDrug && (
                    <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                            <h2>Add Stock - {selectedDrug.generic_name}</h2>

                            <form onSubmit={handleAddStock}>
                                <div className="stock-modal-info" style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ fontWeight: '500' }}>Current Stock:</span>
                                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#4f46e5' }}>{selectedDrug.current_stock || 0} units</span>
                                    </div>
                                    {incomingQuantity && parseInt(incomingQuantity) > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #d1d5db' }}>
                                            <span style={{ fontWeight: '500' }}>New Total:</span>
                                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                                                {(selectedDrug.current_stock || 0) + parseInt(incomingQuantity)} units
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Incoming Quantity *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={incomingQuantity}
                                        onChange={(e) => setIncomingQuantity(e.target.value)}
                                        placeholder="Enter quantity to add"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Notes (Optional)</label>
                                    <textarea
                                        value={stockNotes}
                                        onChange={(e) => setStockNotes(e.target.value)}
                                        placeholder="e.g., Batch number, supplier name, etc."
                                        rows="3"
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowStockModal(false)} className="btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={addingStock} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {addingStock ? (
                                            <>
                                                <Loader className="animate-spin" size={16} />
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <Package size={16} />
                                                Add Stock
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Reorder Modal */}
                {showReorderModal && selectedReorderDrug && (
                    <div className="modal-overlay" onClick={() => setShowReorderModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <Send className="text-indigo-600" size={24} />
                                <h2 style={{ margin: 0 }}>Reorder Drug - {selectedReorderDrug.generic_name}</h2>
                            </div>

                            <form onSubmit={submitReorder}>
                                <div className="form-group">
                                    <label>Reorder Quantity *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={reorderQuantity}
                                        onChange={(e) => setReorderQuantity(e.target.value)}
                                        placeholder="Enter quantity to request"
                                        required
                                        autoFocus
                                    />
                                    <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        Default reorder quantity: {selectedReorderDrug.reorder_quantity}
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label>Notes (Optional)</label>
                                    <textarea
                                        value={reorderNotes}
                                        onChange={(e) => setReorderNotes(e.target.value)}
                                        placeholder="Add any specific instructions for the main store..."
                                        rows="3"
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                                    />
                                </div>

                                <div className="modal-actions" style={{ marginTop: '24px' }}>
                                    <button type="button" onClick={() => setShowReorderModal(false)} className="btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={sendingReorder} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#4f46e5' }}>
                                        {sendingReorder ? (
                                            <>
                                                <Loader className="animate-spin" size={16} />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                Send Request
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PharmacyDrugs;
