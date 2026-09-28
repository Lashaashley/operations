/* =============================================================================
 * newrob.js — Robbing form bootstrap + dynamic part rows
 *
 * Handles:
 *   • Populating #customer, #model, #lot-select via AJAX (cascading)
 *   • Pre-filling form from window.robBootstrap (arriving from Unboxing Issue modal)
 *   • Dynamically adding/removing part rows
 *   • Auto-filling part description when a part is chosen
 *
 * Loaded as a module via @vite(['resources/js/newrob.js'])
 * ============================================================================= */

/* ─── Module state ─────────────────────────────────────────────────────────── */

let partRowCount = 0;
let currentModelId = null;   // remembers selected model so new rows can load parts
/**
 * Multi-mode hydration: N part rows, all sharing the same customer/model/lot.
 */
function hydrateMulti(data) {
    // ── Step 1: customer ──
    waitForOptionThenSet('#customer', data.customer_id, function () {
        console.log('[newrob] multi step 1: setting #customer =', data.customer_id);
        $('#customer').val(data.customer_id).trigger('change');

        // ── Step 2: model ──
        waitForOptionThenSet('#model', data.model_id, function () {
            console.log('[newrob] multi step 2: setting #model =', data.model_id);
            $('#model').val(data.model_id).trigger('change');

            // ── Step 3: lot-select ──
            waitForOptionThenSet('#lot-select', data.lot_id, function () {
                console.log('[newrob] multi step 3: setting #lot-select =', data.lot_id);
                $('#lot-select').val(data.lot_id).trigger('change');
            });

            // ── Step 4: create one row per issue ──
            waitForPartsLoaded(function () {
                console.log('[newrob] multi step 4: parts ready — creating',
                            data.rows.length, 'part rows');

                data.rows.forEach(function (row, index) {
                    console.log(`[newrob] multi: creating row ${index + 1}/${data.rows.length}`,
                                { issue_id: row.issue_id, part_id: row.part_id });

                    createPartRow();

                    const lastRow     = document.querySelector('.part-row:last-child');
                    const partSelect  = lastRow.querySelector('.partnumber-select');
                    const descInput   = lastRow.querySelector('.partdescription-input');
                    const qtyInput    = lastRow.querySelector('.quantity-input');
                    const reasonInput = lastRow.querySelector('.reason-input');

                    // Tag the row so we can trace it back later
                    lastRow.dataset.issueId = row.issue_id;

                    // Add a hidden input per row so the form submission knows which
                    // issue each part row belongs to
                    const hidden = document.createElement('input');
                    hidden.type  = 'hidden';
                    hidden.name  = `parts[${lastRow.dataset.rowId}][issue_id]`;
                    hidden.value = row.issue_id;
                    lastRow.appendChild(hidden);

                    // Fill the part select once its options are loaded
                    waitForOptionThenSet(partSelect, row.part_id, function () {
                        partSelect.value = row.part_id;
                        partSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        descInput.value   = row.partdesc;
                        qtyInput.value    = row.shortage_qty;
                        reasonInput.value = row.reason ?? '';

                        console.log(`[newrob] multi: row ${index + 1} populated`, {
                            issue_id: row.issue_id,
                            part:     partSelect.value,
                            qty:      qtyInput.value,
                        });
                    });
                });
            });
        });
    });
}
/* ─── Boot ─────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
    console.log('[newrob] DOMContentLoaded fired');
    console.log('[newrob] window.robBootstrap =', window.robBootstrap);

    initSelect2();
    initCustomerSelect();
    initModelSelect();
    initAddPartButton();
    initRemoveRowDelegation();

    const data = window.robBootstrap;

    if (!data) {
        console.log('[newrob] no bootstrap — creating one empty row');
        createPartRow();
        return;
    }

    // Detect mode
    if (data.mode === 'multi' && Array.isArray(data.rows) && data.rows.length > 0) {
        console.log('[newrob] multi-mode: hydrating', data.rows.length, 'rows');
        hydrateMulti(data);
    } else {
        // Single mode (existing behavior, unchanged)
        console.log('[newrob] single-mode: hydrating one row');
        hydrateSingle(data);
    }
});

/* ─── Select2 setup ────────────────────────────────────────────────────────── */

