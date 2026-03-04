import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Send, Package, DollarSign, Calendar, AlertCircle, Loader, CheckCircle } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const SendToMainStoreModal = ({ isOpen, onClose, drug, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [suppliers, setSuppliers] = useState([]);

    const [formData, setFormData] = useState({
        quantity: '',
        unit: '',
        unit_price: '',
        supplier_id: '',
        reorder_level: '',
        expiry_date: '',
        batch_no: '',
        location: 'Main Store',
    });

    useEffect(() => {
        if (drug) {
            fetchSuppliers();
            setFormData({
                quantity: '0',
                unit: drug.unit_of_measure || 'tablets',
                unit_price: drug.default_unit_price || '',
                supplier_id: '',
                reorder_level: drug.reorder_level || '',
                expiry_date: '',
                batch_no: '',
                location: 'Main Store',
            });
        }
    }, [drug]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await axios.post(`${API_URL}/pharmacy/drugs/${drug.id}/send-to-main-store`, formData);
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to send to Main Store. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !drug) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 relative rounded-t-2xl">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Send className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">Reorder from Main Store</h3>
                            <p className="text-indigo-100 text-sm mt-1">Request drug reorder from Main Drug Store</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Drug Info Banner */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl mb-6 border border-indigo-200">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Pharmacy Drug</p>
                            <p className="text-lg font-bold text-gray-900">{drug.generic_name}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span>Code: <span className="font-semibold">{drug.drug_code}</span></span>
                                {drug.dosage_form && <span>Form: <span className="font-semibold">{drug.dosage_form}</span></span>}
                                {drug.strength && <span>Strength: <span className="font-semibold">{drug.strength}</span></span>}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg flex items-center">
                            <AlertCircle className="w-5 h-5 mr-3" />
                            <p>{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg flex items-center">
                            <CheckCircle className="w-5 h-5 mr-3" />
                            <p>Successfully sent to Main Store!</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Stock Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Quantity in Main Store *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Package className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0"
                                        required
                                        min="0"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Separate from pharmacy stock</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                                <select
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="tablets">Tablets</option>
                                    <option value="capsules">Capsules</option>
                                    <option value="bottles">Bottles</option>
                                    <option value="boxes">Boxes</option>
                                    <option value="vials">Vials</option>
                                    <option value="sachets">Sachets</option>
                                    <option value="pieces">Pieces</option>
                                    <option value="units">Units</option>
                                </select>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price (KSH) *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        name="unit_price"
                                        value={formData.unit_price}
                                        onChange={handleChange}
                                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Level</label>
                                <input
                                    type="number"
                                    name="reorder_level"
                                    value={formData.reorder_level}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date (Optional)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        name="expiry_date"
                                        value={formData.expiry_date}
                                        onChange={handleChange}
                                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
                                <input
                                    type="text"
                                    name="batch_no"
                                    value={formData.batch_no}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., BATCH-001"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Storage Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Main Store"
                                />
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> This will create a separate inventory item in Main Store linked to this pharmacy drug.
                                Stock quantities are maintained separately - Main Store stock is independent of Pharmacy batches.
                            </p>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-all duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || success}
                                className="flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-all duration-300"
                            >
                                {loading ? (
                                    <><Loader className="animate-spin mr-2 h-5 w-5" /> Processing...</>
                                ) : success ? (
                                    <><CheckCircle className="mr-2 h-5 w-5" /> Success!</>
                                ) : (
                                    <><Send className="mr-2 h-5 w-5" /> Send to Main Store</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SendToMainStoreModal;
