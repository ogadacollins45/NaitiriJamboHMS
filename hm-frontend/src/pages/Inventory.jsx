import React, { useState, useEffect } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import axios from "axios";
import Preloader from "../components/Preloader";
import { Search, Filter, PlusCircle, Edit, Trash2, Loader, AlertCircle, CheckCircle, ChevronLeft, Package, Tag, Boxes, DollarSign, Calendar, Ban, Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/inventory`;

const InputField = ({ icon, name, label, value, onChange, type = "text", required = false, placeholder, disabled = false }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      {icon}
    </div>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
      placeholder={placeholder || label}
      required={required}
      disabled={disabled}
    />
  </div>
);

const SelectField = ({ icon, name, label, value, onChange, options, required = false, disabled = false }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      {icon}
    </div>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 appearance-none"
      required={required}
      disabled={disabled}
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

const Inventory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const [showSuccess, setShowSuccess] = useState("");
  const [showError, setShowError] = useState("");
  const [showEditModal, setShowEditModal] = useState(null);
  const [viewItem, setViewItem] = useState(null);

  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    subcategory: "",
    quantity: "",
    unit: "",
    unit_price: "",
    supplier_id: "",
    expiry_date: "",
    expiry_na: false,
  });

  const [suppliers, setSuppliers] = useState([]);

  const [editItem, setEditItem] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API_URL.replace('/inventory', '/suppliers')}`);
      setSuppliers(res.data || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setItems(res.data.data || res.data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setShowError("Failed to fetch inventory. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewItemChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditItemChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditItem((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setShowError("");
    setShowSuccess("");
    try {
      const payload = { ...newItem };
      if (payload.expiry_na) delete payload.expiry_date;
      delete payload.expiry_na;

      await axios.post(API_URL, payload);
      setShowSuccess("Item added successfully!");
      setShowAddForm(false);
      setNewItem({
        name: "",
        category: "",
        subcategory: "",
        quantity: "",
        unit: "",
        unit_price: "",
        supplier_id: "",
        expiry_date: "",
        expiry_na: false,
      });
      fetchInventory();
    } catch (err) {
      console.error(err);
      setShowError("Failed to add item. Please check your input.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = (id) => {
    setShowConfirm({ type: "delete", id });
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    setShowError("");
    setShowSuccess("");
    try {
      await axios.delete(`${API_URL}/${showConfirm.id}`);
      setShowConfirm(null);
      setShowSuccess("Item deleted successfully!");
      fetchInventory();
    } catch (err) {
      console.error(err);
      setShowError("Failed to delete item. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditItem({ ...item, expiry_na: !item.expiry_date });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setShowError("");
    setShowSuccess("");
    try {
      const payload = { ...editItem };
      if (payload.expiry_na) payload.expiry_date = null;
      delete payload.expiry_na;

      await axios.put(`${API_URL}/${editItem.id}`, payload);
      setShowEditModal(false);
      setShowSuccess("Item updated successfully!");
      fetchInventory();
    } catch (err) {
      console.error(err);
      setShowError("Failed to update item. Please check your input.");
    } finally {
      setEditLoading(false);
    }
  };

  const filteredItems = items
    .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    .filter((item) => item.category !== "Medicine") // Prevent drugs from showing in general item store
    .filter(
      (item) => filterCategory === "All" || item.category === filterCategory
    );

  // Pagination calculations
  const itemsPerPage = limit;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory, limit]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };



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
            <h1 className="text-3xl font-bold text-gray-800">Item Store Inventory</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full">
            <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex items-center">
                <Boxes className="w-8 h-8 text-white mr-4" />
                <h2 className="text-2xl font-bold text-white">Hospital Store Stock</h2>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {showError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg flex items-center shadow-md">
                  <AlertCircle className="w-6 h-6 mr-3" />
                  <div>
                    <p className="font-bold">Error</p>
                    <p>{showError}</p>
                  </div>
                </div>
              )}
              {showSuccess && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg flex items-center shadow-md">
                  <CheckCircle className="w-6 h-6 mr-3" />
                  <div>
                    <p className="font-bold">Success</p>
                    <p>{showSuccess}</p>
                  </div>
                </div>
              )}

              {/* Top Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="relative flex-grow max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <SelectField
                    icon={<Filter className="w-5 h-5 text-gray-400" />}
                    name="filterCategory"
                    label="Filter Category"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    options={[
                      { value: "All", label: "All Categories" },
                      { value: "Equipment", label: "Equipment" },
                      { value: "Consumable", label: "Consumable" },
                    ]}
                  />

                  <SelectField
                    icon={<Boxes className="w-5 h-5 text-gray-400" />}
                    name="limit"
                    label="Show"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    options={[
                      { value: 5, label: "Show 5" },
                      { value: 10, label: "Show 10" },
                      { value: 20, label: "Show 20" },
                      { value: 50, label: "Show 50" },
                    ]}
                  />

                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    {showAddForm ? (
                      <> <Ban className="w-5 h-5 mr-2" /> Cancel </>
                    ) : (
                      <> <PlusCircle className="w-5 h-5 mr-2" /> Add New Item </>
                    )}
                  </button>
                </div>
              </div>

              {/* Add Item Form */}
              {showAddForm && (
                <div className="bg-gray-50 p-6 rounded-xl shadow-inner mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Inventory Item</h3>
                  <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                      <InputField
                        icon={<Package className="w-5 h-5 text-gray-400" />}
                        name="name"
                        label="Item Name"
                        value={newItem.name}
                        onChange={handleNewItemChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <SelectField
                        icon={<Tag className="w-5 h-5 text-gray-400" />}
                        name="category"
                        label="Select Category"
                        value={newItem.category}
                        onChange={handleNewItemChange}
                        options={[
                          { value: "Equipment", label: "Equipment" },
                          { value: "Consumable", label: "Consumable" },
                        ]}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Drug Type / Form</label>
                      <SelectField
                        icon={<Tag className="w-5 h-5 text-gray-400" />}
                        name="subcategory"
                        label="Select Type/Form"
                        value={newItem.subcategory}
                        onChange={handleNewItemChange}
                        options={[
                          { value: "Tablet", label: "Tablet" },
                          { value: "Capsule", label: "Capsule" },
                          { value: "Syrup", label: "Syrup" },
                          { value: "Injection", label: "Injection" },
                          { value: "Ointment", label: "Ointment" },
                          { value: "Cream", label: "Cream" },
                          { value: "Drops", label: "Drops" },
                          { value: "Inhaler", label: "Inhaler" },
                          { value: "Other", label: "Other" },
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <InputField
                        icon={<Boxes className="w-5 h-5 text-gray-400" />}
                        name="quantity"
                        label="Quantity"
                        type="number"
                        value={newItem.quantity}
                        onChange={handleNewItemChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                      <SelectField
                        icon={<Boxes className="w-5 h-5 text-gray-400" />}
                        name="unit"
                        label="Select Unit"
                        value={newItem.unit}
                        onChange={handleNewItemChange}
                        options={[
                          { value: "tablets", label: "Tablets" },
                          { value: "capsules", label: "Capsules" },
                          { value: "bottles", label: "Bottles" },
                          { value: "boxes", label: "Boxes" },
                          { value: "vials", label: "Vials" },
                          { value: "sachets", label: "Sachets" },
                          { value: "pieces", label: "Pieces" },
                          { value: "units", label: "Units" },
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price (KSH)</label>
                      <InputField
                        icon={<DollarSign className="w-5 h-5 text-gray-400" />}
                        name="unit_price"
                        label="Unit Price"
                        type="number"
                        step="0.01"
                        value={newItem.unit_price}
                        onChange={handleNewItemChange}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Supplier (Optional)</label>
                      <SelectField
                        icon={<Package className="w-5 h-5 text-gray-400" />}
                        name="supplier_id"
                        label="Select Supplier"
                        value={newItem.supplier_id}
                        onChange={handleNewItemChange}
                        options={suppliers.map(s => ({ value: s.id, label: `${s.name}${s.contact_person ? ` - ${s.contact_person}` : ''}` }))}
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date (Optional)</label>
                      <div className="flex items-center">
                        <InputField
                          icon={<Calendar className="w-5 h-5 text-gray-600" />}
                          name="expiry_date"
                          label="Expiry Date"
                          type="date"
                          value={newItem.expiry_date}
                          onChange={handleNewItemChange}
                          disabled={newItem.expiry_na}
                        />
                        <label className="flex items-center gap-1 ml-3 text-gray-600 whitespace-nowrap">
                          <input
                            type="checkbox"
                            name="expiry_na"
                            checked={newItem.expiry_na}
                            onChange={handleNewItemChange}
                            className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                          />
                          N/A
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={addLoading}
                      className="col-span-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-4"
                    >
                      {addLoading ? (
                        <> <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> Saving... </>
                      ) : (
                        "Save Item"
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Table */}
              {loading ? (
                <Preloader />
              ) : paginatedItems.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-xl font-semibold">No inventory items found.</p>
                  <p>Try adjusting your search or filters, or add a new item.</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-xl shadow-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.item_code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.category === 'Medicine' ? 'bg-blue-100 text-blue-800' :
                              item.category === 'Equipment' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}{item.unit ? ` - ${item.unit.charAt(0).toUpperCase() + item.unit.slice(1)}` : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">KSH {parseFloat(item.unit_price).toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : <span className="text-gray-500">N/A</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-center space-x-3">
                              <button
                                onClick={() => setViewItem(item)}
                                className="text-blue-600 hover:text-blue-900 transition-colors duration-200 flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-1" /> View
                              </button>
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200 flex items-center"
                              >
                                <Edit className="w-4 h-4 mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-900 transition-colors duration-200 flex items-center"
                              >
                                <Trash2 className="w-4 h-4 mr-1" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  {filteredItems.length > 0 && (
                    <div className="bg-white px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Showing X-Y of Z entries */}
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(endIndex, filteredItems.length)}</span> of{' '}
                        <span className="font-medium">{filteredItems.length}</span> entries
                      </div>

                      {/* Page Navigation - Only show if more than 1 page */}
                      {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                          {/* Previous Button */}
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                          >
                            Previous
                          </button>

                          {/* Page Numbers */}
                          <div className="hidden sm:flex items-center gap-1">
                            {getPageNumbers().map((page, index) => (
                              page === '...' ? (
                                <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">...</span>
                              ) : (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === page
                                    ? 'bg-indigo-600 text-white'
                                    : 'border border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                  {page}
                                </button>
                              )
                            ))}
                          </div>

                          {/* Current Page Indicator (Mobile) */}
                          <div className="sm:hidden px-3 py-2 text-sm font-medium text-gray-700">
                            Page {currentPage} of {totalPages}
                          </div>

                          {/* Next Button */}
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirm Modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-100 opacity-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6 text-center">
                Are you sure you want to delete this inventory item? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-all duration-300"
                >
                  {deleteLoading ? (
                    <> <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> Deleting... </>
                  ) : (
                    <> <Trash2 className="w-5 h-5 mr-2" /> Yes, Delete </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {viewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl transform transition-all duration-300 scale-100 opacity-100 max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 relative">
                <button
                  onClick={() => setViewItem(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{viewItem.name}</h3>
                    <p className="text-indigo-100 text-sm mt-1">Item Code: {viewItem.item_code}</p>
                  </div>
                </div>
              </div>

              {/* Content Area - Scrollable */}
              <div className="overflow-y-auto p-6 space-y-6">
                {/* Stock Status Banner */}
                <div className={`p-4 rounded-xl border-l-4 ${viewItem.quantity <= 10 ? 'bg-red-50 border-red-500' :
                  viewItem.quantity <= 50 ? 'bg-yellow-50 border-yellow-500' :
                    'bg-green-50 border-green-500'
                  }`}>
                  <div className="flex items-center space-x-3">
                    <Boxes className={`w-5 h-5 ${viewItem.quantity <= 10 ? 'text-red-600' :
                      viewItem.quantity <= 50 ? 'text-yellow-600' :
                        'text-green-600'
                      }`} />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {viewItem.quantity <= 10 ? 'Critical Stock Level' :
                          viewItem.quantity <= 50 ? 'Low Stock Alert' :
                            'Adequate Stock'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Current stock: {viewItem.quantity} {viewItem.unit ? viewItem.unit : 'units'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Item Details Section */}
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <Tag className="w-5 h-5 mr-2 text-indigo-600" />
                    Item Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Tag className="w-4 h-4 text-indigo-600" />
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Category</label>
                      </div>
                      <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${viewItem.category === 'Medicine' ? 'bg-indigo-100 text-indigo-800' :
                        viewItem.category === 'Equipment' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                        {viewItem.category}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Package className="w-4 h-4 text-indigo-600" />
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Type / Form</label>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{viewItem.subcategory || 'N/A'}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Boxes className="w-4 h-4 text-indigo-600" />
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Quantity</label>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {viewItem.quantity} {viewItem.unit ? `- ${viewItem.unit.charAt(0).toUpperCase() + viewItem.unit.slice(1)}` : ''}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="w-4 h-4 text-indigo-600" />
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Unit Price</label>
                      </div>
                      <p className="text-xl font-bold text-gray-900">
                        KSH {parseFloat(viewItem.unit_price).toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="w-4 h-4 text-indigo-600" />
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Value</label>
                      </div>
                      <p className="text-xl font-bold text-indigo-700">
                        KSH {(parseFloat(viewItem.unit_price) * parseFloat(viewItem.quantity)).toFixed(2)}
                      </p>
                    </div>

                    <div className={`p-4 rounded-xl border hover:shadow-md transition-shadow duration-200 ${!viewItem.expiry_date ? 'bg-gray-50 border-gray-200' :
                      new Date(viewItem.expiry_date) < new Date() ? 'bg-red-50 border-red-300' :
                        new Date(viewItem.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) ? 'bg-yellow-50 border-yellow-300' :
                          'bg-gray-50 border-gray-200'
                      }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className={`w-4 h-4 ${!viewItem.expiry_date ? 'text-indigo-600' :
                          new Date(viewItem.expiry_date) < new Date() ? 'text-red-600' :
                            new Date(viewItem.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) ? 'text-yellow-600' :
                              'text-indigo-600'
                          }`} />
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Expiry Date</label>
                      </div>
                      {viewItem.expiry_date ? (
                        <div>
                          <p className={`text-lg font-bold ${new Date(viewItem.expiry_date) < new Date() ? 'text-red-700' :
                            new Date(viewItem.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) ? 'text-yellow-700' :
                              'text-gray-900'
                            }`}>
                            {new Date(viewItem.expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                          {new Date(viewItem.expiry_date) < new Date() && (
                            <p className="text-xs text-red-600 mt-1 font-semibold">⚠️ EXPIRED</p>
                          )}
                          {new Date(viewItem.expiry_date) >= new Date() && new Date(viewItem.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                            <p className="text-xs text-yellow-600 mt-1 font-semibold">⚠️ Expiring Soon</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-gray-500">N/A</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Supplier Information Section */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-indigo-600" />
                    Supplier Information
                  </h4>
                  {viewItem.supplier ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Supplier Name</label>
                        <p className="text-base font-semibold text-gray-900">{viewItem.supplier.name}</p>
                      </div>
                      {viewItem.supplier.contact_person && (
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Contact Person</label>
                          <p className="text-base font-medium text-gray-900">{viewItem.supplier.contact_person}</p>
                        </div>
                      )}
                      {viewItem.supplier.phone && (
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Phone</label>
                          <p className="text-base font-medium text-gray-900">{viewItem.supplier.phone}</p>
                        </div>
                      )}
                      {viewItem.supplier.email && (
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Email</label>
                          <p className="text-base font-medium text-gray-900">{viewItem.supplier.email}</p>
                        </div>
                      )}
                      {viewItem.supplier.address && (
                        <div className="bg-white p-3 rounded-lg border border-gray-200 md:col-span-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Address</label>
                          <p className="text-base font-medium text-gray-900">{viewItem.supplier.address}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 font-medium">No supplier information available</p>
                      <p className="text-sm text-gray-400 mt-1">No supplier linked to this item</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setViewItem(null)}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setViewItem(null);
                      handleEdit(viewItem);
                    }}
                    className="flex items-center px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300 scale-100 opacity-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Update Inventory Item</h3>
              <form onSubmit={handleEditSubmit} className="space-y-5">
                <InputField
                  icon={<Package className="w-5 h-5 text-gray-400" />}
                  name="name"
                  label="Item Name"
                  value={editItem.name}
                  onChange={handleEditItemChange}
                  required
                />
                <InputField
                  icon={<Boxes className="w-5 h-5 text-gray-400" />}
                  name="quantity"
                  label="Quantity"
                  type="number"
                  value={editItem.quantity}
                  onChange={handleEditItemChange}
                  required
                />
                <InputField
                  icon={<DollarSign className="w-5 h-5 text-gray-400" />}
                  name="unit_price"
                  label="Unit Price"
                  type="number"
                  step="0.01"
                  value={editItem.unit_price}
                  onChange={handleEditItemChange}
                  required
                />

                <div className="relative flex items-center">
                  <InputField
                    icon={<Calendar className="w-5 h-5 text-gray-600" />}
                    name="expiry_date"
                    label="Expiry Date"
                    type="date"
                    value={editItem.expiry_date || ""}
                    onChange={handleEditItemChange}
                    disabled={editItem.expiry_na}
                  />
                  <label className="flex items-center gap-1 ml-3 text-gray-600">
                    <input
                      type="checkbox"
                      name="expiry_na"
                      checked={editItem.expiry_na}
                      onChange={handleEditItemChange}
                      className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                    />
                    N/A
                  </label>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-all duration-300"
                  >
                    {editLoading ? (
                      <> <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" /> Updating... </>
                    ) : (
                      <> <Edit className="w-5 h-5 mr-2" /> Save Changes </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Inventory;