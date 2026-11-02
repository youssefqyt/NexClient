<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\SupportTicket;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Intelligent, provider-agnostic AI assistant with seamless dual-mode support:
 * 1. Online Mode: Uses Groq (llama-3.3-70b-versatile) or OpenAI/Anthropic with live workspace grounding.
 * 2. Offline Mode: Automatically activates when no API key is set (or if the provider is down).
 *    Answers factually and accurately using real database records (projects, tasks, invoices, payments, tickets).
 */
class AiService
{
    public function __construct(
        protected ?string $provider = null,
        protected ?string $apiKey = null,
        protected ?string $model = null,
        protected ?string $baseUrl = null,
    ) {
        $this->provider = $provider ?? config('services.ai.provider', 'groq');
        $this->apiKey = $apiKey ?? config('services.ai.api_key');

        if ($this->provider === 'groq') {
            $this->model = $model ?? config('services.ai.model', 'llama-3.3-70b-versatile');
            $this->baseUrl = $baseUrl ?? config('services.ai.base_url', 'https://api.groq.com/openai/v1');
        } else {
            $this->model = $model ?? config('services.ai.model', 'gpt-4o-mini');
            $this->baseUrl = $baseUrl ?? config('services.ai.base_url', 'https://api.openai.com/v1');
        }
    }

    public function enabled(): bool
    {
        return ! empty($this->apiKey);
    }

    public function getProvider(): string
    {
        return $this->provider;
    }

    public function getModel(): string
    {
        return $this->model;
    }

    /**
     * Send a single-turn completion prompt to the configured provider.
     */
    public function complete(string $systemPrompt, string $userPrompt, int $maxTokens = 800): string
    {
        if (! $this->enabled()) {
            return '';
        }

        try {
            return match ($this->provider) {
                'openai', 'openrouter', 'groq' => $this->openAiCompatible($systemPrompt, $userPrompt, $maxTokens),
                'anthropic' => $this->anthropic($systemPrompt, $userPrompt, $maxTokens),
                default => '',
            };
        } catch (\Throwable $e) {
            Log::warning('AI provider request failed, falling back to local engine', ['error' => $e->getMessage()]);
            return '';
        }
    }

    /**
     * Send a multi-turn conversation with chat history to the configured provider.
     */
    public function chat(string $systemPrompt, array $history, string $userMessage, int $maxTokens = 1200): string
    {
        if (! $this->enabled()) {
            return '';
        }

        $formattedMessages = [];
        foreach ($history as $msg) {
            $role = ($msg['role'] ?? 'user') === 'assistant' ? 'assistant' : 'user';
            $content = trim($msg['content'] ?? '');
            if ($content !== '') {
                $formattedMessages[] = ['role' => $role, 'content' => $content];
            }
        }
        $formattedMessages[] = ['role' => 'user', 'content' => $userMessage];

        try {
            return match ($this->provider) {
                'openai', 'openrouter', 'groq' => $this->openAiCompatible($systemPrompt, $formattedMessages, $maxTokens),
                'anthropic' => $this->anthropicChat($systemPrompt, $formattedMessages, $maxTokens),
                default => '',
            };
        } catch (\Throwable $e) {
            Log::warning('AI chat request failed, falling back to local engine', ['error' => $e->getMessage()]);
            return '';
        }
    }