function initSelect2() {
    if ($.fn.select2) {
        $('#lot-select').select2({
            placeholder: 'Search for a lot…',
            allowClear: true,
            width: '100%',
            templateResult:    formatLotOption,
            templateSelection: formatLotSelected,
        });

        $('#robbedlot').select2({
            placeholder: 'Search for a lot…',
            allowClear: true,
            width: '100%',
            templateResult:    formatLotOption,
            templateSelection: formatLotSelected,
        });
    }
}

/* ─── #customer — initial population + change handler ─────────────────────── */

function initCustomerSelect() {
    $.ajax({
        url: App.routes.branches,
        type: 'GET',
        success: function (response) {
            const dropdown = $('#customer');
            dropdown.empty().append('<option value="">Select Customer</option>');
            response.data.forEach(function (branch) {
                dropdown.append($('<option>').val(branch.id).text(branch.cname));
            });

            console.log('[newrob] #customer populated with',
                response.data.length, 'options:',
                Array.from(dropdown[0].options).map(o => ({ v: o.value, t: o.text })));
        },
        error: function () {
            console.error('[newrob] failed to load customers');
            alert('Failed to load customers. Please try again.');
        },
    });

    $('#customer').on('change', function () {
        const selectedCustomerId = $(this).val();
        console.log('[newrob] #customer changed to', selectedCustomerId);

        if (selectedCustomerId) {
            loadModelsByCustomer(selectedCustomerId);
            // Clear lot-select immediately; will be repopulated when model changes
            $('#lot-select').empty().append('<option value="">-- Select a Lot --</option>').trigger('change');
        } else {
            // No customer → clear #model and #lot-select
            const $model = $('#model');
            $model.empty().append('<option value="">Select Model</option>');
            $('#lot-select').empty().append('<option value="">-- Select a Lot --</option>').trigger('change');
        }
    });
}

/* ─── #model — change handler ──────────────────────────────────────────────── */

function initModelSelect() {
    $('#model').on('change', function () {
        const modelId = $(this).val();
        console.log('[newrob] #model changed to', modelId);

        if (modelId) {
            currentModelId = modelId;
            loadLotsByModel(modelId);
            loadPartsByModel(modelId);
        } else {
            currentModelId = null;

            $('#lot-select').empty().append('<option value="">-- Select a Lot --</option>').trigger('change');

            // Clear every row's part dropdown, description and quantity
            document.querySelectorAll('.partnumber-select').forEach(function (selectEl) {
                selectEl.innerHTML = '<option value="">-- Select a Model --</option>';
            });
            document.querySelectorAll('.partdescription-input').forEach(el => el.value = '');
            document.querySelectorAll('.quantity-input').forEach(el => el.value = '');
        }
    });
}

/* ─── #btn-add-part-row ────────────────────────────────────────────────────── */

function initAddPartButton() {
    const btn = document.getElementById('btn-add-part-row');
    if (btn) {
        btn.addEventListener('click', function () {
            createPartRow();
        });
    }
}

/* ─── Delegated remove-row handler ─────────────────────────────────────────── */

function initRemoveRowDelegation() {
    document.addEventListener('click', function (e) {
        const removeBtn = e.target.closest('.btn-remove-unit');
        if (!removeBtn) return;

        const row = removeBtn.closest('.part-row');
        if (row) {
            row.remove();
            syncPartRowNumbers();
        }
    });
}

/* ─── Bootstrap hydration ──────────────────────────────────────────────────── */

/**
 * Waits for #customer to have the expected option, then triggers the
 * full cascade: customer → models → lots + parts → part row.
 */
