document.addEventListener('DOMContentLoaded', function () {
    $('#lot-select').select2({
    placeholder: 'Search for a lot…',
    allowClear: true,
    width: '100%',
    templateResult:    formatLotOption,  // dropdown items
    templateSelection: formatLotSelected // selected item
});

$.ajax({
        url: App.routes.branches,
        type: "GET",
        success: function (response) {
            const dropdown = $('#customer');
            dropdown.empty();
            dropdown.append('<option value="">Select Customer</option>');
            response.data.forEach(function (branch) {
                const $option = $('<option>')
                .val(branch.id)           
                .text(branch.cname); 
                dropdown.append($option);
            });
        },
        error: function () {
            alert('Failed to load branches. Please try again.');
        },
    });

    $('#customer').on('change', function() {
          const selectedCampusId = $(this).val();
          if (selectedCampusId) {
            loadmodelsByCust(selectedCampusId);
            const $select = $('#lot-select');
            $select.empty().append('<option value="">-- Select a Lot --</option>');
          } else {
            // Clear classes dropdown if no campus is selected
          const classDropdown = $('#model');
          classDropdown.empty();
          classDropdown.append('<option value="">Select Model</option>');
        }
        
      });


$('#model').on('change', function() {
    const modelId = $(this).val();
    if (modelId) { 
        loadLotsByModel(modelId);
       
    } else {
        // Clear lots dropdown
        const $select = $('#lot-select');
        $select.empty().append('<option value="">-- Select a Lot --</option>');
        
        // Clear parts dropdown
        const $select2 = $('#partnumber');
        $select2.empty().append('<option value="">-- Select a Model --</option>');
        
        // Clear the description and quantity fields when model changes
        $('#partdescription').val('');
        $('#quanitity').val('');
    }
});
document.getElementById('btn-add-unit').addEventListener('click', function () {
    const unitsNo = parseInt(document.getElementById('unitsno').value) || 0;
    const currentRows = document.querySelectorAll('.unit-row').length;

    if (currentRows >= unitsNo) {
        showToast('warning', 'Limit reached', `You can only add ${unitsNo} unit(s) as specified above.`);
        return;
    }

    createUnitRow();
});

document.getElementById('units-container').addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-remove-unit');
    if (btn) removeUnitRow(btn.dataset.rowId);
});

// Re-validate row limit whenever unitsno changes
document.getElementById('unitsno').addEventListener('input', syncAddButtonState);

// Auto-create the first row once unitsno is filled the first time
document.getElementById('unitsno').addEventListener('change', function () {
    const unitsNo = parseInt(this.value) || 0;
    const currentRows = document.querySelectorAll('.unit-row').length;

    if (currentRows === 0 && unitsNo > 0) {
        createUnitRow();
    }
});
});

