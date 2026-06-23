var auditTable = $('#audit-table').DataTable({
    processing: true,
    serverSide: true,
    ajax: {
        url: App.routes.auditgetData,
        type: 'GET',
        data: function(d) {
            d.report_type = $('select[name="report_type"]').val();
            d.user_id     = $('select[name="user_id"]').val();
            d.action      = $('select[name="action"]').val();
            d.table_name  = $('select[name="table_name"]').val();
            d.record_id   = $('input[name="record_id"]').val();
            d.from_date   = $('input[name="from_date"]').val();
            d.to_date     = $('input[name="to_date"]').val();
        }
    },
    columns: [
        {
            data: null, orderable: false,
            className: 'details-control',
            defaultContent: '<span class="material-icons">add_circle_outline</span>',
            width: '36px'
        },
        { data: 'id', title: 'ID' },
        {
            data: 'created_at', title: 'Date & Time',
            render: function(data) {
                return moment ? moment(data).format('YYYY-MM-DD HH:mm:ss') : data;
            }
        },
        {
            data: 'user_name', title: 'User',
            render: function(data, type, row) {
                return data + ' <span class="spancar" >(#' + row.user_id + ')</span>';
            }
        },
        {
            data: 'action', title: 'Action',
            render: function(data) {
                return '<span class="action-badge ' + data + '">' + data + '</span>';
            }
        },
        { data: 'table_name', title: 'Table' },
        { data: 'record_id',  title: 'Record ID' },
        { data: 'ip_address', title: 'IP' }
    ],
    order: [[1, 'desc']],
    pageLength: 50,
    dom: 'rtp',
    language: {
        processing: '<span class="spanloading" >Loading…</span>',
        emptyTable:  'No audit records found. Apply filters and click View Report.',
        zeroRecords: 'No records match your search.'
    },
    drawCallback: function() {
        var info    = this.api().page.info();
        var total   = info.recordsTotal.toLocaleString();
        var display = info.recordsDisplay.toLocaleString();
        document.getElementById('recordCount').textContent =
            info.recordsTotal === info.recordsDisplay
                ? total + ' records'
                : display + ' of ' + total + ' records';
    }
});

/* ── Custom search + page length ─────────────────────────── */
var searchTimer;
document.getElementById('dt-search').addEventListener('input', function() {
    clearTimeout(searchTimer);
    var val = this.value;
    searchTimer = setTimeout(function() { auditTable.search(val).draw(); }, 350);
});

document.getElementById('dt-length').addEventListener('change', function() {
    auditTable.page.len(parseInt(this.value)).draw();
});

/* ── Form submit → reload ────────────────────────────────── */
$('#auditFilterForm').on('submit', function(e) {
    e.preventDefault();
    auditTable.ajax.reload();
});

/* ── Expandable row ──────────────────────────────────────── */
$('#audit-table tbody').on('click', 'td.details-control', function() {
    var tr   = $(this).closest('tr');
    var row  = auditTable.row(tr);
    var icon = $(this).find('.material-icons');

    if (row.child.isShown()) {
        row.child.hide();
        tr.removeClass('shown');
        icon.text('add_circle_outline');
    } else {
        row.child(formatDetails(row.data())).show();
        tr.addClass('shown');
        icon.text('remove_circle_outline');
    }
});

function formatDetails(d) {
    var oldValues   = d.old_values   ? JSON.parse(d.old_values)   : {};
    var newValues   = d.new_values   ? JSON.parse(d.new_values)   : {};
    var contextData = d.context_data ? JSON.parse(d.context_data) : {};
    var allKeys     = new Set(Object.keys(oldValues).concat(Object.keys(newValues)));

    var html = '<div class="detail-wrap"><div class="detail-grid">';

    // Changes table
    if (allKeys.size > 0) {
        html += '<div class="detail-section detail-full">';
        html += '<p class="detail-section-title">Changes</p>';
        html += '<table class="diff-table"><thead><tr><th>Field</th><th>Old Value</th><th>New Value</th></tr></thead><tbody>';

        allKeys.forEach(function(key) {
            var oldV    = oldValues[key] !== undefined ? oldValues[key] : '<em class="opacityem" >—</em>';
            var newV    = newValues[key] !== undefined ? newValues[key] : '<em class="opacityem" >—</em>';
            var changed = String(oldValues[key]) !== String(newValues[key]) ? 'changed' : '';
            html += '<tr class="' + changed + '"><td><strong>' + key + '</strong></td>'
                  + '<td class="diff-old">' + oldV + '</td>'
                  + '<td class="diff-new">' + newV + '</td></tr>';
        });

        html += '</tbody></table></div>';
    }

    // Context
    if (Object.keys(contextData).length > 0) {
        html += '<div class="detail-section">';
        html += '<p class="detail-section-title">Context</p>';
        html += '<pre class="context-pre">' + JSON.stringify(contextData, null, 2) + '</pre>';
        html += '</div>';
    }

    // User agent
    if (d.user_agent) {
        html += '<div class="detail-section">';
        html += '<p class="detail-section-title">User Agent</p>';
        html += '<p class="user-agent-txt">' + d.user_agent + '</p>';
        html += '</div>';
    }

    html += '</div></div>';
    return html;
}

