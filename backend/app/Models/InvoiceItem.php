<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    use HasFactory;
    protected $fillable = ['invoice_id', 'description', 'quantity', 'unit_price', 'amount'];
    protected function casts(): array { return ['quantity' => 'integer', 'unit_price' => 'decimal:2', 'amount' => 'decimal:2']; }
    protected static function boot() { parent::boot(); static::saving(function ($item) { $item->amount = $item->quantity * $item->unit_price; }); }
    public function invoice() { return $this->belongsTo(Invoice::class); }
}
