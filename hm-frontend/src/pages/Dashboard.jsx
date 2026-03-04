import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Users, Activity, DollarSign, Package,
  Calendar, AlertCircle, TrendingUp, Briefcase, Stethoscope, Clock, FileText, ShoppingBag,
  ChevronLeft, Search, Filter, PlusCircle, Edit, Trash2, Loader, CheckCircle, X,
  User, Phone, CreditCard
} from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#22c55e", "#eab308"];

const toISODate = (d) => new Date(d).toISOString().slice(0, 10);
const todayISO = toISODate(new Date());
const daysAgoISO = (n) => toISODate(new Date(Date.now() - n * 86400000));

export default function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role"); // admin | doctor | reception | pharmacist | labtech

  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO);
  const [doctorId, setDoctorId] = useState("");
  const [service, setService] = useState("");

  const [doctors, setDoctors] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pollToggle, setPollToggle] = useState(false);
  const [error, setError] = useState("");

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/doctors`);
      setDoctors(res.data || []);
    } catch (e) {
      console.error("Failed to load doctors", e);
      setError("Failed to load doctors list.");
    }
  }, [API_BASE_URL]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/dashboard`, {
        params: {
          from,
          to,
          doctor_id: doctorId || undefined,
          service: service || undefined,
        },
      });
      setData(res.data || {});
    } catch (e) {
      console.error(e);
      setError("Unable to load dashboard data. Please check your connection and try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, from, to, doctorId, service]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, pollToggle]);

  useEffect(() => {
    const id = setInterval(() => setPollToggle((x) => !x), 60000);
    return () => clearInterval(id);
  }, []);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const lists = data?.lists || {};
  const exceptions = data?.exceptions || {};

  const billingStatusData = useMemo(() => ([
    { stage: "Unbilled", count: exceptions?.unbilled_treatments?.length || 0 },
    { stage: "Partial", count: exceptions?.partial_bills?.length || 0 },
    { stage: "Paid", count: (kpis?.paid_bills_count ?? 0) },
  ]), [exceptions?.unbilled_treatments?.length, exceptions?.partial_bills?.length, kpis?.paid_bills_count]);

  const roleLabel =
    role === "admin" ? "Admin" :
      role === "doctor" ? "Doctor" :
        role === "reception" ? "Reception" :
          role === "pharmacist" ? "Pharmacist" :
            role === "labtech" ? "Lab Tech" :
              "Staff";

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <div className="w-full max-w-full">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-indigo-600" /> {roleLabel} Dashboard
            </h1>
          </div>

          {/* Filter Card */}
          <Card title="📈 Dashboard Filters">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              <InputField icon={<Calendar className="w-5 h-5 text-gray-400" />} label="From Date" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
              <InputField icon={<Calendar className="w-5 h-5 text-gray-400" />} label="To Date" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
              <SelectField
                icon={<Stethoscope className="w-5 h-5 text-gray-400" />}
                label="Doctor"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                options={[
                  { value: "", label: "All Doctors" },
                  ...doctors.map(d => ({
                    value: d.id,
                    label: `Dr. ${d.first_name} ${d.last_name}`
                  }))
                ]}
              />
              <SelectField
                icon={<Briefcase className="w-5 h-5 text-gray-400" />}
                label="Service Type"
                value={service}
                onChange={(e) => setService(e.target.value)}
                options={[
                  { value: "", label: "All Services" },
                  { value: "consultation", label: "Consultation" },
                  { value: "prescription", label: "Prescription" },
                  { value: "lab", label: "Lab" },
                  { value: "service", label: "Service" },
                  { value: "custom", label: "Custom" }
                ]}
              />
              <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                <button
                  onClick={fetchDashboard}
                  className="w-full px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md text-sm md:text-base"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </Card>

          {/* Error */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 rounded-lg flex items-center shadow-md">
              <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0" />
              <p className="text-sm md:text-base">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader className="animate-spin h-12 w-12 text-indigo-500 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-600">Loading dashboard data...</p>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && data && !error && (
            <div className="space-y-4 md:space-y-6 mt-4">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
                <KPI label="Total Patients" value={kpis.total_patients} tone="blue" icon={Users} />

                <KPI label="Total Treatments" value={kpis.total_treatments} tone="green" icon={Activity} />

                {(role === "admin" || role === "reception") && (
                  <KPI label="Pending Bills" value={kpis.pending_bills} tone="yellow" icon={AlertCircle} />
                )}

                {role === "admin" && (
                  <KPI
                    label="Revenue"
                    value={`KES ${Number(kpis.revenue_selected || 0).toFixed(2)}`}
                    tone="purple"
                    icon={DollarSign}
                  />
                )}

                {role === "admin" && (
                  <KPI
                    label="Low Stock Items"
                    value={kpis.low_stock}
                    tone="red"
                    icon={Package}
                  />
                )}
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                {role === "admin" && (
                  <Card title="💰 Revenue Trend (Collected)">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={charts.revenue_series || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: "12px" }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                        <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", color: "#000000" }} />
                        <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {(role === "admin" || role === "reception") && (
                  <Card title="📦 Billing Funnel (Unbilled → Partial → Paid)">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={billingStatusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="stage" stroke="#6b7280" style={{ fontSize: "12px" }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                        <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", color: "#000000" }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {role === "admin" && (
                  <Card title="⏳ A/R Aging (Amount)">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={charts.ar_aging || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="bucket" stroke="#6b7280" style={{ fontSize: "11px" }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: "11px" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            color: "#000000",
                          }}
                        />
                        <Bar dataKey="amount" radius={[8, 8, 0, 0]} fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                )}

                {role === "admin" && (
                  <Card title="🩺 Revenue by Doctor">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={charts.revenue_by_doctor || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="doctor" stroke="#6b7280" style={{ fontSize: "11px" }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: "11px" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            color: "#000000",
                          }}
                        />
                        <Bar dataKey="amount" radius={[8, 8, 0, 0]} fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                )}

                {role === "admin" && (
                  <Card title="🍰 Revenue by Category">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={charts.revenue_by_category || []}
                          dataKey="amount"
                          nameKey="category"
                          outerRadius={75}
                          label
                        >
                          {(charts.revenue_by_category || []).map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", color: "#000000" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                )}
              </div>

              {/* Operations & Exceptions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <Card title="📅 Today's Appointments">
                  {lists.today_appointments?.length ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {lists.today_appointments.map((a, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg transition-all bg-gray-50 hover:bg-gray-100">
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="text-sm font-semibold text-gray-800">
                              {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : "Unknown Patient"}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : a.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : a.status === "cancelled"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                            >
                              {a.status}
                            </span>
                          </div>
                          <p className="text-xs mb-1 text-gray-600">
                            <Clock className="inline-block w-3 h-3 mr-1" />
                            {new Date(a.appointment_time).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600">
                            <Stethoscope className="inline-block w-3 h-3 mr-1" />
                            {a.doctor ? `Dr. ${a.doctor.first_name} ${a.doctor.last_name}` : "No doctor assigned"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty caption="No appointments scheduled for today" />
                  )}
                </Card>

                {(role === "admin" || role === "reception") && (
                  <Card title="🧾 Unbilled Treatments (Action Required)">
                    {exceptions.unbilled_treatments?.length ? (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {exceptions.unbilled_treatments.slice(0, 10).map((t, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg transition-all bg-gray-50 hover:bg-gray-100">
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="text-sm font-semibold text-gray-800">
                                {t.patient ? `${t.patient.first_name} ${t.patient.last_name}` : "Unknown Patient"}
                              </span>
                              <button
                                onClick={() => {
                                  navigate("/billing", {
                                    state: {
                                      patientName: t.patient
                                        ? `${t.patient.first_name} ${t.patient.last_name}`
                                        : "",
                                      patientId: t.patient?.id
                                    }
                                  });
                                }}
                                className="text-xs px-2.5 py-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors font-medium"
                              >
                                Bill Now
                              </button>
                            </div>
                            <p className="text-xs mb-1 text-gray-600">
                              <Calendar className="inline-block w-3 h-3 mr-1" />{" "}
                              {new Date(t.visit_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-600">
                              <Stethoscope className="inline-block w-3 h-3 mr-1" />{" "}
                              {t.doctor
                                ? `Dr. ${t.doctor.first_name} ${t.doctor.last_name}`
                                : t.attending_doctor || "No doctor"}
                            </p>
                            <span className="inline-block text-xs px-2 py-0.5 rounded mt-1 bg-yellow-100 text-yellow-700">
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty caption="All treatments have been billed 🎉" />
                    )}
                  </Card>
                )}

                {role === "admin" && (
                  <Card title="📦 Low Stock Items">
                    {lists.low_stock?.length ? (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {lists.low_stock.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-lg transition-all bg-gray-50 hover:bg-gray-100">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-semibold text-gray-800">
                                {item.name}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-bold ${item.quantity < 5
                                  ? "bg-red-100 text-red-700"
                                  : "bg-orange-100 text-orange-700"
                                  }`}
                              >
                                {item.quantity} left
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-gray-600">
                                <DollarSign className="inline-block w-3 h-3 mr-1" /> KES{" "}
                                {Number(item.unit_price).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-600">
                                <ShoppingBag className="inline-block w-3 h-3 mr-1" />{" "}
                                {item.category || "Uncategorized"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty caption="All items are adequately stocked" />
                    )}
                  </Card>
                )}
              </div>

              {/* Activity Section */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card title="🧍 Recent Patients">
                  {lists.recent_patients?.length ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {lists.recent_patients.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg flex justify-between items-center transition-all bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">
                              <User className="inline-block w-4 h-4 mr-1" /> {p.first_name} {p.last_name}
                            </p>
                            <p className="text-xs text-gray-600">
                              <Phone className="inline-block w-3 h-3 mr-1" />{" "}
                              {p.phone || "No phone provided"}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
                            {new Date(p.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty caption="No recent patient registrations" />
                  )}
                </Card>

                {(role === "admin" || role === "reception") && (
                  <Card title="💳 Recent Payments">
                    {lists.recent_payments?.length ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {lists.recent_payments.map((p, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg flex justify-between items-center transition-all bg-gray-50 hover:bg-gray-100"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-800">
                                {p.patient_name || "Unknown Patient"}
                              </p>
                              <p className="text-xs text-gray-600">
                                <CreditCard className="inline-block w-3 h-3 mr-1" /> {p.payment_method}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-600">
                                KES {Number(p.amount_paid).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-600">
                                <Calendar className="inline-block w-3 h-3 mr-1" />{" "}
                                {new Date(p.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty caption="No recent payment transactions" />
                    )}
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ---------- UI Helper Components ---------- */

function InputField({ icon, label, name, ...props }) {
  return (
    <div className="relative flex-grow">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {icon}
      </div>
      <input
        id={name}
        name={name}
        placeholder={label}
        {...props}
        className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
      />
    </div>
  );
}

function SelectField({ icon, label, name, options, ...props }) {
  return (
    <div className="relative flex-grow">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {icon}
      </div>
      <select
        id={name}
        name={name}
        {...props}
        className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-300 appearance-none"
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}

function KPI({ label, value, tone = "blue", icon: Icon }) {
  const tones = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      iconBg: "bg-blue-100",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      iconBg: "bg-green-100",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-700",
      iconBg: "bg-yellow-100",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-700",
      iconBg: "bg-purple-100",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      iconBg: "bg-red-100",
    },
  };

  const classes = tones[tone];

  return (
    <div className={`${classes.bg} border ${classes.border} rounded-xl p-5 transition-all hover:shadow-lg hover:scale-105 duration-200`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${classes.iconBg}`}>
          <Icon size={20} className={classes.text} />
        </div>
      </div>
      <p className="text-xs font-medium mb-1 text-gray-600">
        {label}
      </p>
      <h2 className={`text-2xl md:text-3xl font-bold ${classes.text}`}>
        {value ?? "—"}
      </h2>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm ">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Empty({ caption }) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-gray-500">
        <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        {caption}
      </p>
    </div>
  );
}
