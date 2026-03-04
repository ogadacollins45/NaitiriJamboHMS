import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Pill, AlertCircle, Loader, XCircle } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

// Major drug categories
const DRUG_CATEGORIES = [
    'Analgesics & Pain Relief',
    'Antibiotics',
    'Antifungals',
    'Antivirals',
    'Antihistamines & Allergy',
    'Antihypertensives',
    'Antidiabetics',
    'Cardiovascular',
    'Gastrointestinal',
    'Respiratory',
    'Dermatological',
    'Ophthalmic',
    'Supplements & Vitamins',
    'Antimalarials',
    'Antiparasitics',
    'Vaccines',
    'Anesthetics',
    'Other'
];

const AddDrugModal = ({ isOpen, onClose, onSuccess, editingDrug = null }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [expiryNA, setExpiryNA] = useState(false);

    const [formData, setFormData] = useState({
        // Basic drug info
        name: '',
        generic_name: '',
        dosage_form: 'tablet',
        strength: '',
        drug_category: '',

        // Stock & pricing
        quantity: '',
        unit: 'tablets',
        unit_price: '',
        reorder_level: '0',

        // Additional
        supplier_id: '',
        expiry_date: '',
        batch_no: '',
        additional_info: ''
    });

    const [brandName, setBrandName] = useState('');
    const [brandNames, setBrandNames] = useState([]);

    useEffect(() => {
        fetchSuppliers();
        if (editingDrug) {
            setFormData({
                name: editingDrug.name || '',
                generic_name: editingDrug.pharmacy_drug?.generic_name || '',
                dosage_form: editingDrug.pharmacy_drug?.dosage_form || 'tablet',
                strength: editingDrug.pharmacy_drug?.strength || '',
                drug_category: editingDrug.pharmacy_drug?.drug_category || '',
                quantity: editingDrug.quantity || '',
                unit: editingDrug.unit || 'tablets',
                unit_price: editingDrug.unit_price || '',
                reorder_level: editingDrug.reorder_level || '',
                supplier_id: editingDrug.supplier_id || '',
                expiry_date: editingDrug.expiry_date || '',
                batch_no: editingDrug.batch_no || '',
                additional_info: editingDrug.pharmacy_drug?.storage_conditions || ''
            });
            setBrandNames(editingDrug.pharmacy_drug?.brand_names || []);
            setExpiryNA(!editingDrug.expiry_date);
        }
    }, [editingDrug]);

    const fetchSuppliers = async () => {
        try {
            const res = await axios.get(`${API_URL}/suppliers`);
            setSuppliers(res.data || []);
        } catch (err) {
            console.error('Error fetching suppliers:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddBrandName = () => {
        if (brandName.trim() && !brandNames.includes(brandName.trim())) {
            setBrandNames(prev => [...prev, brandName.trim()]);
            setBrandName('');
        }
    };

    const handleRemoveBrandName = (brand) => {
        setBrandNames(prev => prev.filter(b => b !== brand));
    };

    const handleExpiryNAToggle = () => {
        setExpiryNA(!expiryNA);
        if (!expiryNA) {
            setFormData(prev => ({ ...prev, expiry_date: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                brand_names: brandNames,
                expiry_date: expiryNA ? null : formData.expiry_date
            };

            if (editingDrug) {
                await axios.put(`${API_URL}/main-store/drugs/${editingDrug.id}`, payload);
            } else {
                await axios.post(`${API_URL}/main-store/drugs`, payload);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to save drug. Please check your input.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 relative rounded-t-2xl">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Pill className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">
                                {editingDrug ? 'Edit Drug' : 'Add New Drug'}
                            </h3>
                            <p className="text-blue-100 text-sm mt-1">Essential drug information for Main Store</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-250px)] overflow-y-auto">
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center">
                            <AlertCircle className="w-5 h-5 mr-3" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Drug Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Drug Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g., Paracetamol 500mg"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Generic Name * (The name displayed) </label>
                            <input
                                type="text"
                                name="generic_name"
                                value={formData.generic_name}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g., Paracetamol"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Dosage Form *</label>
                            <select
                                name="dosage_form"
                                value={formData.dosage_form}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                <option value="tablet">Tablet</option>
                                <option value="capsule">Capsule</option>
                                <option value="syrup">Syrup</option>
                                <option value="suspension">Suspension</option>
                                <option value="injection">Injection</option>
                                <option value="cream">Cream</option>
                                <option value="ointment">Ointment</option>
                                <option value="gel">Gel</option>
                                <option value="drops">Drops</option>
                                <option value="inhaler">Inhaler</option>
                                <option value="suppository">Suppository</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Strength</label>
                            <input
                                type="text"
                                name="strength"
                                value={formData.strength}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g., 500mg, 5ml"
                            />
                        </div>

                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Drug Category *</label>
                            <select
                                name="drug_category"
                                value={formData.drug_category}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                <option value="">Select category</option>
                                {DRUG_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Brand Names (Optional)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Add brand name"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBrandName())}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddBrandName}
                                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-medium"
                                >
                                    Add
                                </button>
                            </div>
                            {brandNames.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {brandNames.map((brand, index) => (
                                        <span key={index} className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                                            {brand}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveBrandName(brand)}
                                                className="ml-2 text-indigo-600 hover:text-indigo-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stock & Pricing */}
                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Stock & Pricing</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="0"
                                    required
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                                <select
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="tablets">Tablets</option>
                                    <option value="capsules">Capsules</option>
                                    <option value="bottles">Bottles</option>
                                    <option value="boxes">Boxes</option>
                                    <option value="vials">Vials</option>
                                    <option value="sachets">Sachets</option>
                                    <option value="pieces">Pieces</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price (KSH) *</label>
                                <input
                                    type="number"
                                    name="unit_price"
                                    value={formData.unit_price}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="0.00"
                                    step="0.01"
                                    required
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Level</label>
                                <input
                                    type="number"
                                    name="reorder_level"
                                    value={formData.reorder_level}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="10"
                                    min="0"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                                <select
                                    name="supplier_id"
                                    value={formData.supplier_id}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number (Optional)</label>
                                <input
                                    type="text"
                                    name="batch_no"
                                    value={formData.batch_no}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., BN-12345"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Additional Information</h4>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        name="expiry_date"
                                        value={formData.expiry_date}
                                        onChange={handleChange}
                                        className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        disabled={expiryNA}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleExpiryNAToggle}
                                        className={`px-4 py-2 rounded-lg font-medium transition ${expiryNA
                                            ? 'bg-gray-400 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        {expiryNA ? <XCircle size={18} className="inline mr-1" /> : null}
                                        N/A
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                                <textarea
                                    name="additional_info"
                                    value={formData.additional_info}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    rows="3"
                                    placeholder="Storage conditions, handling instructions, or other notes..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition"
                        >
                            {loading ? (
                                <><Loader className="animate-spin mr-2 h-5 w-5" /> Saving...</>
                            ) : (
                                editingDrug ? 'Update Drug' : 'Add Drug'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDrugModal;
