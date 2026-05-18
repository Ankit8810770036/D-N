<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DietNotification extends Model
{
    protected $fillable = [
        'user_id', 'type', 'title', 'message', 'is_read', 'scheduled_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'scheduled_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
