<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Patient;
use App\Models\PharmacyDrug;

class ManualDispensationController extends Controller
{
    /**
     * Create a new manual dispensation
     */
    public function createDispensation(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'registered_on_the_fly' => 'boolean',
            'drugs' => 'required|array|min:1',
            'drugs.*.drug_id' => 'required|exists:pharmacy_drugs,id',
            'drugs.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // Create prescription as manual dispensation
            $prescription = Prescription::create([
                'patient_id' => $validated['patient_id'],
                'doctor_id' => null, // No doctor for manual dispensation
                'treatment_id' => null, // No treatment
                'is_manual_dispensation' => true,
                'registered_on_the_fly' => $validated['registered_on_the_fly'] ?? false,
                'pharmacy_status' => 'dispensed', // Immediately dispensed
                'dispensed_at' => now(), // Record the dispensation timestamp
                'notes' => $validated['notes'] ?? 'Manual dispensation',
                'total_amount' => 0, // Will calculate after adding items
            ]);

            $totalAmount = 0;

            // Add drugs as prescription items
            foreach ($validated['drugs'] as $drugData) {
                $drug = PharmacyDrug::findOrFail($drugData['drug_id']);

                // Check stock availability
                if ($drug->current_stock < $drugData['quantity']) {
                    throw new \Exception("Insufficient stock for {$drug->generic_name}. Available: {$drug->current_stock}");
                }

                $unitPrice = (float) $drug->default_unit_price;
                $subtotal = $unitPrice * $drugData['quantity'];
                $totalAmount += $subtotal;

                // Create prescription item
                PrescriptionItem::create([
                    'prescription_id' => $prescription->id,
                    'drug_name_text' => $drug->generic_name,
                    'dosage_text' => $drug->dosage_form . ' - ' . $drug->strength . ' ' . $drug->unit_of_measure,
                    'quantity' => $drugData['quantity'],
                    'unit_price' => $unitPrice,
                    'subtotal' => $subtotal,
                    'mapped_drug_id' => $drug->id,
                    'mapped_quantity' => $drugData['quantity'],
                    'dispensed_from_stock' => true,
                    'source' => 'manual',
                    'manually_added_by' => null, // Set to null to avoid foreign key issues
                ]);

                // Deduct stock
                $drug->decrement('current_stock', $drugData['quantity']);
            }

            // Update total amount
            $prescription->update(['total_amount' => $totalAmount]);

            // Note: Billing is automatically created by BillingService through observers
            // when prescription has treatment_id or when pharmacy items are dispensed

            return response()->json([
                'message' => 'Manual dispensation created successfully',
                'prescription' => $prescription->load('items', 'patient'),
            ], 201);
        });
    }

    /**
     * Quick patient registration for manual dispensation
     */
    public function findOrCreatePatient(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'date_of_birth' => 'required|date',
            'gender' => 'required|in:male,female,other',
            'phone_number' => 'nullable|string',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
        ]);

        // Try to find existing patient by name and date of birth
        $existingPatient = Patient::where('first_name', $validated['first_name'])
            ->where('last_name', $validated['last_name'])
            ->where('date_of_birth', $validated['date_of_birth'])
            ->first();

        if ($existingPatient) {
            return response()->json([
                'patient' => $existingPatient,
                'message' => 'Existing patient found',
                'is_new' => false,
            ]);
        }

        // Create new patient
        $patient = Patient::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'date_of_birth' => $validated['date_of_birth'],
            'gender' => $validated['gender'],
            'phone_number' => $validated['phone_number'],
            'email' => $validated['email'],
            'address' => $validated['address'],
        ]);

        return response()->json([
            'patient' => $patient,
            'message' => 'New patient registered',
            'is_new' => true,
        ], 201);
    }

    /**
     * Add drug to existing prescription manually
     */
    public function addDrugToPrescription(Request $request, $prescriptionId)
    {
        $validated = $request->validate([
            'drug_id' => 'required|exists:pharmacy_drugs,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $prescription = Prescription::findOrFail($prescriptionId);
        $drug = PharmacyDrug::findOrFail($validated['drug_id']);

        // Check stock
        if ($drug->current_stock < $validated['quantity']) {
            return response()->json([
                'message' => "Insufficient stock. Available: {$drug->current_stock}",
            ], 400);
        }

        return DB::transaction(function () use ($prescription, $drug, $validated) {
            $unitPrice = (float) $drug->default_unit_price;
            $subtotal = $unitPrice * $validated['quantity'];

            // Add item to prescription
            $item = PrescriptionItem::create([
                'prescription_id' => $prescription->id,
                'drug_name_text' => $drug->generic_name,
                'dosage_text' => $drug->dosage_form . ' - ' . $drug->strength . ' ' . $drug->unit_of_measure,
                'quantity' => $validated['quantity'],
                'unit_price' => $unitPrice,
                'subtotal' => $subtotal,
                'mapped_drug_id' => $drug->id,
                'mapped_quantity' => $validated['quantity'],
                'dispensed_from_stock' => true,
                'source' => 'manual',
                'manually_added_by' => null, // Set to null to avoid foreign key issues
            ]);

            // Update prescription total
            $prescription->increment('total_amount', $subtotal);

            // Deduct stock
            $drug->decrement('current_stock', $validated['quantity']);

            // Note: Billing is automatically updated by BillingService through observers
            // when prescription items are added or updated

            return response()->json([
                'message' => 'Drug added successfully',
                'item' => $item->load('mappedDrug'),
                'prescription' => $prescription->fresh(['items.mappedDrug']),
            ]);
        });
    }

    /**
     * Get recent manual dispensations
     */
    public function recentDispensations()
    {
        $dispensations = Prescription::with(['patient', 'items'])
            ->where('is_manual_dispensation', true)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json($dispensations);
    }
}
