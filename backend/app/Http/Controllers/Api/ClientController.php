<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Company;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ClientController extends Controller
{
    public function __construct(protected ActivityLogger $activity)
    {
    }

    public function index(Request $request)
    {
        $query = Client::with(['user:id,name,email,avatar', 'company:id,name'])
            ->withCount(['projects', 'invoices']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('company_id')) {
            $query->where('company_id', $request->company_id);
        }

        $clients = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json($clients);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:clients,email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'company_id' => 'nullable|exists:companies,id',
            'position' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:32',
            'notes' => 'nullable|string',
            'status' => 'nullable|in:active,inactive,pending',
            'password' => 'required|string|min:8',
        ]);

        // Every client gets a linked portal login.
        $user = User::create([
            'name' => $validated['first_name'].' '.$validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'client',
            'is_active' => ($validated['status'] ?? 'active') === 'active',
        ]);

        $validated['user_id'] = $user->id;
        unset($validated['password']);

        $client = Client::create($validated);
        $client->load(['user', 'company']);

        $this->activity->log('client.created', $client, ['name' => $client->full_name]);

        return response()->json(['client' => $client, 'message' => 'Client created successfully'], 201);
    }

    public function show(string $id)
    {
        $client = Client::with([
            'user:id,name,email,avatar,phone,is_active,last_login_at',
            'company',
            'projects',
            'invoices.items',
        ])->findOrFail($id);

        return response()->json($client);
    }

    public function update(Request $request, string $id)
    {
        $client = Client::findOrFail($id);

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('clients', 'email')->ignore($client->id)],
            'phone' => 'nullable|string|max:20',
            'company_id' => 'nullable|exists:companies,id',
            'position' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:32',
            'notes' => 'nullable|string',
            'status' => 'nullable|in:active,inactive,pending',
        ]);

        $client->update($validated);

        // Keep the linked user's name / status in sync.
        $client->user?->update(array_filter([
            'name' => trim(($validated['first_name'] ?? $client->first_name).' '.($validated['last_name'] ?? $client->last_name)),
            'email' => $validated['email'] ?? null,
            'is_active' => isset($validated['status']) ? $validated['status'] === 'active' : null,
        ], fn ($v) => ! is_null($v)));

        $client->load(['user', 'company']);
        $this->activity->log('client.updated', $client);

        return response()->json(['client' => $client, 'message' => 'Client updated successfully']);
    }

    public function destroy(string $id)
    {
        $client = Client::findOrFail($id);
        $this->activity->log('client.deleted', $client, ['name' => $client->full_name]);

        // Soft-delete the linked login as well so it can't sign in.
        $client->user?->delete();
        $client->delete();

        return response()->json(['message' => 'Client deleted successfully']);
    }

    /** Companies for the client form dropdown. */
    public function companies(Request $request)
    {
        $query = Company::query();
        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        return response()->json(['companies' => $query->orderBy('name')->get()]);
    }

    public function storeCompany(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'website' => 'nullable|url|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:64',
        ]);

        $company = Company::create($validated);

        return response()->json(['company' => $company, 'message' => 'Company created'], 201);
    }
}
