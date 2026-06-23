/* ═══════════════════════════════════════════════════════════════
   pitems.js — updated for corepay.css modal system
═══════════════════════════════════════════════════════════════ */
import Sortable from 'sortablejs';  // 👈 add this at the top

let sortableInstance = null;
/* ── DataTable init ─────────────────────────────────────────── */
$(document).ready(function () {
    $('#payrollCodesTable').DataTable({
        responsive: true,
        pageLength: 25,
        columnDefs: [
            { targets: 'datatable-nosort', orderable: false }],
        language: {
            emptyTable:   'No payroll items found',
            zeroRecords:  'No matching items found',
            processing:   'Loading…'
        }
    });
});

/* ── Toast helper ───────────────────────────────────────────── */
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

// Legacy alias used throughout the old code
function showMessage(message, isError) {
    showToast(isError ? 'danger' : 'success', isError ? 'Error' : 'Success', message);
}

/* ── Modal helpers ──────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
/* ── ADD form: category → show/hide conditional fields ──────── */
function initAddFormBehavior() {
   
    const categorySelect = document.getElementById('category');
    const balanceOptions = document.getElementById('balanceOptions');
    const loanRateField  = document.getElementById('loanRateField');
    const loanRate       = document.getElementById('loanRate');
    const loanhelper     = document.getElementById('loanhelper');
    const loanhelperDesc = document.getElementById('loanhelperDesc');

    if (!categorySelect) return;

    categorySelect.addEventListener('change', function () {
        const v = this.value;
        balanceOptions.style.display = v === 'balance' ? 'flex' : 'none';
        loanRateField.style.display  = v === 'loan'    ? 'flex' : 'none';
        loanRate.style.display       = v === 'loan'    ? 'flex' : 'none';
        loanhelper.style.display     = v === 'loan'    ? 'flex' : 'none';
        loanhelperDesc.style.display = v === 'loan'    ? 'flex' : 'none';
    });
}



    

    /* ── ADD form: process type toggles formula readonly ────── */
    const calculationRadio = document.getElementById('calculationRadio');
    const amountRadio      = document.getElementById('amount');
    const inputField       = document.getElementById('inputField');

    function toggleReadOnly() {
        if (calculationRadio.checked) {
            inputField.removeAttribute('readonly');
        } else {
            inputField.setAttribute('readonly', true);
        }
    }

    if (calculationRadio && amountRadio) {
        toggleReadOnly();
        calculationRadio.addEventListener('change', toggleReadOnly);
        amountRadio.addEventListener('change', toggleReadOnly);
    }

    /* ── ADD form: formula field code validation ─────────────── */
    const feedback = document.getElementById('feedback');

    function checkCode(code) {
        $.ajax({
            type: 'POST', url: '',
            data: { code },
            success: function (response) {
                try {
                    const json = JSON.parse(response);
                    feedback.innerHTML = json.exists ? '' : `Code ${code} is invalid.`;
                } catch (e) {
                    feedback.innerHTML = 'Error in server response.';
                }
            }
        });
    }

    if (inputField) {
        inputField.addEventListener('keydown', function (event) {
            if (['+', '/', '*', '-', '='].includes(event.key)) {
                const codes = inputField.value.match(/[A-Za-z]+\d+/g);
                if (codes?.length) checkCode(codes[codes.length - 1]);
            }
        });
    }

    /* ── ADD form: mutually exclusive calc checkboxes ────────── */
    const cumulativeValueCheckbox = document.getElementById('cumulativeValue');
    const casualCheckbox          = document.getElementById('casual');

    if (cumulativeValueCheckbox && casualCheckbox) {
        cumulativeValueCheckbox.addEventListener('change', () => {
            if (cumulativeValueCheckbox.checked) casualCheckbox.checked = false;
        });
        casualCheckbox.addEventListener('change', () => {
            if (casualCheckbox.checked) cumulativeValueCheckbox.checked = false;
        });
    }

    /* ── ADD form: priority section ─────────────────────────── */
    const prosstySelect   = document.getElementById('prossty');
    const prioritySection = document.getElementById('prioritySection');
    const sortableList    = document.getElementById('sortableDeductions');
    const priorityInput   = document.getElementById('priorityInput');
    const codeInput       = document.getElementById('code');
    let sortableInstance  = null;

    function updateCurrentItemDisplay() {
        const code = codeInput?.value || 'New Code';
        document.getElementById('currentItemCode').textContent = code;
        document.getElementById('currentItemName').textContent = code;
    }

    if (codeInput) codeInput.addEventListener('input', updateCurrentItemDisplay);

    if (prosstySelect) {
        prosstySelect.addEventListener('change', function () {
            if (this.value === 'Deduction') {
                prioritySection.style.display = 'block';
                loadDeductionPriorities();
            } else {
                prioritySection.style.display = 'none';
                sortableInstance?.destroy();
                sortableInstance = null;
            }
        });
    }

