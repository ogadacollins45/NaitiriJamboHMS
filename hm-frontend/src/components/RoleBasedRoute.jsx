import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const RoleBasedRoute = ({ allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);
    const role = user?.role || localStorage.getItem("role");

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <style>{`
                        @keyframes barGrow {
                            0%, 100% { height: 16px; }
                            50% { height: 48px; }
                        }
                    `}</style>
                    <div className="flex gap-2 justify-center items-end mb-6" style={{ height: '60px' }}>
                        <div className="w-2 bg-indigo-600 rounded-full" style={{ animation: 'barGrow 1.2s ease-in-out infinite', animationDelay: '0s' }}></div>
                        <div className="w-2 bg-blue-600 rounded-full" style={{ animation: 'barGrow 1.2s ease-in-out infinite', animationDelay: '0.15s' }}></div>
                        <div className="w-2 bg-purple-600 rounded-full" style={{ animation: 'barGrow 1.2s ease-in-out infinite', animationDelay: '0.3s' }}></div>
                        <div className="w-2 bg-pink-600 rounded-full" style={{ animation: 'barGrow 1.2s ease-in-out infinite', animationDelay: '0.45s' }}></div>
                        <div className="w-2 bg-indigo-500 rounded-full" style={{ animation: 'barGrow 1.2s ease-in-out infinite', animationDelay: '0.6s' }}></div>
                    </div>
                    <p className="text-lg font-medium text-gray-700">Checking authentication...</p>
                    <p className="mt-1 text-sm text-gray-500">Please wait</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(role)) {
        // User is authenticated but doesn't have permission
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p className="text-gray-700 mb-6">
                        You do not have permission to access this page.
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return <Outlet />;
};

export default RoleBasedRoute;
