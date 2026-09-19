<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Services\TokenService;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    /**
     * Submit user feedback.
     */
    public function store(Request $request, TokenService $tokenService)
    {
        $validated = $request->validate([
            'category'    => 'required|string|in:bug,feature,accuracy,ui,general',
            'rating'      => 'required|integer|min:1|max:5',
            'title'       => 'nullable|string|max:255',
            'message'     => 'required|string|min:5|max:5000',
            'device_info' => 'nullable|array',
        ]);

        $user = $request->user();

        $feedback = Feedback::create([
            'user_id'     => $user?->id,
            'category'    => $validated['category'],
            'rating'      => $validated['rating'],
            'title'       => $validated['title'] ?? null,
            'message'     => $validated['message'],
            'device_info' => $validated['device_info'] ?? null,
            'status'      => 'pending',
        ]);

        $coinsAwarded = 0;
        if ($user) {
            // Award 10 coins for submitting feedback (limited to once per 24h)
            $tx = $tokenService->award($user, 'feedback_submitted', 10, [
                'feedback_id' => $feedback->id,
                'date'        => now()->toDateString()
            ]);
            if ($tx) {
                $coinsAwarded = 10;
            }
        }

        return response()->json([
            'message'       => 'Thank you for your feedback! It helps make Metrivita better.',
            'feedback'      => $feedback,
            'coins_awarded' => $coinsAwarded,
        ], 201);
    }

    /**
     * Admin: List all submitted feedback entries with filters.
     */
    public function index(Request $request)
    {
        $query = Feedback::with(['user:id,name,email,role,plan_type'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('rating') && $request->rating !== 'all') {
            $query->where('rating', (int)$request->rating);
        }

        $feedbacks = $query->get();

        return response()->json($feedbacks);
    }

    /**
     * Admin: Update feedback status (pending -> reviewed -> resolved).
     */
    public function update(Request $request, Feedback $feedback)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,reviewed,resolved',
        ]);

        $feedback->update([
            'status' => $validated['status'],
        ]);

        return response()->json([
            'message'  => 'Feedback status updated to ' . ucfirst($validated['status']),
            'feedback' => $feedback->fresh(['user:id,name,email']),
        ]);
    }

    /**
     * Admin: Delete a feedback entry.
     */
    public function destroy(Feedback $feedback)
    {
        $feedback->delete();
        return response()->json(['message' => 'Feedback entry removed successfully.']);
    }
}
