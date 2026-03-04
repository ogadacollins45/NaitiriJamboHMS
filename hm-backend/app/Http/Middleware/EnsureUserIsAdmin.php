<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * This middleware ensures that only users with role 'admin'
     * can access certain routes.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user(); // Get authenticated user via Sanctum

        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'message' => 'Forbidden: Admin access only.'
            ], 403);
        }

        return $next($request);
    }
}