    /**
     * Offline chat engine: Intelligently answers questions about the app, payments,
     * projects, invoices, tasks, and tickets directly from the database without any API key.
     */
    public function offlineChat(User $user, string $userMessage): string
    {
        $q = strtolower(trim($userMessage));
        $isClient = $user->role === 'client';
        $client = $user->client;

        // 1. PAYMENT & HOW TO PAY
        if (str_contains($q, 'pay') || str_contains($q, 'bank') || str_contains($q, 'settle') || str_contains($q, 'method') || str_contains($q, 'wire')) {
            $response = "### 💳 How to Pay in NexClient\n\n";
            $response .= "Here is how payments work in the portal:\n\n";
            $response .= "1. **View & Download Invoice**: Go to **Invoices** in the left sidebar and click **PDF** to download your official invoice with full itemization.\n";
            $response .= "2. **Make Payment**: Payments are made externally (e.g., via **Bank Wire / Transfer**, **PayPal**, or direct credit card) using the account details specified in the **Notes & Terms** on the invoice.\n";
            $response .= "3. **Staff Confirmation**: Once payment is completed, staff records the payment under the invoice. When the balance reaches zero, the invoice status changes to **Paid**.\n\n";

            if ($isClient && $client) {
                $unpaidInvoices = Invoice::where('client_id', $client->id)
                    ->whereIn('status', ['sent', 'overdue', 'draft'])
                    ->with('payments')
                    ->get();

                if ($unpaidInvoices->isNotEmpty()) {
                    $response .= "#### Your Outstanding Invoices:\n";
                    foreach ($unpaidInvoices as $inv) {
                        $paid = $inv->payments->sum('amount');
                        $balance = max(0, (float)$inv->total - (float)$paid);
                        $due = optional($inv->due_date)->format('M d, Y') ?? 'N/A';
                        $response .= "- **{$inv->invoice_number}**: Balance **{$inv->currency} " . number_format($balance, 2) . "** (Total: {$inv->currency} {$inv->total}, Due: {$due}, Status: *{$inv->status}*)\n";
                    }
                } else {
                    $response .= "✅ You have no outstanding invoices. All bills are settled!";
                }
            }

            return $response;
        }

        // 2. INVOICES & BILLING
        if (str_contains($q, 'invoice') || str_contains($q, 'bill') || str_contains($q, 'balance') || str_contains($q, 'due') || str_contains($q, 'fee') || str_contains($q, 'cost')) {
            if ($isClient && $client) {
                $invoices = Invoice::where('client_id', $client->id)->with('payments')->latest()->take(10)->get();
                if ($invoices->isEmpty()) {
                    return "You currently do not have any invoices on record.";
                }

                $out = "### 🧾 Your Invoices\n\n";
                foreach ($invoices as $inv) {
                    $paid = $inv->payments->sum('amount');
                    $balance = max(0, (float)$inv->total - (float)$paid);
                    $due = optional($inv->due_date)->format('M d, Y') ?? 'N/A';
                    $statusBadge = $balance <= 0 ? '✅ Paid' : "⏳ {$inv->status}";
                    $out .= "- **{$inv->invoice_number}**: {$inv->currency} " . number_format((float)$inv->total, 2) . " | Balance Due: **{$inv->currency} " . number_format($balance, 2) . "** | Due: {$due} | {$statusBadge}\n";
                }
                return $out;
            } else {
                $invoices = Invoice::with(['client', 'payments'])->latest()->take(8)->get();
                $unpaidCount = Invoice::whereIn('status', ['sent', 'overdue'])->count();
                $unpaidSum = Invoice::whereIn('status', ['sent', 'overdue'])->sum('total');

                $out = "### 🧾 Agency Invoice Overview\n\n";
                $out .= "- **Unpaid/Overdue**: {$unpaidCount} invoices (approx. USD " . number_format((float)$unpaidSum, 2) . ")\n\n";
                $out .= "#### Recent Invoices:\n";
                foreach ($invoices as $inv) {
                    $cName = $inv->client ? ($inv->client->first_name . ' ' . $inv->client->last_name) : 'Unknown';
                    $paid = $inv->payments->sum('amount');
                    $balance = max(0, (float)$inv->total - (float)$paid);
                    $out .= "- **{$inv->invoice_number}** ({$cName}): {$inv->currency} {$inv->total} | Balance: **{$inv->currency} " . number_format($balance, 2) . "** | Status: *{$inv->status}*\n";
                }
                return $out;
            }
        }

        // 3. PROJECTS
        if (str_contains($q, 'project') || str_contains($q, 'progress') || str_contains($q, 'deadline')) {
            if ($isClient && $client) {
                $projects = Project::where('client_id', $client->id)->get();
                if ($projects->isEmpty()) {
                    return "You do not have any active projects linked to your account at this moment.";
                }

                $out = "### 📁 Your Projects\n\n";
                foreach ($projects as $p) {
                    $due = optional($p->deadline)->format('M d, Y') ?? 'TBD';
                    $out .= "- **{$p->title}**: Status: **" . ucfirst($p->status) . "** | Progress: **{$p->progress}%** | Deadline: {$due} | Budget: {$p->currency} " . number_format((float)$p->budget, 2) . "\n";
                }
                return $out;
            } else {
                $projects = Project::with('client')->latest()->take(8)->get();
                $out = "### 📁 Active Projects Overview\n\n";
                foreach ($projects as $p) {
                    $cName = $p->client ? ($p->client->first_name . ' ' . $p->client->last_name) : 'No client';
                    $due = optional($p->deadline)->format('M d, Y') ?? 'TBD';
                    $out .= "- **{$p->title}** ({$cName}): **{$p->progress}%** complete | Status: *{$p->status}* | Deadline: {$due}\n";
                }
                return $out;
            }
        }

        // 4. TASKS & TODOS
        if (str_contains($q, 'task') || str_contains($q, 'todo') || str_contains($q, 'done') || str_contains($q, 'overdue')) {
            if ($isClient && $client) {
                $pIds = Project::where('client_id', $client->id)->pluck('id');
                $tasks = Task::whereIn('project_id', $pIds)->orderBy('due_date')->take(15)->get();
                if ($tasks->isEmpty()) {
                    return "No tasks found for your projects.";
                }

                $out = "### 📋 Project Tasks\n\n";
                foreach ($tasks as $t) {
                    $due = optional($t->due_date)->format('M d, Y') ?? 'No date';
                    $out .= "- [{$t->status}] **{$t->title}** | Priority: {$t->priority} | Due: {$due}\n";
                }
                return $out;
            } else {
                $tasks = Task::with('project')->where('status', '!=', 'done')->orderBy('due_date')->take(12)->get();
                $out = "### 📋 Pending & Overdue Tasks\n\n";
                foreach ($tasks as $t) {
                    $pTitle = $t->project?->title ?? 'General';
                    $due = optional($t->due_date)->format('M d, Y') ?? 'No date';
                    $out .= "- **{$t->title}** ({$pTitle}) | Status: *{$t->status}* | Priority: {$t->priority} | Due: {$due}\n";
                }
                return $out;
            }
        }

        // 5. SUPPORT TICKETS
        if (str_contains($q, 'ticket') || str_contains($q, 'support') || str_contains($q, 'help') || str_contains($q, 'issue')) {
            $tickets = $isClient
                ? SupportTicket::where('client_id', $user->id)->latest()->take(6)->get()
                : SupportTicket::with('client')->latest()->take(6)->get();

            if ($tickets->isEmpty()) {
                return "There are no support tickets on file. You can open a new ticket anytime via the **Support** menu in the sidebar.";
            }

            $out = "### 🎫 Support Tickets\n\n";
            foreach ($tickets as $t) {
                $date = optional($t->created_at)->format('M d, Y');
                $out .= "- **#{$t->ticket_number}**: '{$t->subject}' | Status: **{$t->status}** | Priority: {$t->priority} | Date: {$date}\n";
            }
            return $out;
        }

        // 6. DEFAULT WORKSPACE OVERVIEW
        return $this->offlineWorkspaceDigest($user);
    }

