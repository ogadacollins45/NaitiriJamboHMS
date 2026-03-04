import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../layout/DashboardLayout";
import {
  ChevronLeft,
  Edit,
  Trash2,
  Download,
  Eye,
  FileText,
  User,
  ShieldCheck,
  Mail,
  Phone,
  Loader,
  AlertCircle,
  X,
  Paperclip
} from "lucide-react";

const StaffDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/staff/${id}`);
        setStaff(res.data);
      } catch (err) {
        console.error("Error fetching staff details:", err);
        setError("Failed to load staff details.");
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) return;
    try {
      await axios.delete(`${API_BASE_URL}/staff/${id}`);
      alert("Staff deleted successfully!");
      navigate("/staff");
    } catch (err) {
      console.error(err);
      alert("Failed to delete staff member.");
    }
  };

  const getFileUrl = (filePath) => `${API_BASE_URL}/staff-documents/${filePath.split("/").pop()}`;

  const getFileType = (filePath) => {
    const ext = filePath.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    return "other";
  };

  const handleView = (doc) => {
    const type = getFileType(doc.file_path);
    const url = getFileUrl(doc.file_path);
    setSelectedDoc(doc);
    setPreviewType(type);
    setPreviewUrl(url);
  };

  const renderPreview = () => {
    if (!previewUrl) return null;
    switch (previewType) {
      case "image":
        return <img src={previewUrl} alt={selectedDoc?.label} className="max-h-[80vh] mx-auto object-contain" />;
      case "pdf":
        return <iframe src={previewUrl} title="PDF Preview" className="w-full h-[80vh]" />;
      default:
        return (
          <div className="text-center text-gray-600 p-10">
            <p>No inline preview available for this file type.</p>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline mt-4 inline-block">Click to open in a new tab</a>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader className="animate-spin h-10 w-10 text-indigo-500" />
          <p className="ml-3 text-lg text-gray-600">Loading Staff Details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-red-600">{error}</h3>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full">
          <div className="flex items-center mb-6">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-300 mr-4">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Staff Profile</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
                <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center">
                  <User className="w-20 h-20 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{staff.first_name} {staff.last_name}</h2>
                <p className="text-indigo-600 font-semibold capitalize">{staff.position || staff.role}</p>
                <div className="mt-6 flex justify-center gap-3">
                  <Link to={`/staff/${staff.id}/edit`} className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-300">
                    <Edit size={16} className="mr-2" /> Edit
                  </Link>
                  <button onClick={handleDelete} className="flex-1 flex items-center justify-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all duration-300">
                    <Trash2 size={16} className="mr-2" /> Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Details & Documents */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <InfoItem icon={<Mail size={20} className="text-gray-400" />} label="Email Address" value={staff.email} />
                  <InfoItem icon={<Phone size={20} className="text-gray-400" />} label="Phone Number" value={staff.phone || "Not provided"} />
                  <InfoItem icon={<ShieldCheck size={20} className="text-gray-400" />} label="System Role" value={staff.role} isCapitalized />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Attached Documents</h3>
                {staff.documents && staff.documents.length > 0 ? (
                  <ul className="space-y-3">
                    {staff.documents.map((doc) => (
                      <li key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center">
                          <Paperclip className="w-5 h-5 text-gray-500 mr-3" />
                          <span className="font-medium text-gray-700">{doc.label}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleView(doc)} className="flex items-center text-sm text-indigo-600 hover:underline">
                            <Eye size={14} className="mr-1" /> View
                          </button>
                          <a href={getFileUrl(doc.file_path)} download className="flex items-center text-sm text-green-600 hover:underline">
                            <Download size={14} className="mr-1" /> Download
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center py-4">No documents have been uploaded for this staff member.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {previewUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full relative">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">{selectedDoc?.label || "Document Preview"}</h3>
                <button onClick={() => setPreviewUrl(null)} className="p-2 rounded-full hover:bg-gray-200">
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <div className="p-4 bg-gray-100" style={{ height: '80vh' }}>
                {renderPreview()}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const InfoItem = ({ icon, label, value, isCapitalized }) => (
  <div className="flex items-start">
    <div className="flex-shrink-0 mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`font-semibold text-gray-800 ${isCapitalized ? 'capitalize' : ''}`}>{value}</p>
    </div>
  </div>
);

export default StaffDetails;