<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\Staff;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * Get all settings
     */
    public function index()
    {
        $settings = Setting::all();
        return response()->json($settings);
    }

    /**
     * Get a specific setting by key
     */
    public function show($key)
    {
        $setting = Setting::where('key', $key)->first();

        if (!$setting) {
            return response()->json(['message' => 'Setting not found'], 404);
        }

        // Return with cast value
        return response()->json([
            'key' => $setting->key,
            'value' => Setting::getSetting($key),
            'raw_value' => $setting->value,
            'type' => $setting->type,
            'description' => $setting->description,
        ]);
    }

    /**
     * Update a setting value
     */
    public function update(Request $request, $key)
    {
        $validated = $request->validate([
            'value' => 'required',
            'type' => 'nullable|in:string,number,boolean,json',
            'description' => 'nullable|string',
        ]);

        $setting = Setting::where('key', $key)->first();

        if (!$setting) {
            return response()->json(['message' => 'Setting not found'], 404);
        }

        $type = $validated['type'] ?? $setting->type;
        $description = $validated['description'] ?? $setting->description;

        Setting::setSetting($key, $validated['value'], $type, $description);

        return response()->json([
            'message' => 'Setting updated successfully',
            'setting' => Setting::where('key', $key)->first(),
        ]);
    }

    /**
     * Create a new setting
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|unique:settings,key',
            'value' => 'required',
            'type' => 'required|in:string,number,boolean,json',
            'description' => 'nullable|string',
        ]);

        Setting::setSetting(
            $validated['key'],
            $validated['value'],
            $validated['type'],
            $validated['description'] ?? null
        );

        return response()->json([
            'message' => 'Setting created successfully',
            'setting' => Setting::where('key', $validated['key'])->first(),
        ], 201);
    }

    /**
     * Update authenticated user's profile (using exact StaffController logic)
     */
    public function updateProfile(Request $request)
    {
        // Get the authenticated user's ID
        $userId = $request->user()->id;
        
        // Find the staff record exactly like StaffController does
        $staff = Staff::findOrFail($userId);

        // Use EXACT same validation as StaffController.update()
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name'  => 'nullable|string|max:255',
            'email'      => 'nullable|email|max:255|unique:staff,email,' . $userId,
            'phone'      => 'nullable|string|max:255',
            'password'   => 'nullable|string|min:6',
            'password_confirmation' => 'nullable|string|min:6',
        ]);

        // Handle password EXACTLY like StaffController does
        if (!empty($validated['password'])) {
            // Check if confirmation matches
            if ($validated['password'] !== $validated['password_confirmation']) {
                return response()->json(['message' => 'Passwords do not match'], 422);
            }
            $validated['password'] = bcrypt($validated['password']);
        } else {
            unset($validated['password']);
        }
        
        // Remove confirmation from validated data
        unset($validated['password_confirmation']);

        // Update EXACTLY like StaffController does
        $staff->update($validated);

        return response()->json([
            'message' => 'Staff updated successfully',
            'data' => $staff,
            'user' => $staff  // Also return as 'user' for frontend compatibility
        ]);
    }
}
