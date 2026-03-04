import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertCircle, Info, Loader } from 'lucide-react';
import axios from 'axios';

const BulkDeleteModal = ({ isOpen, onClose, unlinkedDrugs, onSuccess }) => {
    const [selectedDrugs, setSelectedDrugs] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedDrugs([...unlinkedDrugs]);
            setError('');
        }
    }, [isOpen, unlinkedDrugs]);

    const handleRemoveFromList = (drugId) => {
        setSelectedDrugs(selectedDrugs.filter(d => d.id !== drugId));
    };

    const handleConfirmDelete = async () => {
        if (selectedDrugs.length === 0) {
            setError('Please keep at least one drug in the list to delete, or close the modal.');
            return;
        }

        setIsDeleting(true);
        setError('');
        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            const ids = selectedDrugs.map(d => d.id);

            await axios.delete(`${apiBaseUrl}/api/main-store/drugs/bulk-delete-unlinked`, {
                data: { ids }
            });

            onSuccess();
            onClose();
        } catch (err) {
            console.error('Bulk delete error:', err);
            setError(err.response?.data?.message || 'Failed to perform bulk deletion. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Review Bulk Deletion</h2>
                            <p className="text-sm text-red-600 font-medium">
                                You are about to soft-delete {selectedDrugs.length} unlinked items
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-100 rounded-full text-red-400 hover:text-red-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                            <AlertCircle size={20} className="flex-shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <Info className="text-blue-500 mt-0.5" size={20} />
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">Important Note:</p>
                            <p>Removing a drug from this list simply excludes it from deletion this time. It will remain in the Main Store.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {selectedDrugs.length > 0 ? (
                            selectedDrugs.map((drug) => (
                                <div key={drug.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors group">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900">{drug.name}</span>
                                        <span className="text-xs text-gray-500 font-mono">{drug.item_code}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFromList(drug.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Exclude from deletion"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-500 font-medium">The deletion list is empty.</p>
                                <button
                                    onClick={onClose}
                                    className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-semibold"
                                >
                                    Close and cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmDelete}
                        disabled={isDeleting || selectedDrugs.length === 0}
                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isDeleting ? (
                            <>
                                <Loader size={18} className="animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 size={18} />
                                Confirm Delete {selectedDrugs.length} Items
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkDeleteModal;
