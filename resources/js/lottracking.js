(function ($) {
    const backdrop = document.getElementById('updatekitsstatusModalBackdrop');

    function openCustomModal () {
        backdrop.classList.add('open');
        // Reset password section each open
        document.getElementById('enable_password_reset').checked = false;
        document.getElementById('password-reset-section').style.display = 'none';
    }

    function closeCustomModal () {
        backdrop.classList.remove('open');
    }

    // Patch $.fn.modal so musers.js calls work seamlessly
    $.fn.modal = function (action) {
        const el = this[0];
        if (!el) return this;

        if (action === 'show') {
            openCustomModal();
            // Fire expected Bootstrap events so any .on('shown.bs.modal') listeners work
            $(el).trigger('show.bs.modal').trigger('shown.bs.modal');
        } else if (action === 'hide') {
            closeCustomModal();
            $(el).trigger('hide.bs.modal').trigger('hidden.bs.modal');
        }
        return this;
    };

    // Close on backdrop click
    backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) closeCustomModal();
    });

    // Expose globals so close buttons work
    window._closeEditModal = closeCustomModal;

})(jQuery);
document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('export-excel').addEventListener('click', function () {
    const search = encodeURIComponent(document.getElementById('dt-search').value || '');
    window.location.href = `${App.routes.exportExcel}?search=${search}`;
});

document.getElementById('export-pdf').addEventListener('click', function () {
    const search = encodeURIComponent(document.getElementById('dt-search').value || '');
    window.location.href = `${App.routes.exportPdf}?search=${search}`;
});

    /* ── Close buttons ───────────────────────────────────── */
    ['modalCloseBtn','modalCancelBtn'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', function () {
            window._closeEditModal();
        });
    });

    /* ── Escape key ──────────────────────────────────────── */
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') window._closeEditModal();
    });

    /* ── DataTable ───────────────────────────────────────── */
    

    /* ── Custom search ───────────────────────────────────── */
    let searchTimer;
    document.getElementById('dt-search').addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        if (usersTable) {
            usersTable.search(this.value).draw();
        }
    }, 350);
});

    /* ── Page length ─────────────────────────────────────── */
    document.getElementById('dt-length').addEventListener('change', function () {
    if (usersTable) {
        usersTable.page.len(parseInt(this.value, 10)).draw();
    }
});

    /* ── Action dropdown ─────────────────────────────────── */
    // ── Action menu toggle (replaces inline onclick) ──────────────────
document.addEventListener('click', function (e) {
    const trigger = e.target.closest('[data-action="toggle-menu"]');

    if (trigger) {
        e.stopPropagation();
        const menu = trigger.closest('.action-wrap').querySelector('.action-menu');
        const isOpen = menu.classList.contains('open');

        // Close all open menus first
        document.querySelectorAll('.action-menu.open').forEach(function (m) {
            m.classList.remove('open');
        });

        // Toggle the clicked one
        if (!isOpen) menu.classList.add('open');
        return;
    }

    // Click outside — close all menus
    document.querySelectorAll('.action-menu.open').forEach(function (m) {
        m.classList.remove('open');
    });
});

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.action-wrap'))
            document.querySelectorAll('.action-menu.open').forEach(m => m.classList.remove('open'));
    });

  

    /* ── Toast ───────────────────────────────────────────── */
   // Add this helper once at the top of your file
function sanitize(str) {
    return $('<div>').text(String(str)).html();
}

function showToast(type, title, message) {
    const icons = { 
        success: 'check_circle', 
        danger: 'error_outline', 
        warning: 'warning_amber', 
        info: 'info' 
    };

    // Sanitize all remote inputs at entry point
    const safeType    = sanitize(type);
    const safeTitle   = sanitize(title);
    const safeMessage = sanitize(message);

    const iconSpan = $('<span>')
        .addClass('material-icons')
        .text(icons[safeType] || 'info');

    const strong = $('<strong>').text(safeTitle);

    const messageDiv = $('<div>')
        .append(strong)
        .append(document.createTextNode(' ' + safeMessage));

    const t = $('<div>')
        .addClass('toast-msg ' + safeType)
        .append(iconSpan)
        .append(messageDiv);

    $('#toastWrap').append(t);

    const dismiss = () => { t.addClass('leaving'); setTimeout(() => t.remove(), 300); };
    t.on('click', dismiss);
    setTimeout(dismiss, 5000);
}

    window.showMessage = function (msg, type) {
        showToast(type || 'info', 'Notice', msg);
    };

});
            $(document).ready(function() {

                loadtable(); 
});

