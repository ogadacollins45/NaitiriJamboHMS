import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../layout/DashboardLayout';
import { Microscope, Save, Send, X, Plus, Loader, Clock, CheckCircle2 } from 'lucide-react';

const LabProcessing = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recordingSample, setRecordingSample] = useState(false);
    const [submittingResults, setSubmittingResults] = useState({});
    const [savingDrafts, setSavingDrafts] = useState({});
    const [openTests, setOpenTests] = useState([]); // Array of test IDs that are open
    const [results, setResults] = useState({});
    const [comments, setComments] = useState({});
    const [draftStatus, setDraftStatus] = useState({});

    const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;
    const token = localStorage.getItem('token');

    useEffect(() => {
        loadRequest();
    }, [id]);

    const loadRequest = async () => {
        try {
            const response = await axios.get(`${API_BASE}/lab/requests/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequest(response.data);

            // Load drafts for all incomplete tests
            response.data.tests?.forEach(test => {
                if (test.status !== 'completed') {
                    loadDraft(test.id);
                }
            });

            setLoading(false);
        } catch (err) {
            console.error('Error loading request:', err);
            setLoading(false);
        }
    };

    const loadDraft = async (testId) => {
        try {
            const response = await axios.get(`${API_BASE}/lab/processing/${id}/tests/${testId}/draft`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.draft) {
                // Load draft data into state
                const draft = response.data.draft;
                if (draft.parameters && draft.parameters.length > 0) {
                    const draftResults = {};
                    draft.parameters.forEach(param => {
                        draftResults[param.parameter_id] = param.value;
                    });
                    setResults(prev => ({
                        ...prev,
                        [testId]: draftResults
                    }));
                }
                if (draft.overall_comment) {
                    setComments(prev => ({
                        ...prev,
                        [testId]: draft.overall_comment
                    }));
                }
                setDraftStatus(prev => ({
                    ...prev,
                    [testId]: `Draft saved: ${new Date(draft.saved_at).toLocaleString()}`
                }));
            }
        } catch (err) {
            console.error('Error loading draft:', err);
        }
    };

    const recordSample = async () => {
        const firstTest = request.tests[0];
        setRecordingSample(true);
        try {
            await axios.post(`${API_BASE}/lab/processing/${id}/sample`, {
                sample_type: firstTest.template.sample_type,
                volume: firstTest.template.sample_volume,
                container_type: firstTest.template.container_type
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Sample recorded successfully');
            loadRequest();
        } catch (err) {
            alert('Error recording sample: ' + (err.response?.data?.message || err.message));
        } finally {
            setRecordingSample(false);
        }
    };

    const saveDraft = async (testId) => {
        const testResults = results[testId];
        if (!testResults || Object.keys(testResults).length === 0) {
            return; // Nothing to save
        }

        // Build parameters array for draft
        const parameters = testResults
            ? Object.entries(testResults).map(([parameterId, value]) => ({
                parameter_id: parseInt(parameterId),
                value: value
            }))
            : [];

        setSavingDrafts(prev => ({ ...prev, [testId]: true }));
        try {
            const response = await axios.post(`${API_BASE}/lab/processing/${id}/tests/${testId}/draft`, {
                parameters,
                overall_comment: comments[testId] || ''
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setDraftStatus(prev => ({
                ...prev,
                [testId]: `Draft saved: ${new Date(response.data.saved_at).toLocaleString()}`
            }));
        } catch (err) {
            alert('Error saving draft: ' + (err.response?.data?.message || err.message));
        } finally {
            setSavingDrafts(prev => ({ ...prev, [testId]: false }));
        }
    };

    const submitResults = async (testId) => {
        // Get the test to check if it has parameters
        const test = request.tests.find(t => t.id === testId);
        const hasParameters = test?.template?.parameters?.length > 0;

        const testResults = results[testId];

        // Only validate results if the test has parameters
        if (hasParameters && (!testResults || Object.keys(testResults).length === 0)) {
            alert('Please enter results for all parameters');
            return;
        }

        // Build parameters array (will be empty array for tests with no parameters)
        const parameters = testResults
            ? Object.entries(testResults).map(([parameterId, value]) => ({
                parameter_id: parseInt(parameterId),
                value: value
            }))
            : [];

        setSubmittingResults(prev => ({ ...prev, [testId]: true }));
        try {
            await axios.post(`${API_BASE}/lab/processing/${id}/tests/${testId}/results`, {
                parameters,
                overall_comment: comments[testId] || ''
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Delete draft after successful submission
            await axios.delete(`${API_BASE}/lab/processing/${id}/tests/${testId}/draft`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('Results submitted successfully');
            loadRequest();

            // Clear state for this test
            setResults(prev => {
                const newResults = { ...prev };
                delete newResults[testId];
                return newResults;
            });
            setComments(prev => {
                const newComments = { ...prev };
                delete newComments[testId];
                return newComments;
            });
            setDraftStatus(prev => {
                const newStatus = { ...prev };
                delete newStatus[testId];
                return newStatus;
            });
            toggleTestForm(testId); // Close the test form
        } catch (err) {
            alert('Error submitting results: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmittingResults(prev => ({ ...prev, [testId]: false }));
        }
    };

    const handleParameterChange = (testId, parameterId, value) => {
        setResults(prev => ({
            ...prev,
            [testId]: {
                ...(prev[testId] || {}),
                [parameterId]: value
            }
        }));
    };

    const toggleTestForm = (testId) => {
        setOpenTests(prev => {
            if (prev.includes(testId)) {
                return prev.filter(id => id !== testId);
            } else {
                return [...prev, testId];
            }
        });
    };

    const getProgressStats = () => {
        if (!request?.tests) return { completed: 0, total: 0, percentage: 0 };
        const total = request.tests.length;
        const completed = request.tests.filter(t => t.status === 'completed').length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completed, total, percentage };
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    const { completed, total, percentage } = getProgressStats();

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 p-6 pt-24">
                {/* Header */}
                <div className="mb-6">
                    <div className=" flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                                <Microscope className="w-8 h-8 text-indigo-600 mr-3" />
                                Lab Processing
                            </h1>
                            <p className="text-gray-600 mt-2">Request #{request?.request_number}</p>
                        </div>
                        <button
                            onClick={() => navigate('/lab/queue')}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                        >
                            Back to Queue
                        </button>
                    </div>

                    {/* Progress Indicator */}
                    <div className="mt-4 bg-white rounded-xl shadow-md p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                            <span className="text-sm font-bold text-indigo-600">{completed} of {total} tests completed ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Patient Info */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Patient Information</h3>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Name:</span> {request?.patient?.first_name} {request?.patient?.last_name}</p>
                            <p><span className="font-medium">Age:</span> {request?.patient?.age || 'N/A'}</p>
                            <p><span className="font-medium">Gender:</span> {request?.patient?.gender || 'N/A'}</p>
                            <p><span className="font-medium">Doctor:</span> Dr. {request?.doctor?.first_name}</p>
                            <p><span className="font-medium">Priority:</span>
                                <span className={`ml-2 px-2 py-1 rounded text-xs ${request?.priority === 'stat' ? 'bg-red-100 text-red-700' :
                                    request?.priority === 'urgent' ? 'bg-orange-100 text-orange-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                    {request?.priority?.toUpperCase()}
                                </span>
                            </p>
                        </div>
                        {request?.clinical_notes && (
                            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-xs font-medium text-yellow-800">Clinical Notes:</p>
                                <p className="text-sm text-yellow-700 mt-1">{request.clinical_notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Tests */}
                    <div className="lg:col-span-2">
                        {request?.status === 'pending' && (
                            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Sample Collection</h3>
                                <button
                                    onClick={recordSample}
                                    disabled={recordingSample}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center"
                                >
                                    {recordingSample ? (
                                        <>
                                            <Loader className="animate-spin h-4 w-4 mr-2" />
                                            Recording...
                                        </>
                                    ) : (
                                        'Record Sample Collection'
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="space-y-4">
                            {request?.tests?.map((test) => (
                                <div key={test.id} className="bg-white rounded-xl shadow-md p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            {test.template?.name}
                                            {openTests.includes(test.id) && test.status !== 'completed' && (
                                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    In Progress
                                                </span>
                                            )}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${test.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            test.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {test.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                                            {test.status}
                                        </span>
                                    </div>

                                    {test.status !== 'completed' && openTests.includes(test.id) && (
                                        <div>
                                            <div className="space-y-3 mb-4">
                                                {test.template?.parameters?.map((param) => (
                                                    <div key={param.id} className="grid grid-cols-3 gap-4 items-center">
                                                        <label className="text-sm font-medium text-gray-700">
                                                            {param.name}
                                                            <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                                                                {param.result_type === 'binary' ? 'Pos/Neg' : 'Range'}
                                                            </span>
                                                        </label>
                                                        {param.result_type === 'binary' ? (
                                                            <select
                                                                value={results[test.id]?.[param.id] || ''}
                                                                onChange={(e) => handleParameterChange(test.id, param.id, e.target.value)}
                                                                className="col-span-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                            >
                                                                <option value="">Select Result</option>
                                                                <option value="Positive">Positive</option>
                                                                <option value="Negative">Negative</option>
                                                            </select>
                                                        ) : (
                                                            <>
                                                                <input
                                                                    type="text"
                                                                    placeholder={`e.g., ${param.normal_range_min}-${param.normal_range_max}`}
                                                                    value={results[test.id]?.[param.id] || ''}
                                                                    onChange={(e) => handleParameterChange(test.id, param.id, e.target.value)}
                                                                    className="col-span-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                                />
                                                                <span className="text-xs text-gray-500 col-start-2 col-span-2">
                                                                    Normal: {param.normal_range_min}-{param.normal_range_max} {param.unit}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Overall Comment</label>
                                                <textarea
                                                    value={comments[test.id] || ''}
                                                    onChange={(e) => setComments(prev => ({ ...prev, [test.id]: e.target.value }))}
                                                    rows="3"
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Add any observations or comments"
                                                />
                                            </div>

                                            {/* Draft Status */}
                                            {draftStatus[test.id] && (
                                                <div className="mb-4 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                                    {draftStatus[test.id]}
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => submitResults(test.id)}
                                                    disabled={submittingResults[test.id]}
                                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center"
                                                >
                                                    {submittingResults[test.id] ? (
                                                        <>
                                                            <Loader className="animate-spin h-4 w-4 mr-2" />
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="w-4 h-4 mr-2" />
                                                            Submit Results
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => saveDraft(test.id)}
                                                    disabled={savingDrafts[test.id]}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center"
                                                >
                                                    {savingDrafts[test.id] ? (
                                                        <>
                                                            <Loader className="animate-spin h-4 w-4 mr-2" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="w-4 h-4 mr-2" />
                                                            Save Draft
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => toggleTestForm(test.id)}
                                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 flex items-center"
                                                >
                                                    <X className="w-4 h-4 mr-2" />
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {test.status !== 'completed' && !openTests.includes(test.id) && (
                                        <button
                                            onClick={() => toggleTestForm(test.id)}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
                                            disabled={request.status === 'pending'}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Enter Results
                                        </button>
                                    )}

                                    {test.status === 'completed' && test.result && (
                                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                            <p className="text-sm font-medium text-green-800 mb-2">Results Submitted</p>
                                            {test.result.parameters?.map((rp) => (
                                                <div key={rp.id} className="text-sm text-gray-700 flex justify-between py-1">
                                                    <span>{rp.parameter?.name}:</span>
                                                    <span className={rp.is_abnormal ? 'text-red-600 font-semibold' : ''}>
                                                        {rp.value} {rp.unit} {rp.abnormal_flag && `(${rp.abnormal_flag})`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default LabProcessing;
