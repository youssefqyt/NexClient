<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: DejaVu Sans, Helvetica, Arial, sans-serif;
            font-size: 12px;
            color: #1f2937;
            margin: 0;
            padding: 40px;
        }
        .header { width: 100%; margin-bottom: 32px; }
        .header td { vertical-align: top; }
        .brand { font-size: 24px; font-weight: bold; color: #4f46e5; letter-spacing: -0.5px; }
        .muted { color: #6b7280; }
        .invoice-title { font-size: 22px; font-weight: bold; text-align: right; letter-spacing: 1px; }
        .meta { text-align: right; margin-top: 6px; }
        .badge {
            display: inline-block; padding: 3px 10px; border-radius: 10px;
            font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;
            background: #eef2ff; color: #4338ca; font-weight: bold;
        }
        .badge.paid { background: #dcfce7; color: #15803d; }
        .badge.overdue { background: #fee2e2; color: #b91c1c; }
        .badge.draft { background: #f3f4f6; color: #4b5563; }
        .badge.cancelled { background: #f3f4f6; color: #9ca3af; }
        .parties { width: 100%; margin-bottom: 28px; }
        .parties td { width: 50%; vertical-align: top; padding-right: 20px; }
        .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; margin-bottom: 6px; }
        .strong { font-weight: bold; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table.items th {
            background: #f9fafb; text-align: left; padding: 10px;
            font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px;
            color: #6b7280; border-bottom: 1px solid #e5e7eb;
        }
        table.items td { padding: 10px; border-bottom: 1px solid #f3f4f6; }
        .right { text-align: right; }
        .totals { width: 45%; margin-left: 55%; }
        .totals td { padding: 6px 10px; }
        .totals .grand { font-size: 15px; font-weight: bold; border-top: 2px solid #e5e7eb; color: #4f46e5; }
        .notes { margin-top: 28px; padding: 14px; background: #f9fafb; border-radius: 8px; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #9ca3af; }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            <td>
                <div class="brand">{{ $siteName ?? 'NexClient' }}</div>
                <div class="muted">{{ $siteEmail ?? 'support@nexclient.com' }}</div>
            </td>
            <td>
                <div class="invoice-title">INVOICE</div>
                <div class="meta strong">{{ $invoice->invoice_number }}</div>
                <div class="meta">
                    <span class="badge {{ $invoice->status }}">{{ $invoice->status }}</span>
                </div>
            </td>
        </tr>
    </table>

    <table class="parties">
        <tr>
            <td>
                <div class="label">Billed To</div>
                <div class="strong">
                    {{ $invoice->client->first_name ?? '' }} {{ $invoice->client->last_name ?? '' }}
                </div>
                @if($invoice->client?->company)
                    <div>{{ $invoice->client->company->name }}</div>
                @endif
                @if($invoice->client?->email)
                    <div class="muted">{{ $invoice->client->email }}</div>
                @endif
                @if($invoice->client?->phone)
                    <div class="muted">{{ $invoice->client->phone }}</div>
                @endif
                @if($invoice->client?->address)
                    <div class="muted">{{ $invoice->client->address }}</div>
                @endif
                @if($invoice->client?->city || $invoice->client?->country)
                    <div class="muted">
                        {{ $invoice->client->city }}{{ $invoice->client->city && $invoice->client->country ? ', ' : '' }}{{ $invoice->client->country }}
                    </div>
                @endif
            </td>
            <td>
                <table style="width:100%;">
                    <tr>
                        <td class="label">Invoice Date</td>
                        <td class="right">{{ optional($invoice->invoice_date)->format('M d, Y') }}</td>
                    </tr>
                    <tr>
                        <td class="label">Due Date</td>
                        <td class="right">{{ optional($invoice->due_date)->format('M d, Y') }}</td>
                    </tr>
                    <tr>
                        <td class="label">Currency</td>
                        <td class="right">{{ $invoice->currency }}</td>
                    </tr>
                    @if($invoice->project)
                    <tr>
                        <td class="label">Project</td>
                        <td class="right">{{ $invoice->project->title }}</td>
                    </tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th style="width:55%;">Description</th>
                <th class="right" style="width:12%;">Qty</th>
                <th class="right" style="width:16%;">Unit Price</th>
                <th class="right" style="width:17%;">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $item)
            <tr>
                <td>{{ $item->description }}</td>
                <td class="right">{{ $item->quantity }}</td>
                <td class="right">{{ number_format((float) $item->unit_price, 2) }}</td>
                <td class="right">{{ number_format((float) $item->amount, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td class="muted">Subtotal</td>
            <td class="right">{{ $invoice->currency }} {{ number_format((float) $invoice->subtotal, 2) }}</td>
        </tr>
        <tr>
            <td class="muted">Tax ({{ (float) $invoice->tax_rate }}%)</td>
            <td class="right">{{ $invoice->currency }} {{ number_format((float) $invoice->tax_amount, 2) }}</td>
        </tr>
        @if((float) $invoice->discount > 0)
        <tr>
            <td class="muted">Discount</td>
            <td class="right">- {{ $invoice->currency }} {{ number_format((float) $invoice->discount, 2) }}</td>
        </tr>
        @endif
        <tr class="grand">
            <td>Total</td>
            <td class="right">{{ $invoice->currency }} {{ number_format((float) $invoice->total, 2) }}</td>
        </tr>
    </table>

    @if($invoice->notes)
    <div class="notes">
        <div class="label">Notes</div>
        <div>{{ $invoice->notes }}</div>
    </div>
    @endif

    @if($invoice->terms)
    <div class="notes">
        <div class="label">Terms &amp; Conditions</div>
        <div>{{ $invoice->terms }}</div>
    </div>
    @endif

    <div class="footer">
        Thank you for your business. Generated by {{ $siteName ?? 'NexClient' }}.
    </div>
</body>
</html>
