<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Unboxing Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            color: #1F2937;
            background: #fff;
            margin: 18px 28px 28px 28px;   /* page margins: top, right, bottom, left */
        }

        /* ── Header — excluded from page margins ── */
        .pdf-header {
            background: #F0F0F0;
            padding: 10px 15px;
            border-bottom: 2px solid #003366;
            margin-bottom: 14px;
            margin-left: -28px;           /* pull header outside left margin */
            margin-right: -28px;          /* pull header outside right margin */
            margin-top: -18px;            /* pull header outside top margin */
            padding-left: 28px;
            padding-right: 28px;
        }

        .header-table {
            width: 100%;
            display: table;
        }
        .header-logo-cell {
            display: table-cell;
            width: 70px;
            vertical-align: middle;
        }
        .header-logo-cell img {
            width: 60px;
        }
        .header-text-cell {
            display: table-cell;
            vertical-align: middle;
            padding-left: 10px;
        }
        .org-name {
            font-size: 18px;
            font-weight: bold;
            color: #003366;
        }
        .org-motto {
            font-size: 11px;
            font-style: italic;
            color: #646464;
            margin-top: 2px;
        }
        .org-contact {
            font-size: 9px;
            color: #646464;
            margin-top: 2px;
        }

        .report-heading {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            color: #000;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid #999;
        }

        /* ── Lot meta info ── */
        .meta-grid {
            display: table;
            width: 100%;
            margin: 14px 0 16px;
        }
        .meta-cell {
            display: table-cell;
            width: 25%;
            padding: 8px 12px;
            background: #F3F4F6;
            border-right: 3px solid #fff;
            vertical-align: top;
        }
        .meta-label {
            font-size: 9px;
            color: #4B5563;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 2px;
        }
        .meta-value {
            font-size: 14px;
            font-weight: 700;
            color: #1F2937;
        }

        /* ── Summary bar ── */
        .summary-bar {
            display: table;
            width: 100%;
            margin-bottom: 18px;
        }
        .summary-cell {
            display: table-cell;
            text-align: center;
            padding: 10px 6px;
            width: 33.33%;
            border-radius: 4px;
        }
        .summary-cell.total {
            background: #EFF6FF;
            color: #1D4ED8;
        }
        .summary-cell.ok {
            background: #ECFDF5;
            color: #065F46;
        }
        .summary-cell.short {
            background: #FEF2F2;
            color: #991B1B;
        }
        .summary-num {
            font-size: 22px;
            font-weight: 700;
        }
        .summary-lbl {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-top: 3px;
        }

        /* ── Boxcase group block ── */
        .case-block {
            margin: 0 0 22px 0;           /* no left/right margin, uses page margins */
        }

        .case-header {
            background: #003366;
            color: #fff;
            padding: 10px 14px;
            font-size: 15px;              /* increased from 11px */
            font-weight: 700;
            border-radius: 4px 4px 0 0;
            letter-spacing: 0.3px;
        }

        /* ── Table inside case-block ── */
        table.parts-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;              /* increased from 9px */
        }

        .parts-table thead th {
            background: #374151;
            color: #fff;
            padding: 8px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;              /* increased from 8px */
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        .parts-table tbody tr:nth-child(even) {
            background: #F9FAFB;
        }
        .parts-table tbody td {
            padding: 8px 8px;             /* more breathing */
            border-bottom: 1px solid #E5E7EB;
            font-size: 13px;              /* consistent with table base */
        }

        /* column widths (kept as before, but font-size inside is bigger) */
        .col-count {
            width: 5%;
            text-align: center;
        }
        .col-partnum {
            width: 14%;
        }
        .col-desc {
            width: 26%;
        }
        .col-qreq {
            width: 8%;
            text-align: center;
        }
        .col-qunbox {
            width: 8%;
            text-align: center;
        }
        .col-qshort {
            width: 8%;
            text-align: center;
        }
        .col-remarks {
            width: 18%;
        }
        .col-checked {
            width: 13%;
        }

        /* badges & status indicators */
        .badge-ok {
            background: #D1FAE5;
            color: #065F46;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;              /* increased from 8px */
            font-weight: 700;
            display: inline-block;
            margin-left: 6px;
        }
        .badge-nok {
            background: #FEE2E2;
            color: #991B1B;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;              /* increased from 8px */
            font-weight: 700;
            display: inline-block;
            margin-left: 6px;
        }
        .qty-short-flag {
            color: #DC2626;
            font-weight: 700;
            font-size: 14px;              /* extra emphasis */
        }
        .qty-short-zero {
            color: #9CA3AF;
            font-size: 13px;
        }

        .report-footer {
            text-align: center;
            font-size: 10px;              /* increased from 8px */
            color: #6B7280;
            margin: 20px 0 0 0;
            padding-top: 8px;
            border-top: 1px solid #E5E7EB;
        }

        /* small extra: meta & summary inside page margins */
        .meta-grid,
        .summary-bar,
        .report-footer {
            margin-left: 0;
            margin-right: 0;
        }

        .image-row td {
    padding: 4px 6px 8px !important;
    border-bottom: 1px solid #E5E7EB;
}

.evidence-images-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    padding: 4px 0;
}

