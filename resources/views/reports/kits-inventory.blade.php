<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kits Inventory Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            color: #1F2937;
            background: #fff;
            margin: 18px 28px 28px 28px;   /* page margins: top, right, bottom, left */
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
            font-size: 12px;
            font-style: italic;
            color: #646464;
            margin-top: 2px;
        }
        .org-contact {
            font-size: 10px;
            color: #646464;
            margin-top: 2px;
        }
        .report-heading {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px solid #999;
        }

        /* ── Section title ── */
        .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #1F2937;
            margin: 20px 0 10px 0;
        }

        /* ── Top-level totals ── */
        .totals-bar {
            display: table;
            width: 100%;
            margin: 0 0 18px 0;
        }
        .totals-cell {
            display: table-cell;
            text-align: center;
            padding: 12px 8px;
            width: 25%;
            border-radius: 4px;
        }
        .totals-cell.lots {
            background: #EFF6FF;
            color: #1D4ED8;
        }
        .totals-cell.units {
            background: #F5F3FF;
            color: #6D28D9;
        }
        .totals-cell.customers {
            background: #ECFDF5;
            color: #065F46;
        }
        .totals-cell.stale {
            background: #FEF2F2;
            color: #991B1B;
        }
        .totals-num {
            font-size: 24px;
            font-weight: 800;
        }
        .totals-lbl {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-top: 3px;
        }

        /* ── Summary tables ── */
        table.summary-table {
            width: 100%;
            margin: 0 0 16px 0;
            border-collapse: collapse;
            font-size: 13px;              /* increased */
        }
        .summary-table thead th {
            background: #374151;
            color: #fff;
            padding: 8px 10px;
            text-align: left;
            font-size: 11px;              /* increased */
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .summary-table tbody td {
            padding: 8px 10px;
            border-bottom: 1px solid #E5E7EB;
            font-size: 13px;
        }
        .summary-table tbody tr:nth-child(even) {
            background: #F9FAFB;
        }

        /* ── Detail table ── */
        table.detail-table {
            width: 100%;
            margin: 0 0 16px 0;
            border-collapse: collapse;
            font-size: 13px;              /* increased */
        }
        .detail-table thead th {
            background: #003366;
            color: #fff;
            padding: 8px 10px;
            text-align: left;
            font-size: 11px;              /* increased */
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .detail-table tbody td {
            padding: 8px 10px;
            border-bottom: 1px solid #E5E7EB;
            font-size: 13px;
        }
        .detail-table tbody tr:nth-child(even) {
            background: #F9FAFB;
        }
        .detail-table tbody tr.stale-row {
            background: #FEF2F2;
        }

        .station-badge {
            color: #fff;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 12px;              /* increased */
            font-weight: 700;
            white-space: nowrap;
            display: inline-block;
        }
        .age-warning {
            color: #DC2626;
            font-weight: 700;
            font-size: 14px;
        }

        /* ── Units sub-table ── */
        .units-subtable {
            width: 100%;
            margin-top: 6px;
            border-collapse: collapse;
            font-size: 12px;              /* increased */
        }
        .units-subtable td {
            padding: 4px 8px;
            border-bottom: 1px dashed #E5E7EB;
            color: #4B5563;
        }
        .units-subtable-wrap {
            padding: 6px 0 10px 24px;
        }

        .report-footer {
            text-align: center;
            font-size: 11px;              /* increased */
            color: #6B7280;
            margin: 18px 0 0 0;
            padding-top: 8px;
            border-top: 1px solid #E5E7EB;
        }

        .customer-group-title {
            font-size: 14px;
            font-weight: 700;
            color: #003366;
            margin: 14px 0 6px 0;
        }

        /* generated timestamp */
        .generated-timestamp {
            text-align: center;
            font-size: 11px;
            color: #6B7280;
            margin-bottom: 14px;
        }
    </style>
</head>
<body>

    {{-- ── Header ── --}}
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
        <div class="report-heading">Kits Inventory Report</div>
    </div>

    <div class="generated-timestamp">
        Generated: {{ $generatedAt }}
    </div>

    {{-- ── Overall Totals ── --}}
    <div class="totals-bar">
        <div class="totals-cell lots">
            <div class="totals-num">{{ $totals['total_lots'] }}</div>
            <div class="totals-lbl">Total Lots</div>
        </div>
        <div class="totals-cell units">
            <div class="totals-num">{{ $totals['total_units'] }}</div>
            <div class="totals-lbl">Total Units</div>
        </div>
        <div class="totals-cell customers">
            <div class="totals-num">{{ $totals['total_customers'] }}</div>
            <div class="totals-lbl">Customers</div>
        </div>
        <div class="totals-cell stale">
            <div class="totals-num">{{ $totals['stale_lots'] }}</div>
            <div class="totals-lbl">Stalled 3+ Days</div>
        </div>
    </div>

    {{-- ── Summary 1: Lots per Customer ── --}}
    <div class="section-title">Lots Summary by Customer</div>
    <table class="summary-table">
        <thead>
            <tr>
                <th>Customer</th>
                <th>No. of Lots</th>
                <th>Total Units</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($lotsPerCustomer as $row)
                <tr>
                    <td>{{ $row['customer'] }}</td>
                    <td>{{ $row['lot_count'] }}</td>
                    <td>{{ $row['unit_total'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    {{-- ── Summary 2: Units per Customer, by Model ── --}}
    <div class="section-title">Units by Customer &amp; Model</div>
    <table class="summary-table">
        <thead>
            <tr>
                <th>Customer</th>
                <th>Model</th>
                <th>Lots</th>
                <th>Units</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($unitsPerCustomerModel as $custRow)
                @foreach ($custRow['models'] as $i => $modelRow)
                    <tr>
                        <td>{{ $i === 0 ? $custRow['customer'] : '' }}</td>
                        <td>{{ $modelRow['model'] }}</td>
                        <td>{{ $modelRow['lot_count'] }}</td>
                        <td>{{ $modelRow['units'] }}</td>
                    </tr>
                @endforeach
            @endforeach
        </tbody>
    </table>

    {{-- ── Detail Table ── --}}
    <div class="section-title">Lot Details</div>
    <table class="detail-table">
        <thead>
            <tr>
                <th>Model</th>
                <th>Lot Number</th>
                <th>No. of Units</th>
                <th>Current Station</th>
                <th>Age at Station</th>
                <th>Age at KVM</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($detailRows as $row)
                <tr class="{{ $row['is_stale'] ? 'stale-row' : '' }}">
                    <td>{{ $row['model'] }}</td>
                    <td>{{ $row['lotnum'] }}</td>
                    <td>{{ $row['unitsno'] }}</td>
                    <td>
                        <span class="station-badge" style="background-color:{{ $row['station_color'] }};">
                            {{ $row['current_station'] }}
                        </span>
                    </td>
                    <td class="{{ $row['is_stale'] ? 'age-warning' : '' }}">
                        {{ $row['age_at_station'] }} {{ $row['is_stale'] ? '⚠' : '' }}
                    </td>
                    <td>{{ $row['age_at_kvm'] }}</td>
                </tr>

                @if ($includeUnits && isset($unitsByLot[$row['lot_id']]))
                    <tr>
                        <td colspan="6">
                            <div class="units-subtable-wrap">
                                <table class="units-subtable">
                                    <tr style="font-weight:700; color:#1F2937; font-size:12px;">
                                        <td style="width:30%;">Chassis Number</td>
                                        <td style="width:30%;">Engine Number</td>
                                    </tr>
                                    @foreach ($unitsByLot[$row['lot_id']] as $unit)
                                        <tr>
                                            <td>{{ $unit->chassis_number }}</td>
                                            <td>{{ $unit->engine_number }}</td>
                                        </tr>
                                    @endforeach
                                </table>
                            </div>
                        </td>
                    </tr>
                @endif
            @endforeach
        </tbody>
    </table>

    <div class="report-footer">
        {{ $totals['total_lots'] }} lots &nbsp;·&nbsp; {{ $totals['total_units'] }} total units &nbsp;·&nbsp;
        {{ $totals['total_customers'] }} customers &nbsp;·&nbsp;
        {{ $totals['stale_lots'] }} lot(s) flagged for stalling 3+ days
    </div>

</body>
</html>