function loadDeductionPriorities() {
    // Guard FIRST — before touching the DOM
    if (!window.App?.routes?.loadpriori) {
        console.error('App.routes.loadpriori is not defined');
        sortableList.innerHTML = '<li class="list-group-item list-error-state">Route not configured</li>';
        return;
    }

    sortableList.innerHTML = `
        <li class="list-group-item list-loading-state">
            <span class="material-icons list-loading-icon">sync</span>
            Loading deductions…
        </li>`;

    fetch(App.routes.loadpriori, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        }
    })
    .then(r => {
        console.log('Response status:', r.status, r.url); 
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
    })
    .then(data => {
        if (data.status === 'success') {
            renderDeductionsList(data.deductions, sortableList, priorityInput, 'currentPriorityNumber');
            initializeSortable();
            updateCurrentPriority();
        } else {
            sortableList.innerHTML = '<li class="list-group-item list-error-state">Error loading deductions</li>';
        }
    })
    .catch((err) => {
        console.error('Fetch failed:', err); 
        sortableList.innerHTML = '<li class="list-group-item list-error-state">Failed to load deductions</li>';
    });
}

    function initializeSortable() {
        sortableInstance?.destroy();
        sortableInstance = new Sortable(sortableList, {
            animation: 150,
            handle: '.drag-handle',
            ghostClass: 'sortable-ghost',
            onEnd: () => {
                updateBadgeNumbers(sortableList, '.list-group-item');
                updateCurrentPriority();
            }
        });
    }

    function updateCurrentPriority() {
        const count = sortableList.querySelectorAll('.list-group-item').length;
        document.getElementById('currentPriorityNumber').textContent = count + 1;
        priorityInput.value = count + 1;
    }

    /* ── ADD form: sacco checkbox ────────────────────────────── */
    $('#saccocheck').on('change', function () {
        const checked = $(this).is(':checked');
        $('#sacconames').toggle(checked);
        $('#staffSelect7').prop('required', checked);
        if (!checked) $('#staffSelect7').val('').trigger('change');
    });

    /* ── ADD form: submit ────────────────────────────────────── */
    $('#payrollForm').on('submit', function (e) {
        e.preventDefault();

        var form = this;

        const newitemUrl = form.dataset.newitemUrl;

        if (!validateFormFields()) return; 

        if (prosstySelect?.value === 'Deduction') {
            const items    = sortableList.querySelectorAll('.list-group-item');
            const newOrder = Array.from(items).map((item, i) => ({ id: item.dataset.id, priority: i + 1 }));
            if (newOrder.length) savePrioritiesOrder(newOrder);
        }

        const submitBtn   = $(this).find('button[type="submit"]');
        const originalHtml = submitBtn.html();
        submitBtn.html('<span class="material-icons" style="animation:spin 1s linear infinite;font-size:16px;">sync</span> Saving…').prop('disabled', true);

        $.ajax({
            type: 'POST', url: newitemUrl,
            data: $(this).serialize(),
            dataType: 'json',
            success: function (response) {
                if (response.status === 'success') {
                    showToast('success', 'Saved', 'Payroll item added successfully.');
                    $('#payrollForm')[0].reset();
                    $('#sacconames').hide();
                    $('#staffSelect7').removeAttr('required').val('');
                    closeModal('addModal');
                } else if (response.status === 'duplicate') {
                    showToast('danger', 'Duplicate', response.message);
                } else {
                    showToast('danger', 'Error', response.message || 'Submission failed.');
                }
            },
            error: function (xhr, status, error) {
                showToast('danger', 'Error', 'Submission failed: ' + error);
            },
            complete: function () {
                submitBtn.html(originalHtml).prop('disabled', false);
            }
        });
    });

    /* ── EDIT form: category change ──────────────────────────── */
    $('#editCategory').on('change', function () {
        const v = $(this).val();
        $('#editBalanceOptions').toggle(v === 'balance');
        $('#editLoanRateField').toggle(v === 'loan');
        $('#editLoanRate').toggle(v === 'loan');
        $('#editloanhelper').toggle(v === 'loan');
        $('#editloanhelperDesc').toggle(v === 'loan');
    });

    /* ── EDIT form: sacco checkbox ───────────────────────────── */
    $('#saccoeditcheck').on('change', function () {
        const checked = $(this).is(':checked');
        $(this).val(checked ? 'Yes' : 'No');
        $('#saccoeditnames').toggle(checked);
        $('#staffSelect8').prop('required', checked);
        if (!checked) $('#staffSelect8').val('').trigger('change');
    });

    /* ── EDIT form: save button ──────────────────────────────── */
    $('#saveChangesButton').on('click', function () {
        submitEditForm();
    });

    /* ── Close add modal on reset ────────────────────────────── */
    document.getElementById('addModal').addEventListener('click', function (e) {
        if (e.target === this) closeModal('addModal');
    });
    document.getElementById('editModal').addEventListener('click', function (e) {
        if (e.target === this) closeModal('editModal');
    });

    // ── Modal open/close via data-action ─────────────────────────────
