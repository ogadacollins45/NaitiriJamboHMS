<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Triage;
use App\Models\Patient;
use App\Models\Staff;

class TriageController extends Controller
{
    /**
     * Store a new triage record
     */
    public function store(Request $request)
    {
        // Get patient to check age
        $patient = Patient::find($request->patient_id);
        
        // Base validation rules
        $rules = [
            'patient_id' => 'required|exists:patients,id',
            'blood_pressure_systolic' => 'nullable|integer',
            'blood_pressure_diastolic' => 'nullable|integer',
            'temperature' => 'nullable|numeric',
            'pulse_rate' => 'nullable|integer',
            'respiratory_rate' => 'nullable|integer',
            'weight' => 'nullable|numeric',
            'height' => 'nullable|numeric',
            'oxygen_saturation' => 'nullable|integer',
            'chief_complaint' => 'nullable|string',
            'notes' => 'nullable|string',
        ];
        
        // If patient is above 13, make vital signs required
        if ($patient && $this->isPatientAbove13($patient)) {
            $rules['blood_pressure_systolic'] = 'required|integer|min:0';
            $rules['blood_pressure_diastolic'] = 'required|integer|min:0';
            $rules['temperature'] = 'required|numeric|min:0';
            $rules['pulse_rate'] = 'required|integer|min:0';
            $rules['respiratory_rate'] = 'required|integer|min:0';
            $rules['weight'] = 'required|numeric|min:0';
        }
        // If patient is 12 or below, make specific vitals required
        elseif ($patient && $this->isPatient12OrBelow($patient)) {
            $rules['temperature'] = 'required|numeric|min:0';
            $rules['pulse_rate'] = 'required|integer|min:0';
            $rules['weight'] = 'required|numeric|min:0';
        }
        
        $validated = $request->validate($rules);

        // Only set recorded_by if we have an authenticated user that exists in the database
        $userId = auth()->id();
        if ($userId && Staff::where('id', $userId)->exists()) {
            $validated['recorded_by'] = $userId;
        } else {
            $validated['recorded_by'] = null;
        }

        $triage = Triage::create($validated);

        return response()->json([
            'message' => 'Triage record created successfully',
            'data' => $triage->load('recorder')
        ], 201);
    }

    /**
     * Get latest triage record for a patient
     */
    public function getLatest($patientId)
    {
        $triage = Triage::where('patient_id', $patientId)
            ->with('recorder')
            ->orderByDesc('created_at')
            ->first();

        if (!$triage) {
            return response()->json([
                'message' => 'No triage record found',
                'data' => null
            ]);
        }

        return response()->json($triage);
    }

    /**
     * Get all triage records for a patient
     */
    public function getAllForPatient($patientId)
    {
        $triages = Triage::where('patient_id', $patientId)
            ->with('recorder')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($triages);
    }

    /**
     * Get a specific triage record
     */
    public function show($id)
    {
        $triage = Triage::with('recorder', 'patient')->find($id);

        if (!$triage) {
            return response()->json(['message' => 'Triage record not found'], 404);
        }

        return response()->json($triage);
    }

    /**
     * Update a triage record
     */
    public function update(Request $request, $id)
    {
        $triage = Triage::find($id);

        if (!$triage) {
            return response()->json(['message' => 'Triage record not found'], 404);
        }
        
        // Get patient to check age
        $patient = Patient::find($triage->patient_id);
        
        // Base validation rules
        $rules = [
            'blood_pressure_systolic' => 'nullable|integer',
            'blood_pressure_diastolic' => 'nullable|integer',
            'temperature' => 'nullable|numeric',
            'pulse_rate' => 'nullable|integer',
            'respiratory_rate' => 'nullable|integer',
            'weight' => 'nullable|numeric',
            'height' => 'nullable|numeric',
            'oxygen_saturation' => 'nullable|integer',
            'chief_complaint' => 'nullable|string',
            'notes' => 'nullable|string',
        ];
        
        // If patient is above 13, make vital signs required
        if ($patient && $this->isPatientAbove13($patient)) {
            $rules['blood_pressure_systolic'] = 'required|integer|min:0';
            $rules['blood_pressure_diastolic'] = 'required|integer|min:0';
            $rules['temperature'] = 'required|numeric|min:0';
            $rules['pulse_rate'] = 'required|integer|min:0';
            $rules['respiratory_rate'] = 'required|integer|min:0';
            $rules['weight'] = 'required|numeric|min:0';
        }
        // If patient is 12 or below, make specific vitals required
        elseif ($patient && $this->isPatient12OrBelow($patient)) {
            $rules['temperature'] = 'required|numeric|min:0';
            $rules['pulse_rate'] = 'required|integer|min:0';
            $rules['weight'] = 'required|numeric|min:0';
        }

        $validated = $request->validate($rules);

        $triage->update($validated);

        return response()->json([
            'message' => 'Triage record updated successfully',
            'data' => $triage->load('recorder')
        ]);
    }
    
    /**
     * Check if patient is 13 years old or above
     */
    private function isPatientAbove13($patient)
    {
        // Check if age field exists and is set
        if ($patient->age !== null) {
            return $patient->age >= 13;
        }
        
        // Calculate age from date of birth if available
        if ($patient->dob) {
            $birthDate = new \DateTime($patient->dob);
            $today = new \DateTime();
            $age = $today->diff($birthDate)->y;
            return $age >= 13;
        }
        
        // If no age data available, don't require fields
        return false;
    }
    
    /**
     * Check if patient is 12 years old or below
     */
    private function isPatient12OrBelow($patient)
    {
        // Check if age field exists and is set
        if ($patient->age !== null) {
            return $patient->age <= 12;
        }
        
        // Calculate age from date of birth if available
        if ($patient->dob) {
            $birthDate = new \DateTime($patient->dob);
            $today = new \DateTime();
            $age = $today->diff($birthDate)->y;
            return $age <= 12;
        }
        
        // If no age data available, don't require fields
        return false;
    }
}
