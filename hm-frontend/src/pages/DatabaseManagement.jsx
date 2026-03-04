import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Database,
    Upload,
    AlertTriangle,
    CheckCircle,
    XCircle,
    FileText,
    Loader,
    Shield,
    Trash2,
    ArrowLeft,
    Download,
    HardDrive
} from 'lucide-react';

const DatabaseManagement = () => {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadedFilename, setUploadedFilename] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [backups, setBackups] = useState([]);
    const [isLoadingBackups, setIsLoadingBackups] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [executionProgress, setExecutionProgress] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [backupToDelete, setBackupToDelete] = useState(null);
    const [showInsertModal, setShowInsertModal] = useState(false);
    const [insertPin, setInsertPin] = useState('');
    const [insertPinError, setInsertPinError] = useState('');

    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.sql')) {
            setSelectedFile(file);
            setError(null);
            setResults(null);
        } else {
            setError('Please select a valid .sql file');
            setSelectedFile(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file first');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const token = localStorage.getItem('token');

            const res = await axios.post(`${API_BASE_URL}/admin/database/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            setUploadedFilename(res.data.filename);
            setError(null);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleExecute = async () => {
        if (!uploadedFilename) {
            setError('Please upload a file first');
            return;
        }

        setIsExecuting(true);
        setError(null);
        setResults(null);
        let backupFilename = null;

        try {
            const token = localStorage.getItem('token');

            // Step 1: Create backup BEFORE database overwrite
            setExecutionProgress('Creating backup of current database...');
            const backupRes = await axios.post(
                `${API_BASE_URL}/admin/database/backups/create`,
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            backupFilename = backupRes.data.filename;

            // Step 2: Download backup while token is still valid
            if (backupFilename) {
                setExecutionProgress('Downloading backup...');
                await handleDownloadBackup(backupFilename);
            }

            // Step 3: Execute database overwrite (this will invalidate token)
            setExecutionProgress('Executing database overwrite...');
            const res = await axios.post(
                `${API_BASE_URL}/admin/database/execute`,
                {
                    filename: uploadedFilename,
                    mode: 'overwrite',
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            setResults({
                ...res.data,
                backup_created: backupFilename // Use the backup we created
            });
            setExecutionProgress('Completed successfully!');

            setUploadedFilename(null);
            setSelectedFile(null);

            // Note: Token is now invalid, user will be logged out
            // Backup list refresh will happen after re-login
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Operation failed');
            setResults(err.response?.data || null);
        } finally {
            setIsExecuting(false);
            setExecutionProgress('');
        }
    };

    const openPinModal = () => {
        if (!uploadedFilename) {
            setError('Please upload a file first');
            return;
        }
        setShowPinModal(true);
        setPinError('');
        setPin('');
    };

    const handlePinSubmit = () => {
        if (pin.toLowerCase() === 'confirmdelete') {
            setShowPinModal(false);
            handleExecute();
        } else {
            setPinError('Incorrect PIN. Access denied.');
        }
        setPin('');
    };

    const openInsertModal = () => {
        if (!uploadedFilename) {
            setError('Please upload a file first');
            return;
        }
        setShowInsertModal(true);
        setInsertPinError('');
        setInsertPin('');
    };

    const handleInsertPinSubmit = () => {
        if (insertPin.toLowerCase() === 'confirminsert') {
            setShowInsertModal(false);
            handleInsertOnly();
        } else {
            setInsertPinError('Incorrect PIN. Access denied.');
        }
        setInsertPin('');
    };

    const handleInsertOnly = async () => {
        if (!uploadedFilename) {
            setError('Please upload a file first');
            return;
        }

        setIsExecuting(true);
        setError(null);
        setResults(null);
        let backupFilename = null;

        try {
            const token = localStorage.getItem('token');

            // Step 1: Create backup BEFORE insert operation
            setExecutionProgress('Creating backup of current database...');
            const backupRes = await axios.post(
                `${API_BASE_URL}/admin/database/backups/create`,
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            backupFilename = backupRes.data.filename;

            // Step 2: Download backup
            if (backupFilename) {
                setExecutionProgress('Downloading backup...');
                await handleDownloadBackup(backupFilename);
            }

            // Step 3: Execute insert operation
            setExecutionProgress('Inserting data safely...');
            const res = await axios.post(
                `${API_BASE_URL}/admin/database/execute`,
                {
                    filename: uploadedFilename,
                    mode: 'insert',
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            setResults({
                ...res.data,
                backup_created: backupFilename
            });
            setExecutionProgress('Insert completed successfully!');
            setUploadedFilename(null);
            setSelectedFile(null);

            // Refresh backup list
            await fetchBackups();
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Insert operation failed');
            setResults(err.response?.data || null);
        } finally {
            setIsExecuting(false);
            setExecutionProgress('');
        }
    };

    const handleDryRun = async () => {
        if (!uploadedFilename) {
            setError('Please upload a file first');
            return;
        }

        setIsExecuting(true);
        setError(null);
        setResults(null);

        try {
            const token = localStorage.getItem('token');

            setExecutionProgress('Analyzing SQL file...');
            const res = await axios.post(
                `${API_BASE_URL}/admin/database/execute`,
                {
                    filename: uploadedFilename,
                    mode: 'dry-run',
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            setResults(res.data);
            setExecutionProgress('Analysis complete!');
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Dry run failed');
            setResults(err.response?.data || null);
        } finally {
            setIsExecuting(false);
            setExecutionProgress('');
        }
    };

    const fetchBackups = async () => {
        setIsLoadingBackups(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/admin/database/backups`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setBackups(res.data.backups || []);
        } catch (err) {
            console.error('Failed to fetch backups:', err);
        } finally {
            setIsLoadingBackups(false);
        }
    };

    const handleDownloadBackup = async (filename) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${API_BASE_URL}/admin/database/backups/download`,
                { filename },
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to download backup: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteBackup = async (filename) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/admin/database/backups/delete`, {
                headers: { 'Authorization': `Bearer ${token}` },
                data: { filename }
            });

            // Refresh backup list
            await fetchBackups();
            setShowDeleteModal(false);
            setBackupToDelete(null);
        } catch (err) {
            setError('Failed to delete backup: ' + (err.response?.data?.message || err.message));
        }
    };

    const confirmDelete = (filename) => {
        setBackupToDelete(filename);
        setShowDeleteModal(true);
    };

    const handleCreateBackup = async (type = 'full') => {
        setIsLoadingBackups(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/admin/database/backups/create`,
                { type },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            // Refresh backup list
            await fetchBackups();

            // Auto-download the created backup
            if (res.data.filename) {
                await handleDownloadBackup(res.data.filename);
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create backup');
        } finally {
            setIsLoadingBackups(false);
        }
    };

    useEffect(() => {
        fetchBackups();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 py-14">
            <div className="max-w-5xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back</span>
                    </button>

                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Database className="w-8 h-8 text-blue-600" />
                        Database Management
                    </h1>
                    <p className="text-gray-600 mt-1">Import and overwrite database with SQL scripts</p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center shadow-md">
                        <XCircle className="w-6 h-6 mr-3 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {/* Security Warning */}
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6 shadow-md">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-lg text-red-900 mb-2">Critical Operation - Admin Only</h3>
                            <p className="text-red-700 text-sm mb-2">
                                This operation will completely overwrite your database by dropping all tables and re-creating them from the SQL file.
                                All existing data will be permanently deleted.
                            </p>
                            <div className="bg-red-100 rounded p-3 text-xs text-red-800 space-y-1">
                                <div>✓ A backup is automatically created before execution</div>
                                <div>✓ Backups are stored in: <code className="bg-red-200 px-1 py-0.5 rounded">storage/app/backups/</code></div>
                                <div className="text-red-900 font-semibold mt-2">⚠️ You will be logged out after this operation and must log in again</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Safe Insert Mode Info */}
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-6 shadow-md">
                    <div className="flex items-start gap-4">
                        <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-lg text-blue-900 mb-2">Safe Insert Mode - Insert Data Only</h3>
                            <p className="text-blue-700 text-sm mb-2">
                                This mode safely inserts data from your SQL file without deleting or modifying existing records.
                            </p>
                            <div className="bg-blue-100 rounded p-3 text-xs text-blue-800 space-y-1">
                                <div>✓ Automatically filters out DROP, DELETE, UPDATE, and TRUNCATE statements</div>
                                <div>✓ Uses INSERT IGNORE to skip duplicate entries</div>
                                <div>✓ Handles foreign key constraints automatically (SET FOREIGN_KEY_CHECKS=0/1)</div>
                                <div>✓ Safe to run multiple times - won't damage existing data</div>
                                <div>✓ Preview mode available to see what will be executed</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
                    <h3 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-600" />
                        Upload SQL File
                    </h3>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select SQL File
                        </label>
                        <input
                            type="file"
                            accept=".sql"
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg 
                                file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 
                                hover:file:bg-blue-100 cursor-pointer bg-gray-50 border border-gray-300 rounded-lg p-2"
                            disabled={isUploading || isExecuting}
                        />
                    </div>

                    {selectedFile && (
                        <div className="mt-4 flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <div>
                                    <span className="text-sm font-semibold text-gray-800 block">{selectedFile.name}</span>
                                    <span className="text-xs text-gray-600">
                                        {(selectedFile.size / 1024).toFixed(2)} KB
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading || isExecuting}
                                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg 
                                    hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Uploading... {uploadProgress}%
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Upload Progress Bar */}
                    {isUploading && uploadProgress > 0 && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}% ` }}
                                />
                            </div>
                        </div>
                    )}

                    {uploadedFilename && (
                        <div className="mt-4 flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 p-4 rounded-lg">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <span className="text-sm font-semibold">File uploaded successfully!</span>
                                <p className="text-xs text-green-600 mt-0.5">Ready to execute</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Execute Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
                    {/* Dry Run Button */}
                    <button
                        onClick={handleDryRun}
                        disabled={!uploadedFilename || isExecuting}
                        className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 
                            disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
                    >
                        {isExecuting && executionProgress.includes('Analyzing') ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <FileText className="w-5 h-5" />
                                Preview (Dry Run)
                            </>
                        )}
                    </button>

                    {/* Insert Only Button */}
                    <button
                        onClick={openInsertModal}
                        disabled={!uploadedFilename || isExecuting}
                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 
                            disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
                    >
                        {isExecuting && executionProgress.includes('Inserting') ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                {executionProgress}
                            </>
                        ) : (
                            <>
                                <Database className="w-5 h-5" />
                                Insert Data Only
                            </>
                        )}
                    </button>

                    {/* Overwrite Button */}
                    <button
                        onClick={openPinModal}
                        disabled={!uploadedFilename || isExecuting}
                        className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 
                            disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
                    >
                        {isExecuting && executionProgress.includes('overwrite') ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                {executionProgress}
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-5 h-5" />
                                Overwrite Database
                            </>
                        )}
                    </button>
                </div>

                {/* PIN Confirmation Modal */}
                {showPinModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                            <div className="bg-red-600 p-6 text-white">
                                <div className="flex items-center gap-3 mb-2">
                                    <Shield className="w-6 h-6" />
                                    <h3 className="text-xl font-bold">Confirm Database Overwrite</h3>
                                </div>
                                <p className="text-sm text-red-100">This action cannot be undone</p>
                            </div>

                            <div className="p-6">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-red-800 font-semibold mb-2">
                                        ⚠️ WARNING: This action will:
                                    </p>
                                    <ul className="text-xs text-red-700 space-y-1 ml-4">
                                        <li>• Drop all existing tables</li>
                                        <li>• Delete all current data</li>
                                        <li>• Import data from the uploaded SQL file</li>
                                        <li>• This action cannot be undone</li>
                                    </ul>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Enter confirmation PIN:
                                    </label>
                                    <input
                                        type="text"
                                        value={pin}
                                        onChange={(e) => {
                                            setPin(e.target.value);
                                            setPinError('');
                                        }}
                                        onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
                                        placeholder="Enter confirmation PIN"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        autoFocus
                                    />
                                    {pinError && (
                                        <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                                            <XCircle className="w-4 h-4" />
                                            {pinError}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowPinModal(false);
                                            setPin('');
                                            setPinError('');
                                        }}
                                        className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePinSubmit}
                                        className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
                                    >
                                        Confirm Overwrite
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Insert Confirmation Modal */}
                {showInsertModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                            <div className="bg-blue-600 p-6 text-white">
                                <div className="flex items-center gap-3 mb-2">
                                    <Shield className="w-6 h-6" />
                                    <h3 className="text-xl font-bold">Confirm Safe Insert</h3>
                                </div>
                                <p className="text-sm text-blue-100">Backup will be created automatically</p>
                            </div>

                            <div className="p-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-blue-800 font-semibold mb-2">
                                        ✓ This operation will:
                                    </p>
                                    <ul className="text-xs text-blue-700 space-y-1 ml-4">
                                        <li>• Create a backup of your current database</li>
                                        <li>• Download the backup automatically</li>
                                        <li>• Insert data from the uploaded SQL file</li>
                                        <li>• Skip dangerous operations (UPDATE/DELETE/DROP)</li>
                                        <li>• Skip duplicate entries automatically</li>
                                        <li>• Preserve all existing data</li>
                                    </ul>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Enter confirmation PIN:
                                    </label>
                                    <input
                                        type="text"
                                        value={insertPin}
                                        onChange={(e) => {
                                            setInsertPin(e.target.value);
                                            setInsertPinError('');
                                        }}
                                        onKeyPress={(e) => e.key === 'Enter' && handleInsertPinSubmit()}
                                        placeholder="Enter confirmation PIN"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        autoFocus
                                    />
                                    {insertPinError && (
                                        <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                                            <XCircle className="w-4 h-4" />
                                            {insertPinError}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowInsertModal(false);
                                            setInsertPin('');
                                            setInsertPinError('');
                                        }}
                                        className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleInsertPinSubmit}
                                        className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                                    >
                                        Confirm Insert
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}



                {/* Results */}
                {results && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
                        <h3 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                            {results.message && results.message.includes('success') ? (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : (
                                <XCircle className="w-6 h-6 text-red-600" />
                            )}
                            {results.message || 'Operation Results'}
                        </h3>

                        {results.backup_created && (
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-3">
                                <p className="text-sm text-gray-700">
                                    <strong>Backup created:</strong> <code className="bg-blue-100 px-2 py-0.5 rounded text-xs">{results.backup_created}</code>
                                </p>
                            </div>
                        )}

                        {/* Dry Run Preview */}
                        {results.preview && (
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-4">
                                <h4 className="font-bold text-gray-800 mb-3">Preview Summary</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                    <div>
                                        <span className="text-gray-600">Total Statements:</span>
                                        <p className="font-bold text-lg text-gray-900">{results.preview.total_statements}</p>
                                    </div>
                                    <div>
                                        <span className="text-green-600">Will Execute:</span>
                                        <p className="font-bold text-lg text-green-700">{results.preview.will_execute}</p>
                                    </div>
                                    <div>
                                        <span className="text-red-600">Will Skip:</span>
                                        <p className="font-bold text-lg text-red-700">{results.preview.will_skip}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Filtered Statements */}
                        {results.results && results.results.filtered_statements > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                                <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Filtered Statements ({results.results.filtered_statements})
                                </h4>
                                <p className="text-sm text-yellow-800 mb-3">
                                    The following dangerous statements were blocked and not executed:
                                </p>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {results.results.filtered_details?.map((item, idx) => (
                                        <div key={idx} className="bg-white border border-yellow-300 p-2 rounded text-xs">
                                            <div className="font-mono text-red-700 mb-1">{item.statement}</div>
                                            <div className="text-yellow-700 italic">{item.reason}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Execution Stats */}
                        {results.results && (
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Executed statements:</span>
                                        <p className="font-bold text-lg text-gray-900">{results.results.executed_statements}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Affected rows:</span>
                                        <p className="font-bold text-lg text-gray-900">{results.results.affected_rows}</p>
                                    </div>
                                </div>

                                {results.results.errors && results.results.errors.length > 0 && (
                                    <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded-lg">
                                        <strong className="text-red-900 text-sm block mb-2">Errors encountered:</strong>
                                        <ul className="list-disc list-inside space-y-1 text-xs text-red-700">
                                            {results.results.errors.map((err, idx) => (
                                                <li key={idx}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Backup List Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between border-b pb-3 mb-4 gap-4">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <HardDrive className="w-5 h-5 text-blue-600" />
                            Available Backups
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleCreateBackup('full')}
                                disabled={isLoadingBackups || isExecuting}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                            >
                                <Database className="w-3 h-3" />
                                Full Backup
                            </button>
                            <button
                                onClick={() => handleCreateBackup('data_only')}
                                disabled={isLoadingBackups || isExecuting}
                                className="px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1"
                            >
                                <FileText className="w-3 h-3" />
                                Data Only
                            </button>
                            <button
                                onClick={fetchBackups}
                                disabled={isLoadingBackups}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium ml-2"
                            >
                                {isLoadingBackups ? 'Refreshing...' : '🔄 Refresh'}
                            </button>
                        </div>
                    </div>

                    {isLoadingBackups ? (
                        <div className="text-center py-8 text-gray-500">
                            <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                            <p>Loading backups...</p>
                        </div>
                    ) : backups.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                            <HardDrive className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="font-medium">No backups found</p>
                            <p className="text-sm mt-1">Backups will appear here after database operations</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {backups.map((backup, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <Database className="w-5 h-5 text-blue-600" />
                                        <div className="flex-1">
                                            <p className="font-mono text-sm font-semibold text-gray-800">
                                                {backup.filename}
                                            </p>
                                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                                                <span>{(backup.size / 1024).toFixed(2)} KB</span>
                                                <span>{backup.created_at}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDownloadBackup(backup.filename)}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                        <button
                                            onClick={() => confirmDelete(backup.filename)}
                                            className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                            <div className="bg-red-600 p-6 text-white">
                                <div className="flex items-center gap-3 mb-2">
                                    <AlertTriangle className="w-6 h-6" />
                                    <h3 className="text-xl font-bold">Delete Backup</h3>
                                </div>
                                <p className="text-sm text-red-100">Are you sure you want to delete this backup?</p>
                            </div>

                            <div className="p-6">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-red-800 font-semibold mb-2">
                                        ⚠️ This action cannot be undone!
                                    </p>
                                    <p className="text-xs text-red-700">
                                        Backup file: <code className="bg-red-100 px-2 py-0.5 rounded font-mono">{backupToDelete}</code>
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setBackupToDelete(null);
                                        }}
                                        className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDeleteBackup(backupToDelete)}
                                        className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
                                    >
                                        Delete Backup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatabaseManagement;
