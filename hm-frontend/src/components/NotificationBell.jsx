import React, { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCheck, FlaskConical, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

/**
 * Formats a relative timestamp like "2 min ago"
 */
function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNavigate = (notification) => {
        const body = notification.body || {};
        const patientId = body.patient_id;
        if (patientId) {
            navigate(`/patients/${patientId}`);
        }
        markAsRead(notification.id);
        setOpen(false);
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 hover:scale-110 focus:outline-none"
                title="Notifications"
                aria-label={`${unreadCount} unread notifications`}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-white" />
                            <span className="text-white font-semibold text-sm">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="ml-2 bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">
                                        {unreadCount}
                                    </span>
                                )}
                            </span>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-1 text-white/80 hover:text-white text-xs transition-colors"
                                title="Mark all as read"
                            >
                                <CheckCheck className="w-3.5 h-3.5" />
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                <Bell className="w-10 h-10 mb-2 opacity-30" />
                                <p className="text-sm">No new notifications</p>
                            </div>
                        ) : (
                            <ul>
                                {notifications.map((n) => {
                                    const body = n.body || {};
                                    return (
                                        <li
                                            key={n.id}
                                            className="border-b border-gray-50 last:border-0 hover:bg-blue-50 transition-colors group"
                                        >
                                            <div className="flex items-start gap-3 px-4 py-3">
                                                {/* Icon */}
                                                <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                                                    <FlaskConical className="w-4 h-4 text-blue-600" />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        {n.title}
                                                    </p>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        <span className="font-medium text-gray-800">
                                                            {body.patient || "Patient"}
                                                        </span>
                                                        {body.request_no && (
                                                            <span className="text-gray-400 ml-1">
                                                                · {body.request_no}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {n.created_at ? timeAgo(n.created_at) : "just now"}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsRead(n.id);
                                                        }}
                                                        className="text-gray-300 hover:text-red-400 transition-colors"
                                                        title="Dismiss"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleNavigate(n)}
                                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors opacity-0 group-hover:opacity-100"
                                                        title="View patient"
                                                    >
                                                        View <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center">
                            <p className="text-xs text-gray-400">
                                Click a notification to go to the patient&apos;s record
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
