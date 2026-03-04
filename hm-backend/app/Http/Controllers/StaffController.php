<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Staff;
use App\Models\StaffDocument;
use Illuminate\Support\Facades\Storage;

class StaffController extends Controller
{
    public function index()
    {
        $staff = Staff::with('documents')->orderByDesc('created_at')->get();
        return response()->json($staff);
    }

    public function show($id)
    {
        $staff = Staff::with('documents')->find($id);
        if (!$staff) return response()->json(['message' => 'Staff not found'], 404);
        return response()->json($staff);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'nullable|email|max:255|unique:staff,email',
            'phone'      => 'nullable|string|max:255',
            'role'       => 'required|in:admin,doctor,reception,pharmacist,labtech,facility_clerk',
            'password'   => 'required|string|min:6',
        ]);

        $validated['password'] = bcrypt($validated['password']);
        $staff = Staff::create($validated);

        if ($request->hasFile('documents')) {
            foreach ($request->file('documents') as $index => $doc) {
                $label = $request->input("labels.$index", "Document");
                $path = $doc->store('staff_docs', 'public');
                $staff->documents()->create([
                    'label' => $label,
                    'file_path' => $path,
                ]);
            }
        }

        return response()->json(['message' => 'Staff created successfully', 'data' => $staff], 201);
    }

    public function update(Request $request, $id)
    {
        $staff = Staff::findOrFail($id);

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'nullable|email|max:255|unique:staff,email,' . $id,
            'phone'      => 'nullable|string|max:255',
            'role'       => 'required|in:admin,doctor,reception,pharmacist,labtech,facility_clerk',
            'password'   => 'nullable|string|min:6',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        } else {
            unset($validated['password']);
        }

        $staff->update($validated);

        // Optional new documents
        if ($request->hasFile('documents')) {
            foreach ($request->file('documents') as $index => $doc) {
                $label = $request->input("labels.$index", "Document");
                $path = $doc->store('staff_docs', 'public');
                $staff->documents()->create([
                    'label' => $label,
                    'file_path' => $path,
                ]);
            }
        }

        return response()->json(['message' => 'Staff updated successfully', 'data' => $staff]);
    }

    public function destroy($id)
    {
        $staff = Staff::find($id);
        if (!$staff) return response()->json(['message' => 'Staff not found'], 404);

        foreach ($staff->documents as $doc) {
            Storage::disk('public')->delete($doc->file_path);
        }
        $staff->delete();

        return response()->json(['message' => 'Staff deleted successfully']);
    }
}