    /**
     * Build an offline workspace digest when the user asks a general question.
     */
    protected function offlineWorkspaceDigest(User $user): string
    {
        $isClient = $user->role === 'client';
        $client = $user->client;

        $out = "👋 **Hello, {$user->name}!**\n\n";
        $out .= "Here is your live **NexClient Workspace Summary**:\n\n";

        if ($isClient && $client) {
            $projects = Project::where('client_id', $client->id)->get();
            $invoices = Invoice::where('client_id', $client->id)->with('payments')->get();
            $unpaidCount = $invoices->filter(fn ($i) => ((float)$i->total - (float)$i->payments->sum('amount')) > 0)->count();
            $unpaidBalance = $invoices->sum(fn ($i) => max(0, (float)$i->total - (float)$i->payments->sum('amount')));

            $out .= "- **Active Projects**: {$projects->count()} project(s)\n";
            $out .= "- **Invoices**: {$invoices->count()} total ({$unpaidCount} unpaid with balance **USD " . number_format($unpaidBalance, 2) . "**)\n";
            $out .= "- **Support**: You can submit support requests directly from the Support tab.\n\n";

            $out .= "💡 **Quick Actions**:\n";
            $out .= "- Type **'how to pay'** for payment instructions & your outstanding bills.\n";
            $out .= "- Type **'projects'** or **'tasks'** to view progress and deliverables.\n";
            $out .= "- Type **'invoices'** to check invoice details.\n";
        } else {
            $totalClients = Client::count();
            $totalProjects = Project::count();
            $activeProjects = Project::whereIn('status', ['planning', 'in_progress'])->count();
            $unpaidInvoices = Invoice::whereIn('status', ['sent', 'overdue'])->count();
            $unpaidSum = Invoice::whereIn('status', ['sent', 'overdue'])->sum('total');

            $out .= "- **Clients**: {$totalClients} total\n";
            $out .= "- **Projects**: {$totalProjects} total ({$activeProjects} currently active)\n";
            $out .= "- **Unpaid Invoices**: {$unpaidInvoices} (approx. USD " . number_format((float)$unpaidSum, 2) . ")\n\n";

            $out .= "💡 **Quick Actions**:\n";
            $out .= "- Ask about **'projects'**, **'invoices'**, **'tasks'**, or **'tickets'**.\n";
        }

        $out .= "\n*(Running in Workspace Data Mode — answering directly from your NexClient database)*";

        return $out;
    }

