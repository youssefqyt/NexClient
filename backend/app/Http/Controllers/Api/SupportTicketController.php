<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\TicketMessage;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class SupportTicketController extends Controller
{
    public function __construct(
        protected ActivityLogger $activity,
        protected NotificationService $notifications,
    ) {
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = SupportTicket::with(['client:id,name,email,avatar', 'assignedAgent:id,name,avatar'])
            ->withCount('messages');

        if ($user->role === 'client') {
            $query->where('client_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('subject', 'like', "%{$request->search}%")
                    ->orWhere('ticket_number', 'like', "%{$request->search}%");
            });
        }

        $tickets = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json($tickets);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|in:technical,billing,general,feature_request,bug',
            'priority' => 'nullable|in:low,medium,high,urgent',
        ]);

        $validated['client_id'] = $request->user()->id;
        $ticket = SupportTicket::create($validated);
        $ticket->load(['client:id,name,email,avatar', 'messages']);

        $this->activity->log('ticket.created', $ticket, ['subject' => $ticket->subject]);

        // Let the admin team know a new ticket arrived.
        $this->notifications->notifyMany(
            User::where('role', 'admin')->pluck('id')->all(),
            'ticket_created',
            'New support ticket',
            "{$ticket->ticket_number}: {$ticket->subject}",
            ['ticket_id' => $ticket->id]
        );

        return response()->json(['ticket' => $ticket, 'message' => 'Support ticket created successfully'], 201);
    }

    public function show(Request $request, string $id)
    {
        $ticket = SupportTicket::with([
            'client:id,name,email,avatar',
            'assignedAgent:id,name,avatar',
            'messages.user:id,name,avatar,role',
        ])->findOrFail($id);

        $this->authorizeTicket($request, $ticket);

        return response()->json($ticket);
    }

    public function update(Request $request, string $id)
    {
        $ticket = SupportTicket::findOrFail($id);
        $previousAssignee = $ticket->assigned_to;

        $validated = $request->validate([
            'status' => 'sometimes|in:open,in_progress,pending,resolved,closed',
            'priority' => 'sometimes|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $ticket->update($validated);
        $this->activity->log('ticket.updated', $ticket, $validated);

        if ($ticket->assigned_to && $ticket->assigned_to !== $previousAssignee) {
            $this->notifications->notify(
                $ticket->assigned_to,
                'ticket_assigned',
                'Ticket assigned to you',
                "{$ticket->ticket_number}: {$ticket->subject}",
                ['ticket_id' => $ticket->id]
            );
        }

        // Notify the client when their ticket is resolved or closed.
        if (in_array($validated['status'] ?? null, ['resolved', 'closed'])) {
            $this->notifications->notify(
                $ticket->client_id,
                'ticket_status',
                "Ticket {$validated['status']}",
                "Your ticket \"{$ticket->subject}\" was marked {$validated['status']}.",
                ['ticket_id' => $ticket->id]
            );
        }

        return response()->json(['ticket' => $ticket, 'message' => 'Ticket updated successfully']);
    }

    public function destroy(string $id)
    {
        $ticket = SupportTicket::findOrFail($id);
        $this->activity->log('ticket.deleted', $ticket);
        $ticket->delete();

        return response()->json(['message' => 'Ticket deleted successfully']);
    }

    public function addMessage(Request $request, $id)
    {
        $ticket = SupportTicket::findOrFail($id);
        $this->authorizeTicket($request, $ticket);

        $validated = $request->validate([
            'message' => 'required|string|max:5000',
            'is_internal' => 'nullable|boolean',
        ]);

        // Only staff can post internal notes.
        $isInternal = $request->boolean('is_internal') && $request->user()->role !== 'client';

        $message = TicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
            'is_internal' => $isInternal,
        ]);
        $message->load('user:id,name,avatar,role');

        // Re-open a resolved/closed ticket when the client replies.
        if ($request->user()->role === 'client' && in_array($ticket->status, ['resolved', 'closed'])) {
            $ticket->update(['status' => 'open']);
        }
        if ($request->user()->role !== 'client' && $ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        $this->activity->log('ticket.replied', $ticket);

        if (! $isInternal) {
            if ($request->user()->role === 'client') {
                $this->notifications->notifyMany(
                    array_filter([$ticket->assigned_to, ...User::where('role', 'admin')->pluck('id')->all()]),
                    'ticket_reply',
                    'New ticket reply',
                    "{$ticket->ticket_number} received a new reply.",
                    ['ticket_id' => $ticket->id]
                );
            } else {
                $this->notifications->notify(
                    $ticket->client_id,
                    'ticket_reply',
                    'New reply on your ticket',
                    "Support replied to \"{$ticket->subject}\".",
                    ['ticket_id' => $ticket->id]
                );
            }
        }

        return response()->json(['message' => $message], 201);
    }

    protected function authorizeTicket(Request $request, SupportTicket $ticket): void
    {
        $user = $request->user();
        if ($user->role === 'client') {
            abort_unless($ticket->client_id === $user->id, 403, 'Unauthorized');
        }
    }
}
