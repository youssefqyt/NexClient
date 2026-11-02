<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\TaskComment;
use App\Services\ActivityLogger;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function __construct(
        protected ActivityLogger $activity,
        protected NotificationService $notifications,
    ) {
    }

    public function index(Request $request)
    {
        $query = Task::with(['project', 'assignedUser:id,name,email,avatar', 'creator:id,name']);

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('search')) {
            $query->where('title', 'like', "%{$request->search}%");
        }

        $tasks = $query->orderBy('order')->latest()->paginate($request->get('per_page', 50));

        return response()->json($tasks);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'status' => 'nullable|in:todo,in_progress,review,done',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
            'labels' => 'nullable|array',
            'checklist' => 'nullable|array',
        ]);

        $validated['created_by'] = $request->user()->id;
        $task = Task::create($validated);
        $task->load(['project', 'assignedUser', 'creator']);

        $this->activity->log('task.created', $task, ['title' => $task->title]);

        if ($task->assigned_to && $task->assigned_to !== $request->user()->id) {
            $this->notifications->notify(
                $task->assigned_to,
                'task_assigned',
                'New task assigned',
                "You were assigned \"{$task->title}\".",
                ['task_id' => $task->id, 'project_id' => $task->project_id]
            );
        }

        return response()->json(['task' => $task, 'message' => 'Task created successfully'], 201);
    }

    public function show(string $id)
    {
        $task = Task::with([
            'project.client:id,first_name,last_name',
            'assignedUser:id,name,email,avatar',
            'creator:id,name,avatar',
            'comments.user:id,name,avatar',
            'attachments.uploader:id,name',
        ])->findOrFail($id);

        return response()->json($task);
    }

    public function update(Request $request, string $id)
    {
        $task = Task::findOrFail($id);
        $previousAssignee = $task->assigned_to;

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'status' => 'nullable|in:todo,in_progress,review,done',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
            'progress' => 'nullable|integer|min:0|max:100',
            'order' => 'nullable|integer',
            'labels' => 'nullable|array',
            'checklist' => 'nullable|array',
        ]);

        $task->update($validated);
        $task->load(['project', 'assignedUser', 'creator']);

        $this->activity->log('task.updated', $task, ['changes' => array_keys($validated)]);

        if ($task->assigned_to && $task->assigned_to !== $previousAssignee) {
            $this->notifications->notify(
                $task->assigned_to,
                'task_assigned',
                'New task assigned',
                "You were assigned \"{$task->title}\".",
                ['task_id' => $task->id, 'project_id' => $task->project_id]
            );
        }

        return response()->json(['task' => $task, 'message' => 'Task updated successfully']);
    }

    public function destroy(string $id)
    {
        $task = Task::findOrFail($id);
        $this->activity->log('task.deleted', $task, ['title' => $task->title]);
        $task->delete();

        return response()->json(['message' => 'Task deleted successfully']);
    }

    /**
     * Persist drag-and-drop ordering / column moves from the Kanban board.
     * Body: { tasks: [{ id, order, status }] }
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'tasks' => 'required|array',
            'tasks.*.id' => 'required|exists:tasks,id',
            'tasks.*.order' => 'required|integer',
            'tasks.*.status' => 'nullable|in:todo,in_progress,review,done',
        ]);

        foreach ($validated['tasks'] as $row) {
            $payload = ['order' => $row['order']];
            if (! empty($row['status'])) {
                $payload['status'] = $row['status'];
                $payload['progress'] = match ($row['status']) {
                    'done' => 100,
                    'review' => 90,
                    'in_progress' => 50,
                    default => 0,
                };
            }
            Task::where('id', $row['id'])->update($payload);
        }

        return response()->json(['message' => 'Tasks reordered successfully']);
    }

    public function storeComment(Request $request, string $id)
    {
        $task = Task::findOrFail($id);

        $validated = $request->validate([
            'comment' => 'required|string|max:5000',
        ]);

        $comment = $task->comments()->create([
            'user_id' => $request->user()->id,
            'comment' => $validated['comment'],
        ]);
        $comment->load('user:id,name,avatar');

        $this->activity->log('task.commented', $task);
        $this->notifications->notifyMany(
            [$task->assigned_to, $task->created_by],
            'task_comment',
            'New comment on task',
            "{$request->user()->name} commented on \"{$task->title}\".",
            ['task_id' => $task->id]
        );

        return response()->json(['comment' => $comment, 'message' => 'Comment added'], 201);
    }

    public function destroyComment(Request $request, string $id, string $commentId)
    {
        $comment = TaskComment::where('task_id', $id)->findOrFail($commentId);

        abort_unless(
            $comment->user_id === $request->user()->id || $request->user()->isAdmin(),
            403,
            'Unauthorized'
        );

        $comment->delete();

        return response()->json(['message' => 'Comment deleted']);
    }

    public function storeAttachment(Request $request, string $id)
    {
        $task = Task::findOrFail($id);

        $request->validate([
            'file' => 'required|file|max:10240|mimes:jpg,jpeg,png,webp,gif,pdf,doc,docx,xls,xlsx,csv,txt,zip',
        ]);

        $file = $request->file('file');
        $path = $file->store('task-attachments', 'public');

        $attachment = TaskAttachment::create([
            'task_id' => $task->id,
            'uploaded_by' => $request->user()->id,
            'filename' => basename($path),
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'path' => $path,
        ]);
        $attachment->load('uploader:id,name');

        $this->activity->log('task.attachment', $task);

        return response()->json(['attachment' => $attachment, 'message' => 'File uploaded'], 201);
    }

    public function destroyAttachment(Request $request, string $id, string $attachmentId)
    {
        $attachment = TaskAttachment::where('task_id', $id)->findOrFail($attachmentId);

        abort_unless(
            $attachment->uploaded_by === $request->user()->id || $request->user()->isAdmin(),
            403,
            'Unauthorized'
        );

        $attachment->delete();

        return response()->json(['message' => 'Attachment deleted']);
    }
}
