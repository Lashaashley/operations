$(document).ready(function () {

    /* ── User selection display ──────────────────────────── */
    $('#users').on('change', function () {
        const name = $(this).find('option:selected').text();
        const val  = $(this).val();

        if (val) {
            $('#selectedUserName').text(name);
            $('#selectedUserDisplay').addClass('show');
        } else {
            $('#selectedUserDisplay').removeClass('show');
        }

        // Clear role highlight on user change
        $('.role-checkbox').prop('checked', false);
        $('#selectedRoleBadge').removeClass('show');
    });

    /* ── Role selection feedback ─────────────────────────── */
    $(document).on('change', '.role-checkbox', function () {
        const name = $(this).data('name') || $(this).closest('.role-item').find('.role-name').text();
        if (this.checked) {
            $('#selectedRoleName').text(name);
            $('#selectedRoleBadge').addClass('show');
        }
    });

    /* ── Assign role ─────────────────────────────────────── */
    $('#assignBtn').on('click', function () {
        const userId       = $('#users').val();
        const selectedRole = $('.role-checkbox:checked').val();

        // Clear errors
        $('.field-error').html('');

        if (!userId) {
            $('#users-error').text('Please select a user');
            showToast('warning', 'Validation', 'Please select a user first.');
            return;
        }

        if (!selectedRole) {
            showToast('warning', 'Validation', 'Please select a role to assign.');
            return;
        }

        const btn         = $(this);
        const origHtml    = btn.html();
        btn.html('<span class="material-icons spin">sync</span> Assigning…').prop('disabled', true);

        $.ajax({
            url:   App.routes.modulesass,
            method: 'POST',
            data: {
                workNo:  userId,
                roleid:  selectedRole
            },
            success: function (response) {
                if (response.status === 'success') {
                    showToast('success', 'Role Assigned', response.message);
                }
            },
            error: function (xhr) {
                if (xhr.status === 422) {
                    const errors = xhr.responseJSON?.errors || {};
                    $.each(errors, function (key, value) {
                        $('#' + key + '-error').text(value[0]);
                    });
                    showToast('danger', 'Validation Error', 'Please check the form for errors.');
                } else {
                    showToast('danger', 'Error', xhr.responseJSON?.message || 'Failed to assign role.');
                }
            },
            complete: function () {
                btn.html(origHtml).prop('disabled', false);
            }
        });
    });

    /* ── Clear selection ─────────────────────────────────── */
    $('#deselectAllBtn').on('click', function () {
        $('.role-checkbox').prop('checked', false);
        $('#selectedRoleBadge').removeClass('show');
        showToast('info', 'Cleared', 'Role selection cleared.');
    });

    /* ── Spinner animation ───────────────────────────────── */
    $('<style>.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style>').appendTo('head');

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

    // Legacy compatibility
    window.showAlert = function (type, title, message) {
        showToast(type === 'success' ? 'success' : type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : 'info', title, message);
    };

});