// Load user data into modal






            // Show message function
            function showMessage(message, type) {
                var alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
                $('#status-message')
                    .removeClass('alert-success alert-danger')
                    .addClass(alertClass)
                    .find('#alert-message').text(message);
                $('#status-message').fadeIn().delay(3000).fadeOut();
            }
            
            let usersTable = null;
let activeLotId = null;

function loadtable() {
    if (usersTable) {
        usersTable.ajax.reload(null, false);
        return;
    }

    usersTable = $('#users-table').DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: App.routes.lottracking,
            type: 'GET',
            error: function () {
                showToast('danger', 'Error', 'Failed to load kit data.');
            }
        },
        columns: [
            { data: 'LotNumber',  orderable: true },
            { data: 'Units',      orderable: true },
            { data: 'Customer',   orderable: true },
            { data: 'Model',      orderable: true },
            {
                data: 'Status', orderable: false,
                render: function (data) {
                    return `<span style="
                        background-color: ${data.color};
                        color: #fff;
                        padding: 3px 10px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                        white-space: nowrap;
                    ">${data.label}</span>`;
                }
            },
            {
                data: 'Age', orderable: false,
                render: function (data) {
                    return data === null ? '—' : `${data} day${data === 1 ? '' : 's'}`;
                }
            },
            {
                data: 'actions', orderable: false, searchable: false,
                render: function (data) {
                    return `
                        <div class="action-wrap">
                            <button class="action-trigger" data-action="toggle-menu">
                                <span class="material-icons">more_horiz</span>
                            </button>
                            <div class="action-menu">
                                <a href="#" class="edit-kit" data-id="${data}">
                                    <span class="material-icons">edit</span> Update Kit
                                </a>
                            </div>
                        </div>`;
                }
            }
        ],
        order: [[0, 'asc']],
        pageLength: 25,
        dom: 'rtp',
        language: {
            processing: '<span style="color:var(--muted);font-size:13px;">Loading…</span>',
            emptyTable: 'No kits found.',
            zeroRecords: 'No kits match your search.'
        },
        drawCallback: function () {
            const info = this.api().page.info();
            const total = info.recordsTotal.toLocaleString();
            const display = info.recordsDisplay.toLocaleString();
            document.getElementById('recordCount').textContent =
                info.recordsTotal === info.recordsDisplay
                    ? `${total} kits`
                    : `${display} of ${total} kits`;
        }
    });
}


// ── Open modal ────────────────────────────────────────────────
$(document).on('click', '.edit-kit', function (e) {
    e.preventDefault();
    activeLotId = $(this).data('id');
    openLotModal(activeLotId);
});

function openLotModal(lotId) {
    // Reset modal state
    document.getElementById('modal-lotnum').textContent    = '—';
    document.getElementById('modal-customer').textContent  = '—';
    document.getElementById('modal-model').textContent     = '—';
    document.getElementById('modal-units').textContent     = '—';
    document.getElementById('modal-current-status').innerHTML = '—';
    document.getElementById('modal-history-timeline').innerHTML =
        '<p style="color:var(--muted);font-size:13px;">Loading…</p>';
    document.getElementById('modal-next-action').style.display    = 'none';
    document.getElementById('modal-completed-state').style.display = 'none';
    document.getElementById('advance-status-btn').style.display   = 'none';

    // Show modal
    document.getElementById('updatekitsstatusModalBackdrop').style.display = 'flex';

    // Fetch lot details
    const lotdetailurl = App.routes.lottrackingDetail.replace('__id__', lotId);
    fetch(lotdetailurl)
        .then(r => r.json())
        .then(data => renderModal(data))
        .catch(() => showToast('danger', 'Error', 'Failed to load lot details.'));
}

