import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, RefreshCw, Download, Loader, X } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/admin/drug-migration`;

const DrugMigrationModal = ({ isOpen, onClose, onSuccess }) => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchStatus();
        }
    }, [isOpen]);

    const fetchStatus = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${API_URL}/status`);
            setStatus(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch migration status');
        } finally {
            setLoading(false);
        }
    };

    const handleImportSingle = async (drugId) => {
        setImporting(true);
        setError('');
        try {
            await axios.post(`${API_URL}/migrate/${drugId}`);
            setSuccess('Drug imported successfully!');
            fetchStatus();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Import failed');
        } finally {
            setImporting(false);
        }
    };

    const handleImportAll = async () => {
        if (!window.confirm(`Import all ${status?.pending} pending drugs to Main Store?`)) return;

        setImporting(true);
        setError('');
        try {
            const res = await axios.post(`${API_URL}/migrate-all`);
            setSuccess(`Successfully imported ${res.data.migrated_count} drugs!`);
            fetchStatus();
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Bulk import failed');
        } finally {
            setImporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Import Drugs to Main Store</h2>
                        <p className="text-blue-100 text-sm mt-1">Import existing Drug Inventory drugs into Main Store control</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-blue-700 rounded-full p-2 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Alerts */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                            <AlertCircle className="flex-shrink-0" size={20} />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
                            <CheckCircle className="flex-shrink-0" size={20} />
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Status Overview */}
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader className="animate-spin mx-auto text-blue-500" size={48} />
                            <p className="mt-4 text-gray-600">Loading import status...</p>
                        </div>
                    ) : status && (
                        <div>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-blue-600 mb-1">Total Drugs</p>
                                    <p className="text-3xl font-bold text-blue-700">{status.total_drugs}</p>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-green-600 mb-1">Migrated</p>
                                    <p className="text-3xl font-bold text-green-700">{status.migrated}</p>
                                </div>
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-indigo-600 mb-1">Pending</p>
                                    <p className="text-3xl font-bold text-indigo-700">{status.pending}</p>
                                </div>
                            </div>

                            {status.pending > 0 ? (
                                <>
                                    {/* Bulk Migration Button */}
                                    <button
                                        onClick={handleImportAll}
                                        disabled={importing}
                                        className="w-full mb-6 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                                    >
                                        <Download size={20} />
                                        {importing ? 'Importing...' : `Import All ${status.pending} Drugs`}
                                    </button>

                                    {/* Pending Drugs Table */}
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                            <h3 className="font-semibold text-gray-700">
                                                Pending Drugs ({status.pending_list.length})
                                            </h3>
                                        </div>
                                        <div className="overflow-x-auto max-h-96">
                                            <table className="w-full">
                                                <thead className="bg-gray-100 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            Drug Code
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            Name
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            Form
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            Strength
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            Stock
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                            Action
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {status.pending_list.map((drug) => (
                                                        <tr key={drug.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                {drug.drug_code}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                {drug.generic_name}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {drug.dosage_form}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {drug.strength || 'N/A'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {drug.current_stock || 0}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <button
                                                                    onClick={() => handleImportSingle(drug.id)}
                                                                    disabled={importing}
                                                                    className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                                >
                                                                    Import
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">All drugs imported!</h3>
                                    <p className="text-gray-600">All Drug Inventory items are now in Main Store</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition"
                    >
                        Close
                    </button>
                    <button
                        onClick={fetchStatus}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DrugMigrationModal;
