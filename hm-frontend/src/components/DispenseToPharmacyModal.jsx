import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Send, Package, Calendar, DollarSign, AlertCircle, Loader, CheckCircle, History, User, Clock, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const DispenseToPharmacyModal = ({ isOpen, onClose, drug, onSuccess }) => {

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [currentDrug, setCurrentDrug] = useState(drug);
    const [success, setSuccess] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isExpiryNA, setIsExpiryNA] = useState(false); // New state for N/A expiry

    const [formData, setFormData] = useState({
        quantity: '',
        batch_number: '',
        expiry_date: '',
        unit_cost: '',
        unit_price: '',
        supplier_id: '',
        storage_location: 'Pharmacy',
        notes: '',
        reorder_level: '',
    });

    useEffect(() => {
        if (drug) {
            setCurrentDrug(drug);
            fetchSuppliers();
            fetchHistory();
            setFormData(prev => ({
                ...prev,
                unit_cost: drug.unit_price || '',
                unit_price: (parseFloat(drug.unit_price) * 1.2).toFixed(2) || '', // 20% markup
                supplier_id: drug.supplier_id || '',
                batch_number: drug.batch_no || '',
                expiry_date: drug.expiry_date || '',
                reorder_level: drug.pharmacy_drug?.reorder_level || '10', // Default to 10 if not set
            }));
            setSuccess(false);
            setError('');
            setIsExpiryNA(false); // Reset N/A state on drug change
        }
    }, [drug, isOpen]);

    const refreshStock = async () => {
        if (!drug?.id) return;
        setRefreshing(true);
        try {
            const res = await axios.get(`${API_URL}/main-store/drugs/${drug.id}`);
            setCurrentDrug(res.data);
            setFormData(prev => ({
                ...prev,
                unit_cost: res.data.unit_price || prev.unit_cost,
                supplier_id: res.data.supplier_id || prev.supplier_id,
            }));
        } catch (err) {
            console.error('Error refreshing drug data:', err);
            setError('Failed to refresh stock levels.');
        } finally {
            setRefreshing(false);
        }
    };

    const fetchHistory = async () => {
        if (!drug?.id) return;
        setLoadingHistory(true);
        try {
            const res = await axios.get(`${API_URL}/main-store/drugs/${drug.id}/dispensation-history`);
            setHistory(res.data || []);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

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

        if (parseInt(formData.quantity) > currentDrug.quantity) {
            setError(`Cannot dispense more than available stock (${currentDrug.quantity} ${currentDrug.unit || 'units'})`);
            return;
        }

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const payload = {
                ...formData,
                expiry_date: isExpiryNA ? null : formData.expiry_date, // Set expiry_date to null if N/A is checked
            };

            await axios.post(`${API_URL}/main-store/drugs/${drug.id}/dispense`, payload);
            setSuccess(true);
            fetchHistory(); // Refresh history
            setTimeout(() => {
                setSuccess(false);
            }, 5000); // Auto-dismiss after 5s

            // Still close modal after a short delay for UX
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to dispense to pharmacy. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !drug || !currentDrug) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 relative rounded-t-2xl">
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
                            <h3 className="text-2xl font-bold text-white">Dispense to Pharmacy</h3>
                            <p className="text-green-100 text-sm mt-1">Transfer stock from Main Store to Pharmacy</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* History Section */}
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center justify-between w-full p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-2 text-gray-700 font-semibold">
                                <History size={18} className="text-indigo-600" />
                                <span>Past Dispensations History</span>
                                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                                    {history.length}
                                </span>
                            </div>
                            {showHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        {showHistory && (
                            <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <div className="max-h-48 overflow-y-auto">
                                    {loadingHistory ? (
                                        <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                                            <Loader className="animate-spin h-4 w-4" /> Loading history...
                                        </div>
                                    ) : history.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 bg-white italic">
                                            No past dispensations found for this drug.
                                        </div>
                                    ) : (
                                        <table className="w-full text-sm text-left bg-white">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                                <tr>
                                                    <th className="px-4 py-2">Date</th>
                                                    <th className="px-4 py-2">Qty</th>
                                                    <th className="px-4 py-2">Batch</th>
                                                    <th className="px-4 py-2">By</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {history.map((txn) => (
                                                    <tr key={txn.id} className="border-b hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-gray-900">
                                                                    {new Date(txn.transaction_date).toLocaleDateString()}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
                                                                    <Clock size={10} /> {new Date(txn.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-indigo-600">
                                                            {txn.quantity} {drug.unit}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 font-mono">
                                                            {txn.batch?.batch_number || 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1.5 text-gray-700">
                                                                <div className="p-1 bg-gray-100 rounded-full">
                                                                    <User size={12} className="text-gray-500" />
                                                                </div>
                                                                <span className="truncate max-w-[100px]" title={`${txn.performed_by_staff?.first_name} ${txn.performed_by_staff?.last_name}`}>
                                                                    {txn.performed_by_staff ? `${txn.performed_by_staff.first_name} ${txn.performed_by_staff.last_name[0]}.` : 'Unknown'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Drug Info Banner */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl mb-6 border border-indigo-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Drug Name</p>
                                <p className="text-lg font-bold text-gray-900">{drug.name}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Code: <span className="font-semibold">{drug.item_code}</span>
                                </p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm text-gray-600 font-medium">Available Stock</p>
                                    <button
                                        type="button"
                                        onClick={refreshStock}
                                        className={`p-1 rounded-full hover:bg-indigo-100 text-indigo-600 transition-all ${refreshing ? 'animate-spin' : ''}`}
                                        title="Refresh stock levels"
                                        disabled={refreshing}
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>
                                <p className="text-2xl font-bold text-indigo-700">
                                    {currentDrug.quantity} <span className="text-sm text-gray-600">{currentDrug.unit || 'units'}</span>
                                </p>
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
                            <p>Successfully dispensed to pharmacy!</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Quantity and Batch */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity to Dispense *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Package className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="0"
                                        required
                                        min="1"
                                        max={drug.quantity}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Max: {drug.quantity} {drug.unit || 'units'}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number (Optional)</label>
                                <input
                                    type="text"
                                    name="batch_number"
                                    value={formData.batch_number}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    placeholder="e.g., BATCH-2024-001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Pharmacy Reorder Level *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <AlertCircle className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        name="reorder_level"
                                        value={formData.reorder_level}
                                        onChange={handleChange}
                                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="10"
                                        required
                                        min="0"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Alert threshold for pharmacy stock</p>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Unit Cost (KSH) *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        name="unit_cost"
                                        value={formData.unit_cost}
                                        onChange={handleChange}
                                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Unit Selling Price (KSH) *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        name="unit_price"
                                        value={formData.unit_price}
                                        onChange={handleChange}
                                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                        min="0"
                                    />
                                </div>
                                {formData.unit_cost && formData.unit_price && (
                                    <p className="text-xs text-gray-600 mt-1">
                                        Markup: {(((parseFloat(formData.unit_price) - parseFloat(formData.unit_cost)) / parseFloat(formData.unit_cost)) * 100).toFixed(1)}%
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Expiry and Supplier */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Expiry Date *</label>
                                    <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-4 w-4 text-green-600 transition duration-150 ease-in-out"
                                            checked={isExpiryNA}
                                            onChange={(e) => setIsExpiryNA(e.target.checked)}
                                        />
                                        <span className="ml-2">N/A</span>
                                    </label>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        name="expiry_date"
                                        value={isExpiryNA ? '' : formData.expiry_date} // Clear value if N/A
                                        onChange={handleChange}
                                        className={`w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 ${isExpiryNA ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        required={!isExpiryNA} // Not required if N/A
                                        disabled={isExpiryNA} // Disable if N/A
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                                <select
                                    name="supplier_id"
                                    value={formData.supplier_id}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">Select supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Storage Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Storage Location in Pharmacy</label>
                            <input
                                type="text"
                                name="storage_location"
                                value={formData.storage_location}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="e.g., Shelf A1, Cold Storage"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="3"
                                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="Any additional notes about this dispensation..."
                            />
                        </div>

                        {/* Summary */}
                        {formData.quantity && formData.unit_cost && (
                            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                <h4 className="font-semibold text-gray-800 mb-2">Dispensation Summary</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-600">Quantity:</span>
                                        <span className="font-semibold ml-2">{formData.quantity} {drug.unit || 'units'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Remaining in Main Store:</span>
                                        <span className="font-semibold ml-2">{currentDrug.quantity - formData.quantity} {currentDrug.unit || 'units'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Total Cost:</span>
                                        <span className="font-semibold ml-2">KSH {(formData.quantity * formData.unit_cost).toFixed(2)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Total Value:</span>
                                        <span className="font-semibold ml-2">KSH {(formData.quantity * formData.unit_price).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

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
                                className="flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-all duration-300"
                            >
                                {loading ? (
                                    <><Loader className="animate-spin mr-2 h-5 w-5" /> Processing...</>
                                ) : success ? (
                                    <><CheckCircle className="mr-2 h-5 w-5" /> Success!</>
                                ) : (
                                    <><Send className="mr-2 h-5 w-5" /> Dispense to Pharmacy</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DispenseToPharmacyModal;
