// Seems i dont use this for routing, i USE main.jsx for routing


import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layout/MainLayout.jsx";
import Dashboard from "../pages/Dashboard";
import Patients from "../pages/Patients";
import Inventory from "../pages/Inventory";
import Reports from "../pages/Reports";
import StaffList from "../pages/StaffList";
import AddStaff from "../pages/AddStaff";
import Settings from "../pages/Settings";
import Login from "../pages/Login";        // make sure this path is right
import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* public login */}
        <Route path="/login" element={<Login />} />

        {/* everything inside MainLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor", "reception"]}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard at "/" */}
          <Route index element={<Dashboard />} />

          {/* Patients */}
          <Route
            path="patients"
            element={
              <ProtectedRoute allowedRoles={["admin", "doctor", "reception"]}>
                <Patients />
              </ProtectedRoute>
            }
          />

          {/* Inventory - admin only */}
          <Route
            path="inventory"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Inventory />
              </ProtectedRoute>
            }
          />

          {/* Reports - admin only */}
          <Route
            path="reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* Staff list - admin only */}
          <Route
            path="staff"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <StaffList />
              </ProtectedRoute>
            }
          />

          {/* Add staff - admin only */}
          <Route
            path="staff/add"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AddStaff />
              </ProtectedRoute>
            }
          />

          {/* 🚨 SETTINGS — NOTE: path is "settings", NOT "/settings" */}
          <Route
            path="settings"
            element={
              <ProtectedRoute allowedRoles={["admin", "doctor", "reception"]}>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
