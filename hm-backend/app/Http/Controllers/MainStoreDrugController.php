<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\PharmacyDrug;
use App\Models\PharmacyDrugBatch;
use App\Models\PharmacyInventoryTransaction;
use App\Models\InventoryTransaction;
use App\Models\PharmacyReorderRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MainStoreDrugController extends Controller
{
    /**
     * GET /api/main-store/drugs
     * List all Medicine items with pharmacy_drug data
     */
    public function index(Request $request)
    {
        $perPage = (int)($request->get('per_page', 10));
        $search = $request->get('search');
        $linked = $request->get('linked'); // 'yes', 'no', or null for all

        $query = InventoryItem::with(['supplier', 'pharmacyDrug'])
            ->where('category', 'Medicine')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                          ->orWhere('item_code', 'like', "%{$search}%");
                });
            })
            ->when($linked === 'yes', fn($q) => $q->whereNotNull('pharmacy_drug_id'))
            ->when($linked === 'no', fn($q) => $q->whereNull('pharmacy_drug_id'))
            ->orderBy('name');

        return $query->paginate($perPage);
    }

    /**
     * POST /api/main-store/drugs
     * Create Medicine item + PharmacyDrug
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            // Inventory Item fields
            'name'          => ['required','string','max:255'],
            'subcategory'   => ['nullable','string','max:255'],
            'quantity'      => ['required','integer','min:0'],
            'unit'          => ['nullable','string','max:50'],
            'reorder_level' => ['nullable','integer','min:0'],
            'unit_price'    => ['required','numeric','min:0'],
            'supplier_id'   => ['nullable','exists:suppliers,id'],
            'expiry_date'   => ['nullable','date'],
            'batch_no'      => ['nullable','string','max:255'],
            'location'      => ['nullable','string','max:255'],

            // Pharmacy Drug fields
            'generic_name'    => ['required','string','max:255'],
            'brand_names'     => ['nullable','array'],
            'dosage_form'     => ['required','string','max:100'], // REQUIRED - DB enum is NOT NULL
            'strength'        => ['nullable','string','max:100'],
            'drug_category'   => ['required','string','max:100'], // REQUIRED in new form
            'additional_info' => ['nullable','string'], // Maps to storage_conditions
            
            // Optional fields (not in simplified form)
            'route_of_administration' => ['nullable','string','max:100'],
            'therapeutic_class' => ['nullable','string','max:100'],
            'manufacturer'    => ['nullable','string','max:255'],
            'active_ingredient' => ['nullable','string','max:255'],
            'storage_conditions' => ['nullable','string','max:255'],
            'indications'     => ['nullable','string'],
            'contraindications' => ['nullable','string'],
            'side_effects'    => ['nullable','string'],
        ]);

        return DB::transaction(function () use ($data) {
            // 1. Calculate the next shared safe ID (including soft-deleted)
            $nextInventoryId = (int)InventoryItem::withTrashed()->max('id') + 1;
            $nextPharmacyId = (int)PharmacyDrug::withTrashed()->max('id') + 1;
            $sharedId = max($nextInventoryId, $nextPharmacyId);

            // 2. Create PharmacyDrug first with explicit ID
            $drugData = [
                'id'              => $sharedId,
                'drug_code'       => $this->generateDrugCode(),
                'generic_name'    => $data['generic_name'],
                'brand_names'     => $data['brand_names'] ?? [],
                'dosage_form'     => strtolower($data['dosage_form']), // Convert to lowercase for DB enum
                'strength'        => $data['strength'] ?? null,
                'route_of_administration' => isset($data['route_of_administration']) && $data['route_of_administration'] ? strtolower($data['route_of_administration']) : null,
                'drug_category'   => $data['drug_category'] ?? null,
                'therapeutic_class' => $data['therapeutic_class'] ?? null,
                'manufacturer'    => $data['manufacturer'] ?? null,
                'active_ingredient' => $data['active_ingredient'] ?? null,
                'storage_conditions' => $data['additional_info'] ?? $data['storage_conditions'] ?? null,
                'indications'     => $data['indications'] ?? null,
                'contraindications' => $data['contraindications'] ?? null,
                'side_effects'    => $data['side_effects'] ?? null,
                'default_unit_price' => $data['unit_price'],
                'reorder_level'   => $data['reorder_level'] ?? 50,
                'current_stock'   => 0, // Stock managed in main store
                'is_active'       => true,
            ];

            $pharmacyDrug = PharmacyDrug::create($drugData);

            // 3. Create InventoryItem linked to PharmacyDrug with same ID
            $itemCode = 'MED-' . strtoupper(Str::padLeft((string)$sharedId, 5, '0'));

            $inventoryData = [
                'id'             => $sharedId,
                'item_code'      => $itemCode,
                'name'           => $data['name'],
                'category'       => 'Medicine',
                'subcategory'    => $data['subcategory'] ?? null,
                'quantity'       => $data['quantity'],
                'unit'           => $data['unit'] ?? 'unit',
                'reorder_level'  => $data['reorder_level'] ?? 0,
                'unit_price'     => $data['unit_price'],
                'supplier_id'    => $data['supplier_id'] ?? null,
                'pharmacy_drug_id' => $pharmacyDrug->id,
                'expiry_date'    => $data['expiry_date'] ?? null,
                'batch_no'       => $data['batch_no'] ?? null,
                'location'       => $data['location'] ?? null,
            ];

            $item = InventoryItem::create($inventoryData);

            // 3. Create initial transaction
            InventoryTransaction::create([
                'item_id'       => $item->id,
                'type'          => 'in',
                'quantity'      => (int) $item->quantity,
                'balance_after' => (int) $item->quantity,
                'reason'        => 'Initial stock - Drug created from Main Store',
                'performed_by'  => 'system',
            ]);

            return response()->json([
                'item' => $item->load(['supplier', 'pharmacyDrug']),
                'pharmacy_drug' => $pharmacyDrug,
            ], 201);
        });
    }

    /**
     * GET /api/main-store/drugs/{id}
     * Show Medicine item with pharmacy drug details
     */
    public function show($id)
    {
        $item = InventoryItem::with(['supplier', 'pharmacyDrug', 'transactions' => fn($q) => $q->latest()])
            ->where('category', 'Medicine')
            ->findOrFail($id);

        return response()->json($item);
    }

    /**
     * PUT /api/main-store/drugs/{id}
     * Update Medicine + sync to PharmacyDrug
     */
    public function update(Request $request, $id)
    {
        $item = InventoryItem::where('category', 'Medicine')->findOrFail($id);

        $data = $request->validate([
            // Inventory Item fields
            'name'          => ['sometimes','string','max:255'],
            'subcategory'   => ['nullable','string','max:255'],
            'quantity'      => ['sometimes','integer','min:0'],
            'unit'          => ['nullable','string','max:50'],
            'reorder_level' => ['nullable','integer','min:0'],
            'unit_price'    => ['sometimes','numeric','min:0'],
            'supplier_id'   => ['nullable','exists:suppliers,id'],
            'expiry_date'   => ['nullable','date'],
            'batch_no'      => ['nullable','string','max:255'],
            'location'      => ['nullable','string','max:255'],

            // Pharmacy Drug fields
            'generic_name'    => ['sometimes','string','max:255'],
            'brand_names'     => ['nullable','array'],
            'dosage_form'     => ['nullable','string','max:100'],
            'strength'        => ['nullable','string','max:100'],
            'route_of_administration' => ['nullable','string','max:100'],
            'drug_category'   => ['nullable','string','max:100'],
            'therapeutic_class' => ['nullable','string','max:100'],
            'manufacturer'    => ['nullable','string','max:255'],
            'active_ingredient' => ['nullable','string','max:255'],
            'storage_conditions' => ['nullable','string','max:255'],
            'indications'     => ['nullable','string'],
            'contraindications' => ['nullable','string'],
            'side_effects'    => ['nullable','string'],
        ]);

        return DB::transaction(function () use ($item, $data) {
            $oldQty = $item->quantity;

            // Update InventoryItem
            $itemData = array_intersect_key($data, array_flip([
                'name', 'subcategory', 'quantity', 'unit', 'reorder_level',
                'unit_price', 'supplier_id', 'expiry_date', 'batch_no', 'location'
            ]));
            $item->update($itemData);

            // Track quantity changes
            if (array_key_exists('quantity', $data) && (int)$data['quantity'] !== (int)$oldQty) {
                $diff = (int)$data['quantity'] - (int)$oldQty;
                InventoryTransaction::create([
                    'item_id'       => $item->id,
                    'type'          => $diff > 0 ? 'in' : 'out',
                    'quantity'      => abs($diff),
                    'balance_after' => (int)$item->quantity,
                    'reason'        => 'Main Store quantity adjustment',
                    'performed_by'  => 'system',
                ]);
            }

            // Sync to PharmacyDrug if linked
            if ($item->pharmacy_drug_id && $item->pharmacyDrug) {
                $drugData = array_intersect_key($data, array_flip([
                    'generic_name', 'brand_names', 'dosage_form', 'strength',
                    'route_of_administration', 'drug_category', 'therapeutic_class',
                    'manufacturer', 'active_ingredient', 'storage_conditions',
                    'indications', 'contraindications', 'side_effects', 'reorder_level'
                ]));

                if (isset($data['unit'])) {
                    $drugData['unit_of_measure'] = $data['unit'];
                }
                if (isset($data['unit_price'])) {
                    $drugData['default_unit_price'] = $data['unit_price'];
                }

                // Convert enum fields to lowercase for database
                if (isset($drugData['dosage_form'])) {
                    $drugData['dosage_form'] = strtolower($drugData['dosage_form']);
                }
                if (isset($drugData['route_of_administration']) && $drugData['route_of_administration']) {
                    $drugData['route_of_administration'] = strtolower($drugData['route_of_administration']);
                }

                if (!empty($drugData)) {
                    $item->pharmacyDrug->update($drugData);
                }
            }

            return response()->json($item->load(['supplier', 'pharmacyDrug']));
        });
    }

    /**
     * POST /api/main-store/drugs/{id}/dispense
     * Dispense stock from Main Store to Pharmacy
     */
    public function dispenseToPharmacy(Request $request, $id)
    {
        $item = InventoryItem::where('category', 'Medicine')
            ->with('pharmacyDrug')
            ->findOrFail($id);

        if (!$item->pharmacy_drug_id) {
            return response()->json([
                'message' => 'This medicine is not linked to a pharmacy drug. Please link it first.'
            ], 422);
        }

        $data = $request->validate([
            'quantity'          => ['required','integer','min:1'],
            'batch_number'      => ['nullable','string','max:100'],
            'expiry_date'       => ['nullable','date','after:today'],
            'unit_cost'         => ['required','numeric','min:0'],
            'unit_price'        => ['required','numeric','min:0'],
            'supplier_id'       => ['nullable','exists:suppliers,id'],
            'storage_location'  => ['nullable','string','max:255'],
            'notes'             => ['nullable','string'],
            'reorder_level'     => ['nullable','integer','min:0'],
        ]);

        // Validate stock availability
        if ($data['quantity'] > $item->quantity) {
            return response()->json([
                'message' => "Insufficient stock. Available: {$item->quantity}, Requested: {$data['quantity']}"
            ], 422);
        }

        return DB::transaction(function () use ($item, $data) {
            // 1. Create PharmacyDrugBatch
            $batch = PharmacyDrugBatch::create([
                'drug_id'           => $item->pharmacy_drug_id,
                'batch_number'      => $data['batch_number'],
                'supplier_id'       => $data['supplier_id'] ?? $item->supplier_id,
                'expiry_date'       => $data['expiry_date'],
                'quantity_received' => $data['quantity'],
                'quantity_current'  => $data['quantity'],
                'unit_cost'         => $data['unit_cost'],
                'unit_price'        => $data['unit_price'],
                'storage_location'  => $data['storage_location'] ?? 'Pharmacy',
                'status'            => 'active',
                'received_date'     => now(),
                'notes'             => $data['notes'] ?? "Dispensed from Main Store (Item: {$item->item_code})",
            ]);

            // 2. Deduct from Main Store
            $item->quantity -= $data['quantity'];
            // Ensure reorder_level is not null if it was fetched as such, to avoid DB constraints if migration didn't apply as expected
            if (is_null($item->reorder_level)) $item->reorder_level = 0;
            $item->save();

            // 3. Update Pharmacy Drug Current Stock
            $pharmacyDrug = $item->pharmacyDrug;
            if ($pharmacyDrug) {
                $pharmacyDrug->current_stock += $data['quantity'];
                if (isset($data['reorder_level'])) {
                    $pharmacyDrug->reorder_level = $data['reorder_level'];
                }
                $pharmacyDrug->save();
            }

            // 4. Dismiss any pending reorder requests for this drug
            PharmacyReorderRequest::where('pharmacy_drug_id', $item->pharmacy_drug_id)
                ->where('status', 'pending')
                ->delete();

            // 3. Log Main Store transaction
            InventoryTransaction::create([
                'item_id'       => $item->id,
                'type'          => 'out',
                'quantity'      => $data['quantity'],
                'balance_after' => $item->quantity,
                'reason'        => "Dispensed to Pharmacy - Batch: {$data['batch_number']}",
                'performed_by'  => auth()->id(),
            ]);

            // 4. Log Pharmacy transaction
            PharmacyInventoryTransaction::create([
                'transaction_number' => $this->generateTransactionNumber(),
                'batch_id'      => $batch->id,
                'drug_id'       => $item->pharmacy_drug_id,
                'transaction_type' => 'transfer_in',
                'quantity'      => $data['quantity'],
                'balance_before' => 0,
                'balance_after' => $data['quantity'],
                'reference_type' => 'inventory_item',
                'reference_id'  => $item->id,
                'from_location' => 'main_store',
                'to_location'   => 'pharmacy',
                'reason'        => "Transferred from Main Store",
                'notes'         => "Source: {$item->item_code} - {$item->name}",
                'unit_cost'     => $data['unit_cost'],
                'total_value'   => $data['unit_cost'] * $data['quantity'],
                'performed_by'  => auth()->id(),
                'transaction_date' => now(),
            ]);

            return response()->json([
                'message' => 'Successfully dispensed to pharmacy',
                'batch' => $batch->load(['drug', 'supplier']),
                'main_store_item' => $item->fresh(['supplier', 'pharmacyDrug']),
            ], 201);
        });
    }

    /**
     * GET /api/main-store/drugs/{id}/dispensation-history
     * Get recent transactions of this drug to pharmacy
     */
    public function dispensationHistory($id)
    {
        $item = InventoryItem::where('category', 'Medicine')->findOrFail($id);

        $history = \App\Models\PharmacyInventoryTransaction::where('reference_id', $item->id)
            ->where('reference_type', 'inventory_item')
            ->where('transaction_type', 'transfer_in')
            ->with(['performedByStaff:id,first_name,last_name', 'batch:id,batch_number,expiry_date'])
            ->latest('transaction_date')
            ->take(10)
            ->get();

        return response()->json($history);
    }

    /**
     * GET /api/main-store/drugs/{id}/pharmacy-info
     * Get linked pharmacy drug details
     */
    public function getPharmacyInfo($id)
    {
        $item = InventoryItem::where('category', 'Medicine')
            ->with(['pharmacyDrug.batches' => function($q) {
                $q->where('status', 'active')->orderBy('expiry_date');
            }])
            ->findOrFail($id);

        if (!$item->pharmacyDrug) {
            return response()->json([
                'message' => 'No pharmacy drug linked'
            ], 404);
        }

        return response()->json([
            'pharmacy_drug' => $item->pharmacyDrug,
            'total_pharmacy_stock' => $item->pharmacyDrug->total_stock,
            'active_batches_count' => $item->pharmacyDrug->activeBatches()->count(),
        ]);
    }

    /**
     * POST /api/main-store/drugs/{id}/link
     * Link existing Medicine item to existing PharmacyDrug
     */
    public function linkToPharmacyDrug(Request $request, $id)
    {
        $item = InventoryItem::where('category', 'Medicine')->findOrFail($id);

        $data = $request->validate([
            'pharmacy_drug_id' => ['required','exists:pharmacy_drugs,id'],
        ]);

        // Check if drug is already linked to another inventory item
        $existing = InventoryItem::where('pharmacy_drug_id', $data['pharmacy_drug_id'])
            ->where('id', '!=', $id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => "This pharmacy drug is already linked to another inventory item: {$existing->item_code} - {$existing->name}"
            ], 422);
        }

        $item->pharmacy_drug_id = $data['pharmacy_drug_id'];
        $item->save();

        return response()->json([
            'message' => 'Successfully linked to pharmacy drug',
            'item' => $item->load(['supplier', 'pharmacyDrug']),
        ]);
    }

    /**
     * GET /api/main-store/drugs/unlinked
     * Get all unlinked Medicine items
     */
    public function getUnlinked()
    {
        $items = InventoryItem::medicines()
            ->unlinked()
            ->with('supplier')
            ->orderBy('name')
            ->get();

        return response()->json($items);
    }

    /**
     * GET /api/pharmacy/drugs/available-for-linking
     * Get pharmacy drugs available for linking
     */
    public function getPharmacyDrugsForLinking()
    {
        $drugs = PharmacyDrug::whereDoesntHave('inventoryItem')
            ->where('is_active', true)
            ->orderBy('generic_name')
            ->get(['id', 'drug_code', 'generic_name', 'brand_names', 'dosage_form', 'strength']);

        return response()->json($drugs);
    }

    /**
     * DELETE /api/main-store/drugs/{id}/remove-from-inventory
     * Remove drug from Drug Inventory (soft delete batches, keep in Main Store)
     */
    public function removeFromDrugInventory($id)
    {
        $item = InventoryItem::with('pharmacyDrug.batches')->findOrFail($id);

        if (!$item->pharmacyDrug) {
            return response()->json([
                'message'  => 'Drug is not linked to Drug Inventory'
            ], 422);
        }

        return DB::transaction(function () use ($item) {
            $pharmacyDrug = $item->pharmacyDrug;

            // Soft delete all batches
            PharmacyDrugBatch::where('drug_id', $pharmacyDrug->id)->delete();

            // Set current stock to 0
            $pharmacyDrug->update(['current_stock' => 0]);

            // Create transaction record
            PharmacyInventoryTransaction::create([
                'drug_id' => $pharmacyDrug->id,
                'transaction_number' => $this->generateTransactionNumber(),
                'type' => 'out',
                'quantity' => 0,
                'balance_after' => 0,
                'reason' => 'Removed from Drug Inventory by admin',
                'performed_by' => auth()->id(),
            ]);

            return response()->json([
                'message' => 'Drug removed from Drug Inventory. It remains in Main Store.',
                'item' => $item->fresh('pharmacyDrug'),
            ]);
        });
    }

    /**
     * DELETE /api/main-store/drugs/{id}/delete-completely
     * Completely delete drug from both Main Store and Drug Inventory
     */
    public function deleteDrugCompletely($id)
    {
        $item = InventoryItem::with('pharmacyDrug')->findOrFail($id);

        // Check if drug is referenced in prescriptions
        if ($item->pharmacyDrug) {
            $prescriptionCount = \App\Models\PrescriptionItem::where('pharmacy_drug_id', $item->pharmacyDrug->id)->count();
            
            // With soft delete, we can allow deletion even if prescriptions exist
            // but we might want to warn or just proceed since soft delete preserves the record
        }

        return DB::transaction(function () use ($item) {
            $drugName = $item->name;
            $pharmacyDrug = $item->pharmacyDrug;

            // Delete inventory transactions
            // InventoryTransaction::where('item_id', $item->id)->delete(); // Keep for logging

            // Delete the inventory item (Main Store) - This is now a soft delete
            $item->delete();

            // Soft delete the pharmacy drug if it exists
            if ($pharmacyDrug) {
                // Delete pharmacy batches
                PharmacyDrugBatch::where('drug_id', $pharmacyDrug->id)->delete();
                
                // Delete pharmacy transactions
                // PharmacyInventoryTransaction::where('drug_id', $pharmacyDrug->id)->delete(); // Keep for logging
                
                // Soft delete pharmacy drug
                $pharmacyDrug->delete();
            }

            return response()->json([
                'message' => "Drug '{$drugName}' deleted completely from system.",
            ]);
        });
    }

    /**
     * DELETE /api/main-store/drugs/bulk-delete-unlinked
     * Delete all/selected unlinked Medicine items from Main Store
     */
    public function bulkDeleteUnlinked(Request $request)
    {
        $ids = $request->input('ids');
        
        $query = InventoryItem::medicines()->unlinked();
        
        if ($ids && is_array($ids)) {
            $query->whereIn('id', $ids);
        }
        
        $unlinkedItems = $query->get();
        $count = $unlinkedItems->count();

        if ($count === 0) {
            return response()->json([
                'message' => 'No matching unlinked drugs found for deletion'
            ], 404);
        }

        return DB::transaction(function () use ($unlinkedItems, $count) {
            foreach ($unlinkedItems as $item) {
                // Delete associated inventory transactions
                // InventoryTransaction::where('item_id', $item->id)->delete(); // Keep for logging
                // Delete the inventory item (soft delete)
                $item->delete();
            }

            return response()->json([
                'message' => "Successfully deleted {$count} unlinked drug(s).",
                'deleted_count' => $count
            ]);
        });
    }

    // Helper methods
    private function generateDrugCode()
    {
        $lastDrug = PharmacyDrug::withTrashed()->latest('id')->first();
        $nextId = $lastDrug ? $lastDrug->id + 1 : 1;
        return 'DRG-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);
    }

    private function generateTransactionNumber()
    {
        $date = now()->format('Ymd');
        $count = PharmacyInventoryTransaction::whereDate('created_at', today())->count() + 1;
        return "TXN-{$date}-" . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

    /**
     * GET /api/main-store/drugs/reorder-requests/all
     * Get all pending reorder requests
     */
    public function getReorderRequests()
    {
        $requests = PharmacyReorderRequest::with(['pharmacyDrug', 'pharmacyDrug.inventoryItem'])
            ->where('status', 'pending')
            ->latest()
            ->get();
            
        return response()->json($requests);
    }

    /**
     * DELETE /api/main-store/drugs/reorder-requests/{id}
     * Dismiss/Complete a reorder request
     */
    public function dismissReorderRequest($id)
    {
        $request = PharmacyReorderRequest::findOrFail($id);
        $request->delete(); // We'll just delete for simplicity, or could mark as 'completed'
        
        return response()->json(['message' => 'Request dismissed.']);
    }
}
