document.addEventListener('DOMContentLoaded', function () {

    /* ── Tab switching ─────────────────────────────────────── */
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            const panel = document.getElementById('panel-' + this.dataset.tab);
            if (panel) panel.classList.add('active');
        });
    });

    /* Legacy openTab compatibility */
    window.openTab = function (event, tabId) {
        const btn = document.querySelector('[data-tab="' + tabId + '"]');
        if (btn) btn.click();
    };

    /* ── Module toggle ─────────────────────────────────────── */
    window.toggleModule = function (row) {
    const cb = row.querySelector('input[type="checkbox"]');
    if (!cb) return;

    cb.checked = !cb.checked;
    row.classList.toggle('checked', cb.checked);

    // If parent, sync all children to match
    if (cb.dataset.parent === 'true') {
        const buttonId = cb.dataset.buttonId;
        document.querySelectorAll('[data-child-of="' + buttonId + '"]').forEach(function (childCb) {
            childCb.checked = cb.checked;
            const childRow = childCb.closest('.module-child');
            if (childRow) childRow.classList.toggle('checked', cb.checked);
        });
    }

    // If child — only auto-CHECK parent when all siblings are checked
    // Never uncheck the parent when a child is unchecked
    if (cb.dataset.childOf) {
        const parentCb = document.querySelector('[data-button-id="' + cb.dataset.childOf + '"]');
        if (parentCb && cb.checked) { // ← only runs when checking, not unchecking
            const siblings  = document.querySelectorAll('[data-child-of="' + cb.dataset.childOf + '"]');
            const allChecked = Array.from(siblings).every(s => s.checked);
            if (allChecked) {
                parentCb.checked = true;
                const parentRow = parentCb.closest('.module-parent');
                if (parentRow) parentRow.classList.add('checked');
            }
        }
    }
};

    /* ── Select / deselect all ─────────────────────────────── */
    document.getElementById('selectAllBtn').addEventListener('click', function () {
        document.querySelectorAll('.module-checkbox').forEach(function (cb) {
            cb.checked = true;
            const row = cb.closest('.module-parent, .module-child');
            if (row) row.classList.add('checked');
        });
        showToast('success', 'Selected', 'All modules selected.');
    });

    document.getElementById('deselectAllBtn').addEventListener('click', function () {
        document.querySelectorAll('.module-checkbox').forEach(function (cb) {
            cb.checked = false;
            const row = cb.closest('.module-parent, .module-child');
            if (row) row.classList.remove('checked');
        });
        showToast('success', 'Cleared', 'All selections cleared.');
    });

    /* ── Load roles into select ────────────────────────────── */
    function loadRolesDropdown () {
        $.ajax({
            url:  App.routes.rolesdrop,
            type: 'GET',
            success: function (response) {
                const sel = $('#roleid');
                sel.empty().append('<option value="">— Select Role —</option>');
                (response.data || response).forEach(function (role) {
                    sel.append($('<option>', { value: role.ID, text: role.rolename }));
                });
            }
        });
    }

    loadRolesDropdown();

    /* ── Load roles table ──────────────────────────────────── */
    let currentPage = 1;

    function loadRolesTable (page) {
        currentPage = page;
        $.ajax({
            url:  App.routes.rolesgetall,
            type: 'GET',
            data: { page: page },
            success: function (response) {
                const tbody = $('#roles-table-body');
                tbody.empty();

                const roles = response.data || response;

                if (!roles.length) {
                    tbody.html('<tr><td colspan="4"class="yexyalin" >No roles found.</td></tr>');
                    return;
                }

                roles.forEach(function (role) {
    // ✅ Create row with DOM-safe methods
    const $row = $('<tr>');
    
    // ID cell
    $row.append($('<td>').text(role.ID));
    
    // Role name cell
    $row.append($('<td>').addClass('font600').text(role.rolename));
    
    // Description cell
    $row.append($('<td>').append(
        $('<span>').addClass('role-desc').text(role.rdesc || '—')
    ));
    
    // ✅ Actions cell - separate the event handler from HTML
    const $actionsTd = $('<td>');
    const $deleteBtn = $('<button>')
        .addClass('btn-del')
        .attr('title', 'Delete')
        .on('click', function() {
            deleteRole(role.ID, this);
        });
    
    // Add icon inside button
    $deleteBtn.append(
        $('<span>').addClass('material-icons').text('delete_outline')
    );
    
    $actionsTd.append($deleteBtn);
    $row.append($actionsTd);
    
    tbody.append($row);
});

                // Pagination
                if (response.last_page && response.last_page > 1) {
                    renderPagination(response.current_page, response.last_page);
                } else {
                    $('#pagination-controls').empty();
                }
            }
        });
    }

    function renderPagination (current, last) {
        const ctrl = $('#pagination-controls');
        ctrl.empty();
        for (let i = 1; i <= last; i++) {
            const btn = $('<button>').text(i).toggleClass('active', i === current);
            btn.on('click', function () { loadRolesTable(i); });
            ctrl.append(btn);
        }
    }

    loadRolesTable(1);

    /* ── Delete role ───────────────────────────────────────── */
    window.deleteRole = function (id, btn) {
        if (!confirm('Delete this role? This cannot be undone.')) return;
        $.ajax({
            url:  "{{ url('roles') }}/" + id,
            type: 'DELETE',
            headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
            success: function (response) {
                showToast('success', 'Deleted', response.message || 'Role deleted.');
                loadRolesTable(currentPage);
                loadRolesDropdown();
            },
            error: function () {
                showToast('danger', 'Error', 'Failed to delete role.');
            }
        });
    };

    /* ── Create role form ──────────────────────────────────── */
    $('#rolesform').on('submit', function (e) {
        e.preventDefault();
        $('.field-error').text('');

         var form = this;

        const storeroleUrl = form.dataset.storeroleUrl;

        const btn = $(this).find('button[type="submit"]');
        const orig = btn.html();
        btn.html('<span class="material-icons spin">sync</span> Saving…').prop('disabled', true);

        $.ajax({
            url:  storeroleUrl,
            type: 'POST',
            data: $(this).serialize(),
            success: function (response) {
                showToast('success', 'Created', response.message || 'Role created.');
                $('#rolesform')[0].reset();
                loadRolesTable(currentPage);
                loadRolesDropdown();
            },
            error: function (xhr) {
                if (xhr.status === 422) {
                    const errors = xhr.responseJSON?.errors || {};
                    $.each(errors, function (key, val) {
                        $('#' + key + '-error').text(val[0]);
                    });
                    showToast('danger', 'Validation', 'Please check the form.');
                } else {
                    showToast('danger', 'Error', xhr.responseJSON?.message || 'Failed to create role.');
                }
            },
            complete: function () { btn.html(orig).prop('disabled', false); }
        });
    });

    /* ── Assign modules ────────────────────────────────────── */
    $('#assignBtn').on('click', function () {
        const roleId     = $('#roleid').val();
        const selectedIds = $('.module-checkbox:checked').map(function () { return this.value; }).get();

        if (!roleId) { showToast('warning', 'Required', 'Please select a role.'); return; }
        if (!selectedIds.length) { showToast('warning', 'Required', 'Please select at least one module.'); return; }

        const btn  = $(this);
        const orig = btn.html();
        btn.html('<span class="material-icons spin">sync</span> Assigning…').prop('disabled', true);

        $.ajax({
            url:  App.routes.savemodules,
            type: 'POST',
            data: {
                roleid:   roleId,
                modules:  selectedIds
            },
            success: function (response) {
                showToast('success', 'Assigned', response.message || 'Modules assigned successfully.');
            },
            error: function (xhr) {
                showToast('danger', 'Error', xhr.responseJSON?.message || 'Failed to assign modules.');
            },
            complete: function () { btn.html(orig).prop('disabled', false); }
        });
    });

    /* ── Auto-load existing modules when role changes ────────── */
    $('#roleid').on('change', function () {
        const roleid = $(this).val();

        // Uncheck all and clear visual state
        $('.module-checkbox').prop('checked', false);
        document.querySelectorAll('.module-parent, .module-child').forEach(function (row) {
            row.classList.remove('checked');
        });

        if (!roleid) return;

        $('#modulesContainer').css('opacity', '0.5');

        $.ajax({
            url:    App.routes.getrmodule,
            method: 'POST',
            data: {
                roleid: roleid
            },
            success: function (response) {
                if (response.status === 'success') {
                    response.buttonIds.forEach(function (buttonId) {
                        const cb = document.getElementById('module' + buttonId);
                        if (cb) {
                            cb.checked = true;
                            const row = cb.closest('.module-parent, .module-child');
                            if (row) row.classList.add('checked');
                        }
                    });
                    showToast('success', 'Loaded', 'Role modules loaded successfully.');
                }
            },
            error: function () {
                showToast('danger', 'Error', 'Failed to load role modules.');
            },
            complete: function () {
                $('#modulesContainer').css('opacity', '1');
            }
        });
    });

    /* ── Spinner style ────────────────────────────────────── */
    $('<style nonce="{{ $cspNonce }}">.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style>').appendTo('head');

    /* ── Toast ─────────────────────────────────────────────── */
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

    window.showAlert = function (type, title, message) { showToast(type, title, message); };
    window.showMessage = function (msg, type) { showToast(type || 'info', 'Notice', msg); };

 document.addEventListener('click', function (e) {
    // Don't intercept direct checkbox clicks — the browser handles those natively
    if (e.target.type === 'checkbox') return;

    const row = e.target.closest('.module-parent, .module-child');
    if (row) {
        e.stopPropagation(); // prevent bubbling from child → parent both firing
        toggleModule(row);
    }
});
});