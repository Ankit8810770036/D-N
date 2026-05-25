<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TokenTransaction extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'type', 'reason', 'amount', 'meta', 'created_at'];

    protected $casts = [
        'meta'       => 'array',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