function hydrateSingle(data) {
    const issueIdInput = document.getElementById('issue_id');
    if (issueIdInput) issueIdInput.value = data.issue_id ?? '';
    console.log('[newrob] hydrating from bootstrap:', data);

    // ── Step 1: wait for #customer to actually contain our value ──
    waitForOptionThenSet('#customer', data.customer_id, function () {
        console.log('[newrob] step 1: setting #customer =', data.customer_id);
        $('#customer').val(data.customer_id).trigger('change');

        // ── Step 2: wait for #model to populate (loaded by loadModelsByCustomer) ──
        waitForOptionThenSet('#model', data.model_id, function () {
            console.log('[newrob] step 2: setting #model =', data.model_id);
            loadLotsByModelandlot(data.model_id);
           
            $('#model').val(data.model_id).trigger('change');

            // ── Step 3: wait for #lot-select to populate ──
            waitForOptionThenSet('#lot-select', data.lot_id, function () {
                console.log('[newrob] step 3: setting #lot-select =', data.lot_id);
                
                $('#lot-select').val(data.lot_id).trigger('change');
            });

            // ── Step 4: wait for parts to finish loading, then create ONE row ──
            waitForPartsLoaded(function () {
                console.log('[newrob] step 4: parts ready — creating part row');
                createPartRow();

                const lastRow     = document.querySelector('.part-row:last-child');
                const partSelect  = lastRow.querySelector('.partnumber-select');
                const descInput   = lastRow.querySelector('.partdescription-input');
                const qtyInput    = lastRow.querySelector('.quantity-input');
                const reasonInput = lastRow.querySelector('.reason-input');

                // ── Step 5: wait for the part option, then fill the row ──
                waitForOptionThenSet(partSelect, data.part_id, function () {
                    console.log('[newrob] step 5: filling part row with part_id =', data.part_id);
                    partSelect.value = data.part_id;
                    // Fire change so any listeners (e.g. auto-fill) run
                    partSelect.dispatchEvent(new Event('change', { bubbles: true }));

                    descInput.value   = data.partdesc;
                    qtyInput.value    = data.shortage_qty;
                    reasonInput.value = data.reason ?? '';

                    console.log('[newrob] row populated:', {
                        part:   partSelect.value,
                        desc:   descInput.value,
                        qty:    qtyInput.value,
                        reason: reasonInput.value,
                    });
                });
            });
        });
    });
}

/* ─── Part rows ────────────────────────────────────────────────────────────── */

function createPartRow() {
    partRowCount++;
    const rowId = partRowCount;

    const row = document.createElement('div');
    row.className = 'part-row';
    row.dataset.rowId = rowId;

    row.innerHTML = `
        <div class="part-row-number">${rowId}</div>

        <div class="field">
            <div class="select-wrap">
                <select name="parts[${rowId}][partnumber]" class="partnumber-select" required>
                    <option value="">Select Partnumber</option>
                </select>
            </div>
            <span class="field-error partnumber-error"></span>
        </div>

        <div class="field">
            <input type="text" class="partdescription-input"
                   name="parts[${rowId}][partdescription]"
                   placeholder="Part Description" readonly required>
            <span class="field-error partdescription-error"></span>
        </div>

        <div class="field">
            <input type="number" class="quantity-input" min="1"
                   name="parts[${rowId}][quantity]"
                   placeholder="Quantity" required>
            <span class="field-error quantity-error"></span>
        </div>

        <div class="field">
            <textarea class="reason-input"
                      name="parts[${rowId}][reason]"
                      placeholder="Enter reason..." required></textarea>
            <span class="field-error reason-error"></span>
        </div>

        <button type="button" class="btn-remove-unit" data-row-id="${rowId}" title="Remove row">
            <span class="material-icons" style="font-size:18px;">close</span>
        </button>
    `;

    document.getElementById('part-rows-container').appendChild(row);

    const $partSelect = row.querySelector('.partnumber-select');
    const $descInput  = row.querySelector('.partdescription-input');

    // If a model is already selected, load parts for this row immediately
    

    // Auto-fill description when a part is chosen
    $partSelect.addEventListener('change', function () {
        const selectedOption = this.options[this.selectedIndex];
        $descInput.value = selectedOption.getAttribute('data-partdesc') || '';
    });

    syncPartRowNumbers();
}

