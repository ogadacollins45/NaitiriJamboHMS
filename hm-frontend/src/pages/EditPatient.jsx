import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../layout/DashboardLayout";
import { KENYA_COUNTIES, SUB_COUNTIES } from "../data/kenyaLocations";
import {
  ChevronLeft,
  User,
  Users,
  Cake,
  Phone,
  Mail,
  MapPin,
  Save,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const EditPatient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    gender: "",
    dob: "",
    phone: "",
    email: "",
    address: "",

    // NEW MOH fields
    county: "",
    sub_county: "",
    ward: "",
    village: "",
    next_of_kin: "",
    next_of_kin_phone: "",
    pregnancy_status: "na",
    has_disability: false,
    disability_type: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mohFieldsExpanded, setMohFieldsExpanded] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/patients/${id}`);
        setFormData({
          first_name: res.data.first_name || "",
          last_name: res.data.last_name || "",
          gender: res.data.gender || "",
          dob: res.data.dob || "",
          phone: res.data.phone || "",
          email: res.data.email || "",
          address: res.data.address || "",

          // NEW MOH fields
          county: res.data.county || "",
          sub_county: res.data.sub_county || "",
          ward: res.data.ward || "",
          village: res.data.village || "",
          next_of_kin: res.data.next_of_kin || "",
          next_of_kin_phone: res.data.next_of_kin_phone || "",
          pregnancy_status: res.data.pregnancy_status || "na",
          has_disability: res.data.has_disability || false,
          disability_type: res.data.disability_type || "",
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load patient details.");
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/patients/${id}`, formData, {
        headers: { "Content-Type": "application/json" },
      });
      setSuccess("Patient updated successfully! Redirecting...");
      setTimeout(() => navigate(`/patients/${id}`), 1500);
    } catch (err) {
      console.error(err);
      const apiError = err.response?.data?.message || "Failed to update patient. Please check your input and try again.";
      setError(apiError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader className="animate-spin h-10 w-10 text-indigo-500" />
          <p className="ml-3 text-lg text-gray-600">Loading Patient Data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-300 mr-4"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Edit Patient Information</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full">
            <div className="p-6 sm:p-8">
              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg flex items-center shadow-md">
                  <AlertCircle className="w-6 h-6 mr-3" />
                  <div>
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}
              {success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg flex items-center shadow-md">
                  <CheckCircle className="w-6 h-6 mr-3" />
                  <div>
                    <p className="font-bold">Success</p>
                    <p>{success}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField icon={<User className="w-5 h-5 text-gray-400" />} label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                  <InputField icon={<User className="w-5 h-5 text-gray-400" />} label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                  <SelectField icon={<Users className="w-5 h-5 text-gray-400" />} label="Gender" name="gender" value={formData.gender} onChange={handleChange} required options={[{ value: "M", label: "Male" }, { value: "F", label: "Female" }, { value: "O", label: "Other" }]} />
                  <InputField icon={<Cake className="w-5 h-5 text-gray-400" />} label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} />
                  <InputField icon={<Phone className="w-5 h-5 text-gray-400" />} label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
                  <InputField icon={<Mail className="w-5 h-5 text-gray-400" />} label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-center pointer-events-none">
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Address" rows="3" className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300" />
                </div>

                {/* MOH Reporting Fields - Collapsible */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setMohFieldsExpanded(!mohFieldsExpanded)}
                    className="w-full flex items-center justify-between text-left hover:bg-gray-200 hover:bg-opacity-50 rounded-lg p-2 -m-2 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                      MOH Reporting Fields
                      <span className="ml-2 text-sm font-normal text-gray-500">(Optional - for MOH 705)</span>
                    </h3>
                    {mohFieldsExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  {mohFieldsExpanded && (
                    <div className="mt-4 space-y-6">
                      {/* Geographic Information */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-indigo-600" />
                          Geographic Information
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                            <select
                              name="county"
                              value={formData.county}
                              onChange={(e) => setFormData({ ...formData, county: e.target.value, sub_county: "" })}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="">-- Select County --</option>
                              {KENYA_COUNTIES.map(county => (
                                <option key={county} value={county}>{county}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sub-County</label>
                            <select
                              name="sub_county"
                              value={formData.sub_county}
                              onChange={handleChange}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              disabled={!formData.county}
                            >
                              <option value="">-- Select Sub-County --</option>
                              {formData.county && SUB_COUNTIES[formData.county]?.map(sc => (
                                <option key={sc} value={sc}>{sc}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <InputField icon={<MapPin className="w-5 h-5 text-gray-400" />} label="Ward" name="ward" value={formData.ward} onChange={handleChange} />
                          <InputField icon={<MapPin className="w-5 h-5 text-gray-400" />} label="Village/Estate" name="village" value={formData.village} onChange={handleChange} />
                        </div>
                      </div>

                      {/* Next of Kin */}
                      <div className="pt-4 border-t border-gray-300">
                        <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                          <User className="w-4 h-4 mr-2 text-indigo-600" />
                          Next of Kin
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InputField icon={<User className="w-5 h-5 text-gray-400" />} label="Next of Kin Name" name="next_of_kin" value={formData.next_of_kin} onChange={handleChange} />
                          <InputField icon={<Phone className="w-5 h-5 text-gray-400" />} label="Next of Kin Phone" name="next_of_kin_phone" value={formData.next_of_kin_phone} onChange={handleChange} />
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="pt-4 border-t border-gray-300">
                        <h4 className="text-md font-semibold text-gray-700 mb-3">Additional Information</h4>

                        {formData.gender === "F" && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pregnancy Status</label>
                            <select
                              name="pregnancy_status"
                              value={formData.pregnancy_status}
                              onChange={handleChange}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="na">Not Applicable</option>
                              <option value="yes">Pregnant</option>
                              <option value="no">Not Pregnant</option>
                              <option value="unknown">Unknown</option>
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              checked={formData.has_disability}
                              onChange={(e) => setFormData({
                                ...formData,
                                has_disability: e.target.checked,
                                disability_type: e.target.checked ? formData.disability_type : ""
                              })}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">Patient has a disability</span>
                          </label>
                        </div>

                        {formData.has_disability && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Disability Type</label>
                            <input
                              type="text"
                              name="disability_type"
                              value={formData.disability_type}
                              onChange={handleChange}
                              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="e.g., Visual, Hearing, Physical, Mental"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => navigate(-1)} className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-all duration-300">
                    <X className="w-5 h-5 mr-2" /> Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-all duration-300 shadow-md">
                    {saving ? (
                      <><Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> Saving...</>
                    ) : (
                      <><Save className="w-5 h-5 mr-2" /> Save Changes</>
                    )}
                  </button>
                </div>
              </form>
            </div>
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
    <input
      id={name}
      name={name}
      placeholder={label}
      {...props}
      className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
    />
  </div>
);

const SelectField = ({ icon, label, name, options, ...props }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      {icon}
    </div>
    <select
      id={name}
      name={name}
      {...props}
      className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
    </div>
  </div>
);

export default EditPatient;