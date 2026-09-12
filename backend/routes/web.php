<?php

use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['message' => 'Diet & Nutrition Planner API is running']);
});

/*
|--------------------------------------------------------------------------
| Email Verification — Signed URL Route
|--------------------------------------------------------------------------
| This is the URL embedded in the verification email.
| When the user clicks it, Laravel validates the signature, marks the
| email as verified, then redirects them back to the frontend.
|
| FRONTEND_URL must be set in .env (e.g. https://clientdomain.com)
*/
Route::get('/email/verify/{id}/{hash}', function (Request $request) {
    $user = \App\Models\User::findOrFail($request->route('id'));

    // Validate the signed URL
    if (! \Illuminate\Support\Facades\URL::hasValidSignature($request)) {
        return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/login?verified=invalid');
    }

    if ($user->hasVerifiedEmail()) {
        return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/dashboard?verified=already');
    }

    $user->markEmailAsVerified();

    return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/dashboard?verified=success');

})->middleware(['signed'])->name('verification.verify');
