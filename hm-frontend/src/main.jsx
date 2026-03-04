import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import { SidebarProvider } from "./context/SidebarContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import RoleBasedRoute from "./components/RoleBasedRoute.jsx";

// Pages
import Dashboard from "./pages/Dashboard.jsx";

import Patients from "./pages/Patients.jsx";
import AddPatient from "./pages/AddPatient.jsx";
import PatientDetails from "./pages/PatientDetails.jsx";
import EditPatient from "./pages/EditPatient.jsx";
import PatientPrintLog from "./pages/PatientPrintLog.jsx";
import TreatmentPrint from "./pages/TreatmentPrint.jsx";
import TodaysTreatments from "./pages/TodaysTreatments.jsx";
import IncompletePatients from "./pages/IncompletePatients.jsx";
import InpatientDetails from "./pages/InpatientDetails.jsx";

import Inventory from "./pages/Inventory.jsx";
import MainStoreDrugs from "./pages/MainStoreDrugs.jsx";
import Suppliers from "./pages/Suppliers.jsx";

import Billing from "./pages/Billing.jsx";
import BillDetails from "./pages/BillDetails.jsx";
import BillReceipt from "./pages/BillReceipt.jsx";

// Staff Management
import StaffList from "./pages/StaffList.jsx";
import AddStaff from "./pages/AddStaff.jsx";
import StaffDetails from "./pages/StaffDetails.jsx";
import StaffEdit from "./pages/StaffEdit.jsx";

// Authentication
import Login from "./pages/Login.jsx";

// Settings Page
import Settings from "./pages/Settings.jsx";
import SystemSettings from "./pages/SystemSettings.jsx";
import LabTestManagement from "./pages/LabTestManagement.jsx";

import Appointments from "./pages/Appointments.jsx";
import Queue from "./pages/Queue.jsx";
import PharmacyQueue from "./pages/PharmacyQueue.jsx";
import PharmacyDispensation from "./pages/PharmacyDispensation.jsx";
import PharmacyDrugs from "./pages/PharmacyDrugs.jsx";
import PharmacyReview from "./pages/PharmacyReview.jsx";
import PharmacyReports from "./pages/PharmacyReports.jsx";
import LabQueue from "./pages/LabQueue.jsx";
import LabProcessing from "./pages/LabProcessing.jsx";
import Updates from "./pages/Updates.jsx";
import DatabaseManagement from "./pages/DatabaseManagement.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <SidebarProvider>
          <Router>
            <Routes>

              {/* ------------------ PUBLIC ROUTES ------------------ */}
              <Route path="/login" element={<Login />} />

              {/* ---------------- PROTECTED ROUTES ----------------- */}
              <Route element={<PrivateRoute />}>

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Dashboard */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Appointments */}
                <Route path="/appointments" element={<Appointments />} />

                {/* Queue */}
                <Route path="/queue" element={<Queue />} />

                {/* Pharmacy */}
                <Route path="/pharmacy" element={<PharmacyQueue />} />
                <Route path="/pharmacy/review" element={<PharmacyReview />} />
                <Route path="/pharmacy/reports" element={<PharmacyReports />} />
                <Route path="/pharmacy/dispensation" element={<PharmacyDispensation />} />

                {/* Admin and Pharmacist routes */}
                <Route element={<RoleBasedRoute allowedRoles={["admin", "pharmacist"]} />}>
                  <Route path="/pharmacy/drugs" element={<PharmacyDrugs />} />
                </Route>

                {/* Admin-only routes */}
                <Route element={<RoleBasedRoute allowedRoles={["admin"]} />}>
                  <Route path="/database-management" element={<DatabaseManagement />} />
                </Route>

                {/* Laboratory */}
                <Route path="/lab/queue" element={<LabQueue />} />
                <Route path="/lab/processing/:id" element={<LabProcessing />} />

                {/* Patients */}
                <Route path="/patients" element={<Patients />} />
                <Route path="/patients/add" element={<AddPatient />} />
                <Route path="/patients/:id" element={<PatientDetails />} />
                <Route path="/patients/:id/edit" element={<EditPatient />} />
                <Route path="/patients/:id/print-log" element={<PatientPrintLog />} />
                <Route path="/patients/:id/treatments/:treatmentId/print" element={<TreatmentPrint />} />

                {/* Today's Treatments */}
                <Route path="/treatments/today" element={<TodaysTreatments />} />

                {/* Incomplete Patients */}
                <Route path="/patients/incomplete" element={<IncompletePatients />} />

                {/* Inpatient */}
                <Route path="/inpatient/:id" element={<InpatientDetails />} />

                {/* Inventory */}
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/main-store/drugs" element={<MainStoreDrugs />} />

                {/* Suppliers */}
                <Route path="/suppliers" element={<Suppliers />} />

                {/* Billing */}
                <Route path="/billing" element={<Billing />} />
                <Route path="/bills/:id" element={<BillDetails />} />
                <Route path="/bills/:id/receipt" element={<BillReceipt />} />

                {/* Staff */}
                <Route path="/staff" element={<StaffList />} />
                <Route path="/staff/add" element={<AddStaff />} />
                <Route path="/staff/:id" element={<StaffDetails />} />
                <Route path="/staff/:id/edit" element={<StaffEdit />} />

                {/* ⭐ SETTINGS PAGE */}
                <Route path="/settings" element={<Settings />} />

                {/* ⭐ SYSTEM SETTINGS PAGE (Admin Only) */}
                <Route path="/system-settings" element={<SystemSettings />} />
                <Route path="/admin/lab-tests" element={<LabTestManagement />} />

                {/* ⭐ UPDATES PAGE */}
                <Route path="/updates" element={<Updates />} />

              </Route>

            </Routes>
          </Router>
        </SidebarProvider>
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>
);
