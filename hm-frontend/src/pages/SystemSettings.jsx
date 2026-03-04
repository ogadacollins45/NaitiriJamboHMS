import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Settings as SettingsIcon, TestTubes } from 'lucide-react';
import DashboardLayout from '../layout/DashboardLayout';
import './SystemSettings.css';

const SystemSettings = () => {
    const [consultationFee, setConsultationFee] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchConsultationFee();
    }, []);

    const fetchConsultationFee = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/settings/consultation_fee`);
            setConsultationFee(res.data.value);
        } catch (error) {
            console.error('Error fetching consultation fee:', error);
            setMessage({ type: 'error', text: 'Failed to load consultation fee' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const fee = parseFloat(consultationFee);
        if (isNaN(fee) || fee <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid positive number' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/settings/consultation_fee`, {
                value: fee,
                type: 'number'
            });
            setMessage({ type: 'success', text: 'Consultation fee updated successfully!' });
        } catch (error) {
            console.error('Error updating consultation fee:', error);
            setMessage({ type: 'error', text: 'Failed to update consultation fee' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="system-settings-page mt-12">
                <div className="system-settings-header">
                    <h1><SettingsIcon size={32} /> System Settings</h1>
                    <p>Manage system-wide configuration</p>
                </div>

                <div className="system-settings-content">
                    <div className="system-settings-card">
                        <h2>Consultation Fee</h2>
                        <p className="settings-description">
                            Set the default consultation fee charged for patient visits. This fee is automatically applied when generating bills for treatments.
                        </p>

                        <form onSubmit={handleSubmit} className="settings-form">
                            <div className="form-group">
                                <label htmlFor="consultationFee">
                                    Consultation Fee Amount
                                </label>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        id="consultationFee"
                                        value={consultationFee}
                                        onChange={(e) => setConsultationFee(e.target.value)}
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            {message.text && (
                                <div className={`alert alert-${message.type}`}>
                                    {message.text}
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>

                    {/* Lab Test Management Card */}
                    <div className="system-settings-card">
                        <h2>Lab Test Pricing</h2>
                        <p className="settings-description">
                            Configure laboratory tests, define test parameters with normal ranges, and set pricing for billing integration.
                        </p>
                        <div className="settings-actions">
                            <button
                                onClick={() => window.location.href = '/admin/lab-tests'}
                                className="btn btn-secondary"
                            >
                                Manage Lab Tests
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SystemSettings;
