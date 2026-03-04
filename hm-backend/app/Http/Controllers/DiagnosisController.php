<?php

namespace App\Http\Controllers;

use App\Models\Diagnosis;
use App\Models\Treatment;
use Illuminate\Http\Request;

class DiagnosisController extends Controller
{
    /**
     * Store a new diagnosis for a treatment
     */
    public function store(Request $request, $treatment_id)
    {
        $validated = $request->validate([
            'diagnosis' => 'required|string',
            'diagnosis_category' => 'required|string|max:100',
            'diagnosis_subcategory' => 'required|string|max:100',
        ]);

        $treatment = Treatment::findOrFail($treatment_id);

        $diagnosis = Diagnosis::create([
            'treatment_id' => $treatment_id,
            'diagnosis' => $validated['diagnosis'],
            'diagnosis_category' => $validated['diagnosis_category'],
            'diagnosis_subcategory' => $validated['diagnosis_subcategory'],
            'is_primary' => false,
        ]);

        return response()->json([
            'message' => 'Diagnosis added successfully',
            'diagnosis' => $diagnosis,
        ], 201);
    }

    /**
     * Delete a diagnosis
     */
    public function destroy($id)
    {
        $diagnosis = Diagnosis::findOrFail($id);
        $diagnosis->delete();

        return response()->json([
            'message' => 'Diagnosis deleted successfully',
        ]);
    }
}
