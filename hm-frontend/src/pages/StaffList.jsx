import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../layout/DashboardLayout";
import {
  Search,
  PlusCircle,
  ChevronLeft,
  Eye,
  Edit,
  Trash2,
  Loader,
  Users,
  AlertCircle,
} from "lucide-react";

const StaffList = () => {
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/staff`);
      setStaff(res.data);
    } catch (err) {
      console.error("Error fetching staff:", err);
      setError("Failed to fetch staff members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/staff/${id}`);
      fetchStaff(); // Refresh the list
    } catch (err) {
      console.error("Error deleting staff:", err);
      setError("Failed to delete staff member.");
    }
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.first_name.toLowerCase().includes(search.toLowerCase()) ||
      s.last_name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="w-full">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-300 mr-4"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full">
            <div className="p-6 sm:p-8">
              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg flex items-center shadow-md">
                  <AlertCircle className="w-6 h-6 mr-3" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="relative flex-grow max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, role, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                  />
                </div>
                <Link
                  to="/staff/add"
                  className="flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Add New Staff
                </Link>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader className="animate-spin h-10 w-10 text-indigo-500" />
                  <p className="ml-3 text-lg text-gray-600">Loading staff...</p>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-xl font-semibold">No staff members found.</p>
                  <p>Try adjusting your search or add a new staff member.</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-xl shadow-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CH ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStaff.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.ch_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.first_name} {s.last_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{s.role}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.phone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center justify-center space-x-4">
                              <Link to={`/staff/${s.id}`} className="text-green-600 hover:text-green-900 flex items-center">
                                <Eye className="w-4 h-4 mr-1" /> View
                              </Link>
                              <Link to={`/staff/${s.id}/edit`} className="text-indigo-600 hover:text-indigo-900 flex items-center">
                                <Edit className="w-4 h-4 mr-1" /> Edit
                              </Link>
                              <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-900 flex items-center">
                                <Trash2 className="w-4 h-4 mr-1" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StaffList;