function renderModal(data) {
    const { lot, history, current, next_status, is_completed, in_queue } = data;

    // Lot info
    document.getElementById('modal-lotnum').textContent   = lot.lotnum;
    document.getElementById('modal-customer').textContent = lot.customer;
    document.getElementById('modal-model').textContent    = lot.model;
    document.getElementById('modal-units').textContent    = lot.units;

    // Current status badge
    const currentEl = document.getElementById('modal-current-status');
    if (in_queue) {
        currentEl.innerHTML = statusBadge('In Queue', '#6B7280');
    } else if (is_completed) {
        currentEl.innerHTML = statusBadge('Completed', '#10B981');
    } else if (current) {
        currentEl.innerHTML = statusBadge(current.status_name, current.color);
    }

    // History timeline
    const timelineEl = document.getElementById('modal-history-timeline');
    if (history.length === 0) {
        timelineEl.innerHTML =
            '<p style="color:var(--muted);font-size:13px;">No tracking history yet.</p>';
    } else {
        timelineEl.innerHTML = history.map((h, i) => `
            <div class="timeline-item">
                <div class="timeline-dot" style="background:${h.color}"></div>
                <div class="timeline-content">
                    <div class="timeline-status">
                        ${statusBadge(h.status_name, h.color)}
                        ${h.done
                            ? '<span class="timeline-done">✓ Done</span>'
                            : '<span class="timeline-active">● Active</span>'}
                    </div>
                    <div class="timeline-times">
                        <span>Started: ${formatDateTime(h.starttime)}</span>
                        ${h.done ? `<span>Ended: ${formatDateTime(h.endtime)}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Next status action / completed state
    if (is_completed) {
        document.getElementById('modal-completed-state').style.display = 'block';

    } else if (next_status) {
        document.getElementById('modal-next-action').style.display = 'block';
        document.getElementById('modal-next-status-preview').innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; 
                        padding:10px; border-radius:8px; background:#F9FAFB;">
                <span class="material-icons" style="color:var(--muted);">arrow_forward</span>
                <span style="font-size:13px; color:var(--muted);">Move to:</span>
                ${statusBadge(next_status.name, next_status.color)}
            </div>`;

        const advBtn = document.getElementById('advance-status-btn');
        advBtn.style.display = 'inline-flex';
        document.getElementById('advance-btn-label').textContent =
            `Move to ${next_status.name}`;
        advBtn.dataset.nextId   = next_status.id;
        advBtn.dataset.nextName = next_status.name;
    }
}


// ── Advance status ────────────────────────────────────────────
document.getElementById('advance-status-btn').addEventListener('click', function () {
    if (!activeLotId) return;

    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons">hourglass_top</span> Saving…';

    const activeloturl = App.routes.lottrackingAdvance.replace('__id__', activeLotId);

    fetch(activeloturl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
    })
    .then(r => r.json())
    .then(data => {
        if (data.error) throw new Error(data.error);

        showToast('success', 'Updated', data.message);
        closeModal();
        usersTable.ajax.reload(null, false); // refresh table without page reset
    })
    .catch(err => {
        showToast('danger', 'Error', err.message || 'Failed to advance status.');
        btn.disabled = false;
        btn.innerHTML =
            `<span class="material-icons">arrow_forward</span>
             <span id="advance-btn-label">${btn.dataset.nextName}</span>`;
    });
});


// ── Helpers ───────────────────────────────────────────────────
function statusBadge(label, color) {
    return `<span style="
        background-color: ${color};
        color: #fff;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
    ">${label}</span>`;
}

function formatDateTime(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function closeModal() {
    document.getElementById('updatekitsstatusModalBackdrop').style.display = 'none';
    activeLotId = null;
}

document.getElementById('modalCloseBtn').addEventListener('click',  closeModal);
document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
document.getElementById('updatekitsstatusModalBackdrop').addEventListener('click', function (e) {
    if (e.target === this) closeModal(); // click outside closes
});