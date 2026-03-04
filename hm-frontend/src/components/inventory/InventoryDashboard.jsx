import React, { useState, useEffect } from "react";
import InventoryTable from "./InventoryTable";

const InventoryDashboard = () => {
  const [items, setItems] = useState([
    { id: 1, name: "Paracetamol", category: "Medicine", quantity: 120, unit_price: 2.5, expiry_date: "2026-01-01" },
    { id: 2, name: "Syringe 5ml", category: "Equipment", quantity: 8, unit_price: 0.8, expiry_date: null },
    { id: 3, name: "Bandage Roll", category: "Consumable", quantity: 5, unit_price: 1.2, expiry_date: null },
    { id: 4, name: "Amoxicillin", category: "Medicine", quantity: 80, unit_price: 4.0, expiry_date: "2027-03-15" },
    { id: 5, name: "Wheelchair", category: "Equipment", quantity: 3, unit_price: 250, expiry_date: null },
    { id: 6, name: "Gauze Pads", category: "Consumable", quantity: 200, unit_price: 0.5, expiry_date: null },
  ]);

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [editItem, setEditItem] = useState(null);

  const filteredItems = items.filter((item) => {
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      alert("Item deleted successfully!");
    }
  };

  const handleEdit = (item) => {
    setEditItem({ ...item }); // open modal
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditItem((prev) => ({ ...prev, [name]: value === "N/A" ? null : value }));
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();

    if (window.confirm("Confirm changes to this item?")) {
      setItems((prev) =>
        prev.map((i) => (i.id === editItem.id ? { ...editItem, unit_price: parseFloat(editItem.unit_price) } : i))
      );
      alert("Item updated successfully!");
      setEditItem(null);
    }
  };

  const lowStockItems = items.filter((item) => item.quantity <= 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, itemsPerPage]);

  return (
    <div className="space-y-4">
      {/* Low Stock Banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold text-lg mb-1">⚠️ Low Stock Alert ({lowStockItems.length})</h3>
          <ul className="list-disc list-inside text-sm">
            {lowStockItems.map((item) => (
              <li key={item.id}>
                {item.name} — only <strong>{item.quantity}</strong> left!
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filter + Search */}
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex flex-wrap gap-2 mb-3">
          {["All", "Medicine", "Equipment", "Consumable"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-lg ${
                categoryFilter === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-full sm:w-72 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Items per page */}
      <div className="flex items-center justify-end gap-2">
        <label className="text-sm text-gray-600">Show:</label>
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="border border-gray-300 rounded-lg p-1 text-sm"
        >
          <option value={3}>3</option>
          <option value={5}>5</option>
          <option value={10}>10</option>
        </select>
        <span className="text-sm text-gray-600">per page</span>
      </div>

      {/* Table */}
      <InventoryTable items={paginatedItems} onDelete={handleDelete} onEdit={handleEdit} />

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
        >
          Next
        </button>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-700">Edit Item</h2>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <input
                type="text"
                name="name"
                value={editItem.name}
                onChange={handleEditChange}
                className="border p-2 w-full rounded"
                placeholder="Item Name"
                required
              />

              <select
                name="category"
                value={editItem.category}
                onChange={handleEditChange}
                className="border p-2 w-full rounded"
                required
              >
                <option value="Medicine">Medicine</option>
                <option value="Equipment">Equipment</option>
                <option value="Consumable">Consumable</option>
              </select>

              <input
                type="number"
                name="quantity"
                value={editItem.quantity}
                onChange={handleEditChange}
                className="border p-2 w-full rounded"
                placeholder="Quantity"
                required
              />

              <input
                type="number"
                step="0.01"
                name="unit_price"
                value={editItem.unit_price}
                onChange={handleEditChange}
                className="border p-2 w-full rounded"
                placeholder="Unit Price"
                required
              />

              <input
                type="date"
                name="expiry_date"
                value={editItem.expiry_date || ""}
                onChange={handleEditChange}
                className="border p-2 w-full rounded"
              />
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!editItem.expiry_date}
                  onChange={(e) =>
                    setEditItem((prev) => ({
                      ...prev,
                      expiry_date: e.target.checked ? null : "",
                    }))
                  }
                />
                No Expiry Date (N/A)
              </label>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDashboard;
