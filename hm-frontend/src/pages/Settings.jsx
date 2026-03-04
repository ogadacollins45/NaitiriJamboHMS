import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import DashboardLayout from "../layout/DashboardLayout";
import { AuthContext } from "../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader,
  CheckCircle,
  AlertCircle,
  Shield
} from "lucide-react";

const Settings = () => {
  const { user, login } = useContext(AuthContext);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Prefill user data
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "",
        password_confirmation: "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Real-time password match validation
    if (name === "password" || name === "password_confirmation") {
      setPasswordError("");
      if (name === "password_confirmation" && formData.password && value && formData.password !== value) {
        setPasswordError("Passwords do not match");
      }
      if (name === "password" && formData.password_confirmation && value && value !== formData.password_confirmation) {
        setPasswordError("Passwords do not match");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setPasswordError("");
    setSaving(true);

    // Validate password confirmation
    if (formData.password && formData.password !== formData.password_confirmation) {
      setPasswordError("Passwords do not match");
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const payload = new FormData();

      // Add all fields (matching StaffEdit exactly)
      payload.append('first_name', formData.first_name);
      payload.append('last_name', formData.last_name);
      payload.append('email', formData.email);
      payload.append('phone', formData.phone);
      payload.append('role', user.role); // Keep current role

      // Only append password if it's being changed
      if (formData.password) {
        payload.append('password', formData.password);
        payload.append('password_confirmation', formData.password_confirmation);
      }

      payload.append("_method", "PUT");

      // Call the EXACT same endpoint as StaffEdit
      const res = await axios.post(`${API_BASE_URL}/staff/${user.id}`, payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      setSuccess("Profile updated successfully!");

      // Clear password fields after successful update
      setFormData({ ...formData, password: "", password_confirmation: "" });

      // Update user context
      if (res.data.data) {
        login(token, res.data.data);
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Settings update error:", err.response || err);
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-14">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              Account Settings
            </h1>
            <p className="text-gray-600 mt-1">Manage your account information and security</p>
          </div>

          {/* Alerts */}
          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg flex items-center shadow-md">
              <CheckCircle className="w-6 h-6 mr-3 flex-shrink-0" />
              <p>{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center shadow-md">
              <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!user ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 flex items-center justify-center">
              <Loader className="animate-spin h-8 w-8 text-blue-600 mr-3" />
              <p className="text-gray-600">Loading user data...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Info Card */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{user.first_name} {user.last_name}</h2>
                    <p className="text-blue-100 capitalize">{user.role}</p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">Personal Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 border-b pb-3 mb-1">Security Settings</h3>
                  <p className="text-sm text-gray-600">Leave blank to keep your current password</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-12 py-3 bg-gray-50 border ${passwordError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                        placeholder="Leave blank to keep current"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-12 py-3 bg-gray-50 border ${passwordError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {passwordError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center text-sm">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <p>{passwordError}</p>
                  </div>
                )}

                {formData.password && formData.password.length < 6 && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded-lg flex items-center text-sm">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <p>Password should be at least 6 characters long</p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving || passwordError}
                  className="flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {saving ? (
                    <>
                      <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
