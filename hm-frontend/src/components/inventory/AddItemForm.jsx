import React, { useState } from "react";

const AddItemForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "Medicine",
    quantity: "",
    unit_price: "",
    expiry_date: "",
    na_expiry: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare data to send to backend
    const payload = {
      ...formData,
      expiry_date: formData.na_expiry ? null : formData.expiry_date,
    };

    console.log("New Inventory Item:", payload);

    // You can later replace this with an axios POST
    // axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/inventory`, payload)

    alert("Item added successfully!");
    onClose();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">Add New Inventory Item</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Item Name */}
        <div>
          <label className="block text-gray-600 text-sm mb-1">Item Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-gray-600 text-sm mb-1">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="Medicine">Medicine</option>
            <option value="Equipment">Equipment</option>
            <option value="Consumable">Consumable</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-gray-600 text-sm mb-1">Quantity</label>
          <input
            type="number"
            name="quantity"
            min="0"
            value={formData.quantity}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        {/* Unit Price */}
        <div>
          <label className="block text-gray-600 text-sm mb-1">Unit Price ($)</label>
          <input
            type="number"
            name="unit_price"
            min="0"
            step="0.01"
            value={formData.unit_price}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        {/* Expiry Date + N/A */}
        <div className="md:col-span-2">
          <label className="block text-gray-600 text-sm mb-1">Expiry Date</label>
          <div className="flex items-center gap-3">
            <input
              type="date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleChange}
              className="border p-2 rounded"
              disabled={formData.na_expiry}
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                name="na_expiry"
                checked={formData.na_expiry}
                onChange={handleChange}
              />
              Not Applicable (N/A)
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="md:col-span-2 text-right">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Save Item
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddItemForm;