document.addEventListener('click', function (e) {

    

    // Open
    const opener = e.target.closest('[data-action="open-modal"]');
    if (opener) {
        const target = opener.dataset.target;
        const modal  = document.getElementById(target);
        if (modal) modal.classList.add('open');
        initAddFormBehavior();
        return;
    }

    // Close button
    const closer = e.target.closest('[data-action="close-modal"]');
    if (closer) {
        const target = closer.dataset.target;
        const modal  = document.getElementById(target);
        if (modal) modal.classList.remove('open');
        return;
    }

    // Click on backdrop itself (outside modal-card)
    const backdrop = e.target.closest('.modal-backdrop-custom');
    if (backdrop && e.target === backdrop) {
        backdrop.classList.remove('open');
        return;
    }
});

// ── Escape key closes any open modal ─────────────────────────────
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop-custom.open').forEach(function (m) {
            m.classList.remove('open');
        });
    }
});


/* ═══════════════════════════════════════════════════
   Shared helpers
═══════════════════════════════════════════════════ */

/* Render a deduction list into a <ul> */
function renderDeductionsList(deductions, listEl, priorityInputEl, priorityNumId) {

    listEl.innerHTML = '';

    if (!deductions.length) {
        listEl.innerHTML = `
            <li class="list-group-item list-empty-state">
                <span class="material-icons list-state-icon">info</span>
                No existing deductions — this will be priority #1.
            </li>`;
        document.getElementById(priorityNumId).textContent = '1';
        priorityInputEl.value = '1';
        return;
    }

    deductions.forEach(function(d, i) {

        // ✅ <li> — data-* set via dataset, never string interpolation
        const li = document.createElement('li');
        li.className        = 'list-group-item';
        li.dataset.id       = String(d.id);       // ✅ dataset assignment, not attribute string
        li.dataset.priority = String(d.priority); // ✅ dataset assignment, not attribute string

        // ✅ Drag handle — purely static content, no server data
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        const dragIcon = document.createElement('span');
        dragIcon.className   = 'material-icons';
        dragIcon.textContent = 'drag_indicator';
        dragHandle.appendChild(dragIcon);

        // ✅ Priority number — integer from loop index, not server string
        const priorityNum = document.createElement('span');
        priorityNum.className   = 'priority-num';
        priorityNum.textContent = i + 1;

        // ✅ Content wrapper — cname and code via textContent
        const contentDiv = document.createElement('div');
        contentDiv.style.flex = '1';

        const nameStrong = document.createElement('strong');
        nameStrong.style.cssText = 'font-size:13px;color:var(--ink);';
        nameStrong.textContent   = d.cname;  // ✅ never parsed as HTML

        const codeDiv = document.createElement('div');
        codeDiv.style.cssText = 'font-size:11.5px;color:var(--muted);';
        codeDiv.textContent   = d.code;      // ✅ never parsed as HTML

        contentDiv.appendChild(nameStrong);
        contentDiv.appendChild(codeDiv);

        // ✅ Priority label — d.priority via textContent
        const priorityLabel = document.createElement('span');
        priorityLabel.style.cssText = 'font-size:11.5px;color:var(--muted);';
        priorityLabel.textContent   = 'Priority ' + String(d.priority); // ✅ safe

        // Assemble and append
        li.appendChild(dragHandle);
        li.appendChild(priorityNum);
        li.appendChild(contentDiv);
        li.appendChild(priorityLabel);
        listEl.appendChild(li);
    });
}

