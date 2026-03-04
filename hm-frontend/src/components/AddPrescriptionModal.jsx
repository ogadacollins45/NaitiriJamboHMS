import React, { useState } from "react";
import axios from "axios";
import {
  X,
  Pill,
  Loader,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { MEDICATION_FREQUENCIES } from "../data/medicationFrequencies";

const AddPrescriptionModal = ({ patientId, treatmentId, doctorId, onClose, onSaved }) => {
  const [items, setItems] = useState([
    { drug_name: "", dosage: "", frequency: "", duration: "", instructions: "", drug_id: null, current_stock: null }
  ]);
  const [notes, setNotes] = useState("");
  const [sendToPharmacy, setSendToPharmacy] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [collapsedItems, setCollapsedItems] = useState({}); // Track collapsed state for each item

  // Autocomplete states
  const [suggestions, setSuggestions] = useState({});
  const [loadingSuggestions, setLoadingSuggestions] = useState({});
  const [activeItemIndex, setActiveItemIndex] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});
  const [searchTimeouts, setSearchTimeouts] = useState({});

  const addItem = () => {
    setItems([...items, { drug_name: "", dosage: "", frequency: "", duration: "", instructions: "", drug_id: null, current_stock: null }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    // Clear drug_id and stock if user manually edits drug name (not from autocomplete)
    if (field === 'drug_name') {
      updated[index].drug_id = null;
      updated[index].current_stock = null;
    }

    setItems(updated);
  };

  const isItemFilled = (item) => {
    return item.drug_name.trim() !== '' &&
      item.dosage.trim() !== '' &&
      item.frequency.trim() !== '' &&
      item.duration.trim() !== '';
  };

  const toggleCollapse = (index) => {
    setCollapsedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const flashMessage = (setter, message) => {
    setter(message);
    setTimeout(() => setter(""), 3000);
  };

  // Debounced search for drugs
  const searchDrugs = async (query, itemIndex) => {
    // Clear existing timeout for this item
    if (searchTimeouts[itemIndex]) {
      clearTimeout(searchTimeouts[itemIndex]);
    }

    if (!query || query.trim().length < 2) {
      setSuggestions(prev => ({ ...prev, [itemIndex]: [] }));
      setShowSuggestions(prev => ({ ...prev, [itemIndex]: false }));
      return;
    }

    // Set debounced timeout
    const timeoutId = setTimeout(async () => {
      setLoadingSuggestions(prev => ({ ...prev, [itemIndex]: true }));
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/pharmacy/drugs`,
          {
            params: {
              search: query,
              is_active: 1,
              per_page: 10
            }
          }
        );

        setSuggestions(prev => ({ ...prev, [itemIndex]: response.data.data || [] }));
        setShowSuggestions(prev => ({ ...prev, [itemIndex]: true }));
        setActiveItemIndex(prev => ({ ...prev, [itemIndex]: -1 }));
      } catch (error) {
        console.error('Error fetching drug suggestions:', error);
        setSuggestions(prev => ({ ...prev, [itemIndex]: [] }));
      } finally {
        setLoadingSuggestions(prev => ({ ...prev, [itemIndex]: false }));
      }
    }, 300); // 300ms debounce

    setSearchTimeouts(prev => ({ ...prev, [itemIndex]: timeoutId }));
  };

  // Handle drug selection from autocomplete
  const handleSelectDrug = (itemIndex, drug) => {
    const drugName = `${drug.generic_name}${drug.strength ? ' ' + drug.strength : ''}${drug.dosage_form ? ' (' + drug.dosage_form + ')' : ''}`;

    // Update all relevant fields including drug_id for auto-mapping
    const updated = [...items];
    updated[itemIndex] = {
      ...updated[itemIndex],
      drug_name: drugName,
      drug_id: drug.id,
      current_stock: drug.current_stock
    };
    setItems(updated);

    setShowSuggestions(prev => ({ ...prev, [itemIndex]: false }));
    setSuggestions(prev => ({ ...prev, [itemIndex]: [] }));
  };

  const handleSubmit = async () => {
    // Validation
    if (items.some(item => !item.drug_name.trim())) {
      flashMessage(setError, "Please enter drug name for all items.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        patient_id: String(patientId),
        treatment_id: Number(treatmentId),
        doctor_id: doctorId ?? null,
        send_to_pharmacy: sendToPharmacy,
        notes,
        items: items.map(item => ({
          name: item.drug_name,
          quantity: 1, // Default quantity
          unit_price: 0, // Will be set by pharmacist
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          drug_id: item.drug_id, // For auto-mapping in pharmacy
        })),
      };

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/prescriptions`, payload);

      flashMessage(setSuccess, sendToPharmacy
        ? "Prescription sent to pharmacy successfully!"
        : "Prescription saved as draft!");
      onSaved?.();
      setTimeout(() => onClose?.(), 1000);
    } catch (error) {
      console.error("Error saving prescription:", error);
      const msg = error?.response?.data?.message || "Error saving prescription.";
      flashMessage(setError, msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center">
            <Pill className="w-8 h-8 text-indigo-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">
              Add Prescription
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg flex items-center">
            <AlertCircle className="w-6 h-6 mr-3" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-lg flex items-center">
            <CheckCircle className="w-6 h-6 mr-3" />
            <p>{success}</p>
          </div>
        )}

        {/* Prescription Items */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700">Medication Details</h3>
          </div>

          {items.map((item, index) => (
            <div key={index} className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              {/* Collapsible Header */}
              <div
                className={`flex justify-between items-center p-3 cursor-pointer transition-colors ${collapsedItems[index] ? 'bg-indigo-50 hover:bg-indigo-100' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                onClick={() => toggleCollapse(index)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-medium text-gray-700">Medication #{index + 1}</span>
                  {collapsedItems[index] && item.drug_name && (
                    <span className="text-sm text-gray-600 truncate flex-1">
                      {item.drug_name}
                      {item.dosage && ` - ${item.dosage}`}
                      {item.frequency && ` - ${item.frequency}`}
                      {item.duration && ` - ${item.duration}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {items.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(index);
                      }}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                      title="Remove medication"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  {collapsedItems[index] ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </div>

              {/* Collapsible Content */}
              {!collapsedItems[index] && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Drug Name *
                      </label>
                      <input
                        type="text"
                        value={item.drug_name}
                        onChange={(e) => {
                          updateItem(index, 'drug_name', e.target.value);
                          searchDrugs(e.target.value, index);
                        }}
                        onKeyDown={(e) => {
                          const suggestionsList = suggestions[index] || [];
                          const currentActive = activeItemIndex[index] ?? -1;

                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            const nextIndex = currentActive < suggestionsList.length - 1 ? currentActive + 1 : 0;
                            setActiveItemIndex(prev => ({ ...prev, [index]: nextIndex }));
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            const prevIndex = currentActive > 0 ? currentActive - 1 : suggestionsList.length - 1;
                            setActiveItemIndex(prev => ({ ...prev, [index]: prevIndex }));
                          } else if (e.key === 'Enter' && currentActive >= 0 && suggestionsList[currentActive]) {
                            e.preventDefault();
                            handleSelectDrug(index, suggestionsList[currentActive]);
                          } else if (e.key === 'Escape') {
                            setShowSuggestions(prev => ({ ...prev, [index]: false }));
                          }
                        }}
                        onBlur={() => {
                          // Delay hiding to allow click on suggestion
                          setTimeout(() => {
                            setShowSuggestions(prev => ({ ...prev, [index]: false }));
                          }, 200);
                        }}
                        onFocus={() => {
                          if (item.drug_name && suggestions[index]?.length > 0) {
                            setShowSuggestions(prev => ({ ...prev, [index]: true }));
                          }
                        }}
                        placeholder="Start typing drug name..."
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        autoComplete="off"
                      />

                      {/* Stock Status Badge */}
                      {item.drug_name && (
                        <div className="mt-2">
                          {item.drug_id ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ In Stock ({item.current_stock || 0} available)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              ⚠ Not in Stock/Store
                            </span>
                          )}
                        </div>
                      )}

                      {/* Loading indicator */}
                      {loadingSuggestions[index] && (
                        <div className="absolute right-3 top-9">
                          <Loader className="animate-spin h-4 w-4 text-indigo-500" />
                        </div>
                      )}

                      {/* Autocomplete Dropdown */}
                      {showSuggestions[index] && suggestions[index]?.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                          {suggestions[index].map((drug, suggestionIdx) => (
                            <div
                              key={drug.id}
                              onClick={() => handleSelectDrug(index, drug)}
                              className={`p-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${activeItemIndex[index] === suggestionIdx
                                ? 'bg-indigo-50 border-l-4 border-l-indigo-500'
                                : 'hover:bg-gray-50'
                                }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800 text-sm">
                                    {drug.generic_name}
                                    {drug.strength && <span className="text-indigo-600 ml-1">{drug.strength}</span>}
                                  </p>
                                  {drug.brand_names && drug.brand_names.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Brand{drug.brand_names.length > 1 ? 's' : ''}: {drug.brand_names.join(', ')}
                                    </p>
                                  )}
                                  <div className="flex gap-3 mt-1">
                                    {drug.dosage_form && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                        {drug.dosage_form}
                                      </span>
                                    )}
                                    {drug.drug_category && (
                                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                        {drug.drug_category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="ml-3 text-right">
                                  <p className={`text-xs font-semibold ${drug.current_stock > 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {drug.current_stock > 0 ? `${drug.current_stock} in stock` : 'Out of stock'}
                                  </p>
                                  {drug.current_stock > 0 && drug.current_stock <= (drug.reorder_level || 0) && (
                                    <p className="text-xs text-orange-500 mt-0.5">Low stock</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No results message */}
                      {showSuggestions[index] &&
                        !loadingSuggestions[index] &&
                        item.drug_name.length >= 2 &&
                        suggestions[index]?.length === 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                            <p className="text-sm text-gray-500 text-center">No drugs found in pharmacy</p>
                          </div>
                        )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dosage
                      </label>
                      <input
                        type="text"
                        value={item.dosage}
                        onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                      </label>
                      <select
                        value={item.frequency}
                        onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select frequency</option>
                        {MEDICATION_FREQUENCIES.map((freq) => (
                          <option
                            key={freq.code}
                            value={`${freq.code} (${freq.description})`}
                            title={freq.description}
                          >
                            {freq.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={item.duration}
                        onChange={(e) => updateItem(index, 'duration', e.target.value)}
                        placeholder="e.g., 7 days"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions
                      </label>
                      <input
                        type="text"
                        value={item.instructions}
                        onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                        placeholder="e.g., Take with food"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Add Medication Button - Below this prescription */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={addItem}
                      className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
                    >
                      <Plus size={16} className="mr-1.5" /> Add Another Medication
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            placeholder="Any additional notes for the prescription..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            rows="2"
          />
        </div>

        {/* Send to Pharmacy Checkbox */}
        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendToPharmacy}
              onChange={(e) => setSendToPharmacy(e.target.checked)}
              className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Send to Pharmacy for Review & Dispensing
            </span>
          </label>
          <p className="text-xs text-gray-500 ml-7 mt-1">
            {sendToPharmacy
              ? "Prescription will be sent to pharmacy queue for pharmacist review and mapping to available drugs"
              : "Prescription will be saved as draft only"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center justify-center px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors shadow-md"
          >
            {loading ? (
              <>
                <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Saving...
              </>
            ) : (
              sendToPharmacy ? "Send to Pharmacy" : "Save as Draft"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPrescriptionModal;