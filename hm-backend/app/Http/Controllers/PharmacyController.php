<?php

namespace App\Http\Controllers;

use App\Models\PharmacyOrder;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PharmacyController extends Controller
{
    /**
     * Display pharmacy order queue
     */
    public function index(Request $request)
    {
        $query = PharmacyOrder::with([
            'prescription.items.inventoryItem',
            'patient',
            'doctor',
            'pharmacist'
        ])->orderBy('created_at', 'desc');

        // Filter by status
        if ($status = $request->query('status')) {
            if ($status === 'pending') {
                $query->pending();
            } elseif ($status === 'dispensed') {
                $query->dispensed();
            }
        }

        $orders = $query->get();

        return response()->json($orders->map(function ($order) {
            return [
                'id' => $order->id,
                'prescription_id' => $order->prescription_id,
                'patient' => [
                    'id' => $order->patient->id,
                    'name' => "{$order->patient->first_name} {$order->patient->last_name}",
                    'age' => $order->patient->age ?? null,
                ],
                'doctor' => $order->doctor ? [
                    'id' => $order->doctor->id,
                    'name' => "{$order->doctor->first_name} {$order->doctor->last_name}",
                ] : null,
                'pharmacist' => $order->pharmacist ? [
                    'id' => $order->pharmacist->id,
                    'name' => "{$order->pharmacist->first_name} {$order->pharmacist->last_name}",
                ] : null,
                'medications' => $order->prescription->items->map(function ($item) {
                    $inv = $item->inventoryItem;
                    return [
                        'name' => $inv ? $inv->name : 'Unknown',
                        'quantity' => $item->quantity,
                        'unit' => $inv ? $inv->unit : null,
                    ];
                }),
                'status' => $order->status,
                'notes' => $order->notes,
                'created_at' => $order->created_at->toDateTimeString(),
                'dispensed_at' => $order->dispensed_at ? $order->dispensed_at->toDateTimeString() : null,
            ];
        }));
    }

    /**
     * Show single pharmacy order
     */
    public function show($id)
    {
        $order = PharmacyOrder::with([
            'prescription.items.inventoryItem',
            'patient',
            'doctor',
            'pharmacist'
        ])->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        return response()->json([
            'id' => $order->id,
            'prescription_id' => $order->prescription_id,
            'patient' => [
                'id' => $order->patient->id,
                'name' => "{$order->patient->first_name} {$order->patient->last_name}",
                'age' => $order->patient->age ?? null,
            ],
            'doctor' => $order->doctor ? [
                'id' => $order->doctor->id,
                'name' => "{$order->doctor->first_name} {$order->doctor->last_name}",
            ] : null,
            'pharmacist' => $order->pharmacist ? [
                'id' => $order->pharmacist->id,
                'name' => "{$order->pharmacist->first_name} {$order->pharmacist->last_name}",
            ] : null,
            'medications' => $order->prescription->items->map(function ($item) {
                $inv = $item->inventoryItem;
                return [
                    'id' => $item->id,
                    'name' => $inv ? $inv->name : 'Unknown',
                    'quantity' => $item->quantity,
                    'unit' => $inv ? $inv->unit : null,
                    'unit_price' => $item->unit_price,
                    'available_stock' => $inv ? $inv->quantity : 0,
                ];
            }),
            'status' => $order->status,
            'notes' => $order->notes,
            'created_at' => $order->created_at->toDateTimeString(),
            'dispensed_at' => $order->dispensed_at ? $order->dispensed_at->toDateTimeString() : null,
        ]);
    }

    /**
     * Dispense pharmacy order
     * - Deduct inventory
     * - Post to billing
     * - Mark as dispensed
     */
    public function dispense(Request $request, $id)
    {
        try {
            $result = DB::transaction(function () use ($request, $id) {
                $order = PharmacyOrder::with(['prescription.items.inventoryItem', 'prescription.treatment'])
                    ->lockForUpdate()
                    ->findOrFail($id);

                if ($order->status === 'dispensed') {
                    throw new \Exception('Order already dispensed');
                }

                $user = $request->user();

                // Deduct inventory for each prescription item
                foreach ($order->prescription->items as $item) {
                    if ($item->inventoryItem) {
                        $inv = $item->inventoryItem;
                        
                        // Stock check
                        if ($inv->quantity < $item->quantity) {
                            throw new \Exception("Insufficient stock for {$inv->name}. Available: {$inv->quantity}, needed: {$item->quantity}");
                        }

                        // Deduct stock
                        $inv->decrement('quantity', $item->quantity);
                    }
                }

                // Mark as dispensed
                $order->update([
                    'status' => 'dispensed',
                    'pharmacist_id' => $user->id,
                    'dispensed_at' => now(),
                    'notes' => $request->input('notes'),
                ]);

                // Refresh billing to include prescription costs
                try {
                    app(\App\Http\Controllers\BillingController::class)
                        ->store(new Request([
                            'patient_id' => $order->patient_id,
                            'treatment_id' => $order->prescription->treatment_id,
                            'doctor_id' => $order->doctor_id,
                            'auto' => true,
                        ]));
                } catch (\Throwable $e) {
                    \Log::error('Billing update failed after dispensing: ' . $e->getMessage());
                }

                return $order->fresh(['prescription.items.inventoryItem', 'patient', 'doctor', 'pharmacist']);
            });

            return response()->json([
                'message' => 'Medications dispensed successfully',
                'order' => $result,
            ]);

        } catch (\Throwable $e) {
            \Log::error('Dispensing failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to dispense medication',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