/* Update priority number badges after drag */
function updateBadgeNumbers(listEl, itemSelector) {
    listEl.querySelectorAll(itemSelector).forEach((item, i) => {
        const badge = item.querySelector('.priority-num');
        if (badge) badge.textContent = i + 1;
    });
}

/* Save reordered priorities */
function savePrioritiesOrder(order) {
    $.ajax({
        url: App.routes.pitemsupdatepriorities, method: 'POST',
        data: JSON.stringify({ priorities: order }),
        contentType: 'application/json',
        dataType: 'json',
        headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
        success: function (data) {
            if (data.status === 'success') {
                showToast('success', 'Priorities', 'Order updated successfully.');
            } else {
                showToast('danger', 'Error', data.message || 'Failed to update priorities.');
            }
        },
        error: function () {
            showToast('danger', 'Error', 'Could not update priority order.');
        }
    });
}

/* ═══════════════════════════════════════════════════
   openEditModal — reads data-id from the clicked link,
   then reads hidden <td> cells from the same <tr>
═══════════════════════════════════════════════════ */


/* Set a segmented toggle radio by value */
function setSegToggle(toggleId, radioName, value, fallback) {
    const target = value || fallback;
    const radios  = document.querySelectorAll(`#${toggleId} input[name="${radioName}"]`);
    let matched   = false;

    radios.forEach(r => {
        if (r.value === target) { r.checked = true; matched = true; }
        else                    { r.checked = false; }
    });

    /* Fall back to first option if no match */
    if (!matched && radios.length) radios[0].checked = true;
}

