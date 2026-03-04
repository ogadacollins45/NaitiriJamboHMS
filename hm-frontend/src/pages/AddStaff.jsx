import React, { useState } from "react";
import axios from "axios";
import DashboardLayout from "../layout/DashboardLayout";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  User,
  Users,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  Key,
  FilePlus,
  PlusCircle,
  Trash2,
  Save,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";

const AddStaff = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    gender: "",
    email: "",
    phone: "",
    position: "",
    role: "reception",
    password: "",
    password_confirmation: "",
  });

  const [documents, setDocuments] = useState([{ label: "", file: null }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDocumentChange = (index, field, value) => {
    const updatedDocs = [...documents];
    updatedDocs[index][field] = value;
    setDocuments(updatedDocs);
  };

  const addDocumentRow = () => {
    setDocuments([...documents, { label: "", file: null }]);
  };

  const removeDocumentRow = (index) => {
    const updatedDocs = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = new FormData();
      Object.keys(formData).forEach((key) => {
        payload.append(key, formData[key]);
      });

      documents.forEach((doc, i) => {
        if (doc.file && doc.label) {
          payload.append(`documents[${i}][label]`, doc.label);
          payload.append(`documents[${i}][file]`, doc.file);
        }
      });

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/staff`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Staff member added successfully! Redirecting...");
      setTimeout(() => navigate("/staff"), 1500);
    } catch (err) {
      console.error("Error saving staff:", err.response || err);
      setError(
        err.response?.data?.message ||
        "Failed to add staff. Please check all fields."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-300 mr-4">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Add New Staff Member</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full">
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center shadow-md">
                  <AlertCircle className="w-6 h-6 mr-3" />
                  <p>{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg flex items-center shadow-md">
                  <CheckCircle className="w-6 h-6 mr-3" />
                  <p>{success}</p>
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField icon={<User className="w-5 h-5 text-gray-400" />} label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                  <InputField icon={<User className="w-5 h-5 text-gray-400" />} label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                  <SelectField icon={<Users className="w-5 h-5 text-gray-400" />} label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={[{ value: "M", label: "Male" }, { value: "F", label: "Female" }, { value: "O", label: "Other" }]} />
                  <InputField icon={<Mail className="w-5 h-5 text-gray-400" />} label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                  <InputField icon={<Phone className="w-5 h-5 text-gray-400" />} label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
                  <InputField icon={<Briefcase className="w-5 h-5 text-gray-400" />} label="Position / Title" name="position" value={formData.position} onChange={handleChange} />
                  <SelectField icon={<ShieldCheck className="w-5 h-5 text-gray-400" />} label="Role" name="role" value={formData.role} onChange={handleChange} required options={[{ value: "admin", label: "Admin" }, { value: "doctor", label: "Doctor" }, { value: "reception", label: "Reception" }, { value: "pharmacist", label: "Pharmacist" }, { value: "labtech", label: "Lab Tech" }, { value: "facility_clerk", label: "Facility Clerk" }]} />
                </div>
              </div>

              {/* Password Fields */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField icon={<Key className="w-5 h-5 text-gray-400" />} label="Password" type="password" name="password" value={formData.password} onChange={handleChange} required />
                  <InputField icon={<Key className="w-5 h-5 text-gray-400" />} label="Confirm Password" type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} required />
                </div>
              </div>

              {/* Document Uploads */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Documents (Optional)</h3>
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                    <InputField icon={<FilePlus className="w-5 h-5 text-gray-400" />} placeholder="Document Label (e.g. License)" value={doc.label} onChange={(e) => handleDocumentChange(index, "label", e.target.value)} />
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocumentChange(index, "file", e.target.files[0])} className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                    {documents.length > 1 && (
                      <button type="button" onClick={() => removeDocumentRow(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addDocumentRow} className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  <PlusCircle size={16} className="mr-2" /> Add Another Document
                </button>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => navigate(-1)} className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-all duration-300">
                  <X className="w-5 h-5 mr-2" /> Cancel
                </button>
                <button type="submit" disabled={loading} className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-all duration-300 shadow-md">
                  {loading ? (
                    <><Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> Saving...</>
                  ) : (
                    <><Save className="w-5 h-5 mr-2" /> Add Staff</>
                  )}
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
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      {icon}
    </div>
    <input id={name} name={name} placeholder={label} {...props} className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
  </div>
);

const SelectField = ({ icon, label, name, options, ...props }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      {icon}
    </div>
    <select id={name} name={name} {...props} className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 appearance-none">
      <option value="">{label}</option>
      {options.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
    </div>
  </div>
);

export default AddStaff;