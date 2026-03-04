import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";

export const NotificationContext = createContext();

// ─── TEMPORARY: simple polling mode ─────────────────────────────────────────
// Switch back to Echo/Reverb later by restoring the Echo implementation.
const POLL_INTERVAL_MS = 5000; // poll every 5 seconds

export const NotificationProvider = ({ children }) => {
    const { user, token } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);

    // Only doctors and admins receive notifications
    const isTargetRole = user && ["doctor", "admin"].includes(user.role);

    const fetchNotifications = useCallback(async () => {
        if (!token || !isTargetRole) return;
        try {
            const res = await axios.get("/notifications");
            setNotifications(res.data);
        } catch (err) {
            // Silently ignore (e.g. 401 on logout handled by AuthContext interceptor)
        }
    }, [token, isTargetRole]);

    useEffect(() => {
        if (!isTargetRole || !token) return;

        // Immediate first fetch
        fetchNotifications();

        // Then poll on interval
        const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [isTargetRole, token, fetchNotifications]);

    const markAsRead = useCallback(async (id) => {
        try {
            await axios.post(`/notifications/${id}/read`);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await axios.post("/notifications/read-all");
            setNotifications([]);
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    }, []);

    const unreadCount = notifications.length;

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, markAsRead, markAllAsRead }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