    /**
     * Offline project summary generator.
     */
    public function offlineProjectSummary(Project $project): string
    {
        $project->loadMissing(['client', 'tasks', 'milestones', 'members']);
        $tasks = $project->tasks;
        $done = $tasks->where('status', 'done')->count();
        $inProgress = $tasks->where('status', 'in_progress')->count();
        $todo = $tasks->where('status', 'todo')->count();
        $overdue = $tasks->filter(fn ($t) => $t->due_date && $t->due_date->isPast() && $t->status !== 'done')->count();

        $clientName = $project->client ? ($project->client->first_name . ' ' . $project->client->last_name) : 'N/A';
        $deadline = optional($project->deadline)->format('M d, Y') ?? 'Not specified';

        return "### 📊 Project Summary: {$project->title}\n\n"
            . "- **Client**: {$clientName}\n"
            . "- **Status**: " . ucfirst($project->status) . " | **Priority**: " . ucfirst($project->priority) . "\n"
            . "- **Overall Progress**: {$project->progress}%\n"
            . "- **Budget**: {$project->currency} " . number_format((float)$project->budget, 2) . "\n"
            . "- **Deadline**: {$deadline}\n"
            . "- **Team Members**: " . ($project->members->pluck('name')->implode(', ') ?: 'Unassigned') . "\n\n"
            . "#### Task Overview\n"
            . "- **Total Tasks**: {$tasks->count()}\n"
            . "- **Completed**: {$done}\n"
            . "- **In Progress**: {$inProgress}\n"
            . "- **To Do**: {$todo}\n"
            . ($overdue > 0 ? "- ⚠️ **Overdue Tasks**: {$overdue} task(s) require immediate attention\n" : "- ✅ **Overdue Tasks**: None (on schedule)\n");
    }

    /**
     * Offline status update writer.
     */
    public function offlineStatusUpdate(Project $project): string
    {
        $project->loadMissing(['client', 'tasks']);
        $cName = $project->client?->first_name ?? 'Valued Client';
        $deadline = optional($project->deadline)->format('F d, Y') ?? 'our scheduled delivery date';
        $doneCount = $project->tasks->where('status', 'done')->count();
        $totalCount = $project->tasks->count();

        return "Dear {$cName},\n\n"
            . "Here is the latest progress update on **{$project->title}**. We are currently at **{$project->progress}% completion** with the project in the **" . ucfirst($project->status) . "** stage.\n\n"
            . "To date, our team has completed {$doneCount} of {$totalCount} tasks. Key deliverables are progressing steadily toward our target delivery date of **{$deadline}**.\n\n"
            . "Please let us know if you have any questions or additional requirements. You can also monitor real-time task movement on your project Kanban board.\n\n"
            . "Best regards,\nThe Project Team";
    }