.evidence-label {
    font-size: 8px;
    font-weight: 700;
    color: #991B1B;
    text-transform: uppercase;
    margin-right: 4px;
}

.evidence-thumb {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border: 1px solid #FCA5A5;
    border-radius: 4px;
}
    </style>
</head>
<body>

    {{-- ── Header (mirrors FPDF Header() structure) ── --}}
    <div class="pdf-header">
        <div class="header-table">
            <div class="header-logo-cell">
                @if ($logoPath)
                    <img src="{{ $logoPath }}" alt="logo">
                @endif
            </div>
            <div class="header-text-cell">
                <div class="org-name">{{ $structure->name ?? 'Organization Name Not Found' }}</div>
                <div class="org-motto">{{ $structure->motto ?? '' }}</div>
                <div class="org-contact">
                    P.O. Box: {{ $structure->pobox ?? 'N/A' }} |
                    Email: {{ $structure->email ?? 'N/A' }} |
                    {{ $structure->physaddres ?? 'N/A' }}
                </div>
            </div>
        </div>
        <div class="report-heading">Unboxing Report</div>
    </div>

    {{-- ── Lot Meta ── --}}
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

    {{-- ── Summary Bar ── --}}
    <div class="summary-bar">
        <div class="summary-cell total">
            <div class="summary-num">{{ $totalParts }}</div>
            <div class="summary-lbl">Total Parts Checked</div>
        </div>
        <div class="summary-cell ok">
            <div class="summary-num">{{ $okParts }}</div>
            <div class="summary-lbl">OK</div>
        </div>
        <div class="summary-cell short">
            <div class="summary-num">{{ $shortParts }}</div>
            <div class="summary-lbl">Short / Flagged</div>
        </div>
    </div>

    {{-- ── One block per boxcase ── --}}
    @foreach ($unboxrecords as $boxcase => $parts)
        <div class="case-block">
            <div class="case-header">
                Case: {{ $boxcase }} &nbsp;·&nbsp; {{ $parts->count() }} part(s)
            </div>

            <table class="parts-table">
                <thead>
                    <tr>
                        <th class="col-count">Count</th>
                        <th class="col-partnum">Part Number</th>
                        <th class="col-desc">Part Description</th>
                        <th class="col-qreq">Qty Req.</th>
                        <th class="col-qunbox">Q Unboxed</th>
                        <th class="col-qshort">Q Short</th>
                        <th class="col-remarks">Remarks</th>
                        <th class="col-checked">Checked By</th>
                    </tr>
                </thead>
                <tbody>
    @foreach ($parts as $i => $part)
        <tr>
            <td class="col-count">{{ $i + 1 }}</td>
            <td class="col-partnum">{{ $part->partnum }}</td>
            <td class="col-desc">{{ $part->partdesc }}</td>
            <td class="col-qreq">{{ $part->required_qty }}</td>
            <td class="col-qunbox">{{ $part->counted_qty }}</td>
            <td class="col-qshort">
                @if ($part->qty_short > 0)
                    <span class="qty-short-flag">{{ $part->qty_short }}</span>
                @else
                    <span class="qty-short-zero">0</span>
                @endif
            </td>
            <td class="col-remarks">
                {{ $part->comment ?? '—' }}
                @if ($part->status === 'NOK')
                    <span class="badge-nok">NOK</span>
                @else
                    <span class="badge-ok">OK</span>
                @endif
                
                {{-- Display images if they exist --}}
                @if(isset($part->image_data) && $part->image_data->isNotEmpty())
                    <div class="issue-images" style="margin-top: 6px;">
                        @foreach($part->image_data as $imageData)
                            <img src="{{ $imageData }}" alt="Issue image" 
                                 style="max-width: 80px; max-height: 80px; margin: 3px; 
                                        border: 1px solid #ddd; border-radius: 4px; 
                                        display: inline-block; object-fit: cover;">
                        @endforeach
                    </div>
                @endif
            </td>
            <td class="col-checked">{{ $part->checked_by_name }}</td>
        </tr>
    @endforeach
</tbody>
            </table>
        </div>
    @endforeach

    <div class="report-footer">
        Lot {{ $lot->lotnum }} &nbsp;·&nbsp;
        {{ $totalParts }} parts checked across {{ $unboxrecords->count() }} case(s) &nbsp;·&nbsp;
        Technician(s): {{ $technicians->implode(', ') }}
    </div>

</body>
</html>