<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Bill;
use App\Models\BillItem;
use App\Models\Payment;
use App\Models\Patient;
use App\Models\Treatment;

class BillingController extends Controller
{
    /**
     * Get list of bills (paginated, searchable)
     */
    public function index(Request $request)
    {
        $query = Bill::with(['patient', 'doctor', 'treatment'])
            ->orderByDesc('created_at');

        if ($search = $request->input('search')) {
            $query->whereHas('patient', function ($q) use ($search) {
                $q->where('first_name', 'like', "%$search%")
                    ->orWhere('last_name', 'like', "%$search%")
                    ->orWhere('phone', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%");
            });
        }

        return response()->json($query->paginate(10));
    }

    /**
     * Create bill for a treatment OR apply discount/tax to existing bill
     * Does NOT refresh - observers build bill incrementally
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'treatment_id' => 'required|exists:treatments,id',
            'patient_id'   => 'nullable|exists:patients,id',
            'doctor_id'    => 'nullable|exists:doctors,id',
            'discount'     => 'nullable|numeric|min:0',
            'tax'          => 'nullable|numeric|min:0',
        ]);

        try {
            $billingService = app(\App\Services\BillingService::class);
            
            // Get or create bill WITHOUT refreshing
            // Observers add items as services are provided
            $bill = $billingService->getOrCreateBillForTreatment($validated['treatment_id']);

            // Apply discount and tax if provided
            if (isset($validated['discount']) || isset($validated['tax'])) {
                $bill->update([
                    'discount' => $validated['discount'] ?? $bill->discount,
                    'tax'      => $validated['tax'] ?? $bill->tax,
                ]);
                $billingService->recalculateBill($bill);
            }

            return response()->json([
                'message' => 'Bill retrieved successfully',
                'data'    => $bill->fresh(['items', 'payments', 'patient.bills', 'doctor', 'treatment']),
            ], 201);

        } catch (\Throwable $e) {
            \Log::error('Billing failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to get bill',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get bill by treatment ID
     * Returns existing bill WITHOUT refreshing/rebuilding
     * Bills are built incrementally by observers
     */
    public function getByTreatment($treatmentId)
    {
        try {
            $treatment = Treatment::findOrFail($treatmentId);
            
            $bill = Bill::where('treatment_id', $treatmentId)
                ->with(['items', 'payments', 'patient', 'doctor', 'treatment'])
                ->first();

            if (!$bill) {
                // No bill exists yet - return empty structure
                // Observers will create bill items as services are provided
                return response()->json([
                    'id' => null,
                    'treatment_id' => $treatmentId,
                    'patient_id' => $treatment->patient_id,
                    'items' => [],
                    'payments' => [],
                    'subtotal' => 0,
                    'total_amount' => 0,
                    'status' => 'unpaid',
                    'patient' => $treatment->patient,
                    'doctor' => $treatment->doctor,
                    'treatment' => $treatment,
                ]);
            }

            return response()->json($bill);
        } catch (\Throwable $e) {
            \Log::error('Failed to get bill by treatment: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve bill',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show bill with all details + patient's past bills
     */
    public function show($id)
    {
        $bill = Bill::with([
            'patient.bills' => function ($q) {
                $q->orderByDesc('created_at');
            },
            'patient.bills.payments',
            'doctor',
            'treatment',
            'items',
            'payments'
        ])->find($id);

        if (!$bill) {
            return response()->json(['message' => 'Bill not found'], 404);
        }

        // Get the LATEST treatment payment_type for this bill
        // (handles same-day consolidation where multiple treatments link to one bill)
        $latestTreatment = Treatment::where('bill_id', $bill->id)
            ->orderByDesc('created_at')
            ->first();
        
        if ($latestTreatment && $latestTreatment->payment_type) {
            $bill->payment_method = $latestTreatment->payment_type;
        }

        return response()->json([
            'bill' => $bill,
            'past_bills' => $bill->patient->bills->where('id', '!=', $bill->id)->values()
        ]);
    }

    /**
     * Get pending (unpaid/partial) bills
     */
    public function pending(Request $request)
    {
        $query = Bill::with(['patient', 'doctor', 'treatment'])
            ->whereIn('status', ['unpaid', 'partial'])
            ->orderByDesc('created_at');

        if ($search = $request->input('search')) {
            $query->whereHas('patient', function ($q) use ($search) {
                $q->where('first_name', 'like', "%$search%")
                    ->orWhere('last_name', 'like', "%$search%")
                    ->orWhere('phone', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%");
            });
        }

        return response()->json($query->paginate(10));
    }

    /**
     * Get cleared (paid) bills
     */
    public function cleared(Request $request)
    {
        $query = Bill::with(['patient', 'doctor', 'treatment'])
            ->where('status', 'paid')
            ->orderByDesc('created_at');

        if ($search = $request->input('search')) {
            $query->whereHas('patient', function ($q) use ($search) {
                $q->where('first_name', 'like', "%$search%")
                    ->orWhere('last_name', 'like', "%$search%")
                    ->orWhere('phone', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%");
            });
        }

        return response()->json($query->paginate(10));
    }


    /**
     * Record payment
     */
    public function recordPayment(Request $request, $id)
    {
        $validated = $request->validate([
            'amount_paid'     => 'required|numeric|min:0.01',
            'payment_method'  => 'required|string|max:50',
            'transaction_ref' => 'nullable|string|max:100',
            'notes'           => 'nullable|string',
        ]);

        try {
            $bill = DB::transaction(function () use ($validated, $id) {

                $bill = Bill::with('payments')
                    ->lockForUpdate()
                    ->findOrFail($id);

                Payment::create([
                    'bill_id'        => $bill->id,
                    'amount_paid'    => $validated['amount_paid'],
                    'payment_method' => $validated['payment_method'],
                    'transaction_ref'=> $validated['transaction_ref'] ?? null,
                    'notes'          => $validated['notes'] ?? null,
                    'paid_at'        => now(),
                ]);

                $bill->refreshTotals();
                $bill->refreshStatus();

                return $bill->load(['items', 'payments', 'patient.bills', 'doctor', 'treatment']);
            });

            return response()->json($bill);

        } catch (\Throwable $e) {
            \Log::error('Payment failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to record payment',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