/* ═══════════════════════════════════════════════════
   submitEditForm
═══════════════════════════════════════════════════ */
function submitEditForm() {
    const formData = {
        id:        $('#editid').val(),
        code:      $('#editCode').val(),
        cname:     $('#editDescription').val(),
        formula:   $('#editinputField').val(),
        procctype: $('input[name="editProcessType"]:checked').val(),
        cumcas:    $('input[name="editcalctype"]:checked').val(),
        varorfixed:$('input[name="editVarOrFixed"]:checked').val(),
        taxaornon: $('input[name="editTaxOrNon"]:checked').val(),
        category:  $('#editCategory').val(),
        prossty:   $('#editProcessSty').val(),
        relief:    $('input[name="editRelief"]:checked').val(),
        saccocheck:$('#saccoeditcheck').val(),
        poster:    $('#staffSelect8').val(),
        increREDU: $('#editCategory').val() === 'balance' ? $('input[name="editBalanceType"]:checked').val() : null,
        rate:      $('#editCategory').val() === 'loan'    ? $('#editRate').val()          : null,
        intrestcode:$('#editCategory').val() === 'loan'   ? $('#editinterestcode').val()  : null,
        codename:  $('#editCategory').val() === 'loan'    ? $('#editinterestdesc').val()  : null,
        recintres: $('#editCategory').val() === 'loan'    ? $('input[name="editrecintres"]:checked').val() : null,
    };

    /* Save priority order if deduction */
    if ($('#editProcessSty').val() === 'Deduction') {
        const editsortableList = document.getElementById('editsortableDeductions');
        const newOrder = Array.from(editsortableList.querySelectorAll('.list-group-item'))
            .map((item, i) => ({ id: item.dataset.id, priority: i + 1 }));
        if (newOrder.length) savePrioritiesOrder(newOrder);
    }

    const saveBtn      = document.getElementById('saveChangesButton');
    const originalHtml = saveBtn.innerHTML;
    saveBtn.innerHTML  = '<span class="material-icons" style="animation:spin 1s linear infinite;font-size:16px;">sync</span> Saving…';
    saveBtn.disabled   = true;

    $.ajax({
        url: App.routes.pitemsupdate, type: 'POST',
        data: formData,
        dataType: 'json',
        headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
        success: function (response) {
            if (response.success) {
                showToast('success', 'Updated', 'Payroll code updated successfully.');
                updateTableRow(formData);
                closeModal('editModal');
            } else {
                showToast('danger', 'Error', response.message || 'Update failed.');
            }
        },
        error: function (xhr, status, error) {
            showToast('danger', 'Error', 'Update failed: ' + error);
        },
        complete: function () {
            saveBtn.innerHTML = originalHtml;
            saveBtn.disabled  = false;
        }
    });
}

 /* Priority section — classList instead of style.display */
    const prioreSection     = document.getElementById('prioreSection');
    const editsortableList  = document.getElementById('editsortableDeductions');
    const editPriorityInput = document.getElementById('editpriorityInput');
    let   esortableInstance = null;

function loadEditDeductionPriorities() {
        editsortableList.innerHTML = `
            <li class="list-group-item list-loading-state">
                <span class="material-icons list-loading-icon">sync</span>
                Loading deductions…
            </li>`;

        fetch(App.routes.loadpriori, {
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'success') {
                renderDeductionsList(data.deductions, editsortableList, editPriorityInput, 'editPriorityNumber');
                esortableInstance?.destroy();
                esortableInstance = new Sortable(editsortableList, {
                    animation: 150,
                    handle: '.drag-handle',
                    ghostClass: 'sortable-ghost',
                    onEnd: () => {
                        updateBadgeNumbers(editsortableList, '.list-group-item');
                        const count = editsortableList.querySelectorAll('.list-group-item').length;
                        document.getElementById('editPriorityNumber').textContent = count + 1;
                        editPriorityInput.value = count + 1;
                    }
                });
            }
        })
        .catch(() => {
            editsortableList.innerHTML = '<li class="list-group-item list-error-state">Failed to load deductions</li>';
        });
    }
/* Update the table row in place after edit */
function updateTableRow(f) {
    const row = $('#payrollCodesTable tbody tr').filter(function () {
        return $(this).find('td:eq(0)').text().trim() === f.id;
    });

    row.find('td:eq(1) .code-primary').text(f.code);
    row.find('td:eq(1) .code-desc').text(f.cname);
    row.find('td:eq(2)').text(f.procctype);
    row.find('td:eq(3)').html(`<span class="type-badge ${(f.varorfixed||'').toLowerCase()}">${f.varorfixed||''}</span>`);
    row.find('td:eq(4)').html(`<span class="type-badge ${f.taxaornon === 'Non-taxable' ? 'nontaxable' : 'taxable'}">${f.taxaornon||''}</span>`);
    row.find('td:eq(5)').html(`<span class="type-badge ${(f.category||'').toLowerCase()}">${f.category||''}</span>`);
    /* Update hidden cells */
    row.find('td:eq(6)').text(f.relief    || '');
    row.find('td:eq(7)').text(f.prossty   || '');
    row.find('td:eq(8)').text(f.rate      || '');
    row.find('td:eq(9)').text(f.increREDU || '');
    row.find('td:eq(10)').text(f.recintres    || '');
    row.find('td:eq(11)').text(f.formula      || '');
    row.find('td:eq(12)').text(f.cumcas       || '');
    row.find('td:eq(13)').text(f.intrestcode  || '');
    row.find('td:eq(14)').text(f.codename     || '');
    row.find('td:eq(15)').text(f.saccocheck   || '');
    row.find('td:eq(16)').text(f.poster       || '');
}

