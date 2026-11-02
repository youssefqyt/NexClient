<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\Request;

class BlogPostController extends Controller
{
    public function index(Request $request)
    {
        $query = BlogPost::with('author');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } elseif (! $request->boolean('all')) {
            $query->where('status', 'published');
        }

        $posts = $query->latest('published_at')->paginate($request->get('per_page', 15));
        return response()->json($posts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'excerpt' => 'nullable|string',
            'content' => 'required|string',
            'featured_image' => 'nullable|image|max:2048',
            'tags' => 'nullable|array',
            'status' => 'nullable|in:draft,published,archived',
            'published_at' => 'nullable|date',
        ]);

        $validated['author_id'] = $request->user()->id;

        if ($request->hasFile('featured_image')) {
            $validated['featured_image'] = $request->file('featured_image')->store('blog', 'public');
        }

        $post = BlogPost::create($validated);
        return response()->json(['post' => $post, 'message' => 'Blog post created successfully'], 201);
    }

    public function show(string $id)
    {
        $post = BlogPost::with('author')->findOrFail($id);
        return response()->json($post);
    }

    public function update(Request $request, string $id)
    {
        $post = BlogPost::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'excerpt' => 'nullable|string',
            'content' => 'sometimes|string',
            'status' => 'nullable|in:draft,published,archived',
        ]);

        $post->update($validated);
        return response()->json(['post' => $post, 'message' => 'Blog post updated successfully']);
    }

    public function destroy(string $id)
    {
        $post = BlogPost::findOrFail($id);
        $post->delete();
        return response()->json(['message' => 'Blog post deleted successfully']);
    }
}
