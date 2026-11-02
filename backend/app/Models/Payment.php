<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;
    protected $fillable = ['invoice_id', 'transaction_id', 'amount', 'payment_method', 'payment_date', 'notes'];
    protected function casts(): array { return ['amount' => 'decimal:2', 'payment_date' => 'date']; }
    public function invoice() { return $this->belongsTo(Invoice::class); }
}
