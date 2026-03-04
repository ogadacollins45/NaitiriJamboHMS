import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../layout/DashboardLayout";
import {
  ChevronLeft, User, Mail, Phone, Briefcase, ShieldCheck, Key, Save, Loader, AlertCircle, CheckCircle, X, Paperclip
} from "lucide-react";

const StaffEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position: "",
    role: "",
    password: "",
    password_confirmation: "",
  });

  const [documentsToUpload, setDocumentsToUpload] = useState([]); // For new documents
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/staff/${id}`)
      .then((res) => {
        setFormData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to load staff data.");
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setDocumentsToUpload([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = new FormData();

    // Append all form data fields
    Object.keys(formData).forEach(key => {
      if (key !== 'password' && key !== 'password_confirmation') {
        payload.append(key, formData[key]);
      }
    });

    // Only append password if it's being changed
    if (formData.password) {
      payload.append('password', formData.password);
      payload.append('password_confirmation', formData.password_confirmation);
    }

    // Append new documents
    documentsToUpload.forEach((file) => {
      payload.append('documents[]', file);
    });

    payload.append("_method", "PUT");

    try {
      await axios.post(`${API_BASE_URL}/staff/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess("Staff details updated successfully! Redirecting...");
      setTimeout(() => navigate(`/staff/${id}`), 1500);
    } catch (err) {
      console.error("Error updating staff:", err.response || err);
      setError(err.response?.data?.message || "Failed to update staff.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen"><Loader className="animate-spin h-10 w-10 text-indigo-500" /><p className="ml-3 text-lg text-gray-600">Loading Editor...</p></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full">
          <div className="flex items-center mb-6">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-300 mr-4"><ChevronLeft className="w-6 h-6 text-gray-600" /></button>
            <h1 className="text-3xl font-bold text-gray-800">Edit Staff Member</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full">
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
              {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center shadow-md"><AlertCircle className="w-6 h-6 mr-3" /><p>{error}</p></div>}
              {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg flex items-center shadow-md"><CheckCircle className="w-6 h-6 mr-3" /><p>{success}</p></div>}

              {/* Personal & Job Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Personal & Job Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField icon={<User className="w-5 h-5 text-gray-400" />} label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                  <InputField icon={<User className="w-5 h-5 text-gray-400" />} label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                  <InputField icon={<Mail className="w-5 h-5 text-gray-400" />} label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                  <InputField icon={<Phone className="w-5 h-5 text-gray-400" />} label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
                  <InputField icon={<Briefcase className="w-5 h-5 text-gray-400" />} label="Position / Title" name="position" value={formData.position} onChange={handleChange} />
                  <SelectField icon={<ShieldCheck className="w-5 h-5 text-gray-400" />} label="Role" name="role" value={formData.role} onChange={handleChange} required options={[{ value: "admin", label: "Admin" }, { value: "doctor", label: "Doctor" }, { value: "reception", label: "Reception" }, { value: "pharmacist", label: "Pharmacist" }, { value: "labtech", label: "Lab Tech" }, { value: "facility_clerk", label: "Facility Clerk" }]} />
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Upload New Documents (Optional)</h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <Paperclip className="w-5 h-5 text-gray-400" />
                  <input type="file" multiple onChange={handleFileChange} className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
                {documentsToUpload.length > 0 && (
                  <div className="text-sm text-gray-600 mt-2">
                    Selected files: {documentsToUpload.map(file => file.name).join(', ')}
                  </div>
                )}
              </div>

              {/* Password Update */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Update Password (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField icon={<Key className="w-5 h-5 text-gray-400" />} label="New Password" type="password" name="password" value={formData.password} onChange={handleChange} />
                  <InputField icon={<Key className="w-5 h-5 text-gray-400" />} label="Confirm New Password" type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => navigate(-1)} className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-all duration-300"><X className="w-5 h-5 mr-2" /> Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-all duration-300 shadow-md">
                  {saving ? <><Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> Saving...</> : <><Save className="w-5 h-5 mr-2" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const InputField = ({ icon, label, name, ...props }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>
    <input id={name} name={name} placeholder={label} {...props} className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
  </div>
);

const SelectField = ({ icon, label, name, options, ...props }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>
    <select id={name} name={name} {...props} className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none">
      <option value="">{label}</option>
      {options.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg></div>
  </div>
);

export default StaffEdit;