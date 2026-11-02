<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;
    protected $fillable = ['user_id', 'plan_name', 'price', 'billing_cycle', 'status', 'start_date', 'end_date', 'next_billing_date'];
    protected function casts(): array { return ['price' => 'decimal:2', 'start_date' => 'date', 'end_date' => 'date', 'next_billing_date' => 'date']; }
    public function user() { return $this->belongsTo(User::class); }
    public function isActive() { return $this->status === 'active' && (!$this->end_date || $this->end_date->isFuture()); }
}