/* ═══════════════════════════════════════════════════
   deletePayrollCode
═══════════════════════════════════════════════════ */


/* ── Validation ─────────────────────────────────────────────── */
function validateFormFields() {
    let isValid = true;

    $('#payrollForm').find('input:not([type="radio"]):not([type="checkbox"]), select').each(function () {
        if (!$(this).prop('readonly') && $(this).prop('required') && !$(this).val().trim()) {
            $(this).css('border-color', 'var(--danger)');
            isValid = false;
        } else {
            $(this).css('border-color', '');
        }
    });

    if (!validateNumericFields()) isValid = false;
    return isValid;
}

function validateNumericFields() {
    let valid = true;
    const rateField = $('#rate');

    if (rateField.is(':visible') && !rateField.prop('readonly') && isNaN(rateField.val())) {
        rateField.css('border-color', 'var(--danger)');
        valid = false;
    } else {
        rateField.css('border-color', '');
    }

    if ($('#loanhelper').is(':visible')) {
        const recintresVal = $('input[name="recintres"]:checked').val();
        if (recintresVal === '0') {
            ['#interestcode', '#interestdesc'].forEach(sel => {
                if (!$(sel).val()?.trim()) {
                    $(sel).css('border-color', 'var(--danger)');
                    valid = false;
                } else {
                    $(sel).css('border-color', '');
                }
            });
        }
    }

    return valid;
}

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
    closeMenus();
    // Click outside — close all menus
    document.querySelectorAll('.action-menu.open').forEach(function (m) {
        m.classList.remove('open');
    });

    const editTrigger = e.target.closest('[data-action="open-edit"]');
    if (editTrigger) {
        e.preventDefault();

        // Close any open action menus
        document.querySelectorAll('.action-menu.open').forEach(m => m.classList.remove('open'));

        // Find the row and pass the anchor element (openEditModal reads the TR from it)
        openEditModal(editTrigger);
        return;
    }
});

function closeMenus() {
    document.querySelectorAll('.action-menu.open').forEach(m => m.classList.remove('open'));
}

document.addEventListener('click', e => {
    if (!e.target.closest('.action-wrap')) closeMenus();
});

/* ── Wire openEditModal to new modal ─────────────────── */

function openModal(id)  { document.getElementById(id).classList.add('open');    }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }


