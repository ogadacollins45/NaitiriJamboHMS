import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import axios from 'axios';
import Preloader from '../components/Preloader';
import AddDrugModal from '../components/AddDrugModal';
import DispenseToPharmacyModal from '../components/DispenseToPharmacyModal';
import DrugImportModal from '../components/DrugImportModal';
import BulkDeleteModal from '../components/BulkDeleteModal';
import { PlusCircle, Search, Edit, Trash2, Pill, Send, ChevronLeft, AlertCircle, CheckCircle, Link, Download, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/main-store/drugs`;

const MainStoreDrugs = () => {
    const navigate = useNavigate();
    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [linkFilter, setLinkFilter] = useState('all'); // 'all', 'linked', 'unlinked'

    const [showAddModal, setShowAddModal] = useState(false);
    const [showDispenseModal, setShowDispenseModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [editingDrug, setEditingDrug] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [reorderRequests, setReorderRequests] = useState([]);
    const [showReorderModal, setShowReorderModal] = useState(false);

    const [showError, setShowError] = useState('');
    const [showSuccess, setShowSuccess] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchDrugs();
        fetchReorderRequests();
    }, []);

    const fetchReorderRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/main-store/drugs/reorder-requests/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReorderRequests(res.data || []);
        } catch (err) {
            console.error('Error fetching reorder requests:', err);
        }
    };

    useEffect(() => {
        fetchDrugs();
    }, [linkFilter]);

    const fetchDrugs = async () => {
        setLoading(true);
        try {
            const params = {
                linked: linkFilter === 'all' ? undefined : linkFilter === 'linked' ? 'yes' : 'no',
                per_page: 1000, // Get all for client-side filtering
            };
            const res = await axios.get(API_URL, { params });
            setDrugs(res.data.data || res.data);
        } catch (err) {
            console.error('Error fetching drugs:', err);
            setShowError('Failed to fetch drugs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSuccess = () => {
        setShowSuccess('Drug added successfully!');
        fetchDrugs();
        setTimeout(() => setShowSuccess(''), 3000);
    };

    const handleEditDrug = (drug) => {
        setEditingDrug(drug);
        setShowAddModal(true);
    };

    const handleDispenseDrug = (drug) => {
        if (!drug.pharmacy_drug_id) {
            setShowError('This drug is not linked to pharmacy. Please link it first.');
            return;
        }
        setSelectedDrug(drug);
        setShowDispenseModal(true);
    };

    const handleProcessReorder = (request) => {
        if (request.pharmacy_drug?.inventory_item) {
            setSelectedDrug(request.pharmacy_drug.inventory_item);
            setShowDispenseModal(true);
            setShowReorderModal(false);
            window._pendingReorderRequestId = request.id;
        } else {
            setShowError('This pharmacy drug is not linked to any item in Main Store.');
            setTimeout(() => setShowError(''), 3000);
        }
    };

    const handleDismissReorder = async (requestId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/main-store/drugs/reorder-requests/${requestId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchReorderRequests();
        } catch (err) {
            console.error('Error dismissing reorder request:', err);
        }
    };

    const handleDispenseSuccess = async () => {
        fetchDrugs();
        if (window._pendingReorderRequestId) {
            await handleDismissReorder(window._pendingReorderRequestId);
            window._pendingReorderRequestId = null;
        }
        fetchReorderRequests();
        setShowDispenseModal(false);
        setShowSuccess('Dispensation successful!');
        setTimeout(() => setShowSuccess(''), 3000);
    };

    const handleDeleteDrug = async (drug) => {
        const confirmMsg = drug.pharmacy_drug_id
            ? `Are you sure you want to delete "${drug.name}"? This will also delete it from the Pharmacy Inventory.`
            : `Are you sure you want to delete "${drug.name}"?`;

        if (!window.confirm(confirmMsg)) return;

        setDeleting(true);
        setShowError('');
        try {
            await axios.delete(`${API_URL}/${drug.id}/delete-completely`);
            setShowSuccess(`Drug "${drug.name}" deleted successfully.`);
            fetchDrugs();
            setTimeout(() => setShowSuccess(''), 3000);
        } catch (err) {
            console.error(err);
            setShowError(err.response?.data?.message || 'Failed to delete drug.');
        } finally {
            setDeleting(false);
        }
    };

    const handleBulkDeleteUnlinked = async () => {
        const unlinked = drugs.filter(d => !d.pharmacy_drug_id);
        if (unlinked.length === 0) {
            setShowError('No unlinked drugs found to delete.');
            return;
        }
        setShowBulkDeleteModal(true);
    };

    const filteredDrugs = drugs.filter(drug =>
        drug.name.toLowerCase().includes(search.toLowerCase()) ||
        drug.item_code.toLowerCase().includes(search.toLowerCase()) ||
        (drug.pharmacy_drug?.generic_name || '').toLowerCase().includes(search.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredDrugs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedDrugs = filteredDrugs.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, linkFilter]);

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="w-full">
                    {/* Header */}
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-300 mr-4"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-600" />
                        </button>

                    </div>

                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full">
                        {/* Header Section */}
                        <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-600 to-indigo-600">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Pill className="w-8 h-8 text-white mr-4" />
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Main Drug Store</h2>
                                        <p className="text-blue-100 text-sm mt-1">{filteredDrugs.length} medicine(s) in stock</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Reorder Notifications */}
                                    <button
                                        onClick={() => setShowReorderModal(true)}
                                        className="relative p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 group"
                                        title="Reorder Requests from Pharmacy"
                                    >
                                        <Bell className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                                        {reorderRequests.length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-indigo-600 animate-pulse">
                                                {reorderRequests.length}
                                            </span>
                                        )}
                                    </button>

                                    <button
                                        onClick={handleBulkDeleteUnlinked}
                                        disabled={deleting}
                                        className="flex items-center px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-all duration-300 shadow-sm"
                                        title="Delete all drugs not linked to pharmacy"
                                    >
                                        <Trash2 className="w-5 h-5 mr-2" /> Bulk Delete Unlinked
                                    </button>
                                    <button
                                        onClick={() => setShowImportModal(true)}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                        title="Import drugs from pharmacy inventory"
                                    >
                                        <Download className="w-5 h-5 mr-2" /> Import Drugs
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingDrug(null);
                                            setShowAddModal(true);
                                        }}
                                        className="flex items-center px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg hover:bg-blue-50 transition-all duration-300 shadow-md hover:shadow-lg"
                                    >
                                        <PlusCircle className="w-5 h-5 mr-2" /> Add New Drug
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">
                            {/* Alerts */}
                            {showError && (
                                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg flex items-center shadow-md">
                                    <AlertCircle className="w-6 h-6 mr-3" />
                                    <div>
                                        <p className="font-bold">Error</p>
                                        <p>{showError}</p>
                                    </div>
                                </div>
                            )}
                            {showSuccess && (
                                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg flex items-center shadow-md">
                                    <CheckCircle className="w-6 h-6 mr-3" />
                                    <div>
                                        <p className="font-bold">Success</p>
                                        <p>{showSuccess}</p>
                                    </div>
                                </div>
                            )}

                            {/* Filters */}
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                <div className="relative flex-grow max-w-md">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search drugs..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setLinkFilter('all')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${linkFilter === 'all'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setLinkFilter('linked')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${linkFilter === 'linked'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Linked
                                    </button>
                                    <button
                                        onClick={() => setLinkFilter('unlinked')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${linkFilter === 'unlinked'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Unlinked
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            {loading ? (
                                <Preloader />
                            ) : paginatedDrugs.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <Pill className="w-16 h-16 mx-auto mb-4" />
                                    <p className="text-xl font-semibold">No drugs found.</p>
                                    <p>Try adjusting your filters or add a new drug.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto bg-white rounded-xl shadow-md">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drug Info</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generic Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharmacy Link</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {paginatedDrugs.map((drug) => (
                                                <tr key={drug.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{drug.name}</p>
                                                            <p className="text-xs text-gray-500">{drug.item_code}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        {drug.pharmacy_drug?.generic_name || <span className="text-gray-400">N/A</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        {drug.pharmacy_drug ? (
                                                            <div>
                                                                <p>{drug.pharmacy_drug.dosage_form || 'N/A'}</p>
                                                                <p className="text-xs text-gray-500">{drug.pharmacy_drug.strength || ''}</p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={`font-semibold ${drug.quantity <= 10 ? 'text-red-600' : drug.quantity <= 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                            {drug.quantity} {drug.unit || 'units'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        KSH {parseFloat(drug.unit_price).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {drug.pharmacy_drug_id ? (
                                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                <Link className="w-3 h-3 mr-1" /> Linked
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                                Not Linked
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-center space-x-3">
                                                            <button
                                                                onClick={() => handleEditDrug(drug)}
                                                                className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200 flex items-center"
                                                                title="Edit Drug"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            {drug.pharmacy_drug_id && drug.quantity > 0 && (
                                                                <button
                                                                    onClick={() => handleDispenseDrug(drug)}
                                                                    className="text-green-600 hover:text-green-900 transition-colors duration-200 flex items-center"
                                                                    title="Dispense to Pharmacy"
                                                                >
                                                                    <Send className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDeleteDrug(drug)}
                                                                className="text-red-600 hover:text-red-900 transition-colors duration-200 flex items-center"
                                                                title="Delete Drug Completely"
                                                                disabled={deleting}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                            <div className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                                                <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredDrugs.length)}</span> of{' '}
                                                <span className="font-medium">{filteredDrugs.length}</span> drugs
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Previous
                                                </button>
                                                <span className="px-3 py-2 text-sm font-medium text-gray-700">
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <AddDrugModal
                    isOpen={showAddModal}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingDrug(null);
                    }}
                    onSuccess={handleAddSuccess}
                    editingDrug={editingDrug}
                />

                <DispenseToPharmacyModal
                    isOpen={showDispenseModal}
                    onClose={() => {
                        setShowDispenseModal(false);
                        setSelectedDrug(null);
                    }}
                    drug={selectedDrug}
                    onSuccess={handleDispenseSuccess}
                />

                <DrugImportModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={fetchDrugs}
                />

                <BulkDeleteModal
                    isOpen={showBulkDeleteModal}
                    onClose={() => setShowBulkDeleteModal(false)}
                    unlinkedDrugs={drugs.filter(d => !d.pharmacy_drug_id)}
                    onSuccess={() => {
                        setShowSuccess('Unlinked drugs deleted successfully.');
                        fetchDrugs();
                        setTimeout(() => setShowSuccess(''), 3000);
                    }}
                />

                {/* Reorder Requests Modal */}
                {showReorderModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-6 h-6 text-white" />
                                    <h3 className="text-xl font-bold text-white">Pharmacy Reorder Requests</h3>
                                </div>
                                <button onClick={() => setShowReorderModal(false)} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                                    <Trash2 className="w-5 h-5" /> {/* Using Trash2 as a close icon if X not available, or just a button */}
                                </button>
                            </div>

                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                {reorderRequests.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-20" />
                                        <p>No pending reorder requests.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {reorderRequests.map(req => (
                                            <div key={req.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <p className="font-bold text-gray-900">{req.pharmacy_drug?.generic_name}</p>
                                                                <p className="text-xs text-indigo-600 font-medium">Requested Qty: {req.quantity || 'N/A'}</p>
                                                                <p className="text-[10px] text-gray-500 mt-1">
                                                                    Current Pharmacy Stock: {req.pharmacy_drug?.current_stock || 0}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {req.notes && <p className="text-xs text-indigo-600 mt-1 italic">"{req.notes}"</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleProcessReorder(req)}
                                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                                                    >
                                                        <Send className="w-4 h-4" /> Process
                                                    </button>
                                                    <button
                                                        onClick={() => handleDismissReorder(req.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Dismiss"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => setShowReorderModal(false)}
                                    className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MainStoreDrugs;
