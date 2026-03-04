import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

/*
  FINAL PROTECTED ROUTE LOGIC
  ---------------------------
  ✔ Prevents “login twice” issue
  ✔ Waits until token & role exist before checking access
  ✔ Redirects correctly depending on allowed roles
  ✔ Handles page refresh correctly (role may load slowly from storage)
*/

const ProtectedRoute = ({ allowedRoles, children }) => {
  const [ready, setReady] = useState(false);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    // Slight delay fixes the issue where role is null immediately after login
    const timer = setTimeout(() => {
      setReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // While waiting for token/role to load → avoid redirect loops
  if (!ready) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading...</p>
      </div>
    );
  }

  // No token → not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Role exists, but is not allowed for this route
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Allowed → render page
  return children;
};

export default ProtectedRoute;
