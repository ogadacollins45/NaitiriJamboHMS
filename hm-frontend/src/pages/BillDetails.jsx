import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../layout/DashboardLayout";
import {
  ChevronLeft,
  Printer,
  DollarSign,
  CreditCard,
  FileText,
  Save,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  Hash,
  User,
  Stethoscope,
  Calendar,
  Info,
  Eye,
} from "lucide-react";

const BillDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [pastBills, setPastBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [payment, setPayment] = useState({
    amount_paid: "",
    payment_method: "Cash",
    transaction_ref: "",
    notes: "",
  });

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  const fetchBill = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/bills/${id}`);
      setBill(res.data.bill);
      setPastBills(res.data.past_bills || []);
      const balance = Number(res.data.bill.total_amount) - (res.data.bill.payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0);
      // Set payment method from bill's payment_method, defaulting to Cash if not set
      setPayment(prev => ({
        ...prev,
        amount_paid: balance > 0 ? balance.toFixed(2) : "",
        payment_method: res.data.bill.payment_method || "Cash"
      }));
    } catch (error) {
      console.error("Error fetching bill:", error);
      setError("Bill not found or could not be loaded.");
      setTimeout(() => navigate("/billing"), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBill();
  }, [id]);

  const flashMessage = (setter, message) => {
    setter(message);
    setTimeout(() => setter(""), 4000);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!payment.amount_paid || isNaN(payment.amount_paid) || payment.amount_paid <= 0) {
      flashMessage(setError, "Please enter a valid payment amount.");
      return;
    }

    setIsPaying(true);
    setError("");
    setSuccess("");
    try {
      await axios.post(`${API_BASE_URL}/bills/${bill.id}/payments`, payment);
      flashMessage(setSuccess, "Payment recorded successfully!");
      await fetchBill();
      setPayment({ amount_paid: "", payment_method: "Cash", transaction_ref: "", notes: "" });
    } catch (error) {
      console.error("Payment error:", error);
      flashMessage(setError, "Failed to record payment. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  const paidAmount = bill?.payments?.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0) || 0;
  const balance = Number(bill?.total_amount || 0) - paidAmount;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader className="animate-spin h-10 w-10 text-indigo-500" />
          <p className="ml-3 text-lg text-gray-600">Loading Bill Details...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full">
          <div className="flex items-center mb-6">
            <button onClick={() => navigate("/billing")} className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-300 mr-4">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Bill Details</h1>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg flex items-center shadow-md">
              <AlertCircle className="w-6 h-6 mr-3" />
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg flex items-center shadow-md">
              <CheckCircle className="w-6 h-6 mr-3" />
              <p>{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bill Info Card */}
              <InfoCard bill={bill} paidAmount={paidAmount} balance={balance} />

              {/* Bill Items Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Bill Items</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bill?.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{item.description}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">{Number(item.amount).toFixed(2)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium text-right">{Number(item.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Patient's Past Bills Card */}
              {pastBills && pastBills.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Patient's Bill History ({bill?.patient?.first_name} {bill?.patient?.last_name})
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bill #</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pastBills.map((pastBill) => {
                          const paidAmt = pastBill.payments?.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0) || 0;
                          const balanceAmt = Number(pastBill.total_amount || 0) - paidAmt;

                          return (
                            <tr key={pastBill.id} className="hover:bg-gray-50 transition-colors duration-200">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">#{pastBill.id}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(pastBill.created_at).toLocaleDateString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium text-right">KES {Number(pastBill.total_amount).toFixed(2)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pastBill.status === 'paid' ? 'bg-green-100 text-green-700' :
                                  pastBill.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                  {pastBill.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                <button
                                  onClick={() => navigate(`/bills/${pastBill.id}`)}
                                  className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200 inline-flex items-center"
                                >
                                  <Eye className="w-4 h-4 mr-1" /> View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment Form Card */}
              {balance > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Record a Payment</h2>
                  <form onSubmit={handlePayment} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField icon={<DollarSign className="w-5 h-5 text-gray-400" />} label="Amount Paid" type="number" step="0.01" value={payment.amount_paid} onChange={(e) => setPayment({ ...payment, amount_paid: e.target.value })} required />
                      <SelectField
                        icon={<CreditCard className="w-5 h-5 text-gray-400" />}
                        label="Payment Method"
                        value={payment.payment_method}
                        onChange={(e) => setPayment({ ...payment, payment_method: e.target.value })}
                        options={[
                          { value: "Cash", label: "Cash" },
                          { value: "Mobile Money", label: "Mobile Money (Mpesa/Airtel Money)" },
                          { value: "Bank Transfer", label: "Bank Transfer" },
                          { value: "Insurance", label: "Insurance" },
                          { value: "Other", label: "Other" }
                        ]}
                      />
                    </div>
                    <InputField icon={<FileText className="w-5 h-5 text-gray-400" />} label="Transaction Reference (optional)" value={payment.transaction_ref} onChange={(e) => setPayment({ ...payment, transaction_ref: e.target.value })} />
                    <div className="flex justify-end">
                      <button type="submit" disabled={isPaying} className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-all duration-300 shadow-md">
                        {isPaying ? (
                          <><Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> Processing...</>
                        ) : (
                          <><Save className="w-5 h-5 mr-2" /> Submit Payment</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Right Column - Receipt Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ReceiptPreview bill={bill} paidAmount={paidAmount} balance={balance} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const InfoCard = ({ bill, paidAmount, balance }) => (
  <div className="bg-white rounded-2xl shadow-xl p-6">
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
      <InfoItem icon={<Hash className="text-indigo-500" />} label="Bill ID" value={bill.id} />
      <InfoItem icon={<User className="text-indigo-500" />} label="Patient" value={`${bill.patient?.first_name} ${bill.patient?.last_name}`} />
      <InfoItem icon={<Stethoscope className="text-indigo-500" />} label="Doctor" value={bill.doctor ? `Dr. ${bill.doctor.first_name} ${bill.doctor.last_name}` : "N/A"} />
      <InfoItem icon={<Calendar className="text-indigo-500" />} label="Bill Date" value={new Date(bill.created_at).toLocaleDateString()} />
      <InfoItem icon={<DollarSign className="text-green-500" />} label="Amount Paid" value={`KES ${paidAmount.toFixed(2)}`} />
      <InfoItem icon={<DollarSign className={balance > 0 ? "text-red-500" : "text-green-500"} />} label="Balance Due" value={`KES ${balance.toFixed(2)}`} />
    </div>
  </div>
);

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start">
    <div className="flex-shrink-0 mr-3">{React.cloneElement(icon, { size: 20 })}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

const ReceiptPreview = ({ bill, paidAmount, balance }) => {
  const navigate = useNavigate();
  if (!bill) return null;

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-800">Receipt Preview</h3>
      </div>
      <div className="p-6 bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-inner border border-gray-100">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">Naitiri Jambo HMS</h1>
            <p className="text-xs text-gray-500">Billing Receipt</p>
          </div>
          <div className="text-xs text-gray-600 space-y-1 mb-4">
            <p><strong>Receipt #:</strong> {bill.id}</p>
            <p><strong>Date:</strong> {new Date(bill.created_at).toLocaleString()}</p>
            <p><strong>Patient:</strong> {bill.patient?.first_name} {bill.patient?.last_name}</p>
          </div>
          <table className="w-full text-xs">
            <thead className="border-b border-gray-300">
              <tr>
                <th className="py-1 text-left font-semibold">Item</th>
                <th className="py-1 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.items?.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-1">{item.description} (x{item.quantity})</td>
                  <td className="py-1 text-right">{Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-xs text-right space-y-1">
            <p><strong>Subtotal:</strong> KES {Number(bill.subtotal).toFixed(2)}</p>
            <p><strong>Tax:</strong> KES {Number(bill.tax).toFixed(2)}</p>
            <p className="font-bold text-sm"><strong>Total:</strong> KES {Number(bill.total_amount).toFixed(2)}</p>
            <p className="text-green-600"><strong>Paid:</strong> KES {paidAmount.toFixed(2)}</p>
            <p className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              <strong>Balance:</strong> KES {balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 border-t border-gray-200 flex justify-end">
        <button onClick={() => navigate(`/bills/${bill.id}/receipt`)} className="flex items-center justify-center px-4 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 transition-all duration-300">
          <Printer className="w-5 h-5 mr-2" /> Print Full Receipt
        </button>
      </div>
    </div>
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
      {options.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
    </div>
  </div>
);

export default BillDetails;