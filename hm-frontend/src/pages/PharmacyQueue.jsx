import { useState, useEffect } from 'react';
import axios from 'axios';
import { Pill, User, Clock, CheckCircle } from 'lucide-react';
import DashboardLayout from '../layout/DashboardLayout';
import './PharmacyQueue.css';

const PharmacyQueue = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, dispensed
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [dispensing, setDispensing] = useState(false);

    useEffect(() => {
        fetchOrders();
        // No polling - manual refresh only for cost optimization
    }, [filter]);

    const fetchOrders = async () => {
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/pharmacy/orders`, { params });
            setOrders(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching pharmacy orders:', error);
            setLoading(false);
        }
    };

    const handleDispense = async (orderId) => {
        if (!confirm('Are you sure you want to dispense this medication? Inventory will be deducted and billing will be updated.')) {
            return;
        }

        setDispensing(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pharmacy/orders/${orderId}/dispense`);
            alert('Medication dispensed successfully!');
            fetchOrders();
            setSelectedOrder(null);
        } catch (error) {
            console.error('Error dispensing medication:', error);
            alert(error.response?.data?.error || 'Failed to dispense medication');
        } finally {
            setDispensing(false);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'pending') {
            return <span className="badge badge-warning"><Clock size={14} /> Pending</span>;
        }
        return <span className="badge badge-success"><CheckCircle size={14} /> Dispensed</span>;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="loading">Loading pharmacy queue...</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="pharmacy-queue">
                <div className="queue-header">
                    <h1><Pill size={32} /> Pharmacy Queue</h1>
                    <p>Manage prescription dispensing</p>
                </div>

                <div className="queue-filters">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All Orders ({orders.length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        Pending ({orders.filter(o => o.status === 'pending').length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'dispensed' ? 'active' : ''}`}
                        onClick={() => setFilter('dispensed')}
                    >
                        Dispensed ({orders.filter(o => o.status === 'dispensed').length})
                    </button>
                </div>

                <div className="queue-content">
                    {orders.length === 0 ? (
                        <div className="empty-state">
                            <Pill size={64} className="empty-icon" />
                            <p>No pharmacy orders found</p>
                        </div>
                    ) : (
                        <div className="orders-grid">
                            {orders.map((order) => (
                                <div key={order.id} className={`order-card ${order.status}`}>
                                    <div className="order-header">
                                        <div>
                                            <h3><User size={18} /> {order.patient.name}</h3>
                                            <p className="text-muted">Age: {order.patient.age || 'N/A'}</p>
                                        </div>
                                        {getStatusBadge(order.status)}
                                    </div>

                                    <div className="order-info">
                                        <p><strong>Doctor:</strong> {order.doctor?.name || 'N/A'}</p>
                                        <p><strong>Ordered:</strong> {new Date(order.created_at).toLocaleString()}</p>
                                        {order.dispensed_at && (
                                            <p><strong>Dispensed:</strong> {new Date(order.dispensed_at).toLocaleString()}</p>
                                        )}
                                    </div>

                                    <div className="medications-list">
                                        <h4>Medications:</h4>
                                        <ul>
                                            {order.medications.map((med, idx) => (
                                                <li key={idx}>
                                                    <Pill size={14} />
                                                    {med.name} - {med.quantity} {med.unit}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {order.status === 'pending' && (
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleDispense(order.id)}
                                            disabled={dispensing}
                                        >
                                            {dispensing ? 'Dispensing...' : 'Dispense Medication'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PharmacyQueue;