/* ── Quick date range ────────────────────────────────────── */
$('#quick_range').on('change', function() {
    var val   = $(this).val();
    var today = new Date();
    var fmt   = function(d) { return d.toISOString().split('T')[0]; };
    var from  = $('input[name="from_date"]');
    var to    = $('input[name="to_date"]');

    if (val === 'today') {
        from.val(fmt(today)); to.val(fmt(today));
    } else if (val === 'yesterday') {
        var y = new Date(today); y.setDate(y.getDate() - 1);
        from.val(fmt(y)); to.val(fmt(y));
    } else if (val === 'last7') {
        var d7 = new Date(today); d7.setDate(d7.getDate() - 6);
        from.val(fmt(d7)); to.val(fmt(today));
    } else if (val === 'last30') {
        var d30 = new Date(today); d30.setDate(d30.getDate() - 29);
        from.val(fmt(d30)); to.val(fmt(today));
    } else if (val === 'thismonth') {
        from.val(fmt(new Date(today.getFullYear(), today.getMonth(), 1)));
        to.val(fmt(today));
    } else if (val === 'lastmonth') {
        from.val(fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1)));
        to.val(fmt(new Date(today.getFullYear(), today.getMonth(), 0)));
    }
});

/* ── Conditional filter show/hide ────────────────────────── */
$('select[name="report_type"]').on('change', function() {
    var val = $(this).val();
    $('#user_filter').toggle(val === 'user_activity' || val === 'comprehensive');
    $('#action_filter').toggle(val === 'action_type'  || val === 'comprehensive');
    $('#table_filter').toggle(val === 'table_activity' || val === 'comprehensive');
    $('#record_filter').toggle(val === 'record_history');
});

/* ── Export Excel ────────────────────────────────────────── */
$('#export-excel').on('click', function() {
    window.location.href = `${App.routes.auditexcel}?` + $('#auditFilterForm').serialize();
});

/* ── PDF preview modal ───────────────────────────────────── */
var currentFilterData = '';

$('#export-pdf').on('click', function(e) {
    e.preventDefault();
    currentFilterData = $('#auditFilterForm').serialize();

    document.getElementById('pdfPreviewModal').classList.add('open');
    document.getElementById('pdfLoading').style.display = 'flex';

    var old = document.getElementById('pdfContainer').querySelector('iframe');
    if (old) old.remove();

    var iframe = document.createElement('iframe');
    iframe.src = `${App.routes.auditviewPdf}?` + currentFilterData + '#toolbar=0&navpanes=0';
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    iframe.onload = function() {
        document.getElementById('pdfLoading').style.display = 'none';
    };
    document.getElementById('pdfContainer').appendChild(iframe);
});

$('#downloadPdfBtn').on('click', function() {
    window.location.href = `${App.routes.auditexportPdf}?` + currentFilterData;
});

/* Close PDF modal */
function closePdfModal() {
    document.getElementById('pdfPreviewModal').classList.remove('open');
    var old = document.getElementById('pdfContainer').querySelector('iframe');
    if (old) old.remove();
    document.getElementById('pdfLoading').style.display = 'flex';
}

document.getElementById('closePdfModal').addEventListener('click', closePdfModal);

document.getElementById('pdfPreviewModal').addEventListener('click', function(e) {
    if (e.target === this) closePdfModal();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closePdfModal();
}); 