function openEditModal(element) {

    const row = $(element).closest('tr');

    /* Column indexes match the modernized table exactly */
    const id           = row.find('td:eq(0)').text().trim();
    const code         = row.find('td:eq(1) .code-primary').text().trim();
    const description  = row.find('td:eq(1) .code-desc').text().trim();
    const processType  = row.find('td:eq(2)').text().trim();
    const varorfixed   = row.find('td:eq(3)').text().trim();
    const taxornontax  = row.find('td:eq(4)').text().trim();
    const category     = row.find('td:eq(5)').text().trim();
    const relief       = row.find('td:eq(6)').text().trim();   // hidden
    const prossty      = row.find('td:eq(7)').text().trim();   // hidden
    const rate         = row.find('td:eq(8)').text().trim();   // hidden
    const incredu      = row.find('td:eq(9)').text().trim();   // hidden
    const recintres    = row.find('td:eq(10)').text().trim();  // hidden
    const formularinpu = row.find('td:eq(11)').text().trim();  // hidden
    const cumcas       = row.find('td:eq(12)').text().trim();  // hidden
    const intrestcode  = row.find('td:eq(13)').text().trim();  // hidden
    const codename     = row.find('td:eq(14)').text().trim();  // hidden
    const issaccorel   = row.find('td:eq(15)').text().trim();  // hidden
    const sposter      = row.find('td:eq(16)').text().trim();  // hidden

    /* Populate basic fields */
    $('#editid').val(id);
    $('#editCode').val(code);
    $('#editDescription').val(description);
    $('#editCategory').val(category);
    $('#editProcessSty').val(prossty);
    $('#editinputField').val(formularinpu);
    $('#editModalSubtitle').text(`Editing: ${code} — ${description}`);

    /* Process type radio */
    $('#editAmount').prop('checked',      processType === 'Amount');
    $('#editCalculation').prop('checked', processType !== 'Amount');
    $('#editinputField').prop('readonly', processType === 'Amount');

    /* Calc type checkboxes */
    $('#editcumulative').prop('checked', cumcas === 'cumulative');
    $('#editcasual').prop('checked',     cumcas === 'casual');

    /* Segmented toggles — just set the radio; CSS handles the rest */
    setSegToggle('editVarOrFixedToggle', 'editVarOrFixed', varorfixed, 'Variable');
    setSegToggle('editTaxableToggle',    'editTaxOrNon',   taxornontax, 'Taxable');
    setSegToggle('editReliefToggle',     'editRelief',     relief,     'NONE');
    setSegToggle('recint-toggleedit',    'editrecintres',  recintres,  '1');

    /* Category-conditional fields */
    document.getElementById('editBalanceOptions').classList.toggle('hidden', category !== 'balance');
    document.getElementById('editLoanRateField').classList.toggle('hidden',  category !== 'loan');
    document.getElementById('editLoanRate').classList.toggle('hidden',       category !== 'loan');
    document.getElementById('editloanhelper').classList.toggle('hidden',     category !== 'loan');
    document.getElementById('editloanhelperDesc').classList.toggle('hidden', category !== 'loan');

    if (category === 'balance') {
        $('#editIncreasing').prop('checked', incredu === 'Increasing');
        $('#editReducing').prop('checked',   incredu === 'Reducing');
    }

    if (category === 'loan') {
        $('#editRate').val(rate);
        $('#editinterestcode').val(intrestcode);
        $('#editinterestdesc').val(codename);
    }

    /* Sacco */
    setTimeout(function () {
        const isSacco = issaccorel === 'Yes';
        $('#saccoeditcheck').prop('checked', isSacco).val(isSacco ? 'Yes' : 'No');
        $('#saccoeditnames').toggle(isSacco);
        $('#staffSelect8').prop('required', isSacco);
        if (isSacco) {
            $('#staffSelect8').val(sposter).trigger('change');
        } else {
            $('#staffSelect8').val('').trigger('change');
        }
    }, 200);

    

    if (prossty === 'Deduction') {
        prioreSection.classList.remove('hidden');
        loadEditDeductionPriorities();
    } else {
        prioreSection.classList.add('hidden');
    }

    /* Wire prossty change inside edit modal */
    $('#editProcessSty').off('change.edit').on('change.edit', function () {
        if (this.value === 'Deduction') {
            prioreSection.classList.remove('hidden');
            loadEditDeductionPriorities();
        } else {
            prioreSection.classList.add('hidden');
            esortableInstance?.destroy();
            esortableInstance = null;
        }
    });

    

    openModal('editModal');
}
/* ── Close modals on backdrop click ──────────────────── */
['addModal', 'editModal'].forEach(id => {
    document.getElementById(id).addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('open');
    });
});

/* ── Toast helper (if not defined in pitems.js) ──────── */
if (typeof showToast === 'undefined') {
    window.showToast = function(type, title, message) {
        const wrap  = document.getElementById('toastWrap');
        const icons = { success: 'check_circle', danger: 'error_outline', warning: 'warning_amber' };
        const t = document.createElement('div');
        t.className = `toast-msg ${type}`;
        t.innerHTML = `<span class="material-icons">${icons[type] || 'info'}</span>
                       <div><strong>${title}</strong> ${message ? ' — ' + message : ''}</div>`;
        wrap.appendChild(t);
        const dismiss = () => { t.classList.add('leaving'); setTimeout(() => t.remove(), 300); };
        t.addEventListener('click', dismiss);
        setTimeout(dismiss, 5000);
    };
}

});