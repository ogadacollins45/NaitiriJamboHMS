<?php

namespace App\Http\Controllers;

use App\Models\PharmacyDrug;
use App\Models\Staff;
use App\Models\PharmacyReorderRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PharmacyDrugController extends Controller
{
    public function index(Request $request)
    {
        $query = PharmacyDrug::with(['batches' => function ($q) {
            $q->where('status', 'active');
        }]);

        // Search
        if ($request->has('search')) {
            $query->search($request->search);
        }

        // Filter by category
        if ($request->has('category')) {
            $query->byCategory($request->category);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        // Filter controlled substances
        if ($request->boolean('controlled_only')) {
            $query->controlledSubstances();
        }

        // Low stock filter
        if ($request->boolean('low_stock')) {
            $query->lowStock();
        }

        // Out of stock filter
        if ($request->boolean('out_of_stock')) {
            $query->where('current_stock', '=', 0);
        }

        $perPage = $request->input('per_page', 20);
        $drugs = $query->paginate($perPage);

        return response()->json($drugs);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'generic_name' => 'required|string|max:255',
            'brand_names' => 'nullable|array',
            'dosage_form' => 'required|in:tablet,capsule,syrup,suspension,injection,cream,ointment,gel,drops,inhaler,suppository,patch,powder,solution,lotion,spray',
            'strength' => 'nullable|string|max:100',
            'route_of_administration' => 'nullable|in:oral,iv,im,sc,topical,inhalation,rectal,vaginal,ophthalmic,otic,nasal,transdermal',
            'drug_category' => 'required|string|max:100',
            'therapeutic_class' => 'nullable|string|max:100',
            'controlled_substance' => 'nullable|boolean',
            'schedule' => 'nullable|string',
            'requires_prescription' => 'nullable|boolean',
            'storage_conditions' => 'nullable|string',
            'storage_temp_min' => 'nullable|numeric',
            'storage_temp_max' => 'nullable|numeric',
            'indications' => 'nullable|string',
            'contraindications' => 'nullable|string',
            'side_effects' => 'nullable|string',
            'warnings' => 'nullable|string',
            'precautions' => 'nullable|string',
            'pregnancy_category' => 'nullable|in:A,B,C,D,X,N/A',
            'safe_in_pregnancy' => 'nullable|boolean',
            'safe_in_lactation' => 'nullable|boolean',
            'pediatric_use' => 'nullable|boolean',
        'manufacturer' => 'nullable|string',
        'unit_of_measure' => 'nullable|string|max:50',
        'default_unit_price' => 'required|numeric|min:0',
        'current_stock' => 'nullable|integer|min:0',
        'reorder_level' => 'nullable|integer|min:0',
        'reorder_quantity' => 'nullable|integer|min:0',
    ]);

        $drug = new PharmacyDrug($validated);
        $drug->drug_code = $drug->generateDrugCode();
        $drug->created_by = $request->user()->id;
        $drug->save();

        return response()->json($drug, 201);
    }

    public function show($id)
    {
        $drug = PharmacyDrug::with([
            'batches',
            'activeBatches',
            'interactions.drugA',
            'interactions.drugB',
            'stockAlerts' => function ($q) {
                $q->where('is_resolved', false);
            }
        ])->findOrFail($id);

        return response()->json($drug);
    }

    public function update(Request $request, $id)
    {
        $drug = PharmacyDrug::findOrFail($id);

        $validated = $request->validate([
        'generic_name' => 'string|max:255',
        'brand_names' => 'nullable|array',
        'dosage_form' => 'in:tablet,capsule,syrup,suspension,injection,cream,ointment,gel,drops,inhaler,suppository,patch,powder,solution,lotion,spray',
        'strength' => 'nullable|string|max:100',
        'unit_of_measure' => 'nullable|string|max:50',
        'default_unit_price' => 'numeric|min:0',
        'current_stock' => 'nullable|integer|min:0',
        'reorder_level' => 'integer|min:0',
        'reorder_quantity' => 'integer|min:0',
        'is_active' => 'boolean',
    ]);

        $validated['updated_by'] = $request->user()->id;
        $drug->update($validated);

        return response()->json($drug);
    }

    public function destroy($id)
    {
        $drug = PharmacyDrug::findOrFail($id);
        $drug->delete();

        return response()->json(['message' => 'Drug deleted successfully']);
    }

    /**
     * Add stock to existing drug inventory
     */
    public function addStock(Request $request, $id)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string'
        ]);

        $drug = PharmacyDrug::findOrFail($id);
        $previousStock = $drug->current_stock;
        
        // Add to current stock
        $drug->current_stock += $validated['quantity'];
        $drug->updated_by = $request->user()->id ?? null;
        $drug->save();

        // Create inventory transaction record
        try {
            \App\Models\PharmacyInventoryTransaction::create([
                'transaction_number' => \App\Models\PharmacyInventoryTransaction::generateTransactionNumber(),
                'drug_id' => $drug->id,
                'transaction_type' => 'stock_in',
                'quantity' => $validated['quantity'],
                'balance_before' => $previousStock,
                'balance_after' => $drug->current_stock,
                'reference_type' => 'manual_adjustment',
                'notes' => $validated['notes'] ?? 'Stock replenishment',
                'performed_by' => $request->user()->id ?? 1,
                'transaction_date' => now(),
            ]);
        } catch (\Exception $e) {
            \Log::warning('Failed to create inventory transaction: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Stock added successfully',
            'drug' => $drug,
            'previous_stock' => $previousStock,
            'added_quantity' => $validated['quantity'],
            'new_stock' => $drug->current_stock
        ]);
    }

    public function checkInteraction(Request $request, $id)
    {
        $validated = $request->validate([
            'drug_ids' => 'required|array',
            'drug_ids.*' => 'exists:pharmacy_drugs,id',
        ]);

        $drug = PharmacyDrug::findOrFail($id);
        $interactions = [];

        foreach ($validated['drug_ids'] as $otherDrugId) {
            $interaction = $drug->checkInteractionWith($otherDrugId);
            if ($interaction) {
                $interactions[] = $interaction->load(['drugA', 'drugB']);
            }
        }

        return response()->json([
            'has_interactions' => count($interactions) > 0,
            'interactions' => $interactions,
        ]);
    }

    /**
     * Send pharmacy drug to Main Store
     * Creates an inventory_item linked to this pharmacy drug
     */
    public function sendToMainStore(Request $request, $id)
    {
        $drug = PharmacyDrug::with('inventoryItem')->findOrFail($id);

        // Check if already linked to Main Store
        if ($drug->inventoryItem) {
            return response()->json([
                'message' => 'This drug is already linked to Main Store',
                'inventory_item' => $drug->inventoryItem,
            ], 422);
        }

        $validated = $request->validate([
            'quantity' => 'required|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'unit_price' => 'required|numeric|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'reorder_level' => 'nullable|integer|min:0',
            'expiry_date' => 'nullable|date',
            'batch_no' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($drug, $validated) {
            // Generate item code
            $itemCode = 'MED-' . strtoupper(str_pad((string)(\App\Models\InventoryItem::max('id') + 1), 5, '0', STR_PAD_LEFT));

            // Create inventory item
            $inventoryItem = \App\Models\InventoryItem::create([
                'item_code' => $itemCode,
                'name' => $drug->generic_name,
                'category' => 'Medicine',
                'subcategory' => $drug->dosage_form,
                'quantity' => $validated['quantity'],
                'unit' => $validated['unit'] ?? $drug->unit_of_measure ?? 'unit',
                'reorder_level' => $validated['reorder_level'] ?? $drug->reorder_level ?? 0,
                'unit_price' => $validated['unit_price'],
                'supplier_id' => $validated['supplier_id'] ?? null,
                'pharmacy_drug_id' => $drug->id,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'batch_no' => $validated['batch_no'] ?? null,
                'location' => $validated['location'] ?? 'Main Store',
            ]);

            // Log initial transaction if quantity > 0
            if ($validated['quantity'] > 0) {
                \App\Models\InventoryTransaction::create([
                    'item_id' => $inventoryItem->id,
                    'type' => 'in',
                    'quantity' => (int) $validated['quantity'],
                    'balance_after' => (int) $validated['quantity'],
                    'reason' => 'Initial stock - Sent from Pharmacy Drug Inventory',
                    'performed_by' => 'system',
                ]);
            }

            return response()->json([
                'message' => 'Drug successfully sent to Main Store',
                'inventory_item' => $inventoryItem->load(['supplier', 'pharmacyDrug']),
            ], 201);
        });
    }

    public function reorder(Request $request, $id)
    {
        $drug = PharmacyDrug::findOrFail($id);

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string'
        ]);

        // Check if already pending reorder
        $exists = PharmacyReorderRequest::where('pharmacy_drug_id', $id)
            ->where('status', 'pending')
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A reorder request for this drug is already pending.'], 422);
        }

        PharmacyReorderRequest::create([
            'pharmacy_drug_id' => $id,
            'quantity' => $validated['quantity'],
            'status' => 'pending',
            'requested_by' => $request->user()->id ?? null,
            'notes' => $validated['notes']
        ]);

        return response()->json(['message' => 'Reorder request sent to Main Store.']);
    }
}
