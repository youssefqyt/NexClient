<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\AiService;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function __construct(protected AiService $ai)
    {
    }

    /** Feature discovery so the UI can display current mode & provider. */
    public function status()
    {
        return response()->json([
            'enabled' => $this->ai->enabled(),
            'provider' => $this->ai->getProvider(),
            'model' => $this->ai->getModel(),
        ]);
    }

    public function summarizeProject(Request $request)
    {
        $request->validate(['project_id' => 'required|exists:projects,id']);
        $project = Project::findOrFail($request->project_id);
        $this->authorizeProject($request, $project);

        $text = '';
        if ($this->ai->enabled()) {
            $context = $this->ai->projectContext($project);
            $text = $this->ai->complete(
                'You are a senior project manager for NexClient. Summarize project activity into a short, skimmable status brief with bullet points using the actual data provided.',
                $context
            );
        }

        // Automatic smart offline fallback using live DB data
        if (empty($text)) {
            $text = $this->ai->offlineProjectSummary($project);
        }

        return response()->json(['result' => $text, 'ai_enabled' => $this->ai->enabled()]);
    }

    public function statusUpdate(Request $request)
    {
        $request->validate(['project_id' => 'required|exists:projects,id']);
        $project = Project::findOrFail($request->project_id);
        $this->authorizeProject($request, $project);

        $text = '';
        if ($this->ai->enabled()) {
            $context = $this->ai->projectContext($project);
            $text = $this->ai->complete(
                'You write client-facing project updates for NexClient. Be concise, professional and reassuring. 3 short paragraphs maximum based on the exact project metrics.',
                "Write a status update for the client based on this project data:\n\n{$context}"
            );
        }

        // Automatic smart offline fallback using live DB data
        if (empty($text)) {
            $text = $this->ai->offlineStatusUpdate($project);
        }

        return response()->json(['result' => $text, 'ai_enabled' => $this->ai->enabled()]);
    }

    public function taskBreakdown(Request $request)
    {
        $request->validate([
            'project_id' => 'nullable|exists:projects,id',
            'goal' => 'required|string|max:500',
        ]);

        $project = null;
        $context = '';
        if ($request->filled('project_id')) {
            $project = Project::findOrFail($request->project_id);
            $this->authorizeProject($request, $project);
            $context = $this->ai->projectContext($project);
        }

        $text = '';
        if ($this->ai->enabled()) {
            $text = $this->ai->complete(
                'You are a technical lead on NexClient. Break a goal into a numbered list of actionable engineering tasks with a one-line estimate each.',
                "Goal: {$request->goal}\n\nContext:\n{$context}"
            );
        }

        // Automatic smart offline fallback
        if (empty($text)) {
            $text = $this->ai->offlineTaskBreakdown($request->goal, $project);
        }

        return response()->json(['result' => $text, 'ai_enabled' => $this->ai->enabled()]);
    }

    public function draftMessage(Request $request)
    {
        $validated = $request->validate([
            'context' => 'required|string|max:2000',
            'tone' => 'nullable|in:professional,friendly,apologetic,firm',
            'project_id' => 'nullable|exists:projects,id',
        ]);

        $tone = $validated['tone'] ?? 'professional';
        $project = !empty($validated['project_id']) ? Project::find($validated['project_id']) : null;

        $text = '';
        if ($this->ai->enabled()) {
            $extra = $project ? ("\n\nRelevant Project:\n" . $this->ai->projectContext($project)) : '';
            $text = $this->ai->complete(
                "You draft client communications for digital agencies using NexClient. Tone: {$tone}. Return only the email body, no subject line.",
                $validated['context'] . $extra
            );
        }

        // Automatic smart offline fallback
        if (empty($text)) {
            $text = $this->ai->offlineDraftMessage($validated['context'], $tone, $project);
        }

        return response()->json(['result' => $text, 'ai_enabled' => $this->ai->enabled()]);
    }

    public function chat(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
            'history' => 'nullable|array',
        ]);

        $user = $request->user();
        $text = '';

        if ($this->ai->enabled()) {
            $appContext = $this->ai->buildAppContext($user);

            $systemPrompt = "You are NexClient Copilot, the intelligent in-app assistant for the NexClient Project & Client Management Portal.\n\n"
                . "=== CURRENT WORKSPACE DATA & PORTAL CONTEXT ===\n"
                . $appContext . "\n\n"
                . "=== INSTRUCTIONS & OPERATING RULES ===\n"
                . "1. ANSWER USING SPECIFIC WORKSPACE DATA: You must ground all responses in the real workspace data provided above. Never give generic placeholders when concrete data (projects, tasks, invoices, tickets) exists.\n"
                . "2. EXACT ENTITY REFERENCES: Always quote exact invoice numbers (e.g. INV-2026-00001), exact project titles, client names, balances, and deadlines when answering.\n"
                . "3. ROLE ACCURACY: The current user is '{$user->name}' with role '{$user->role}'. If they are a client, address their specific account, projects, and invoices. If they are staff/admin, speak from the agency management perspective.\n"
                . "4. REAL NEXCLIENT WORKFLOWS:\n"
                . "   - How clients pay: Explain that invoices are downloadable as PDF from the Invoices section; payment is made externally (via bank transfer, wire, or payment details in the invoice terms); once payment is received, staff records it on the invoice detail page (Record Payment) to mark it paid.\n"
                . "   - Projects & Tasks: Projects feature interactive Kanban boards (Todo, In Progress, Review, Done), task checklists, milestones, and attachments.\n"
                . "   - Support: Users can create support tickets (Low, Medium, High, Urgent) and communicate directly in ticket message threads.\n"
                . "5. HONESTY: If the user asks about data or a record that does not exist in the provided workspace data, clearly state that you cannot find it in their current records rather than inventing or hallucinating information.\n"
                . "6. Keep answers concise, helpful, and formatted cleanly in markdown.";

            $history = $validated['history'] ?? [];
            $text = $this->ai->chat($systemPrompt, $history, $validated['message']);
        }

        // Automatic smart offline engine if API key is not set OR if provider request fails/times out
        if (empty($text)) {
            $text = $this->ai->offlineChat($user, $validated['message']);
        }

        return response()->json([
            'result' => $text,
            'ai_enabled' => $this->ai->enabled(),
            'provider' => $this->ai->getProvider(),
            'model' => $this->ai->getModel(),
        ]);
    }

    /** Clients may only use AI on their own projects. */
    protected function authorizeProject(Request $request, Project $project): void
    {
        $user = $request->user();
        if ($user->role === 'client') {
            abort_unless($user->client && $project->client_id === $user->client->id, 403, 'Unauthorized');
        }
    }
}