    /**
     * Offline task breakdown generator.
     */
    public function offlineTaskBreakdown(string $goal, ?Project $project = null): string
    {
        $pContext = $project ? " for **{$project->title}**" : "";
        return "### 📋 Actionable Task Breakdown{$pContext}\n"
            . "**Goal**: {$goal}\n\n"
            . "1. **Discovery & Scope Definition** — Clarify technical specifications, acceptance criteria, and project dependencies. *(Estimate: 1 day)*\n"
            . "2. **Design & API Specification** — Design wireframes, database migrations, and API contracts. *(Estimate: 2 days)*\n"
            . "3. **Core Implementation** — Develop backend services, business logic, and responsive frontend UI components. *(Estimate: 3-5 days)*\n"
            . "4. **Testing & Code Review** — Perform integration tests, security verification, and edge-case validation. *(Estimate: 1-2 days)*\n"
            . "5. **Deployment & Stakeholder Signoff** — Deploy to staging/production, run smoke tests, and notify the team. *(Estimate: 1 day)*";
    }

    /**
     * Offline client communication drafter.
     */
    public function offlineDraftMessage(string $context, string $tone = 'professional', ?Project $project = null): string
    {
        $pContext = $project ? " regarding project '{$project->title}'" : "";
        $greeting = match ($tone) {
            'friendly' => 'Hi there,',
            'apologetic' => 'Dear Client,',
            'firm' => 'Hello,',
            default => 'Hello,',
        };

        return "{$greeting}\n\n"
            . "I am reaching out to provide an update{$pContext}.\n\n"
            . "{$context}\n\n"
            . "Please let us know if you have any questions or require any adjustments. We appreciate your partnership.\n\n"
            . "Best regards,\nYour Team";
    }

