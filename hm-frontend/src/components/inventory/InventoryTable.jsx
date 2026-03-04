import React from "react";

const InventoryTable = ({ items, onDelete, onEdit }) => {
  return (
    <div className="overflow-x-auto bg-white shadow rounded-lg">
      <table className="w-full border-collapse">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="text-left py-3 px-4">#</th>
            <th className="text-left py-3 px-4">Item Name</th>
            <th className="text-left py-3 px-4">Category</th>
            <th className="text-left py-3 px-4">Quantity</th>
            <th className="text-left py-3 px-4">Unit Price ($)</th>
            <th className="text-left py-3 px-4">Expiry Date</th>
            <th className="text-center py-3 px-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center py-6 text-gray-500">
                No items found.
              </td>
            </tr>
          ) : (
            items.map((item, index) => (
              <tr
                key={item.id}
                className={`border-b hover:bg-gray-50 ${
                  item.quantity <= 10 ? "bg-red-50" : ""
                }`}
              >
                <td className="py-3 px-4">{index + 1}</td>
                <td className="py-3 px-4 font-semibold text-blue-700">{item.name}</td>
                <td className="py-3 px-4">{item.category}</td>
                <td
                  className={`py-3 px-4 font-medium ${
                    item.quantity <= 10 ? "text-red-600" : "text-gray-800"
                  }`}
                >
                  {item.quantity}
                </td>
                <td className="py-3 px-4">${item.unit_price.toFixed(2)}</td>
                <td className="py-3 px-4">
                  {item.expiry_date ? item.expiry_date : <span className="text-gray-400">N/A</span>}
                </td>
                <td className="py-3 px-4 text-center space-x-3">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;
