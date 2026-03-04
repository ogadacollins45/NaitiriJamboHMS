import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../layout/DashboardLayout';
import {
    BarChart3,
    Package,
    TrendingDown,
    Calendar,
    Search,
    ChevronLeft,
    ChevronRight,
    FileText,
    Activity,
} from 'lucide-react';

const PharmacyReports = () => {
    const [activeTab, setActiveTab] = useState('dispensed');
    const [dispensedData, setDispensedData] = useState({ data: [], current_page: 1, last_page: 1 });
    const [stockData, setStockData] = useState({ data: [], current_page: 1, last_page: 1 });
    const [transactionsData, setTransactionsData] = useState({ data: [], current_page: 1, last_page: 1 });
    const [summaryStats, setSummaryStats] = useState({});
    const [topDrugs, setTopDrugs] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [lowStockOnly, setLowStockOnly] = useState(false);

    const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;
    const token = localStorage.getItem('token');

    useEffect(() => {
        loadSummaryStats();
        loadTopDrugs();
    }, [startDate, endDate]);

    useEffect(() => {
        if (activeTab === 'dispensed') {
            loadDispensedDrugs(1);
        } else if (activeTab === 'stock') {
            loadStockLevels(1);
        } else if (activeTab === 'transactions') {
            loadTransactions(1);
        }
    }, [activeTab, startDate, endDate, searchTerm, lowStockOnly]);

    const loadSummaryStats = async () => {
        try {
            const response = await axios.get(`${API_BASE}/pharmacy/reports/summary`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { start_date: startDate, end_date: endDate }
            });
            setSummaryStats(response.data);
        } catch (err) {
            console.error('Error loading summary:', err);
        }
    };

    const loadTopDrugs = async () => {
        try {
            const response = await axios.get(`${API_BASE}/pharmacy/reports/top-drugs`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { start_date: startDate, end_date: endDate, limit: 5 }
            });
            setTopDrugs(response.data);
        } catch (err) {
            console.error('Error loading top drugs:', err);
        }
    };

    const loadDispensedDrugs = async (page = 1) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/pharmacy/reports/dispensed-drugs`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page, per_page: 15, start_date: startDate, end_date: endDate }
            });
            setDispensedData(response.data);
        } catch (err) {
            console.error('Error loading dispensed drugs:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadStockLevels = async (page = 1) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/pharmacy/reports/stock-levels`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page, per_page: 20, search: searchTerm, low_stock_only: lowStockOnly ? 1 : 0 }
            });
            setStockData(response.data);
        } catch (err) {
            console.error('Error loading stock levels:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadTransactions = async (page = 1) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/pharmacy/reports/transactions`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page, per_page: 20, start_date: startDate, end_date: endDate }
            });
            setTransactionsData(response.data);
        } catch (err) {
            console.error('Error loading transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    const Pagination = ({ data, onPageChange }) => {
        return (
            <div className="flex justify-between items-center mt-4 px-4 py-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                    Page {data.current_page} of {data.last_page}
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(data.current_page - 1)}
                        disabled={data.current_page === 1}
                        className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onPageChange(data.current_page + 1)}
                        disabled={data.current_page === data.last_page}
                        className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 p-6 pt-24">
                {/* Header - Minimalistic */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 border-indigo-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 rounded-lg">
                                <BarChart3 className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Pharmacy Reports</h1>
                                <p className="text-gray-600 mt-1">View dispensation history, stock levels, and analytics</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Dispensations</p>
                                <p className="text-2xl font-bold text-gray-800">{summaryStats.total_dispensations || 0}</p>
                            </div>
                            <FileText className="w-10 h-10 text-indigo-500 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Drugs Dispensed (Units)</p>
                                <p className="text-2xl font-bold text-gray-800">{summaryStats.total_drugs_dispensed || 0}</p>
                            </div>
                            <Package className="w-10 h-10 text-green-500 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Low Stock Items</p>
                                <p className="text-2xl font-bold text-gray-800">{summaryStats.low_stock_count || 0}</p>
                            </div>
                            <TrendingDown className="w-10 h-10 text-orange-500 opacity-50" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm">Total Stock Value</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    KES {parseFloat(summaryStats.total_stock_value || 0).toLocaleString()}
                                </p>
                            </div>
                            <Activity className="w-10 h-10 text-purple-500 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Top Dispensed Drugs */}
                {topDrugs.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Dispensed Drugs (This Month)</h3>
                        <div className="space-y-3">
                            {topDrugs.map((drug, index) => (
                                <div key={drug.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-indigo-600">#{index + 1}</span>
                                        <div>
                                            <p className="font-semibold text-gray-800">{drug.generic_name}</p>
                                            <p className="text-sm text-gray-600">{drug.dosage_form}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-800">{drug.total_dispensed} units</p>
                                        <p className="text-sm text-gray-600">{drug.prescription_count} prescriptions</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        {activeTab === 'stock' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                    <input
                                        type="text"
                                        placeholder="Search drug..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={lowStockOnly}
                                            onChange={(e) => setLowStockOnly(e.target.checked)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Low Stock Only</span>
                                    </label>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-md">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('dispensed')}
                            className={`flex-1 py-4 px-6 font-semibold ${activeTab === 'dispensed'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-gray-600 hover:text-indigo-600'
                                }`}
                        >
                            Dispensed Drugs
                        </button>
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`flex-1 py-4 px-6 font-semibold ${activeTab === 'stock'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-gray-600 hover:text-indigo-600'
                                }`}
                        >
                            Stock Levels
                        </button>
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`flex-1 py-4 px-6 font-semibold ${activeTab === 'transactions'
                                ? 'border-b-2 border-indigo-600 text-indigo-600'
                                : 'text-gray-600 hover:text-indigo-600'
                                }`}
                        >
                            Transactions
                        </button>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                <p className="text-gray-600 mt-2">Loading...</p>
                            </div>
                        ) : (
                            <>
                                {/* Dispensed Drugs Tab */}
                                {activeTab === 'dispensed' && (
                                    <div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Patient</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Doctor</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Items</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Drugs</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {dispensedData.data?.map((prescription) => (
                                                        <tr key={prescription.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-800">
                                                                <div>
                                                                    <div className="font-medium">
                                                                        {new Date(prescription.created_at).toLocaleDateString()}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {new Date(prescription.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-800">
                                                                {prescription.patient?.first_name} {prescription.patient?.last_name}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-800">
                                                                Dr. {prescription.doctor?.first_name || 'N/A'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-800">
                                                                {prescription.items?.length || 0} items
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {prescription.items?.map((item, idx) => (
                                                                    <div key={idx}>
                                                                        {item.mapped_drug?.generic_name || item.drug_name_text} ({item.mapped_quantity || item.quantity})
                                                                    </div>
                                                                ))}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <Pagination data={dispensedData} onPageChange={loadDispensedDrugs} />
                                    </div>
                                )}

                                {/* Stock Levels Tab */}
                                {activeTab === 'stock' && (
                                    <div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Drug Code</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Form</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Current Stock</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Reorder Level</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {stockData.data?.map((drug) => (
                                                        <tr key={drug.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-800">{drug.drug_code}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-800 font-medium">{drug.generic_name}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{drug.dosage_form}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{drug.current_stock}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{drug.reorder_level}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-1 text-xs rounded-full ${drug.stock_status === 'low'
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : 'bg-green-100 text-green-700'
                                                                    }`}>
                                                                    {drug.stock_status === 'low' ? 'Low Stock' : 'Normal'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-800">
                                                                KES {drug.stock_value?.toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <Pagination data={stockData} onPageChange={loadStockLevels} />
                                    </div>
                                )}

                                {/* Transactions Tab */}
                                {activeTab === 'transactions' && (
                                    <div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Drug</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Quantity</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Balance</th>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Performed By</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {transactionsData.data?.map((txn) => (
                                                        <tr key={txn.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-800">
                                                                {new Date(txn.transaction_date).toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-800">{txn.drug?.generic_name}</td>
                                                            <td className="px-4 py-3 text-sm font-semibold text-gray-800">{txn.quantity}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-800">{txn.balance_after}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {txn.performed_by_staff?.first_name || 'N/A'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <Pagination data={transactionsData} onPageChange={loadTransactions} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PharmacyReports;
