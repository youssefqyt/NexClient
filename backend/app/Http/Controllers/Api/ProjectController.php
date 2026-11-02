<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Milestone;
use App\Models\Project;
use App\Services\ActivityLogger;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function __construct(
        protected ActivityLogger $activity,
        protected NotificationService $notifications,
    ) {
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Project::with(['client:id,first_name,last_name', 'creator:id,name', 'members:id,name'])
            ->withCount('tasks');

        // Clients only ever see their own projects.
        if ($user->role === 'client') {
            $clientId = $user->client?->id;
            $query->where('client_id', $clientId ?? 0);
        }

        if ($request->filled('search')) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        $projects = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json($projects);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'client_id' => 'required|exists:clients,id',
            'budget' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:8',
            'start_date' => 'nullable|date',
            'deadline' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|in:pending,in_progress,on_hold,completed,cancelled',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'tags' => 'nullable|array',
            'notes' => 'nullable|string',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'exists:users,id',
        ]);

        $validated['created_by'] = $request->user()->id;
        $memberIds = $validated['member_ids'] ?? [];
        unset($validated['member_ids']);

        $project = Project::create($validated);

        if (! empty($memberIds)) {
            $project->members()->sync($memberIds);
            $this->notifications->notifyMany(
                $memberIds,
                'project_assigned',
                'Added to a project',
                "You were added to \"{$project->title}\".",
                ['project_id' => $project->id]
            );
        }

        $project->load(['client', 'creator', 'members']);
        $this->activity->log('project.created', $project, ['title' => $project->title]);

        return response()->json(['project' => $project, 'message' => 'Project created successfully'], 201);
    }

    public function show(Request $request, string $id)
    {
        $project = Project::with([
            'client.company',
            'creator:id,name,avatar',
            'members:id,name,email,avatar',
            'tasks.assignedUser:id,name,avatar',
            'milestones',
        ])->findOrFail($id);

        $this->authorizeClient($request, $project);

        return response()->json($project);
    }

    public function update(Request $request, string $id)
    {
        $project = Project::findOrFail($id);
        $this->authorizeClient($request, $project);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'client_id' => 'sometimes|exists:clients,id',
            'budget' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:8',
            'start_date' => 'nullable|date',
            'deadline' => 'nullable|date',
            'status' => 'nullable|in:pending,in_progress,on_hold,completed,cancelled',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'progress' => 'nullable|integer|min:0|max:100',
            'tags' => 'nullable|array',
            'notes' => 'nullable|string',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'exists:users,id',
        ]);

        if (array_key_exists('member_ids', $validated)) {
            $project->members()->sync($validated['member_ids'] ?? []);
            unset($validated['member_ids']);
        }

        $project->update($validated);
        $project->load(['client', 'creator', 'members']);
        $this->activity->log('project.updated', $project);

        return response()->json(['project' => $project, 'message' => 'Project updated successfully']);
    }

    public function destroy(string $id)
    {
        $project = Project::findOrFail($id);
        $this->activity->log('project.deleted', $project, ['title' => $project->title]);
        $project->delete();

        return response()->json(['message' => 'Project deleted successfully']);
    }

    /** Recent activity feed for a project. */
    public function activity(Request $request, string $id)
    {
        $project = Project::findOrFail($id);
        $this->authorizeClient($request, $project);

        $logs = \App\Models\ActivityLog::with('user:id,name,avatar')
            ->where('model_type', Project::class)
            ->where('model_id', $project->id)
            ->latest()
            ->take(30)
            ->get();

        return response()->json(['activity' => $logs]);
    }

    // ---------------------------------------------------------------- Milestones

    public function storeMilestone(Request $request, string $id)
    {
        $project = Project::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'required|date',
            'status' => 'nullable|in:pending,in_progress,completed',
        ]);

        $validated['project_id'] = $project->id;
        $milestone = Milestone::create($validated);

        $this->activity->log('milestone.created', $project, ['title' => $milestone->title]);

        return response()->json(['milestone' => $milestone, 'message' => 'Milestone created'], 201);
    }

    public function updateMilestone(Request $request, string $id, string $milestoneId)
    {
        $milestone = Milestone::where('project_id', $id)->findOrFail($milestoneId);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'sometimes|date',
            'status' => 'nullable|in:pending,in_progress,completed',
        ]);

        $milestone->update($validated);

        return response()->json(['milestone' => $milestone, 'message' => 'Milestone updated']);
    }

    public function destroyMilestone(string $id, string $milestoneId)
    {
        Milestone::where('project_id', $id)->findOrFail($milestoneId)->delete();

        return response()->json(['message' => 'Milestone deleted']);
    }

    protected function authorizeClient(Request $request, Project $project): void
    {
        $user = $request->user();
        if ($user->role === 'client') {
            abort_unless($user->client && $project->client_id === $user->client->id, 403, 'Unauthorized');
        }
    }
}
