<?php

namespace App\Http\Controllers;

use App\Models\LabTestTemplate;
use App\Models\LabTestParameter;
use App\Models\LabTestCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LabTestManagementController extends Controller
{
    /**
     * Get all lab test templates with their categories and parameters
     */
    public function index(Request $request)
    {
        $query = LabTestTemplate::with(['category', 'parameters']);

        // Search by name
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        $tests = $query->orderBy('name')->get();

        return response()->json($tests);
    }

    /**
     * Get all test categories
     */
    public function getCategories()
    {
        $categories = LabTestCategory::orderBy('name')->get();
        return response()->json($categories);
    }

    /**
     * Get a specific lab test with parameters
     */
    public function show($id)
    {
        $test = LabTestTemplate::with(['category', 'parameters' => function ($q) {
            $q->orderBy('sort_order');
        }])->findOrFail($id);

        return response()->json($test);
    }

    /**
     * Create a new lab test template
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:lab_test_categories,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:lab_test_templates,code',
            'description' => 'nullable|string',
            'sample_type' => 'required|string|max:255',
            'sample_volume' => 'nullable|string|max:100',
            'container_type' => 'nullable|string|max:100',
            'preparation_instructions' => 'nullable|string',
            'turn_around_time' => 'nullable|integer',
            'price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'parameters' => 'nullable|array',
            'parameters.*.name' => 'required|string|max:255',
            'parameters.*.unit' => 'nullable|string|max:50',
            'parameters.*.reference_range' => 'nullable|string|max:255',
            'parameters.*.normal_range_min' => 'nullable|numeric',
            'parameters.*.normal_range_max' => 'nullable|numeric',
            'parameters.*.sort_order' => 'nullable|integer',
        ]);

        DB::beginTransaction();
        try {
            // Create the test template
            $test = LabTestTemplate::create([
                'category_id' => $validated['category_id'],
                'name' => $validated['name'],
                'code' => $validated['code'],
                'description' => $validated['description'] ?? null,
                'sample_type' => $validated['sample_type'],
                'sample_volume' => $validated['sample_volume'] ?? null,
                'container_type' => $validated['container_type'] ?? null,
                'preparation_instructions' => $validated['preparation_instructions'] ?? null,
                'turn_around_time' => $validated['turn_around_time'] ?? null,
                'price' => $validated['price'],
                'is_active' => $validated['is_active'] ?? true,
            ]);

            // Create parameters if provided
            if (!empty($validated['parameters'])) {
                foreach ($validated['parameters'] as $index => $parameterData) {
                    LabTestParameter::create([
                        'test_template_id' => $test->id,
                        'name' => $parameterData['name'],
                        'unit' => $parameterData['unit'] ?? null,
                        'reference_range' => null, // Computed from min/max
                        'normal_range_min' => $parameterData['normal_range_min'] ?? null,
                        'normal_range_max' => $parameterData['normal_range_max'] ?? null,
                        'sort_order' => $parameterData['sort_order'] ?? ($index + 1) * 10,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Lab test created successfully',
                'data' => $test->load(['category', 'parameters'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create lab test',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a lab test template
     */
    public function update(Request $request, $id)
    {
        $test = LabTestTemplate::findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'sometimes|exists:lab_test_categories,id',
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|max:50|unique:lab_test_templates,code,' . $id,
            'description' => 'nullable|string',
            'sample_type' => 'sometimes|string|max:255',
            'sample_volume' => 'nullable|string|max:100',
            'container_type' => 'nullable|string|max:100',
            'preparation_instructions' => 'nullable|string',
            'turn_around_time' => 'nullable|integer',
            'price' => 'sometimes|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $test->update($validated);

        return response()->json([
            'message' => 'Lab test updated successfully',
            'data' => $test->load(['category', 'parameters'])
        ]);
    }

    /**
     * Delete a lab test template (soft delete)
     */
    public function destroy($id)
    {
        $test = LabTestTemplate::findOrFail($id);

        // Soft delete the test - it will be hidden from listings but preserved for historical records
        $test->delete();

        return response()->json([
            'message' => 'Lab test deleted successfully'
        ]);
    }

    /**
     * Add a parameter to a lab test
     */
    public function addParameter(Request $request, $testId)
    {
        $test = LabTestTemplate::findOrFail($testId);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50',
            'result_type' => 'sometimes|in:range,binary',
            'unit' => 'nullable|string|max:50',
            'normal_range_min' => 'nullable|numeric',
            'normal_range_max' => 'nullable|numeric',
            'sort_order' => 'nullable|integer',
        ]);

        $parameter = LabTestParameter::create([
            'test_template_id' => $testId,
            'name' => $validated['name'],
            'code' => $validated['code'],
            'result_type' => $validated['result_type'] ?? 'range',
            'unit' => $validated['unit'] ?? null,
            'normal_range_min' => $validated['normal_range_min'] ?? null,
            'normal_range_max' => $validated['normal_range_max'] ?? null,
            'sort_order' => $validated['sort_order'] ?? ($test->parameters()->max('sort_order') + 10),
        ]);

        return response()->json([
            'message' => 'Parameter added successfully',
            'data' => $parameter
        ], 201);
    }

    /**
     * Update a parameter
     */
    public function updateParameter(Request $request, $parameterId)
    {
        $parameter = LabTestParameter::findOrFail($parameterId);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'unit' => 'nullable|string|max:50',
            'normal_range_min' => 'nullable|numeric',
            'normal_range_max' => 'nullable|numeric',
            'sort_order' => 'nullable|integer',
        ]);

        $parameter->update($validated);

        return response()->json([
            'message' => 'Parameter updated successfully',
            'data' => $parameter
        ]);
    }

    /**
     * Delete a parameter
     */
    public function deleteParameter($parameterId)
    {
        $parameter = LabTestParameter::findOrFail($parameterId);
        $parameter->delete();

        return response()->json([
            'message' => 'Parameter deleted successfully'
        ]);
    }
}

