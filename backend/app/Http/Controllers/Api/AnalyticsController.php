<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Client, Invoice, Project, SupportTicket, Task};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        return match ($user->role) {
            'admin', 'manager' => $this->adminDashboard($user),
            'client' => $this->clientDashboard($user),
            default => response()->json(['message' => 'Unauthorized'], 403),
        };
    }

    private function adminDashboard($user)
    {
        $scoped = $user->role === 'manager';

        $stats = [
            'total_clients' => Client::count(),
            'active_projects' => Project::where('status', 'in_progress')->count(),
            'total_projects' => Project::count(),
            'pending_tasks' => Task::whereIn('status', ['todo', 'in_progress'])->count(),
            'completed_tasks' => Task::where('status', 'done')->count(),
            'overdue_tasks' => Task::where('status', '!=', 'done')
                ->whereNotNull('due_date')
                ->whereDate('due_date', '<', now())
                ->count(),
            'open_tickets' => SupportTicket::whereIn('status', ['open', 'in_progress'])->count(),
            'total_revenue' => (float) Invoice::where('status', 'paid')->sum('total'),
            'pending_invoices' => Invoice::where('status', 'sent')->count(),
            'overdue_invoices' => Invoice::where('status', 'overdue')->count(),
            'total_outstanding' => (float) Invoice::whereIn('status', ['sent', 'overdue'])->sum('total'),
        ];

        $recentProjects = Project::with('client:id,first_name,last_name')->latest()->take(5)->get();
        $recentInvoices = Invoice::with('client:id,first_name,last_name')->latest()->take(5)->get();
        $recentTickets = SupportTicket::with('client:id,name')->latest()->take(5)->get();

        return response()->json([
            'role' => $user->role,
            'stats' => $stats,
            'recent_projects' => $recentProjects,
            'recent_invoices' => $recentInvoices,
            'recent_tickets' => $recentTickets,
            'monthly_revenue' => $this->monthlyRevenue(),
            'projects_by_status' => Project::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')->get(),
            'tasks_by_status' => Task::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')->get(),
            'client_growth' => $this->clientGrowth(),
        ]);
    }

    private function clientDashboard($user)
    {
        $client = $user->client;

        if (! $client) {
            return response()->json([
                'role' => 'client',
                'stats' => [],
                'recent_projects' => [],
                'recent_invoices' => [],
                'recent_tickets' => [],
                'upcoming_deadlines' => [],
                'projects_by_status' => [],
                'invoice_breakdown' => [],
            ]);
        }

        $projects = Project::where('client_id', $client->id);

        $stats = [
            'active_projects' => (clone $projects)->where('status', 'in_progress')->count(),
            'total_projects' => (clone $projects)->count(),
            'total_tasks' => Task::whereHas('project', fn ($q) => $q->where('client_id', $client->id))->count(),
            'completed_tasks' => Task::whereHas('project', fn ($q) => $q->where('client_id', $client->id))
                ->where('status', 'done')->count(),
            'open_tickets' => SupportTicket::where('client_id', $user->id)
                ->whereIn('status', ['open', 'in_progress'])->count(),
            'total_invoices' => Invoice::where('client_id', $client->id)->count(),
            'unpaid_amount' => (float) Invoice::where('client_id', $client->id)
                ->whereIn('status', ['sent', 'overdue'])->sum('total'),
            'paid_amount' => (float) Invoice::where('client_id', $client->id)
                ->where('status', 'paid')->sum('total'),
        ];

        return response()->json([
            'role' => 'client',
            'stats' => $stats,
            'recent_projects' => Project::where('client_id', $client->id)->latest()->take(5)->get(),
            'recent_invoices' => Invoice::with('items')->where('client_id', $client->id)->latest()->take(5)->get(),
            'recent_tickets' => SupportTicket::where('client_id', $user->id)->latest()->take(5)->get(),
            'upcoming_deadlines' => Task::whereHas('project', fn ($q) => $q->where('client_id', $client->id))
                ->where('status', '!=', 'done')
                ->whereNotNull('due_date')
                ->orderBy('due_date')
                ->take(5)
                ->get(['id', 'title', 'due_date', 'priority', 'project_id']),
            'projects_by_status' => Project::where('client_id', $client->id)
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')->get(),
            'invoice_breakdown' => Invoice::where('client_id', $client->id)
                ->select('status', DB::raw('count(*) as count'), DB::raw('SUM(total) as total'))
                ->groupBy('status')->get(),
        ]);
    }

    /** Helper to generate DB-agnostic SQL expression for extracting month number. */
    private function monthExpression(string $column): string
    {
        return match (DB::connection()->getDriverName()) {
            'pgsql' => "EXTRACT(MONTH FROM {$column})::integer",
            'sqlite' => "CAST(strftime('%m', {$column}) AS INTEGER)",
            default => "MONTH({$column})",
        };
    }

    /** Monthly paid revenue for the current year (12 buckets, zero-filled). */
    public function revenue(Request $request)
    {
        $year = (int) $request->get('year', date('Y'));
        $monthExpr = $this->monthExpression('invoice_date');

        $rows = Invoice::where('status', 'paid')
            ->whereYear('invoice_date', $year)
            ->select(
                DB::raw("{$monthExpr} as month"),
                DB::raw('SUM(total) as revenue'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy(DB::raw($monthExpr))
            ->pluck('revenue', 'month');

        $data = collect(range(1, 12))->map(fn ($m) => [
            'month' => $m,
            'label' => date('M', mktime(0, 0, 0, $m, 1)),
            'revenue' => (float) ($rows[$m] ?? 0),
        ]);

        return response()->json([
            'year' => $year,
            'total' => $data->sum('revenue'),
            'data' => $data,
        ]);
    }

    public function tasks()
    {
        $byStatus = Task::select('status', DB::raw('count(*) as count'))->groupBy('status')->get();
        $byPriority = Task::select('priority', DB::raw('count(*) as count'))->groupBy('priority')->get();

        return response()->json([
            'by_status' => $byStatus,
            'by_priority' => $byPriority,
            'overdue' => Task::where('status', '!=', 'done')
                ->whereNotNull('due_date')
                ->whereDate('due_date', '<', now())
                ->with('project:id,title')
                ->take(20)
                ->get(['id', 'title', 'due_date', 'priority', 'project_id']),
        ]);
    }

    /** New clients per month for the current year. */
    public function clients(Request $request)
    {
        $year = (int) $request->get('year', date('Y'));
        $monthExpr = $this->monthExpression('created_at');

        $rows = Client::whereYear('created_at', $year)
            ->select(DB::raw("{$monthExpr} as month"), DB::raw('count(*) as count'))
            ->groupBy(DB::raw($monthExpr))
            ->pluck('count', 'month');

        $data = collect(range(1, 12))->map(fn ($m) => [
            'month' => $m,
            'label' => date('M', mktime(0, 0, 0, $m, 1)),
            'count' => (int) ($rows[$m] ?? 0),
        ]);

        return response()->json(['year' => $year, 'data' => $data]);
    }

    private function monthlyRevenue()
    {
        $monthExpr = $this->monthExpression('invoice_date');

        return Invoice::where('status', 'paid')
            ->whereYear('invoice_date', date('Y'))
            ->select(DB::raw("{$monthExpr} as month"), DB::raw('SUM(total) as revenue'))
            ->groupBy(DB::raw($monthExpr))
            ->orderBy(DB::raw($monthExpr))
            ->get();
    }

    private function clientGrowth()
    {
        $monthExpr = $this->monthExpression('created_at');

        return Client::whereYear('created_at', date('Y'))
            ->select(DB::raw("{$monthExpr} as month"), DB::raw('count(*) as count'))
            ->groupBy(DB::raw($monthExpr))
            ->orderBy(DB::raw($monthExpr))
            ->get();
    }
}
