<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use App\Models\Food;
use App\Models\Recipe;
use App\Models\HealthProfile;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function getStats()
    {
        $stats = \Illuminate\Support\Facades\Cache::remember('admin_platform_stats', 300, function () {
            return [
                'users_count' => User::count(),
                'foods_count' => Food::count(),
                'recipes_count' => Recipe::count(),
                'premium_users' => User::where('plan_type', 'premium')->count(),
                'total_calories_logged' => (float) DB::table('progress_logs')->sum('calories_consumed'),
            ];
        });

        return response()->json($stats);
    }

    public function getUsers()
    {
        return response()->json(User::with('profile')->latest()->get());
    }

    public function updateUser(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => 'sometimes|string|in:user,admin',
            'plan_type' => 'sometimes|string|in:basic,premium',
        ]);

        // Prevent self-demotion from admin
        if ($user->id === $request->user()->id && isset($validated['role']) && $validated['role'] !== 'admin') {
            return response()->json(['message' => 'You cannot remove your own admin privileges.'], 403);
        }

        if (isset($validated['plan_type'])) {
            if ($validated['plan_type'] === 'premium') {
                $validated['subscription_id'] = $user->subscription_id ?? ('admin_granted_' . $user->id . '_' . time());
                $validated['subscribed_at'] = now();
                $validated['subscription_expires_at'] = now()->addYear(); // 1 year active premium
            } else {
                $validated['subscription_expires_at'] = null;
            }
        }

        $user->update($validated);
        \Illuminate\Support\Facades\Cache::flush();
        return response()->json($user->fresh());
    }

    public function refreshCache()
    {
        \Illuminate\Support\Facades\Cache::flush();
        \Illuminate\Support\Facades\Artisan::call('cache:clear');
        return response()->json(['message' => 'System cache cleared and synchronized.']);
    }

    public function exportUsers()
    {
        $users = User::with('profile')->get();
        $csvHeader = ['ID', 'Name', 'Email', 'Role', 'Plan', 'Age', 'Weight', 'Height', 'Goal', 'Joined At'];
        
        $callback = function() use ($users, $csvHeader) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $csvHeader);

            foreach ($users as $user) {
                fputcsv($file, [
                    $user->id,
                    $user->name,
                    $user->email,
                    $user->role,
                    $user->plan_type,
                    $user->profile->age ?? 'N/A',
                    $user->profile->weight_kg ?? 'N/A',
                    $user->profile->height_cm ?? 'N/A',
                    $user->profile->goal ?? 'N/A',
                    $user->created_at->format('Y-m-d'),
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=users_export_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ]);
    }

    public function destroy(User $user)
    {
        // Prevent self-deletion
        if ($user->id === request()->user()->id) {
            return response()->json(['message' => 'Cannot delete yourself.'], 403);
        }

        // Protect all admin accounts — they cannot be removed through the panel
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Admin accounts cannot be deleted through the panel. Change the role first.'], 403);
        }

        $user->delete();
        \Illuminate\Support\Facades\Cache::flush();
        return response()->json(['message' => 'User deleted successfully.']);
    }
}
