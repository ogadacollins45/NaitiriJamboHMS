import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../layout/DashboardLayout';
import { Package, Plus, Edit, Trash2, Loader, Phone, Mail, User, Building, MapPin, Tag, Search } from 'lucide-react';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        category: 'general'
    });
    const [saving, setSaving] = useState(false);

    const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/suppliers`;

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        filterSuppliers();
    }, [suppliers, searchTerm, categoryFilter]);

    const filterSuppliers = () => {
        let filtered = suppliers;

        if (searchTerm) {
            filtered = filtered.filter(s =>
                s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(s => s.category === categoryFilter);
        }

        setFilteredSuppliers(filtered);
    };

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API_URL);
            setSuppliers(res.data || []);
        } catch (err) {
            console.error('Error fetching suppliers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingSupplier) {
                await axios.put(`${API_URL}/${editingSupplier.id}`, formData);
            } else {
                await axios.post(API_URL, formData);
            }
            setShowModal(false);
            resetForm();
            fetchSuppliers();
        } catch (err) {
            console.error('Error saving supplier:', err);
            alert('Failed to save supplier');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            contact_person: supplier.contact_person || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
            address: supplier.address || '',
            category: supplier.category || 'general'
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this supplier?')) return;
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchSuppliers();
        } catch (err) {
            console.error('Error deleting supplier:', err);
            alert('Failed to delete supplier');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            contact_person: '',
            phone: '',
            email: '',
            address: '',
            category: 'general'
        });
        setEditingSupplier(null);
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'pharmaceutical': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'equipment': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const stats = {
        total: suppliers.length,
        pharmaceutical: suppliers.filter(s => s.category === 'pharmaceutical').length,
        equipment: suppliers.filter(s => s.category === 'equipment').length,
        general: suppliers.filter(s => s.category === 'general').length,
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 p-6 pt-12">
                {/* Header with gradient */}
                <div className="mb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3 mb-2">
                                <Package className="w-10 h-10 text-blue-600" />
                                Suppliers Management
                            </h1>
                            <p className="text-gray-600 text-lg">Manage supplier information and contacts</p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Supplier
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                            <p className="text-blue-100 text-sm font-medium">Total Suppliers</p>
                            <p className="text-3xl font-bold mt-1">{stats.total}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border-2 border-blue-100 shadow-md">
                            <p className="text-gray-600 text-sm font-medium">Pharmaceutical</p>
                            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.pharmaceutical}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border-2 border-purple-100 shadow-md">
                            <p className="text-gray-600 text-sm font-medium">Equipment</p>
                            <p className="text-3xl font-bold text-purple-600 mt-1">{stats.equipment}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-md">
                            <p className="text-gray-600 text-sm font-medium">General</p>
                            <p className="text-3xl font-bold text-gray-600 mt-1">{stats.general}</p>
                        </div>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="bg-white rounded-xl shadow-md p-4 flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[250px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search suppliers..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Tag className="w-5 h-5 text-gray-400" />
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="all">All Categories</option>
                                <option value="pharmaceutical">Pharmaceutical</option>
                                <option value="equipment">Equipment</option>
                                <option value="general">General</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-md">
                        <div className="text-center">
                            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600">Loading suppliers...</p>
                        </div>
                    </div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No suppliers found</h3>
                        <p className="text-gray-500">
                            {searchTerm || categoryFilter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Get started by adding your first supplier'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSuppliers.map(supplier => (
                            <div key={supplier.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                                {/* Card Header */}
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg mb-1">{supplier.name}</h3>
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getCategoryColor(supplier.category)} bg-white`}>
                                                {supplier.category}
                                            </span>
                                        </div>
                                        <Building className="w-8 h-8 opacity-50" />
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 space-y-3">
                                    {supplier.contact_person && (
                                        <div className="flex items-center text-gray-700">
                                            <User className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                                            <span className="text-sm">{supplier.contact_person}</span>
                                        </div>
                                    )}
                                    {supplier.phone && (
                                        <div className="flex items-center text-gray-700">
                                            <Phone className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                                            <span className="text-sm">{supplier.phone}</span>
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center text-gray-700">
                                            <Mail className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                                            <span className="text-sm truncate">{supplier.email}</span>
                                        </div>
                                    )}
                                    {supplier.address && (
                                        <div className="flex items-start text-gray-700">
                                            <MapPin className="w-4 h-4 mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                                            <span className="text-sm line-clamp-2">{supplier.address}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer */}
                                <div className="px-4 pb-4 flex gap-2">
                                    <button
                                        onClick={() => handleEdit(supplier)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(supplier.id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-2xl">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <Package className="w-7 h-7" />
                                    {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter company name"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Person</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.contact_person}
                                                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Contact name"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="+254 700 000 000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            rows="3"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter full address"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="pharmaceutical">Pharmaceutical</option>
                                        <option value="equipment">Equipment</option>
                                        <option value="general">General</option>
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center font-semibold shadow-lg transition-all"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader className="animate-spin w-5 h-5 mr-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-5 h-5 mr-2" />
                                                Save Supplier
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

export default Suppliers;
