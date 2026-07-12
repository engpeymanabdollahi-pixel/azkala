<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SettingHistory extends Model
{
    use HasFactory;
    protected $fillable = [
        'setting_key',
        'group',
        'old_value',
        'new_value',
        'changed_by',
        'note',
        'label',
    ];

    public function changer()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}