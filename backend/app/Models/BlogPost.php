<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class BlogPost extends Model
{
    use HasFactory, SoftDeletes;
    protected $fillable = ['author_id', 'title', 'slug', 'excerpt', 'content', 'featured_image', 'tags', 'status', 'published_at'];
    protected function casts(): array { return ['tags' => 'array', 'published_at' => 'datetime']; }
    protected static function boot()
    {
        parent::boot();
        static::creating(function ($post) {
            if (empty($post->slug)) {
                $base = Str::slug($post->title) ?: 'post';
                $slug = $base;
                $suffix = 1;
                while (static::withTrashed()->where('slug', $slug)->exists()) {
                    $slug = $base . '-' . (++$suffix);
                }
                $post->slug = $slug;
            }
        });
    }
    public function author() { return $this->belongsTo(User::class, 'author_id'); }
}