/* ─── Polling helpers ──────────────────────────────────────────────────────── */

/**
 * Polls until a <select> contains an option with the given value, then
 * sets the value and runs the callback. Gives up after ~6 seconds.
 */
function waitForOptionThenSet(selector, value, callback, attempts = 0) {
    const el = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;

    if (!el) {
        console.warn('[waitForOptionThenSet] selector not found:', selector);
        return;
    }

    const hasOption = Array.from(el.options).some(opt => opt.value == value);

    if (hasOption) {
        el.value = value;
        if (callback) callback();
        return;
    }

    if (attempts > 60) {
        console.warn('[waitForOptionThenSet] TIMEOUT — option not found:', {
            selector: typeof selector === 'string' ? selector : '(element)',
            expected_value: value,
            current_options: Array.from(el.options).map(o => ({ v: o.value, t: o.text })),
        });
        return;
    }

    setTimeout(() => waitForOptionThenSet(selector, value, callback, attempts + 1), 100);
}

/**
 * Polls until `currentModelId` is set (meaning model's part-list AJAX has
 * been kicked off). This does not guarantee parts are fully loaded, but
 * loadPartsForRow() handles its own waiting.
 */
function waitForPartsLoaded(callback, attempts = 0) {
    if (currentModelId) {
        if (callback) callback();
        return;
    }
    if (attempts > 60) {
        console.warn('[waitForPartsLoaded] TIMEOUT — proceeding anyway');
        if (callback) callback();
        return;
    }
    setTimeout(() => waitForPartsLoaded(callback, attempts + 1), 100);
}

/* ─── AJAX loaders ─────────────────────────────────────────────────────────── */

function loadModelsByCustomer(customerId) {
    console.log('[newrob] loadModelsByCustomer', customerId);

    $.ajax({
        url: App.routes.getbycamp,
        type: 'GET',
        data: { campusId: customerId },
        success: function (response) {
            const dropdown = $('#model');
            dropdown.empty().append('<option value="">Select Model</option>');
            response.data.forEach(function (m) {
                dropdown.append($('<option>').val(m.id).text(m.mname));
            });

            console.log('[newrob] #model populated with',
                response.data.length, 'options');
        },
        error: function () {
            console.error('[newrob] failed to load models for customer', customerId);
            alert('Failed to load models. Please try again.');
        },
    });
}

function loadLotsByModel(modelId) {
    const $select = $('#lot-select');
    $select.empty().append('<option value="">Loading…</option>').trigger('change');

    console.log('[newrob] loadLotsByModel', modelId);

    fetch(`${App.routes.getLotsByModel}?modelId=${modelId}`)
        .then(r => r.json())
        .then(response => {
            $select.empty().append('<option value="">-- Select a Lot --</option>');

            if (response.data.length === 0) {
                $select.append('<option disabled>No lots found for this model</option>');
            } else {
                response.data.forEach(lot => {
                    const option = document.createElement('option');
                    option.value = lot.id;
                    option.textContent = lot.lotnum;
                    option.setAttribute('data-color', lot.color);
                    option.setAttribute('data-status', lot.status);
                    option.setAttribute('data-statusid', lot.statusid ?? '');
                    $select.append(option);
                });
            }

            $select.trigger('change');
            console.log('[newrob] #lot-select populated with',
                response.data.length, 'options');
        })
        .catch(err => {
            console.error('[newrob] loadLotsByModel failed:', err);
            $select.empty().append('<option value="">Failed to load lots</option>').trigger('change');
        });
}
function loadPartsByModel(modelId) {
    currentModelId = modelId; // remember for rows added later

    $.ajax({
        url: App.routes.getbymodel,
        type: "GET",
        data: { modelid: modelId },
        success: function (response) {
            const parts = response && Array.isArray(response.data) ? response.data : [];

            // Populate every row currently on the page
            document.querySelectorAll('.partnumber-select').forEach(function (selectEl) {
                populatePartSelect(selectEl, parts);
            });
        },
        error: function () {
            showToast('danger', 'Error', 'Failed to load parts. Please try again.');
        }
    });
}

