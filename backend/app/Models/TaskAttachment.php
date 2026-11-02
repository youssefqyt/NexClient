<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskAttachment extends Model
{
    use HasFactory;
    protected $fillable = ['task_id', 'uploaded_by', 'filename', 'original_name', 'mime_type', 'size', 'path'];
    protected function casts(): array { return ['size' => 'integer']; }
    public function task() { return $this->belongsTo(Task::class); }
    public function uploader() { return $this->belongsTo(User::class, 'uploaded_by'); }
}
