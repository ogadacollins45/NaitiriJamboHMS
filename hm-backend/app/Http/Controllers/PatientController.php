<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Patient;
use App\Models\Treatment;
use App\Models\Doctor;

class PatientController extends Controller
{
    /**
     * Display a listing of all patients with their treatments.
     * Only treatments that are active or awaiting billing are included.
     */
    public function index(Request $request)
    {
        $query = Patient::with([
            'treatments' => function ($q) {
                $q->whereIn('status', ['active', 'awaiting_billing'])
                ->orderByDesc('visit_date');
            }
        ])->orderByDesc('created_at');

        // ✅ Search filter (by name, phone, email, or national_id)
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                ->orWhere('last_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('national_id', 'like', "%{$search}%")
                ->orWhere('upid', 'like', "%{$search}%");
            });
        }

        // ✅ Filter by today's patients
        if ($request->input('today') === 'true') {
            $query->whereDate('created_at', now()->toDateString());
        }

        // ✅ Paginate results (20 per page)
        $patients = $query->paginate(20);

        return response()->json($patients);
    }

    /**
     * Get patients with incomplete treatments
     * A treatment is incomplete if it's missing:
     * - Diagnosis (no primary diagnosis AND no additional diagnoses)
     * - Prescription
     * - Dispensation (if prescription exists but not dispensed)
     * - Lab results (if lab request exists but not completed)
     */
    public function getIncompletePatients(Request $request)
    {
        // Get all patients with active treatments, ordered by most recent treatment
        $allPatients = Patient::with([
            'treatments' => function ($q) {
                $q->where('status', 'active')
                  ->orderByDesc('created_at')
                  ->with(['doctor', 'diagnoses', 'prescriptions.items', 'labRequests.tests']);
            }
        ])
        ->whereHas('treatments', function ($q) {
            $q->where('status', 'active');
        })
        ->get();

        // Filter patients to only include those with incomplete treatments
        $incompletePatients = $allPatients->filter(function ($patient) {
            if (!$patient->treatments || count($patient->treatments) === 0) {
                return false;
            }

            // Get the latest active treatment
            $latestTreatment = $patient->treatments->first();
            $incompleteItems = [];
            
            // Check 1: Missing diagnosis
            $hasDiagnosis = !empty($latestTreatment->diagnosis) || 
                           ($latestTreatment->diagnoses && count($latestTreatment->diagnoses) > 0);
            if (!$hasDiagnosis) {
                $incompleteItems[] = 'diagnosis';
            }
            
            // Check 2: Missing prescription
            $hasPrescription = $latestTreatment->prescriptions && count($latestTreatment->prescriptions) > 0;
            if (!$hasPrescription) {
                $incompleteItems[] = 'prescription';
            } else {
                // Check 3: Pending dispensation (if prescription exists)
                // Check if ALL prescriptions have been dispensed
                $allDispensed = true;
                foreach ($latestTreatment->prescriptions as $prescription) {
                    // A prescription is dispensed if:
                    // - pharmacy_status is 'dispensed', OR
                    // - dispensed_at timestamp is set
                    $isDispensed = ($prescription->pharmacy_status === 'dispensed') || 
                                  !empty($prescription->dispensed_at);
                    
                    if (!$isDispensed) {
                        $allDispensed = false;
                        break;
                    }
                }
                if (!$allDispensed) {
                    $incompleteItems[] = 'dispensation';
                }
            }
            
            // Check 4: Pending lab results (if lab request exists)
            if ($latestTreatment->labRequests && count($latestTreatment->labRequests) > 0) {
                foreach ($latestTreatment->labRequests as $labRequest) {
                    if ($labRequest->status !== 'completed') {
                        $incompleteItems[] = 'lab';
                        break;
                    }
                }
            }
            
            // Add incomplete items to patient
            $patient->incomplete_items = $incompleteItems;
            $patient->latest_treatment_date = $latestTreatment->created_at;
            
            // Only include if there are incomplete items
            return count($incompleteItems) > 0;
        });

        // Sort by most recent treatment
        $sortedPatients = $incompletePatients->sortByDesc('latest_treatment_date')->values();

        // Manually paginate the results
        $page = $request->input('page', 1);
        $perPage = 20;
        $total = $sortedPatients->count();
        $lastPage = ceil($total / $perPage);
        $offset = ($page - 1) * $perPage;
        
        $paginatedPatients = $sortedPatients->slice($offset, $perPage)->values();
        
        // Create pagination response
        return response()->json([
            'current_page' => (int) $page,
            'data' => $paginatedPatients,
            'first_page_url' => url('/api/patients/incomplete?page=1'),
            'from' => $total > 0 ? $offset + 1 : null,
            'last_page' => $lastPage,
            'last_page_url' => url("/api/patients/incomplete?page={$lastPage}"),
            'next_page_url' => $page < $lastPage ? url("/api/patients/incomplete?page=" . ($page + 1)) : null,
            'path' => url('/api/patients/incomplete'),
            'per_page' => $perPage,
            'prev_page_url' => $page > 1 ? url("/api/patients/incomplete?page=" . ($page - 1)) : null,
            'to' => $total > 0 ? min($offset + $perPage, $total) : null,
            'total' => $total,
        ]);
    }

    /**
     * Store a newly created patient record.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name'  => 'required|string|max:100',
            'last_name'   => 'required|string|max:100',
            'gender'      => 'required|string|max:10',
            'dob'         => 'nullable|date',
            'age'         => 'nullable|integer|min:0|max:150', //added
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email|max:255',
            'address'     => 'nullable|string|max:255',
            'national_id' => 'nullable|string|max:50|unique:patients,national_id',
            // 🚫 removed upid validation (auto-generated in model)
        ]);

        $patient = Patient::create($validated);

        return response()->json([
            'message' => 'Patient created successfully',
            'data'    => $patient,
        ], 201);
    }

    /**
     * Display a specific patient with all related data.
     * Optimized with eager loading to prevent N+1 queries.
     */
    public function show($id)
    {
        $patient = Patient::with([
            'treatments' => function ($q) {
                $q->orderByDesc('visit_date');
            },
            'treatments.doctor',
            'treatments.diagnoses',
            'treatments.prescriptions' => function ($q) {
                $q->withTrashed(); // Include soft-deleted prescriptions in history
            },
            'treatments.prescriptions.items.inventoryItem',
            'treatments.labRequests.tests',
            'appointments.doctor',
            'bills'
        ])->find($id);

        if (!$patient) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        // Convert to array and transform prescription items
        $patientArray = $patient->toArray();
        
        if (isset($patientArray['treatments'])) {
            foreach ($patientArray['treatments'] as &$treatment) {
                if (isset($treatment['prescriptions'])) {
                    foreach ($treatment['prescriptions'] as &$prescription) {
                        if (isset($prescription['items'])) {
                            $prescription['items'] = array_map(function ($item) {
                                $invItem = $item['inventory_item'] ?? null;
                                return [
                                    'id' => $item['id'],
                                    'name' => $item['drug_name_text'] ?? ($invItem ? $invItem['name'] : 'Unknown Item'),
                                    'quantity' => $item['quantity'],
                                    'unit' => $invItem ? $invItem['unit'] : null,
                                    'unit_price' => (float) $item['unit_price'],
                                    'subtotal' => (float) $item['subtotal'],
                                    'category' => $invItem ? $invItem['category'] : null,
                                    'subcategory' => $invItem ? $invItem['subcategory'] : null,
                                    'item_code' => $invItem ? $invItem['item_code'] : null,
                                    'batch_no' => $invItem ? $invItem['batch_no'] : null,
                                    'expiry_date' => $invItem && isset($invItem['expiry_date']) ? $invItem['expiry_date'] : null,
                                    'dosage' => $item['dosage_text'],
                                    'frequency' => $item['frequency_text'],
                                    'duration' => $item['duration_text'],
                                    'instructions' => $item['instructions_text'],
                                    'mapped_drug_id' => $item['mapped_drug_id'],
                                    'mapped_quantity' => $item['mapped_quantity'],
                                    'dispensed_from_stock' => $item['dispensed_from_stock'],
                                ];
                            }, $prescription['items']);
                        }
                    }
                }
            }
        }

        return response()->json($patientArray);
    }

    /**
     * Update a patient record.
     */
    public function update(Request $request, $id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        $validated = $request->validate([
            'upid'        => 'nullable|string|max:50|unique:patients,upid,' . $id,
            'first_name'  => 'required|string|max:100',
            'last_name'   => 'required|string|max:100',
            'gender'      => 'required|string|max:10',
            'dob'         => 'nullable|date',
            'age'         => 'nullable|integer|min:0|max:150', //added
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email|max:255',
            'address'     => 'nullable|string|max:255',
            'national_id' => 'nullable|string|max:50|unique:patients,national_id,' . $id,
        ]);

        $patient->update($validated);

        return response()->json([
            'message' => 'Patient updated successfully',
            'data'    => $patient,
        ]);
    }

    /**
     * Remove a patient record.
     */
    public function destroy($id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        $patient->delete();

        return response()->json(['message' => 'Patient deleted successfully']);
    }
}
