<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    /**
     * Get all doctors
     * GET /api/doctors
     */
    public function index()
    {
        return response()->json(Doctor::orderBy('first_name')->get());
    }

    /**
     * Create a new doctor
     * POST /api/doctors
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'specialization' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100|unique:doctors,email',
        ]);

        $doctor = Doctor::create($validated);
        return response()->json($doctor, 201);
    }

    /**
     * Get details of a specific doctor
     * GET /api/doctors/{id}
     */
    public function show($id)
    {
        $doctor = Doctor::find($id);

        if (!$doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        return response()->json($doctor);
    }

    /**
     * Update a doctor's info
     * PUT /api/doctors/{id}
     */
    public function update(Request $request, $id)
    {
        $doctor = Doctor::find($id);

        if (!$doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'specialization' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100|unique:doctors,email,' . $doctor->id,
        ]);

        $doctor->update($validated);

        return response()->json($doctor);
    }

    /**
     * Delete a doctor (optional)
     * DELETE /api/doctors/{id}
     */
    public function destroy($id)
    {
        $doctor = Doctor::find($id);

        if (!$doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        $doctor->delete();

        return response()->json(['message' => 'Doctor deleted successfully']);
    }
}
