<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupportTicket extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ticket_number', 'client_id', 'assigned_to',
        'subject', 'description', 'category', 'priority', 'status'
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($ticket) {
            if (empty($ticket->ticket_number)) {
                $sequence = (static::withTrashed()->max('id') ?? 0) + 1;
                do {
                    $candidate = 'TKT-' . date('Ymd') . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);
                    $sequence++;
                } while (static::withTrashed()->where('ticket_number', $candidate)->exists());

                $ticket->ticket_number = $candidate;
            }
        });
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function assignedAgent()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function messages()
    {
        return $this->hasMany(TicketMessage::class, 'ticket_id');
    }
}
