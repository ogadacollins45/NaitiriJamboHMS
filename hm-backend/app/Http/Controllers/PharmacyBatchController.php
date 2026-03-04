<?php

namespace App\Http\Controllers;

use App\Models\PharmacyDrugBatch;
use App\Models\PharmacyInventoryTransaction;
use App\Models\PharmacyStockAlert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PharmacyBatchController extends Controller
{
    /**
     * Get all batches with filters
     */
    public function index(Request $request)
    {
        $query = PharmacyDrugBatch::with(['drug', 'supplier']);

        if ($request->has('drug_id')) {
            $query->forDrug($request->drug_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('location')) {
            $query->byLocation($request->location);
        }

        if ($request->boolean('expiring_soon')) {
            $query->expiringSoon($request->input('days', 180));
        }

        if ($request->boolean('available_only')) {
            $query->available();
        }

        $batches = $query->latest('received_date')->paginate(20);

        return response()->json($batches);
    }

    /**
     * Receive new batch
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'drug_id' => 'required|exists:pharmacy_drugs,id',
            'batch_number' => 'required|string|unique:pharmacy_drug_batches',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'purchase_order_number' => 'nullable|string',
            'manufacture_date' => 'nullable|date',
            'expiry_date' => 'required|date|after:today',
            'quantity_received' => 'required|integer|min:1',
            'unit_cost' => 'required|numeric|min:0',
            'unit_price' => 'required|numeric|min:0',
            'vat_percentage' => 'nullable|numeric|min:0|max:100',
            'storage_location' => 'nullable|string',
            'storage_temp_min' => 'nullable|numeric',
            'storage_temp_max' => 'nullable|numeric',
            'requires_cold_chain' => 'boolean',
            'quality_check_status' => 'in:pending,passed,failed',
            'receiving_notes' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            // Create batch
            $batch = PharmacyDrugBatch::create([
                ...$validated,
                'quantity_current' => $validated['quantity_received'],
                'received_date' => now(),
                'received_by' => $request->user()->id,
                'status' => 'active',
            ]);

            // Create inventory transaction
            PharmacyInventoryTransaction::create([
                'transaction_number' => PharmacyInventoryTransaction::generateTransactionNumber(),
                'batch_id' => $batch->id,
                'drug_id' => $batch->drug_id,
                'transaction_type' => 'receipt',
                'quantity' => $validated['quantity_received'],
                'balance_before' => 0,
                'balance_after' => $validated['quantity_received'],
                'reason' => 'New stock received',
                'performed_by' => $request->user()->id,
                'transaction_date' => now(),
                'unit_cost' => $validated['unit_cost'],
                'total_value' => $validated['quantity_received'] * $validated['unit_cost'],
            ]);

            // Check for expiry and create alert if needed
            if ($batch->is_expiring_soon) {
                PharmacyStockAlert::create([
                    'alert_type' => 'expiry_soon',
                    'severity' => 'warning',
                    'drug_id' => $batch->drug_id,
                    'batch_id' => $batch->id,
                    'message' => "Batch {$batch->batch_number} expires in {$batch->days_to_expiry} days",
                    'expiry_date' => $batch->expiry_date,
                    'days_to_expiry' => $batch->days_to_expiry,
                    'recommended_action' => 'Use this batch before expiry or plan return',
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Batch received successfully',
                'batch' => $batch->load('drug'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to receive batch',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get batch details
     */
    public function show($id)
    {
        $batch = PharmacyDrugBatch::with([
            'drug',
            'supplier',
            'receivedByStaff',
            'transactions',
            'dispensationItems',
            'alerts',
        ])->findOrFail($id);

        return response()->json($batch);
    }

    /**
     * Update batch
     */
    public function update(Request $request, $id)
    {
        $batch = PharmacyDrugBatch::findOrFail($id);

        $validated = $request->validate([
            'storage_location' => 'string',
            'status' => 'in:active,expired,recalled,depleted,quarantined',
            'quality_check_status' => 'in:pending,passed,failed',
            'notes' => 'nullable|string',
        ]);

        $batch->update($validated);

        return response()->json($batch);
    }

    /**
     * Get FEFO batches for a drug
     */
    public function fefo($drugId)
    {
        $batches = PharmacyDrugBatch::forDrug($drugId)
            ->FEFO()
            ->get();

        return response()->json($batches);
    }

    /**
     * Adjust batch quantity
     */
    public function adjust(Request $request, $id)
    {
        $validated = $request->validate([
            'adjustment_type' => 'required|in:damage,expiry,loss,return',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            $batch = PharmacyDrugBatch::findOrFail($id);
            $balanceBefore = $batch->quantity_current;

            // Apply adjustment
            switch ($validated['adjustment_type']) {
                case 'damage':
                    $batch->quantity_damaged += $validated['quantity'];
                    break;
                case 'expiry':
                    $batch->quantity_expired += $validated['quantity'];
                    $batch->status = 'expired';
                    break;
                case 'loss':
                    // Just deduct from current
                    break;
                case 'return':
                    $batch->quantity_returned += $validated['quantity'];
                    break;
            }

            $batch->quantity_current -= $validated['quantity'];
            if ($batch->quantity_current <= 0 && $batch->status === 'active') {
                $batch->status = 'depleted';
            }
            $batch->save();

            // Create transaction
            PharmacyInventoryTransaction::create([
                'transaction_number' => PharmacyInventoryTransaction::generateTransactionNumber(),
                'batch_id' => $batch->id,
                'drug_id' => $batch->drug_id,
                'transaction_type' => $validated['adjustment_type'],
                'quantity' => -$validated['quantity'],
                'balance_before' => $balanceBefore,
                'balance_after' => $batch->quantity_current,
                'reason' => $validated['reason'],
                'performed_by' => $request->user()->id,
                'transaction_date' => now(),
                'requires_authorization' => true,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Adjustment recorded',
                'batch' => $batch,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Adjustment failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