    /**
     * Build rich, role-aware context from the database so the AI knows the real
     * current state of the app rather than giving generic answers.
     */
    public function buildAppContext(User $user): string
    {
        $role = $user->role ?? 'client';
        $sections = [];

        $sections[] = "User Identity: {$user->name} (Email: {$user->email}, Role: {$role}).";

        if ($role === 'client') {
            $client = $user->client;
            if ($client) {
                $company = $client->company?->name ?? 'Independent';
                $sections[] = "Client Profile: Name: {$client->full_name} | Company: {$company} | Phone: " . ($client->phone ?? 'N/A') . " | City/Country: " . trim("{$client->city}, {$client->country}", ', ');

                // Client Projects
                $projects = Project::where('client_id', $client->id)->get();
                if ($projects->isNotEmpty()) {
                    $projList = $projects->map(function ($p) {
                        return "- [Project ID {$p->id}] '{$p->title}' | Status: {$p->status} | Progress: {$p->progress}% | Budget: {$p->currency} {$p->budget} | Deadline: " . optional($p->deadline)->format('Y-m-d');
                    })->implode("\n");
                    $sections[] = "Active Projects:\n{$projList}";

                    // Project Tasks
                    $tasks = Task::whereIn('project_id', $projects->pluck('id'))->orderBy('due_date')->take(20)->get();
                    if ($tasks->isNotEmpty()) {
                        $taskList = $tasks->map(function ($t) {
                            return "- [Task] '{$t->title}' | Status: {$t->status} | Priority: {$t->priority} | Due: " . optional($t->due_date)->format('Y-m-d');
                        })->implode("\n");
                        $sections[] = "Project Tasks:\n{$taskList}";
                    }
                } else {
                    $sections[] = "Active Projects: None currently registered.";
                }

                // Client Invoices
                $invoices = Invoice::where('client_id', $client->id)->with('payments')->latest()->take(10)->get();
                if ($invoices->isNotEmpty()) {
                    $invList = $invoices->map(function ($inv) {
                        $paid = $inv->payments->sum('amount');
                        $balance = max(0, (float)$inv->total - (float)$paid);
                        return "- Invoice {$inv->invoice_number}: Status: {$inv->status} | Total: {$inv->currency} {$inv->total} | Balance Due: {$inv->currency} {$balance} | Issued: " . optional($inv->invoice_date)->format('Y-m-d') . " | Due: " . optional($inv->due_date)->format('Y-m-d');
                    })->implode("\n");
                    $sections[] = "Invoices & Billing:\n{$invList}";
                } else {
                    $sections[] = "Invoices & Billing: No invoices found.";
                }

                // Support Tickets
                $tickets = SupportTicket::where('client_id', $user->id)->latest()->take(6)->get();
                if ($tickets->isNotEmpty()) {
                    $tktList = $tickets->map(function ($t) {
                        return "- Ticket #{$t->ticket_number}: '{$t->subject}' | Priority: {$t->priority} | Status: {$t->status} | Created: " . optional($t->created_at)->format('Y-m-d');
                    })->implode("\n");
                    $sections[] = "Support Tickets:\n{$tktList}";
                } else {
                    $sections[] = "Support Tickets: No support tickets opened.";
                }
            } else {
                $sections[] = "Client Profile: No client company profile linked yet.";
            }
        } else {
            // Admin or Manager overview
            $totalClients = Client::count();
            $totalProjects = Project::count();
            $activeProjects = Project::whereIn('status', ['planning', 'in_progress'])->count();
            $unpaidInvoices = Invoice::whereIn('status', ['sent', 'overdue'])->count();
            $unpaidSum = Invoice::whereIn('status', ['sent', 'overdue'])->sum('total');
            $openTickets = SupportTicket::whereIn('status', ['open', 'in_progress', 'pending'])->count();

            $sections[] = "Portal Metrics Snapshot:\n"
                . "- Clients: {$totalClients} total clients\n"
                . "- Projects: {$totalProjects} total ({$activeProjects} currently active)\n"
                . "- Unpaid Invoices: {$unpaidInvoices} (approx. USD {$unpaidSum})\n"
                . "- Open Support Tickets: {$openTickets} needing attention";

            // Recent Projects
            $projects = Project::with('client')->latest()->take(8)->get();
            if ($projects->isNotEmpty()) {
                $projList = $projects->map(function ($p) {
                    $cName = $p->client ? ($p->client->first_name . ' ' . $p->client->last_name) : 'None';
                    return "- [Project ID {$p->id}] '{$p->title}' | Client: {$cName} | Status: {$p->status} | Progress: {$p->progress}% | Deadline: " . optional($p->deadline)->format('Y-m-d');
                })->implode("\n");
                $sections[] = "Recent Projects:\n{$projList}";
            }

            // Pending/Overdue Invoices
            $invoices = Invoice::with(['client', 'payments'])->whereIn('status', ['sent', 'overdue', 'draft'])->latest()->take(8)->get();
            if ($invoices->isNotEmpty()) {
                $invList = $invoices->map(function ($inv) {
                    $cName = $inv->client ? ($inv->client->first_name . ' ' . $inv->client->last_name) : 'Unknown';
                    $paid = $inv->payments->sum('amount');
                    $bal = max(0, (float)$inv->total - (float)$paid);
                    return "- {$inv->invoice_number} | Client: {$cName} | Status: {$inv->status} | Total: {$inv->currency} {$inv->total} | Due: " . optional($inv->due_date)->format('Y-m-d') . " | Balance: {$inv->currency} {$bal}";
                })->implode("\n");
                $sections[] = "Unpaid / Overdue Invoices:\n{$invList}";
            }

            // Open Support Tickets
            $tickets = SupportTicket::with('client')->whereIn('status', ['open', 'in_progress', 'pending'])->latest()->take(6)->get();
            if ($tickets->isNotEmpty()) {
                $tktList = $tickets->map(function ($t) {
                    $cName = $t->client ? $t->client->name : 'Unknown';
                    return "- Ticket #{$t->ticket_number} ('{$t->subject}') | Client: {$cName} | Priority: {$t->priority} | Status: {$t->status}";
                })->implode("\n");
                $sections[] = "Open Support Tickets:\n{$tktList}";
            }

            // Urgent / Overdue Tasks
            $tasks = Task::with('project')
                ->where('status', '!=', 'done')
                ->orderBy('due_date')
                ->take(10)
                ->get();
            if ($tasks->isNotEmpty()) {
                $taskList = $tasks->map(function ($t) {
                    $pTitle = $t->project?->title ?? 'General';
                    return "- '{$t->title}' ({$pTitle}) | Status: {$t->status} | Due: " . optional($t->due_date)->format('Y-m-d');
                })->implode("\n");
                $sections[] = "Upcoming & Overdue Tasks:\n{$taskList}";
            }
        }

        // NexClient app functionality manual
        $sections[] = "NexClient App Operations Knowledge:\n"
            . "- Invoices & Payments: Invoices are created by staff and can be downloaded as PDF. In NexClient, client payment is settled externally (e.g. bank wire, transfer, or PayPal as instructed in invoice terms). Once the client pays, staff records the payment on the invoice detail page (Record Payment button) with the amount, method, and transaction reference. Once paid in full, status updates to 'paid'.\n"
            . "- Projects & Tasks: Projects feature interactive Kanban boards (Todo, In Progress, Review, Done), milestone tracking, task attachments, and comments.\n"
            . "- Support Tickets: Clients open tickets with priority levels (Low, Medium, High, Urgent) and categories (General, Billing, Technical, Bug). Staff and clients reply in a real-time message thread.\n"
            . "- Notifications: Users receive in-app alerts when invoices are issued, tasks assigned, or ticket replies sent.";

        return implode("\n\n", $sections);
    }