/**
 * Loads parts for a specific row's <select>.
 * NOTE: this function was referenced in the original file but not shown.
 *       If you already have it defined elsewhere (e.g. in a shared file),
 *       REMOVE this stub to avoid a duplicate declaration error.
 */
function loadPartsForRow(selectEl, modelId) {
    $.ajax({
        url: App.routes.getbymodel,
        type: "GET",
        data: { modelid: modelId },
        success: function (response) {
            const parts = response && Array.isArray(response.data) ? response.data : [];
            populatePartSelect(selectEl, parts);
        },
        error: function () {
            showToast('danger', 'Error', 'Failed to load parts for this row.');
        }
    });
}
function populatePartSelect(selectEl, parts) {
    selectEl.innerHTML = '<option value="">Select Partnumber</option>';

    if (parts.length === 0) {
        const opt = document.createElement('option');
        opt.disabled = true;
        opt.textContent = 'No parts found for this model';
        selectEl.appendChild(opt);
        return;
    }

    parts.forEach(function (part) {
        const option = document.createElement('option');
        option.value = part.id;
        option.textContent = part.partnum;
        option.setAttribute('data-partdesc', part.partdesc);
        option.setAttribute('data-quantity', part.quantity);
        selectEl.appendChild(option);
    });
}


/* ─── Row number sync + display helpers ────────────────────────────────────── */

function syncPartRowNumbers() {
    const rows = document.querySelectorAll('.part-row');
    rows.forEach((row, index) => {
        const num = row.querySelector('.part-row-number');
        if (num) num.textContent = index + 1;
    });
}

function formatLotOption(lot) {
    if (!lot.id) return lot.text;
    const color  = lot.element?.dataset?.color  || '#6B7280';
    const status = lot.element?.dataset?.status || '';
    const $wrap = $('<span>').text(lot.text);
    if (status) {
        $wrap.append(
            $('<span>').css({
                'margin-left': '8px',
                'font-size': '11px',
                'color': color,
                'font-weight': '600',
            }).text('· ' + status)
        );
    }
    return $wrap;
}

function formatLotSelected(option) {
    if (!option.id) return option.text;

    const color  = $(option.element).data('color');
    const status = $(option.element).data('status');

    return $(`
        <span style="display:flex; align-items:center; gap:8px;">
            <span>${option.text}</span>
            <span style="
                background-color: ${color};
                color: #fff;
                padding: 1px 7px;
                border-radius: 15px;
                font-size: 9px;
                font-weight: 500;
            ">${status}</span>
        </span>
    `);
}

function loadLotsByModelandlot(modelId) {
    const $select = $('#robbedlot');

    // Reset and show loading
    $select.empty().append('<option value="">Loading…</option>').trigger('change');

    // Fix: Use & instead of ? for second parameter
    fetch(`${App.routes.getLotsByModelandlot}?modelId=${modelId}`)
        .then(r => r.json())
        .then(response => {
            $select.empty().append('<option value="">-- Select a Lot --</option>');

            if (response.data.length === 0) {
                $select.append('<option disabled>No lots found</option>');
            } else {
                response.data.forEach(lot => {
                    const option = new Option(lot.lotnum, lot.id, false, false);
                    $(option).data('color',    lot.color);
                    $(option).data('status',   lot.status);
                    $(option).data('statusid', lot.statusid);  // ← add this
                    $select.append(option);
                });
            }

            $select.trigger('change');
        })
        .catch(() => {
            $select.empty().append('<option value="">Failed to load lots</option>');
            $select.trigger('change');
        });


        
}