function loadmodelsByCust(campusId) {
        $.ajax({
          url: App.routes.getbycamp,
          type: "GET",
          data: { campusId: campusId },
          success: function (response) {
            const dropdown = $('#model');
            dropdown.empty();
            dropdown.append('<option value="">Select Model</option>');
            

            response.data.forEach(function (models) {
                const $option = $('<option>')
                .val(models.id)           
                .text(models.mname); 
                dropdown.append($option);
            });
          },
          error: function () {
            alert('Failed to load models. Please try again.');
          }
        });
      }

      function loadLotsByModel(modelId) {
    const $select = $('#lot-select');

    // Reset and show loading
    $select.empty().append('<option value="">Loading…</option>').trigger('change');

    fetch(`${App.routes.getLotsByModel}?modelId=${modelId}`)
        .then(r => r.json())
        .then(response => {
            $select.empty().append('<option value="">-- Select a Lot --</option>');

            if (response.data.length === 0) {
                $select.append('<option disabled>No lots found for this model</option>');
            } else {
                response.data.forEach(lot => {
                    // Create option with proper data attributes
                    const option = document.createElement('option');
                    option.value = lot.id;
                    option.textContent = lot.lotnum;
                    
                    // Store data attributes
                    $(option).data('color', lot.color);
                    $(option).data('status', lot.status);
                    $(option).data('statusid', lot.statusid); // Store the statusid
                    
                    $select.append(option);
                });
            }

            $select.trigger('change'); // refresh Select2
        })
        .catch(() => {
            $select.empty().append('<option value="">Failed to load lots</option>');
            $select.trigger('change');
        });
}


      function sanitize2(str) {
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
    const safeType    = sanitize2(type);
    const safeTitle   = sanitize2(title);
    const safeMessage = sanitize2(message);

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

      // resources/js/createlot.js (add to existing file)

let lastChassisValue = '';
let lastEngineValue  = '';
let unitRowCount = 0;

function createUnitRow() {
    unitRowCount++;
    const rowId = unitRowCount;

    const row = document.createElement('div');
    row.className = 'unit-row';
    row.dataset.rowId = rowId;

    row.innerHTML = `
        <div class="unit-row-number">${rowId}</div>

        <div class="field">
            <div class="ghost-input-wrap">
                <input type="text" 
                       class="chassis-input" 
                       name="units[${rowId}][caseno]" 
                       placeholder="Case Number" 
                       autocomplete="off"
                       required>
                <div class="ghost-overlay"></div>
            </div>
            <span class="field-error caseno-error"></span>
        </div>

        <div class="field unit-status-field">
            <label class="status-toggle" title="Toggle OK/NOK">
                <input type="checkbox" 
                       class="status-checkbox" 
                       name="units[${rowId}][status]" 
                       value="NOK">
                <span class="toggle-track">
                    <span class="toggle-thumb"></span>
                    <span class="toggle-label-ok">OK</span>
                    <span class="toggle-label-nok">NOK</span>
                </span>
            </label>
            <span class="field-error status-error"></span>
        </div>

        <div class="field">
            <div class="ghost-input-wrap">
                <input type="text" 
                       class="engine-input" 
                       name="units[${rowId}][comment]" 
                       placeholder="Comment" 
                       autocomplete="off">
                <div class="ghost-overlay"></div>
            </div>
            <span class="field-error comment-error"></span>
        </div>

        <button type="button" class="btn-remove-unit" data-row-id="${rowId}" title="Remove row">
            <span class="material-icons" style="font-size:18px;">close</span>
        </button>
    `;

    document.getElementById('units-container').appendChild(row);

    attachGhostHint(row.querySelector('.chassis-input'), () => lastChassisValue, (v) => lastChassisValue = v);
    attachGhostHint(row.querySelector('.engine-input'),  () => lastEngineValue,  (v) => lastEngineValue  = v);

    // ── Toggle behavior: OK / NOK ──────────────────
    const statusCheckbox = row.querySelector('.status-checkbox');
    const commentInput   = row.querySelector('.engine-input');

    statusCheckbox.addEventListener('change', function () {
        if (this.checked) {
            // NOK
            row.classList.add('row-flagged');
            commentInput.placeholder = 'Comment (explain issue)';
        } else {
            // OK
            row.classList.remove('row-flagged');
            commentInput.placeholder = 'Comment';
        }
    });

    syncUnitRowNumbers();
    syncAddButtonState();
}
function removeUnitRow(rowId) {
    const row = document.querySelector(`.unit-row[data-row-id="${rowId}"]`);
    if (row) row.remove();
    syncUnitRowNumbers();
    syncAddButtonState();
}

function syncUnitRowNumbers() {
    document.querySelectorAll('.unit-row').forEach((row, index) => {
        row.querySelector('.unit-row-number').textContent = index + 1;
    });
}

// Lock row count to match unitsno field
function syncAddButtonState() {
    const unitsNo = parseInt(document.getElementById('unitsno').value) || 0;
    const currentRows = document.querySelectorAll('.unit-row').length;
    const addBtn = document.getElementById('btn-add-unit');

    addBtn.disabled = currentRows >= unitsNo;
    addBtn.style.opacity = currentRows >= unitsNo ? '0.5' : '1';
    addBtn.style.cursor  = currentRows >= unitsNo ? 'not-allowed' : 'pointer';

    document.getElementById('units-error').textContent =
        currentRows !== unitsNo && unitsNo > 0
            ? `${currentRows} of ${unitsNo} cases added`
            : '';
}


// ── Ghost text hint logic ───────────────────────────────────
function attachGhostHint(input, getLastValue, setLastValue) {
    const overlay = input.parentElement.querySelector('.ghost-overlay');

    input.addEventListener('input', function () {
        updateGhostOverlay(input, overlay, getLastValue());
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Tab' && overlay.dataset.hint) {
            e.preventDefault();
            input.value = overlay.dataset.hint;
            overlay.innerHTML = '';
            overlay.dataset.hint = '';

            // Move cursor to end, select nothing — let user edit freely
            input.setSelectionRange(input.value.length, input.value.length);
        }
    });

    input.addEventListener('blur', function () {
        if (input.value.trim() !== '') {
            setLastValue(input.value.trim());
        }
        overlay.innerHTML = '';
        overlay.dataset.hint = '';
    });

    input.addEventListener('focus', function () {
        updateGhostOverlay(input, overlay, getLastValue());
    });
}

