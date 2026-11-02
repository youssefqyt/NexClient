<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->with('client');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        $users = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json($users);
    }

    /**
     * Users that can be assigned to projects / tickets (admins + managers).
     * Available to any authenticated user.
     */
    public function assignable()
    {
        $users = User::whereIn('role', ['admin', 'manager'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'avatar']);

        return response()->json(['users' => $users]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['admin', 'client', 'manager'])],
            'phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        return response()->json(['user' => $user, 'message' => 'User created successfully'], 201);
    }

    public function show(string $id)
    {
        return response()->json(User::with(['client', 'subscription'])->findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['sometimes', Rule::in(['admin', 'client', 'manager'])],
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'password' => 'sometimes|string|min:8',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json(['user' => $user, 'message' => 'User updated successfully']);
    }

    public function toggleStatus(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        abort_if($user->id === $request->user()->id, 422, 'You cannot deactivate your own account.');

        $user->update(['is_active' => ! $user->is_active]);

        return response()->json([
            'user' => $user,
            'message' => $user->is_active ? 'User activated' : 'User deactivated',
        ]);
    }

    public function changeRole(Request $request, string $id)
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(['admin', 'client', 'manager'])],
        ]);

        $user = User::findOrFail($id);
        $user->update(['role' => $validated['role']]);

        return response()->json(['user' => $user, 'message' => 'Role updated successfully']);
    }

    public function destroy(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        abort_if($user->id === $request->user()->id, 422, 'You cannot delete your own account.');

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    /** Client profile belonging to the authenticated user. */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load('client.company'),
        ]);
    }

    public function updateMe(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string',
            'timezone' => 'sometimes|string',
            'language' => 'sometimes|in:en,fr,ar',
        ]);

        $user->update($validated);

        if ($user->client) {
            $clientFields = $request->validate([
                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'phone' => 'nullable|string|max:20',
                'position' => 'nullable|string|max:255',
                'address' => 'nullable|string',
                'city' => 'nullable|string',
                'state' => 'nullable|string',
                'country' => 'nullable|string',
                'postal_code' => 'nullable|string',
            ]);
            $user->client->update($clientFields);
        }

        return response()->json([
            'user' => $user->fresh()->load('client.company'),
            'message' => 'Profile updated successfully',
        ]);
    }
}
