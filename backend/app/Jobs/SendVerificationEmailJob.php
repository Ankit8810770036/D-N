<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendVerificationEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 30;

    public function __construct(
        public User $user
    ) {
        $this->onQueue('high');
    }

    /**
     * Execute the job asynchronously.
     */
    public function handle(): void
    {
        try {
            $this->user->sendEmailVerificationNotification();
            Log::info("SendVerificationEmailJob: Verification email dispatched to User {$this->user->id} ({$this->user->email})");
        } catch (\Throwable $e) {
            Log::warning("SendVerificationEmailJob failed for User {$this->user->id}: " . $e->getMessage());
        }
    }
}
