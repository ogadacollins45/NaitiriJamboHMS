import React from "react";

export default function CategoryTabs({ categories, activeCategory, onChange }) {
  return (
    <div className="flex space-x-4 border-b pb-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-all ${
            activeCategory === cat
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-gray-500 hover:text-blue-600"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
