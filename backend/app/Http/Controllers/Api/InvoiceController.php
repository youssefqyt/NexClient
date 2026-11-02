<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Setting;
use App\Services\ActivityLogger;
use App\Services\NotificationService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(
        protected ActivityLogger $activity,
        protected NotificationService $notifications,
    ) {
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Invoice::with(['client:id,first_name,last_name', 'project:id,title', 'items']);

        if ($user->role === 'client') {
            $query->where('client_id', $user->client?->id ?? 0);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->filled('search')) {
            $query->where('invoice_number', 'like', "%{$request->search}%");
        }

        $invoices = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json($invoices);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'project_id' => 'nullable|exists:projects,id',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'status' => 'nullable|in:draft,sent,paid,overdue,cancelled',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:8',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $validated['created_by'] = $request->user()->id;
        $items = $validated['items'];
        unset($validated['items']);

        $invoice = Invoice::create($validated);

        foreach ($items as $item) {
            $invoice->items()->create($item);
        }

        $invoice->load('items');
        $invoice->calculateTotal();
        $invoice->load(['client', 'project', 'items']);

        $this->activity->log('invoice.created', $invoice, ['total' => $invoice->total]);

        if ($invoice->client?->user_id) {
            $this->notifications->notify(
                $invoice->client->user_id,
                'invoice_created',
                'New invoice available',
                "Invoice {$invoice->invoice_number} for {$invoice->currency} {$invoice->total} is ready.",
                ['invoice_id' => $invoice->id]
            );
        }

        return response()->json(['invoice' => $invoice, 'message' => 'Invoice created successfully'], 201);
    }

    public function show(Request $request, string $id)
    {
        $invoice = Invoice::with(['client.company', 'project', 'items', 'payments'])->findOrFail($id);
        $this->authorizeInvoice($request, $invoice);

        return response()->json($invoice);
    }

    public function update(Request $request, string $id)
    {
        $invoice = Invoice::findOrFail($id);

        $validated = $request->validate([
            'status' => 'sometimes|in:draft,sent,paid,overdue,cancelled',
            'invoice_date' => 'sometimes|date',
            'due_date' => 'sometimes|date',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:8',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
        ]);

        $invoice->update($validated);
        $invoice->load('items');
        $invoice->calculateTotal();

        $this->activity->log('invoice.updated', $invoice, $validated);

        return response()->json([
            'invoice' => $invoice->load(['client', 'project', 'items']),
            'message' => 'Invoice updated successfully',
        ]);
    }

    public function destroy(string $id)
    {
        $invoice = Invoice::findOrFail($id);
        $this->activity->log('invoice.deleted', $invoice, ['number' => $invoice->invoice_number]);
        $invoice->delete();

        return response()->json(['message' => 'Invoice deleted successfully']);
    }

    /** Record a manual payment against an invoice. */
    public function recordPayment(Request $request, string $id)
    {
        $invoice = Invoice::findOrFail($id);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'nullable|string|max:100',
            'payment_date' => 'required|date',
            'transaction_id' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $validated['invoice_id'] = $invoice->id;
        $payment = Payment::create($validated);

        if ((float) $invoice->payments()->sum('amount') >= (float) $invoice->total) {
            $invoice->update(['status' => 'paid']);
        }

        $this->activity->log('invoice.payment', $invoice, ['amount' => $validated['amount']]);

        return response()->json([
            'payment' => $payment,
            'invoice' => $invoice->fresh()->load(['items', 'payments']),
            'message' => 'Payment recorded',
        ], 201);
    }

    public function downloadPdf(Request $request, $id)
    {
        $invoice = Invoice::with(['client.company', 'project', 'items'])->findOrFail($id);
        $this->authorizeInvoice($request, $invoice);

        $pdf = Pdf::loadView('invoices.pdf', [
            'invoice' => $invoice,
            'siteName' => Setting::get('site_name', config('app.name')),
            'siteEmail' => Setting::get('site_email', 'support@nexclient.com'),
        ]);

        return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
    }

    /** Clients may only access their own invoices. */
    protected function authorizeInvoice(Request $request, Invoice $invoice): void
    {
        $user = $request->user();
        if ($user->role === 'client') {
            abort_unless($user->client && $invoice->client_id === $user->client->id, 403, 'Unauthorized');
        }
    }
}
