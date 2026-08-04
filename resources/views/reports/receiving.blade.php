<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Container Receiving Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;             /* base increased */
            color: #1F2937;
            background: #fff;
            margin: 18px 28px 28px 28px;   /* page margins: top, right, bottom, left */
        }

        /* ── Organization Header — excluded from page margins ── */
        .org-header {
            display: table;
            width: 100%;
            padding: 16px 28px;
            background: #fff;
            border-bottom: 4px solid #1E3A5F;
            margin-bottom: 18px;
            margin-left: -28px;           /* pull outside left margin */
            margin-right: -28px;          /* pull outside right margin */
            margin-top: -18px;            /* pull outside top margin */
            padding-left: 28px;
            padding-right: 28px;
            width: calc(100% + 56px);     /* full width including margins */
        }
        .org-header-left {
            display: table-cell;
            vertical-align: middle;
            width: 80px;
        }
        .org-header-left img {
            max-width: 70px;
            max-height: 70px;
            object-fit: contain;
        }
        .org-header-right {
            display: table-cell;
            vertical-align: middle;
            padding-left: 16px;
        }
        .org-name {
            font-size: 18px;              /* increased */
            font-weight: 700;
            color: #1E3A5F;
            margin-bottom: 2px;
        }
        .org-motto {
            font-size: 12px;              /* increased */
            color: #6B7280;
            font-style: italic;
            margin-bottom: 4px;
        }
        .org-details {
            font-size: 10px;              /* increased */
            color: #6B7280;
            line-height: 1.5;
        }

        /* ── Cover / Header — excluded from page margins ── */
        .report-header {
            background: #1E3A5F;
            color: #fff;
            padding: 20px 28px;
            margin-bottom: 22px;
            margin-left: -28px;
            margin-right: -28px;
            padding-left: 28px;
            padding-right: 28px;
            width: calc(100% + 56px);
        }
        .report-header h1 {
            font-size: 20px;              /* increased */
            font-weight: 700;
            margin-bottom: 4px;
        }
        .report-header p {
            font-size: 13px;              /* increased */
            opacity: 0.85;
        }

        /* ── Meta grid ── */
        .meta-grid {
            display: table;
            width: 100%;
            margin-bottom: 18px;
        }
        .meta-cell {
            display: table-cell;
            width: 25%;
            padding: 10px 14px;
            background: #F3F4F6;
            border-right: 3px solid #fff;
            vertical-align: top;
        }
        .meta-label {
            font-size: 10px;              /* increased */
            color: #4B5563;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 3px;
        }
        .meta-value {
            font-size: 15px;              /* increased */
            font-weight: 700;
            color: #1F2937;
        }

        /* ── Summary bar ── */
        .summary-bar {
            display: table;
            width: 100%;
            margin-bottom: 22px;
            border-radius: 6px;
            overflow: hidden;
        }
        .summary-cell {
            display: table-cell;
            text-align: center;
            padding: 12px 10px;
            width: 33.33%;
        }
        .summary-cell.total {
            background: #EFF6FF;
            color: #1D4ED8;
        }
        .summary-cell.ok {
            background: #ECFDF5;
            color: #065F46;
        }
        .summary-cell.nok {
            background: #FEF2F2;
            color: #991B1B;
        }
        .summary-num {
            font-size: 26px;              /* increased */
            font-weight: 700;
        }
        .summary-lbl {
            font-size: 10px;              /* increased */
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-top: 3px;
        }

        /* ── Container block ── */
        .container-block {
            page-break-after: always;
            padding: 0 0 24px 0;          /* no left/right padding, uses page margins */
        }
        .container-block:last-child {
            page-break-after: avoid;
        }

        .container-header {
            background: #1E3A5F;
            color: #fff;
            padding: 10px 14px;
            border-radius: 6px 6px 0 0;
            margin-bottom: 0;
            display: table;
            width: 100%;
        }
        .container-header-left {
            display: table-cell;
            font-size: 16px;              /* increased */
            font-weight: 700;
        }
        .container-header-right {
            display: table-cell;
            text-align: right;
            font-size: 12px;              /* increased */
            opacity: 0.85;
        }

        /* ── Cases table ── */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;              /* increased from 10px */
        }
        thead th {
            background: #374151;
            color: #fff;
            padding: 8px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;              /* increased from 9px */
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        tbody tr:nth-child(even) {
            background: #F9FAFB;
        }
        tbody tr:nth-child(odd) {
            background: #fff;
        }
        tbody td {
            padding: 8px 10px;            /* more padding */
            border-bottom: 1px solid #E5E7EB;
            font-size: 13px;
        }

        .badge-ok {
            background: #D1FAE5;
            color: #065F46;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 12px;              /* increased */
            font-weight: 700;
            display: inline-block;
        }
        .badge-nok {
            background: #FEE2E2;
            color: #991B1B;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 12px;              /* increased */
            font-weight: 700;
            display: inline-block;
        }

        /* ── Footer ── */
        .report-footer {
            text-align: center;
            font-size: 11px;              /* increased */
            color: #6B7280;
            margin-top: 16px;
            padding-top: 10px;
            border-top: 1px solid #E5E7EB;
        }
    </style>
</head>
<body>

    {{-- ── Organization Header ── --}}
    @if($structure)
        <div class="org-header">
            @if($logoPath)
                <div class="org-header-left">
                    <img src="{{ $logoPath }}" alt="{{ $structure->name }} Logo">
                </div>
            @endif
            <div class="org-header-right">
                <div class="org-name">{{ $structure->name }}</div>
                @if($structure->motto)
                    <div class="org-motto">"{{ $structure->motto }}"</div>
                @endif
                <div class="org-details">
                    @if($structure->pobox)P.O. Box {{ $structure->pobox }} &nbsp;·&nbsp; @endif
                    @if($structure->email){{ $structure->email }} &nbsp;·&nbsp; @endif
                    @if($structure->physaddres){{ $structure->physaddres }}@endif
                </div>
            </div>
        </div>
    @endif

    {{-- ── Report Header ── --}}
    <div class="report-header">
        <h1>Container Receiving Report</h1>
        <p>Lot: {{ $lot->lotnum }} &nbsp;|&nbsp; Generated: {{ $generatedAt }}</p>
    </div>

    {{-- ── Lot Meta ── --}}
    <div class="meta-grid">
        <div class="meta-cell">
            <div class="meta-label">Customer</div>
            <div class="meta-value">{{ $lot->cname }}</div>
        </div>
        <div class="meta-cell">
            <div class="meta-label">Model</div>
            <div class="meta-value">{{ $lot->mname }}</div>
        </div>
        <div class="meta-cell">
            <div class="meta-label">Technician(s)</div>
            <div class="meta-value">{{ implode(', ', $technicians) ?: 'N/A' }}</div>
        </div>
        <div class="meta-cell">
            <div class="meta-label">Time Taken</div>
            <div class="meta-value">{{ $timeTaken ?? 'N/A' }}</div>
        </div>
    </div>

    {{-- ── Summary Bar ── --}}
    <div class="summary-bar">
        <div class="summary-cell total">
            <div class="summary-num">{{ $totalCases }}</div>
            <div class="summary-lbl">Total Cases</div>
        </div>
        <div class="summary-cell ok">
            <div class="summary-num">{{ $okCount }}</div>
            <div class="summary-lbl">OK</div>
        </div>
        <div class="summary-cell nok">
            <div class="summary-num">{{ $nokCount }}</div>
            <div class="summary-lbl">NOK</div>
        </div>
    </div>

    {{-- ── One page per container ── --}}
    @foreach ($containers as $containerNo => $cases)
        <div class="container-block">

            <div class="container-header">
                <div class="container-header-left">
                    Container: {{ $containerNo }}
                </div>
                <div class="container-header-right">
                    Seal: {{ $cases->first()->sealno }}
                    &nbsp;|&nbsp;
                    {{ $cases->count() }} cases
                    &nbsp;|&nbsp;
                    OK: {{ $cases->where('status', 'OK')->count() }}
                    &nbsp;|&nbsp;
                    NOK: {{ $cases->where('status', 'NOK')->count() }}
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Case No</th>
                        <th>Status</th>
                        <th>Comment</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($cases as $i => $case)
                        <tr>
                            <td>{{ $i + 1 }}</td>
                            <td>{{ $case->caseno }}</td>
                            <td>
                                @if ($case->status === 'OK')
                                    <span class="badge-ok">OK</span>
                                @else
                                    <span class="badge-nok">NOK</span>
                                @endif
                            </td>
                            <td>{{ $case->comment ?? '—' }}</td>
                            <td>{{ $case->timein ?? '—' }}</td>
                            <td>{{ $case->timeout ?? '—' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

        </div>
    @endforeach

    <div class="report-footer">
        @if($structure){{ $structure->name }} &nbsp;·&nbsp; @endif
        Lot {{ $lot->lotnum }} &nbsp;·&nbsp;
        {{ $totalCases }} total cases &nbsp;·&nbsp;
        Receiving started {{ $startTime ? $startTime->format('d M Y H:i') : 'N/A' }}
        &nbsp;·&nbsp;
        Completed {{ $endTime ? $endTime->format('d M Y H:i') : 'N/A' }}
    </div>

</body>
</html>