    /**
     * Build a compact textual digest of a specific project for summarization or tasks.
     */
    public function projectContext(Project $project): string
    {
        $project->loadMissing(['client', 'tasks', 'milestones', 'members']);

        $tasks = $project->tasks;
        $done = $tasks->where('status', 'done')->count();
        $overdue = $tasks->filter(
            fn ($t) => $t->due_date && $t->due_date->isPast() && $t->status !== 'done'
        )->count();

        $lines = [
            "Project: {$project->title}",
            "Client: " . ($project->client->full_name ?? 'N/A'),
            "Status: {$project->status} | Priority: {$project->priority} | Progress: {$project->progress}%",
            "Budget: {$project->currency} {$project->budget}",
            "Deadline: " . optional($project->deadline)->format('Y-m-d'),
            "Tasks: {$tasks->count()} total, {$done} done, {$overdue} overdue",
            "Team: " . $project->members->pluck('name')->implode(', '),
        ];

        $taskList = $tasks->take(15)->map(
            fn ($t) => "- [{$t->status}] {$t->title} (due " . optional($t->due_date)->format('Y-m-d') . ')'
        )->implode("\n");

        return implode("\n", $lines) . ($taskList ? "\nRecent tasks:\n{$taskList}" : '');
    }

    protected function openAiCompatible(string $system, string|array $promptOrMessages, int $maxTokens): string
    {
        $base = rtrim($this->baseUrl ?: 'https://api.groq.com/openai/v1', '/');

        if (is_array($promptOrMessages)) {
            $messages = array_merge(
                [['role' => 'system', 'content' => $system]],
                $promptOrMessages
            );
        } else {
            $messages = [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user', 'content' => $promptOrMessages],
            ];
        }

        $response = Http::withToken($this->apiKey)
            ->timeout(25)
            ->post("{$base}/chat/completions", [
                'model' => $this->model,
                'messages' => $messages,
                'max_tokens' => $maxTokens,
                'temperature' => 0.3,
            ]);

        if ($response->failed()) {
            Log::warning('AI provider request failed', [
                'provider' => $this->provider,
                'status' => $response->status(),
                'error' => $response->json('error.message') ?? $response->body(),
            ]);
            return '';
        }

        $content = $response->json('choices.0.message.content');
        return !empty($content) ? (string) $content : '';
    }

    protected function anthropic(string $system, string $user, int $maxTokens): string
    {
        return $this->anthropicChat($system, [['role' => 'user', 'content' => $user]], $maxTokens);
    }

    protected function anthropicChat(string $system, array $messages, int $maxTokens): string
    {
        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
            'anthropic-version' => '2023-06-01',
        ])->timeout(25)->post('https://api.anthropic.com/v1/messages', [
            'model' => $this->model,
            'max_tokens' => $maxTokens,
            'system' => $system,
            'messages' => $messages,
        ]);

        return (string) $response->json('content.0.text', '');
    }
}