function updateGhostOverlay(input, overlay, lastValue) {
    const typed = input.value;

    if (!lastValue || typed.length === 0 || !lastValue.startsWith(typed)) {
        overlay.innerHTML = '';
        overlay.dataset.hint = '';
        return;
    }

    if (typed === lastValue) {
        // Already fully matches — no hint needed
        overlay.innerHTML = '';
        overlay.dataset.hint = '';
        return;
    }

    const hintRemainder = lastValue.slice(typed.length);
    overlay.innerHTML = `<span class="typed-part">${typed}</span><span class="hint-part">${hintRemainder}</span>`;
    overlay.dataset.hint = lastValue;
}

function formatLotOption(option) {
    if (!option.id) return $('<span>' + option.text + '</span>'); // placeholder

    const color  = $(option.element).data('color');
    const status = $(option.element).data('status');

    return $(`
        <div style="display:flex; align-items:center; justify-content:space-between; padding:2px 0;">
            <span style="font-weight:500;">${option.text}</span>
            <span style="
                background-color: ${color};
                color: #fff;
                padding: 2px 8px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
            ">${status}</span>
        </div>
    `);
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
                padding: 0px 7px;
                border-radius: 15px;
                font-size: 9px;
                font-weight: 500;
            ">${status}</span>
        </span>
    `);
}

let heartbeatInterval = null;
let currentTrackedLotId = null;

function startHeartbeat(lotId) {
    currentTrackedLotId = lotId;

    sendHeartbeat(lotId); // fire immediately

    if (heartbeatInterval) clearInterval(heartbeatInterval);

    heartbeatInterval = setInterval(() => {
        if (currentTrackedLotId) sendHeartbeat(currentTrackedLotId);
    }, 10000); // every 10 seconds
}

function sendHeartbeat(lotId) { 
    fetch(`${App.routes.lotActivityHeartbeat}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value,
        },
        body: JSON.stringify({ lot_id: lotId }),
    }).catch(() => { /* silent fail — non-critical */ });
}

function endTracking(lotId) {
    if (!lotId) return;

    // Use sendBeacon for reliable delivery even on tab close
    const payload = JSON.stringify({ lot_id: lotId });
    const formData = new FormData();
    formData.append('lot_id', lotId);
    formData.append('_token', document.querySelector('input[name="_token"]').value);

    navigator.sendBeacon(App.routes.lotActivityEnd, formData);
}

// Trigger when a lot is selected
$('#lot-select').on('change', function () {
    const lotId = $(this).val();

    
    // End previous tracking if switching lots
    if (currentTrackedLotId && currentTrackedLotId !== lotId) {
        endTracking(currentTrackedLotId);
    }

    if (lotId) {
        console.log(lotId);
        startHeartbeat(lotId);
    } else {
        clearInterval(heartbeatInterval);
        currentTrackedLotId = null;
    }
});

// End tracking when user leaves the page
window.addEventListener('beforeunload', function () {
    if (currentTrackedLotId) {
        endTracking(currentTrackedLotId);
    }
});