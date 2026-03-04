import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Save, X, Loader, PlusCircle } from 'lucide-react';
import DashboardLayout from '../layout/DashboardLayout';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const LabTestManagement = () => {
    const [tests, setTests] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTestForm, setShowTestForm] = useState(false);
    const [currentTest, setCurrentTest] = useState(null);
    const [expandedTest, setExpandedTest] = useState(null);
    const [addingParameter, setAddingParameter] = useState(false);

    const [testForm, setTestForm] = useState({
        name: '',
        code: '',
        category_id: '',
        description: '',
        sample_type: 'blood',
        sample_volume: '',
        container_type: '',
        preparation_instructions: '',
        turn_around_time: 24,
        price: 0,
        is_active: true,
    });

    const [parameterForm, setParameterForm] = useState({
        name: '',
        code: '',
        result_type: 'range',
        unit: '',
        normal_range_min: '',
        normal_range_max: '',
    });

    const [showParameterForm, setShowParameterForm] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [testsRes, categoriesRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/lab/management/tests`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_BASE_URL}/api/lab/management/categories`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
            ]);
            setTests(testsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitTest = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (currentTest) {
                await axios.put(`${API_BASE_URL}/api/lab/management/tests/${currentTest.id}`, testForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Test updated successfully');
            } else {
                await axios.post(`${API_BASE_URL}/api/lab/management/tests`, testForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Test created successfully');
            }
            setShowTestForm(false);
            setCurrentTest(null);
            resetTestForm();
            fetchData();
        } catch (error) {
            console.error('Error saving test:', error);
            alert('Failed to save test: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleAddParameter = async () => {
        if (!expandedTest || !parameterForm.name) {
            alert('Please fill in parameter name');
            return;
        }
        setAddingParameter(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/lab/management/tests/${expandedTest.id}/parameters`, parameterForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Parameter added successfully');
            setShowParameterForm(false);
            setParameterForm({ name: '', code: '', result_type: 'range', unit: '', normal_range_min: '', normal_range_max: '' });
            fetchData();
        } catch (error) {
            console.error('Error adding parameter:', error);
            alert('Failed to add parameter');
        } finally {
            setAddingParameter(false);
        }
    };

    const handleDeleteTest = async (id) => {
        if (window.confirm('Are you sure you want to delete this test?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_BASE_URL}/api/lab/management/tests/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Test deleted successfully');
                fetchData();
            } catch (error) {
                console.error('Error deleting test:', error);
                alert('Failed to delete test: ' + (error.response?.data?.message || 'May have existing requests'));
            }
        }
    };

    const handleDeleteParameter = async (parameterId) => {
        if (window.confirm('Are you sure you want to delete this parameter?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_BASE_URL}/api/lab/management/parameters/${parameterId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Parameter deleted successfully');
                fetchData();
            } catch (error) {
                console.error('Error deleting parameter:', error);
                alert('Failed to delete parameter: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    const resetTestForm = () => {
        setTestForm({
            name: '',
            code: '',
            category_id: '',
            description: '',
            sample_type: 'blood',
            sample_volume: '',
            container_type: '',
            preparation_instructions: '',
            turn_around_time: 24,
            price: 0,
            is_active: true,
        });
    };

    const openEditTest = (test) => {
        setCurrentTest(test);
        setTestForm({
            name: test.name,
            code: test.code,
            category_id: test.category_id,
            description: test.description || '',
            sample_type: test.sample_type,
            sample_volume: test.sample_volume || '',
            container_type: test.container_type || '',
            preparation_instructions: test.preparation_instructions || '',
            turn_around_time: test.turn_around_time,
            price: test.price,
            is_active: test.is_active,
        });
        setShowTestForm(true);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6 pt-24 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Lab Test Management</h1>
                    <button
                        onClick={() => { resetTestForm(); setShowTestForm(true); }}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus size={20} /> Add New Test
                    </button>
                </div>

                {/* Tests List */}
                <div className="grid gap-4">
                    {tests.map((test) => (
                        <div key={test.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-800">{test.name}</h3>
                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">{test.code}</span>
                                        <span className={`text-xs px-2 py-1 rounded ${test.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {test.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{test.description || 'No description'}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                                        <div><span className="font-medium">Category:</span> {test.category?.name}</div>
                                        <div><span className="font-medium">Price:</span> KES {test.price}</div>
                                        <div><span className="font-medium">Sample:</span> {test.sample_type}</div>
                                        <div><span className="font-medium">TAT:</span> {test.turn_around_time}h</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditTest(test)}
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTest(test.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Parameters Section */}
                            <div className="mt-4 pt-4 border-t">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-gray-700">Parameters ({test.parameters?.length || 0})</h4>
                                    <button
                                        onClick={() => {
                                            setExpandedTest(test);
                                            setShowParameterForm(true);
                                        }}
                                        className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-200"
                                    >
                                        + Add Parameter
                                    </button>
                                </div>
                                {test.parameters && test.parameters.length > 0 && (
                                    <div className="grid gap-2">
                                        {test.parameters.map((param) => (
                                            <div key={param.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                                                <div>
                                                    <span className="font-medium">{param.name}</span>
                                                    <span className="text-gray-500 ml-2">({param.code})</span>
                                                    <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                                                        {param.result_type === 'binary' ? 'Positive/Negative' : 'Range'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-gray-600">
                                                        {param.result_type === 'binary'
                                                            ? 'Pos/Neg'
                                                            : `${param.normal_range_min} - ${param.normal_range_max} ${param.unit}`}
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteParameter(param.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete parameter"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Test Form Modal */}
                {showTestForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">{currentTest ? 'Edit' : 'Add'} Lab Test</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">Enter test details and specifications</p>
                                </div>
                                <button
                                    onClick={() => { setShowTestForm(false); setCurrentTest(null); }}
                                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form Content */}
                            <form onSubmit={handleSubmitTest} className="flex-1 overflow-y-auto">
                                <div className="px-8 py-6 space-y-6">
                                    {/* Basic Information Section */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-4">Basic Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Test Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={testForm.name}
                                                    onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    placeholder="e.g., Complete Blood Count"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Test Code <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={testForm.code}
                                                    onChange={(e) => setTestForm({ ...testForm, code: e.target.value })}
                                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    placeholder="e.g., CBC"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Category <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    required
                                                    value={testForm.category_id}
                                                    onChange={(e) => setTestForm({ ...testForm, category_id: e.target.value })}
                                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none bg-white"
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map((cat) => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                                <textarea
                                                    value={testForm.description}
                                                    onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                                                    rows={2}
                                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                                    placeholder="Brief description of the test"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sample Information Section */}
                                    <div className="pt-6 border-t border-gray-100">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-4">Sample Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Sample Type <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    required
                                                    value={testForm.sample_type}
                                                    onChange={(e) => setTestForm({ ...testForm, sample_type: e.target.value })}
                                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none bg-white"
                                                >
                                                    <option value="blood">Blood</option>
                                                    <option value="urine">Urine</option>
                                                    <option value="stool">Stool</option>
                                                    <option value="sputum">Sputum</option>
                                                    <option value="csf">CSF</option>
                                                    <option value="tissue">Tissue</option>
                                                    <option value="swab">Swab</option>
                                                    <option value="fluid">Fluid</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Sample Volume</label>
                                                <input
                                                    type="text"
                                                    value={testForm.sample_volume}
                                                    onChange={(e) => setTestForm({ ...testForm, sample_volume: e.target.value })}
                                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    placeholder="e.g., 5 ml"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Container Type</label>
                                                <input
                                                    type="text"
                                                    value={testForm.container_type}
                                                    onChange={(e) => setTestForm({ ...testForm, container_type: e.target.value })}
                                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    placeholder="e.g., EDTA tube"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Preparation Instructions</label>
                                                <input
                                                    type="text"
                                                    value={testForm.preparation_instructions}
                                                    onChange={(e) => setTestForm({ ...testForm, preparation_instructions: e.target.value })}
                                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    placeholder="e.g., Fasting required"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing & Turnaround Section */}
                                    <div className="pt-6 border-t border-gray-100">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-4">Pricing & Turnaround</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Price (KES) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    step="0.01"
                                                    value={testForm.price}
                                                    onChange={(e) => setTestForm({ ...testForm, price: parseFloat(e.target.value) })}
                                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Turnaround Time (hours) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={testForm.turn_around_time}
                                                    onChange={(e) => setTestForm({ ...testForm, turn_around_time: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                                    placeholder="24"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-8 py-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setShowTestForm(false); setCurrentTest(null); }}
                                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                    >
                                        <Save size={16} /> {currentTest ? 'Update' : 'Create'} Test
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Parameter Form Modal */}
                {showParameterForm && expandedTest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Add Parameter</h3>
                                    <p className="text-indigo-100 text-sm mt-1">{expandedTest.name}</p>
                                </div>
                                <button
                                    onClick={() => { setShowParameterForm(false); setExpandedTest(null); }}
                                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Parameter Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={parameterForm.name}
                                            onChange={(e) => setParameterForm({ ...parameterForm, name: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                            placeholder="Enter parameter name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={parameterForm.code}
                                            onChange={(e) => setParameterForm({ ...parameterForm, code: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                            placeholder="Enter code"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Result Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={parameterForm.result_type}
                                            onChange={(e) => setParameterForm({ ...parameterForm, result_type: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-white"
                                        >
                                            <option value="range">Numeric Range</option>
                                            <option value="binary">Positive / Negative</option>
                                        </select>
                                        <div className={`mt-2 p-3 rounded-lg ${parameterForm.result_type === 'binary' ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50 border border-blue-200'}`}>
                                            <p className="text-xs font-medium text-gray-700">
                                                ℹ️ {parameterForm.result_type === 'binary'
                                                    ? 'Results will be Positive or Negative only'
                                                    : 'Results will be numeric values with reference ranges'}
                                            </p>
                                        </div>
                                    </div>
                                    {parameterForm.result_type === 'range' && (
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                                            <h4 className="font-semibold text-gray-800 text-sm">Reference Range Settings</h4>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., mg/dL, mmol/L, %"
                                                    value={parameterForm.unit}
                                                    onChange={(e) => setParameterForm({ ...parameterForm, unit: e.target.value })}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Normal Min</label>
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        value={parameterForm.normal_range_min}
                                                        onChange={(e) => setParameterForm({ ...parameterForm, normal_range_min: e.target.value })}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                        placeholder="Min"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Normal Max</label>
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        value={parameterForm.normal_range_max}
                                                        onChange={(e) => setParameterForm({ ...parameterForm, normal_range_max: e.target.value })}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                                        placeholder="Max"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                    <button
                                        onClick={() => { setShowParameterForm(false); setExpandedTest(null); }}
                                        className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddParameter}
                                        disabled={addingParameter}
                                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md transition-all"
                                    >
                                        {addingParameter ? (
                                            <>
                                                <Loader className="animate-spin w-4 h-4" />
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <PlusCircle size={18} />
                                                Add Parameter
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default LabTestManagement;


