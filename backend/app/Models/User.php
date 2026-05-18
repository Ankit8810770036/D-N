<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'plan_type',
        'profile_photo_path',
        'subscription_id',
        'subscribed_at',
        'subscription_expires_at',
    ];

    protected $appends = [
        'profile_photo_url',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'        => 'datetime',
            'password'                 => 'hashed',
            'subscribed_at'            => 'datetime',
            'subscription_expires_at'  => 'datetime',
        ];
    }

    // Relationships
    public function profile()
    {
        return $this->hasOne(UserProfile::class);
    }

    public function mealPlans()
    {
        return $this->hasMany(MealPlan::class);
    }

    public function progressLogs()
    {
        return $this->hasMany(ProgressLog::class);
    }

    public function dietNotifications()
    {
        return $this->hasMany(DietNotification::class);
    }

    // Helpers
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function recipes()
    {
        return $this->hasMany(Recipe::class);
    }

    public function isPremium(): bool
    {
        return $this->plan_type === 'premium' || $this->isAdmin();
    }

    public function getCurrentStreak(): int
    {
        $logs = $this->progressLogs()
            ->where('calories_consumed', '>', 0)
            ->orderBy('date', 'desc')
            ->pluck('date')
            ->map(function ($date) {
                return \Carbon\Carbon::parse($date)->toDateString();
            })->toArray();

        if (empty($logs)) return 0;

        $streak = 0;
        $currentDate = \Carbon\Carbon::today();
        
        $todayStr = $currentDate->toDateString();
        $yesterdayStr = $currentDate->copy()->subDay()->toDateString();

        if (in_array($todayStr, $logs)) {
            $streak = 1;
            $checkDate = $currentDate->copy()->subDay();
        } elseif (in_array($yesterdayStr, $logs)) {
            $streak = 1;
            $checkDate = $currentDate->copy()->subDays(2);
        } else {
            return 0;
        }

        while (in_array($checkDate->toDateString(), $logs)) {
            $streak++;
            $checkDate->subDay();
        }

        return $streak;
    }

    public function getProfilePhotoUrlAttribute()
    {
        return $this->profile_photo_path
            ? asset('storage/' . $this->profile_photo_path)
            : 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&color=7F9CF5&background=EBF4FF';
    }
}
