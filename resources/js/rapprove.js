document.addEventListener('DOMContentLoaded', function () {

    const modal        = document.getElementById('reviewModal');
    const modalBody    = document.getElementById('reviewModalBody');
    const modalAgent   = document.getElementById('modalAgentLabel');
    const skeleton     = document.getElementById('modalSkeleton');
    const hiddenId     = document.getElementById('pending_update_id');
    const rejectReason = document.getElementById('rejection_reason');

    /* ── Open modal ──────────────────────────────────── */
    document.querySelectorAll('.reviewBtn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.dataset.id;
            hiddenId.value = id;
            rejectReason.value = '';

            // Show modal with skeleton
            modalBody.innerHTML = '';
            modalBody.appendChild(skeleton);
            skeleton.style.display = 'block';
            modalAgent.textContent = 'Loading…';
            modal.classList.add('open');

            const showurl = window.App.routes.showfields.replace('__id__', id);

            fetch(showurl, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(r => r.json())
            .then(response => {
    if (response.status !== 'success') throw new Error('Bad response');

    const pending = response.pendingUpdate;
    const changes = response.changes;

    // ✅ Set agent header text safely
    modalAgent.textContent = `Agent ${pending.empid} · ${pending.status}`;

    // Clear modal body
    modalBody.innerHTML = '';

    // ✅ Build meta strip with DOM API
    const metaStrip = document.createElement('div');
    metaStrip.className = 'meta-strip';

    const metaItems = [
        { label: 'Agent ID', value: pending.empid },
        { label: 'Status', value: pending.status },
        { label: 'Submitted By', value: pending.submitter ? pending.submitter.name : 'Unknown' },
        { label: 'Submitted At', value: pending.submitted_at }
    ];

    metaItems.forEach(item => {
        const metaItem = document.createElement('div');
        metaItem.className = 'meta-item';

        const metaLabel = document.createElement('div');
        metaLabel.className = 'meta-label';
        metaLabel.textContent = item.label;

        const metaValue = document.createElement('div');
        metaValue.className = 'meta-value';
        metaValue.textContent = item.value;

        metaItem.appendChild(metaLabel);
        metaItem.appendChild(metaValue);
        metaStrip.appendChild(metaItem);
    });

    modalBody.appendChild(metaStrip);

    // ✅ Build changes table
    const changesLabel = document.createElement('p');
    changesLabel.className = 'changes-section-label';
    changesLabel.textContent = 'Changed Fields';
    modalBody.appendChild(changesLabel);

    const table = document.createElement('table');
    table.className = 'changes-table';

    // Table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Field', 'Current Value', 'Proposed Value'].forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table body
    const tbody = document.createElement('tbody');
    const keys = Object.keys(changes);

    if (keys.length > 0) {
        keys.forEach(field => {
            const oldVal = changes[field].old ?? '—';
            const newVal = changes[field].new ?? '—';

            const tr = document.createElement('tr');

            const tdField = document.createElement('td');
            tdField.className = 'field-name';
            tdField.textContent = field;

            const tdOld = document.createElement('td');
            const spanOld = document.createElement('span');
            spanOld.className = 'old-val';
            spanOld.textContent = oldVal;
            tdOld.appendChild(spanOld);

            const tdNew = document.createElement('td');
            const spanNew = document.createElement('span');
            spanNew.className = 'new-val';
            spanNew.textContent = newVal;
            tdNew.appendChild(spanNew);

            tr.appendChild(tdField);
            tr.appendChild(tdOld);
            tr.appendChild(tdNew);
            tbody.appendChild(tr);
        });
    } else {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 3;
        td.className = 'muted';
        td.textContent = 'No changes found';
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    modalBody.appendChild(table);

    skeleton.style.display = 'none';
})
            .catch(() => {
                skeleton.style.display = 'none';
                modalBody.innerHTML = `
                    <div class="paddang" >
                        <span class="material-icons font32" >error_outline</span>
                        Failed to load details. Please try again.
                    </div>`;
            });
        });
    });

    /* ── Close modal ─────────────────────────────────── */
    function closeModal() { modal.classList.remove('open'); }

    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    
    

    /* ── Reject ──────────────────────────────────────── */
    $(document).on('click', '#approvebtn', function(e){
    e.preventDefault();

    let id = $('#pending_update_id').val();

    if(!id){
        showToast("danger", "Error", "No pending update selected.");
        return;
    }

    $('#approvebtn').prop('disabled', true).html('<span class="material-icons anime" >sync</span> Approving…');

    const approveurl = window.App.routes.regapprove.replace('__id__', id);

    $.ajax({
        url: approveurl,
        type: "POST",
        data: {
            
        },
        success: function(response){
            if(response.success){
                showToast("success", "Approved", response.message);

               

                const modalEl = document.getElementById('reviewModal');
if (modalEl) {
    bootstrap.Modal.getInstance(modalEl)?.hide();
}

                // Optional: remove row from table
                $('button.reviewBtn[data-id="'+id+'"]').closest('tr').remove();
            }else{
                showToast("danger", "Error", response.message);
            }
        },
        error: function(xhr){
            console.log(xhr.responseText);
            showToast("danger", "Error", "Failed to approve update.");
        },
        complete: function(){
            $('#approvebtn').prop('disabled', false).html('<i class="fas fa-check-double"></i> Approve');
        }
    });
});
$(document).on('click', '#rejectbtn', function(e){
    e.preventDefault();

    let id = $('#pending_update_id').val();
    let reason = $('#rejection_reason').val();

    if(!id){
        showToast("danger", "Error", "No pending update selected.");
        return;
    }

    if(!reason || reason.trim() === ""){
        showToast("danger", "Rejected", "Rejection reason is required.");
        return;
    }

    $('#rejectbtn').prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Rejecting...');

    const rejecturl = window.App.routes.regapprovrej.replace('__id__', id);

    $.ajax({
        url: rejecturl,
        type: "POST",
        data: {
            rejection_reason: reason
        },
        success: function(response){
            if(response.success){
                showToast("success", "Rejected", response.message);

                

                const modalEl = document.getElementById('reviewModal');
if (modalEl) {
    bootstrap.Modal.getInstance(modalEl)?.hide();
}

                // Optional: remove row from table
                $('button.reviewBtn[data-id="'+id+'"]').closest('tr').remove();
            }else{
                showToast("danger", "Error", response.message);
            }
        },
        error: function(xhr){
            console.log(xhr.responseText);

            if(xhr.status === 422){
                showToast("danger", "Validation Error", "Rejection reason is required.");
            }else{
                showToast("danger", "Error", "Failed to reject update.");
            }
        },
        complete: function(){
            $('#rejectbtn').prop('disabled', false).html('<i class="fas fa-window-close"></i> Cancel');
        }
    });
});


    /* ── Toast ───────────────────────────────────────── */
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

});