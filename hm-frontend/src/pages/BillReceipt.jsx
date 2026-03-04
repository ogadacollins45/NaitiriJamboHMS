import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Printer, X } from "lucide-react";

const BillReceipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBill = async () => {
      try {
        console.log("Fetching bill with ID:", id);
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/bills/${id}`;
        console.log("API URL:", apiUrl);

        const res = await axios.get(apiUrl);
        console.log("Bill data received:", res.data);

        // Handle different response structures
        const billData = res.data.bill || res.data.data || res.data;
        setBill(billData);
      } catch (e) {
        console.error("Error fetching bill:", e);
        console.error("Error response:", e.response?.data);
        console.error("Error status:", e.response?.status);
        setError(e.response?.data?.message || "Unable to load bill details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBill();
    } else {
      setError("No bill ID provided");
      setLoading(false);
    }
  }, [id]);

  const totalPaid =
    bill?.payments?.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0) || 0;
  const balance =
    Number(bill?.total_amount || 0) - Number(totalPaid || 0);

  const onPrint = () => window.print();

  if (loading) return <div className="flex justify-center items-center h-screen"><p className="text-center text-gray-600">Loading receipt...</p></div>;
  if (error) return <div className="flex justify-center items-center h-screen"><p className="text-center text-red-600">{error}</p></div>;
  if (!bill) return <div className="flex justify-center items-center h-screen"><p className="text-center text-red-600">Bill not found.</p></div>;

  return (
    <div className="bg-gray-100 min-h-screen w-full flex items-center justify-center p-4 print:p-0 print:bg-white fixed inset-0 print:relative">
      <div className="max-w-3xl w-full bg-white shadow-xl rounded-lg overflow-hidden my-8 print:shadow-none print:rounded-none print:my-0">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-start print:border-b-0">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">Naitiri Jambo HMS</h1>
            <p className="text-xs text-gray-500">Hospital Billing Receipt</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Receipt # {bill.id}</p>
            <p className="text-sm text-gray-600">Date: {new Date(bill.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Patient and Doctor Info */}
        <div className="p-6 border-b border-gray-200 grid grid-cols-2 gap-4 text-sm print:border-b-0">
          <div>
            <h2 className="font-semibold text-gray-700 mb-1">Patient Details</h2>
            <p>{bill.patient?.first_name} {bill.patient?.last_name}</p>
            {bill.patient?.upid && <p className="text-gray-600">UPID: {bill.patient.upid}</p>}
            {bill.patient?.phone && <p className="text-gray-600">Phone: {bill.patient.phone}</p>}
            {bill.patient?.email && <p className="text-gray-600">Email: {bill.patient.email}</p>}
          </div>
          <div className="text-right">
            <h2 className="font-semibold text-gray-700 mb-1">Attending Doctor</h2>
            <p>{bill.doctor ? `Dr. ${bill.doctor.first_name} ${bill.doctor.last_name}` : "N/A"}</p>
            {bill.treatment_id && <p className="text-gray-600">Treatment ID: {bill.treatment_id}</p>}
            <p className="text-gray-600">Status: <span className="font-medium capitalize">{bill.status}</span></p>
          </div>
        </div>

        {/* Bill Items */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Items Charged</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">#</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Description</th>
                <th className="px-4 py-2 text-center font-medium text-gray-600">Qty</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Unit Price</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bill.items?.map((item, i) => (
                <tr key={item.id || i}>
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">{item.description} <span className="text-xs text-gray-500">({item.category})</span></td>
                  <td className="px-4 py-2 text-center">{item.quantity}</td>
                  <td className="px-4 py-2 text-right">KES {Number(item.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">KES {Number(item.subtotal || 0).toFixed(2)}</td>
                </tr>
              ))}
              {(!bill.items || bill.items.length === 0) && (
                <tr>
                  <td colSpan="5" className="px-4 py-4 text-center text-gray-500">No items on this bill.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-6 pt-0 flex justify-end print:ml-auto print:max-w-md">
          <div className="w-full max-w-sm">
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>KES {Number(bill.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>KES {Number(bill.tax || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>- KES {Number(bill.discount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2 mt-2">
                <span>Total:</span>
                <span>KES {Number(bill.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span className="font-semibold">Amount Paid:</span>
                <span className="font-semibold">KES {Number(totalPaid).toFixed(2)}</span>
              </div>
              <div className={`flex justify-between font-bold ${balance > 0 ? "text-red-600" : "text-green-700"}`}>
                <span>Balance Due:</span>
                <span>KES {Number(balance).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 text-center text-sm text-gray-500 print:text-xs print:border-t-0">
          <p>Thank you for choosing Naitiri Jambo HMS. For any inquiries, please contact us.</p>
        </div>

        {/* Controls - Hidden on Print */}
        <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300"
          >
            <X className="w-5 h-5 mr-2" /> Close
          </button>
          <button
            onClick={onPrint}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300"
          >
            <Printer className="w-5 h-5 mr-2" /> Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillReceipt;