<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { 
        font-family: 'Segoe UI', Roboto, sans-serif; 
        font-size: 13px; 
        color: #1F2937;
        background: #fff;
        margin: 18px 28px 28px 28px;
    }

    /* ── Header — excluded from margins ── */
    .pdf-header { 
        background: #F0F0F0; 
        padding: 12px 28px; 
        border-bottom: 2px solid #003366; 
        margin-bottom: 14px;
        margin-left: -28px;
        margin-right: -28px;
        margin-top: -18px;
        padding-left: 28px;
        padding-right: 28px;
        width: calc(100% + 56px);
    }
    .header-table { width:100%; display:table; }
    .header-logo-cell { display:table-cell; width:70px; vertical-align:middle; }
    .header-logo-cell img { width:60px; }
    .header-text-cell { display:table-cell; vertical-align:middle; padding-left:10px; }
    .org-name { font-size:18px; font-weight:bold; color:#003366; }
    .org-motto { font-size:12px; font-style:italic; color:#646464; margin-top:2px; }
    .org-contact { font-size:10px; color:#646464; margin-top:2px; }
    .report-heading { 
        text-align:center; 
        font-size:16px; 
        font-weight:bold; 
        margin-top:8px; 
        padding-top:6px; 
        border-top:1px solid #999; 
    }

    /* ── Meta Grid ── */
    .meta-grid { display:table; width:100%; margin:10px 0 14px; }
    .meta-cell { 
        display:table-cell; 
        width:25%; 
        padding:8px 12px; 
        background:#F3F4F6; 
        border-right:3px solid #fff; 
        vertical-align:top; 
    }
    .meta-label { 
        font-size:10px; 
        color:#4B5563; 
        text-transform:uppercase; 
        letter-spacing:0.3px;
        margin-bottom:2px; 
    }
    .meta-value { font-size:14px; font-weight:700; color:#1F2937; }

    /* ── Summary Bar ── */
    .summary-bar { display:table; width:100%; margin-bottom:16px; }
    .summary-cell { 
        display:table-cell; 
        text-align:center; 
        padding:10px; 
        width:33.33%;
        border-radius:4px;
    }
    .summary-cell.total   { background:#EFF6FF; color:#1D4ED8; }
    .summary-cell.pending { background:#FFFBEB; color:#92400E; }
    .summary-cell.nok     { background:#FEF2F2; color:#991B1B; }
    .summary-num { font-size:24px; font-weight:700; }
    .summary-lbl { font-size:10px; text-transform:uppercase; letter-spacing:0.3px; margin-top:2px; }

    /* ── Section Title ── */
    .section-title { 
        font-size:15px; 
        font-weight:700; 
        color:#1F2937; 
        margin:18px 0 10px;
        display:flex; 
        align-items:center; 
    }

    /* ── Tables ── */
    table.data-table { 
        width:100%; 
        margin:0 0 12px; 
        border-collapse:collapse; 
        font-size:13px;
    }
    .data-table thead th { 
        padding:8px 10px; 
        text-align:left; 
        font-size:11px; 
        text-transform:uppercase; 
        letter-spacing:0.3px;
        color:#fff; 
    }
    .data-table.nok-table thead th { background:#991B1B; }
    .data-table.pending-table thead th { background:#92400E; }
    .data-table tbody td { 
        padding:8px 10px; 
        border-bottom:1px solid #E5E7EB; 
        font-size:13px;
    }
    .data-table tbody tr:nth-child(even) { background:#F9FAFB; }

    /* ── Station Group ── */
    .station-group-title {
        font-size:13px;
        font-weight:700; 
        color:#991B1B;
        background:#FEF2F2; 
        padding:6px 12px; 
        margin:8px 0 0;
        border-radius:4px 4px 0 0;
    }

    /* ── Source Tags ── */
    .source-tag {
        font-size:11px;
        font-weight:700; 
        padding:3px 10px; 
        border-radius:10px;
        display:inline-block;
    }
    .source-tag.unboxing { background:#FEF3C7; color:#92400E; }
    .source-tag.linefeeding { background:#FEE2E2; color:#991B1B; }

    /* ── Status Styles ── */
    .status-pending { color:#92400E; font-weight:700; }
    .status-inprogress { color:#1D4ED8; font-weight:700; }
    .status-awaiting { color:#7C3AED; font-weight:700; }
    .status-notstarted { color:#6B7280; font-weight:700; }

    /* ── Empty State ── */
    .empty-note { 
        text-align:center; 
        padding:14px; 
        color:#6B7280; 
        font-size:13px; 
        margin:0;
        background:#F9FAFB;
        border-radius:4px;
    }

    /* ── Footer ── */
    .report-footer { 
        text-align:center; 
        font-size:11px; 
        color:#6B7280; 
        margin:18px 0 0; 
        padding-top:8px; 
        border-top:1px solid #E5E7EB; 
    }
</style>
</head>
<body>

<div class="pdf-header">
    <div class="header-table">
        <div class="header-logo-cell">
            @if ($logoPath)<img src="{{ $logoPath }}">@endif
        </div>
        <div class="header-text-cell">
            <div class="org-name">{{ $structure->name ?? 'Organization Name Not Found' }}</div>
            <div class="org-motto">{{ $structure->motto ?? '' }}</div>
            <div class="org-contact">
                P.O. Box: {{ $structure->pobox ?? 'N/A' }} | Email: {{ $structure->email ?? 'N/A' }} | {{ $structure->physaddres ?? 'N/A' }}
            </div>
        </div>
    </div>
    <div class="report-heading">Line Feeding Report — Issues &amp; Pending Stations</div>
</div>

<div class="meta-grid">
    <div class="meta-cell">
        <div class="meta-label">Lot Number</div>
        <div class="meta-value">{{ $lot->lotnum }}</div>
    </div>
    <div class="meta-cell">
        <div class="meta-label">Customer</div>
        <div class="meta-value">{{ $lot->cname }}</div>
    </div>
    <div class="meta-cell">
        <div class="meta-label">Model</div>
        <div class="meta-value">{{ $lot->mname }}</div>
    </div>
    <div class="meta-cell">
        <div class="meta-label">Generated</div>
        <div class="meta-value">{{ $generatedAt }}</div>
    </div>
</div>

<div class="summary-bar">
    <div class="summary-cell total">
        <div class="summary-num">{{ $completedCount }} / {{ $totalStations }}</div>
        <div class="summary-lbl">Stations Completed</div>
    </div>
    <div class="summary-cell pending">
        <div class="summary-num">{{ count($pendingStationRows) }}</div>
        <div class="summary-lbl">Pending Stations</div>
    </div>
    <div class="summary-cell nok">
        <div class="summary-num">{{ $nokGroups->flatten(1)->count() }}</div>
        <div class="summary-lbl">Flagged Parts (NOK)</div>
    </div>
</div>

{{-- ── Section 1: NOK Issues, grouped by station ── --}}
<div class="section-title">
    <span style="color:#991B1B;">⚠</span>&nbsp; Flagged Issues (NOK)
</div>

@if ($nokGroups->isEmpty())
    <div class="empty-note">No NOK issues recorded for this lot.</div>
@else
    @foreach ($nokGroups as $station => $issues)
    <div class="station-group-title">Station: {{ $station }} &nbsp;·&nbsp; {{ $issues->count() }} issue(s)</div>
    <table class="data-table nok-table">
        <thead>
            <tr>
                <th style="width:14%;">Part Number</th>
                <th style="width:26%;">Description</th>
                <th style="width:12%;">Source</th>
                <th style="width:26%;">Comment</th>
                <th style="width:12%;">Checked By</th>
                <th style="width:10%;">Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($issues as $issue)
            <tr>
                <td>{{ $issue['partnum'] }}</td>
                <td>{{ $issue['partdesc'] }}</td>
                <td>
                    <span class="source-tag {{ $issue['source'] === 'Unboxing' ? 'unboxing' : 'linefeeding' }}">
                        {{ $issue['source'] }}
                    </span>
                </td>
                <td>{{ $issue['comment'] ?? '—' }}</td>
                <td>{{ $issue['checked_by_name'] }}</td>
                <td>{{ \Carbon\Carbon::parse($issue['checked_at'])->format('d M, H:i') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endforeach
@endif

{{-- ── Section 2: Pending Stations ── --}}
<div class="section-title">
    <span style="color:#92400E;">⏳</span>&nbsp; Pending Stations
</div>

@if (count($pendingStationRows) === 0)
    <div class="empty-note">All stations have been completed for this lot.</div>
@else
<table class="data-table pending-table">
    <thead>
        <tr>
            <th style="width:25%;">Station</th>
            <th style="width:18%;">Parts Required</th>
            <th style="width:18%;">Total Qty Required</th>
            <th style="width:18%;">Parts Reviewed</th>
            <th style="width:21%;">Status</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($pendingStationRows as $row)
        <tr>
            <td>{{ $row['station'] }}</td>
            <td>{{ $row['required_parts'] }}</td>
            <td>{{ $row['required_qty'] }}</td>
            <td>{{ $row['parts_reviewed'] }} / {{ $row['required_parts'] }}</td>
            <td class="status-{{ strtolower(str_replace(' ', '', $row['status'])) }}">
                {{ $row['status'] }}
            </td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif

<div class="report-footer">
    Lot {{ $lot->lotnum }} &nbsp;·&nbsp;
    {{ $completedCount }} of {{ $totalStations }} stations completed &nbsp;·&nbsp;
    {{ $nokGroups->flatten(1)->count() }} flagged issue(s) &nbsp;·&nbsp;
    {{ count($pendingStationRows) }} station(s) pending
</div>

</body>
</html>