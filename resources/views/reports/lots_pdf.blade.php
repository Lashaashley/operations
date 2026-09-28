<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Lot Tracking Export</title>
    <style>
        @page {
            margin: 30px 25px;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            color: #1f2937;
        }

        .header {
            margin-bottom: 16px;
        }

        .header h1 {
            font-size: 16px;
            margin: 0 0 4px 0;
        }

        .header .meta {
            font-size: 10px;
            color: #6b7280;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead th {
            background-color: #f3f4f6;
            border-bottom: 2px solid #d1d5db;
            text-align: left;
            padding: 6px 8px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            color: #374151;
        }

        tbody td {
            padding: 6px 8px;
            border-bottom: 1px solid #e5e7eb;
        }

        tbody tr:nth-child(even) {
            background-color: #fafafa;
        }

        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 9px;
            font-weight: 600;
            color: #fff;
        }

        .text-right {
            text-align: right;
        }

        .footer {
            position: fixed;
            bottom: -20px;
            left: 0;
            right: 0;
            font-size: 9px;
            color: #9ca3af;
            text-align: center;
        }

        .empty {
            text-align: center;
            padding: 20px;
            color: #9ca3af;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1>Lot Tracking Report</h1>
        <div class="meta">
            Generated {{ now()->format('M d, Y H:i') }}
            @if(!empty($search))
                &nbsp;·&nbsp; Filtered by: "{{ $search }}"
            @endif
            &nbsp;·&nbsp; {{ count($rows) }} {{ count($rows) === 1 ? 'record' : 'records' }}
        </div>
    </div>

    @if(count($rows) === 0)
        <div class="empty">No records found.</div>
    @else
        <table>
            <thead>
                <tr>
                    <th>Lot Number</th>
                    <th>Units</th>
                    <th>Customer</th>
                    <th>Model</th>
                    <th>Status</th>
                    <th class="text-right">Age (days)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($rows as $row)
                    <tr>
                        <td>{{ $row['LotNumber'] }}</td>
                        <td>{{ $row['Units'] }}</td>
                        <td>{{ $row['Customer'] ?? '—' }}</td>
                        <td>{{ $row['Model'] ?? '—' }}</td>
                        <td>
                            <span class="status-badge" style="background-color: {{ $row['StatusColor'] ?? '#6B7280' }};">
                                {{ $row['Status'] }}
                            </span>
                        </td>
                        <td class="text-right">{{ $row['Age'] !== null ? $row['Age'] . ' d' : '—' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div class="footer">
        Page <span class="pagenum"></span>
    </div>

</body>
</html>