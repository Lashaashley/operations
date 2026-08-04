
$(document).ready(function() {

$('#recievelot').on('submit', function(e) { 
    e.preventDefault();
    
    // Clear previous errors
    $('.text-danger').html('');

    const unitsNo = parseInt(document.getElementById('unitsno').value) || 0;
    const currentRows = document.querySelectorAll('.unit-row').length;

    if (currentRows !== unitsNo) {
        showToast('danger', 'Mismatch', `Please add exactly ${unitsNo} unit(s). Currently: ${currentRows}.`);
        return;
    }
    
    let formData = new FormData(this);

     document.querySelectorAll('.unit-row').forEach(row => {
        const rowId = row.dataset.rowId;
        const images = rowImages[rowId] || [];

        images.forEach((file, i) => {
            formData.append(`units[${rowId}][images][${i}]`, file);
        });
    });
    
    const submitBtn = $(this).find('button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn.html('<span class="material-icons" style="font-size:14px;animation:spin 1s linear infinite">sync</span> Creating…').prop('disabled', true);
    
    // Store reference to form for use in callbacks
    const form = this;

    console.log(formData);
    
    fetch(App.routes.recieved, {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value,
            'Accept': 'application/json',
        },
        body: formData,
    })
    .then(r => r.json().then(data => ({ status: r.status, data })))
    .then(({ status, data }) => {
        if (status === 422) {
            // Clear previous errors
            document.querySelectorAll('.field-error').forEach(el => el.textContent = '');

            Object.entries(data.errors).forEach(([field, messages]) => {
                const errorEl = document.getElementById(`${field}-error`);
                if (errorEl) errorEl.textContent = messages[0];
                else showToast('danger', 'Error', messages[0]); // fallback for 'units' key
            });
            return;
        }

        showToast('success', 'Success', data.message);
        form.reset();
        document.getElementById('units-container').innerHTML = '';
        unitRowCount = 0;
        lastChassisValue = '';
        lastEngineValue = '';
    })
    .catch(() => showToast('danger', 'Error', 'Something went wrong. Please try again.'))
    .finally(() => {
        submitBtn.html(originalText).prop('disabled', false);
    });
});
       });

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
    const lotId = $('#lot-select').val();  // fixed: missing $
    unitRowCount++;
    const rowId = unitRowCount;

    const row = document.createElement('div');
    row.className = 'unit-row';
    row.dataset.rowId = rowId;

    row.innerHTML = `
        <div class="unit-row-number">${rowId}</div>

        <div class="field">
            <div class="select-wrap">
                <select name="units[${rowId}][caseno]" class="boxcaseno-select" required>
                    <option value="">Select Case</option>
                </select>
            </div>
            <span class="field-error caseno-error"></span>
        </div>

        <div class="field unit-status-field">
            <label class="status-toggle" title="Toggle OK/NOK">
                <input type="checkbox" class="status-checkbox">
                <span class="toggle-track">
                    <span class="toggle-thumb"></span>
                    <span class="toggle-label-ok">OK</span>
                    <span class="toggle-label-nok">NOK</span>
                </span>
            </label>
            <input type="hidden" name="units[${rowId}][status]" value="OK">
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

        <div class="field unit-image-field" style="display:none;">
            <div class="image-capture-wrap">
                <button type="button" class="btn-image-action btn-camera" title="Take photo">
                    <span class="material-icons">photo_camera</span>
                </button>
                <button type="button" class="btn-image-action btn-upload" title="Upload from device">
                    <span class="material-icons">upload</span>
                </button>
                <input type="file" class="camera-input" accept="image/*" capture="environment" style="display:none;">
                <input type="file" class="upload-input" accept="image/*" multiple style="display:none;">
                <span class="image-count-badge" style="display:none;">0</span>
            </div>
            <div class="image-thumbs-row"></div>
            <span class="field-error image-error"></span>
        </div>

        <button type="button" class="btn-remove-unit" data-row-id="${rowId}" title="Remove row">
            <span class="material-icons" style="font-size:18px;">close</span>
        </button>
    `;

    document.getElementById('units-container').appendChild(row);

    // Only comment field uses ghost hint now — chassis input is gone
    attachGhostHint(row.querySelector('.engine-input'), () => lastEngineValue, (v) => lastEngineValue = v);

    const $caseSelect = row.querySelector('.boxcaseno-select');

    // Initialize Select2 on this row's dropdown
    $($caseSelect).select2({
        placeholder: 'Search for a case…',
        allowClear: true,
        width: '100%',
        dropdownParent: $(row) // keeps dropdown positioned correctly inside dynamic rows
    });

    loadcasesbylot(lotId, $caseSelect);

    // ── Toggle behavior: OK / NOK ──────────────────
    const statusCheckbox = row.querySelector('.status-checkbox');
    const statusHidden   = row.querySelector('input[type="hidden"]');
    const commentInput   = row.querySelector('.engine-input');
    const imageField     = row.querySelector('.unit-image-field');

    statusCheckbox.addEventListener('change', function () {
        if (this.checked) {
            // NOK
            statusHidden.value = 'NOK';
            row.classList.add('row-flagged');
            commentInput.placeholder = 'Comment (explain issue)';
            imageField.style.display = 'block'; // show image capture only for NOK
        } else {
            // OK
            statusHidden.value = 'OK';
            row.classList.remove('row-flagged');
            commentInput.placeholder = 'Comment';
            imageField.style.display = 'none';
            clearRowImages(row); // remove any attached images when switching back to OK
        }
    });

    attachImageCapture(row, rowId);

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
// Store selected File objects per row, keyed by rowId
const rowImages = {};

function attachImageCapture(row, rowId) {
    rowImages[rowId] = [];

    const cameraBtn   = row.querySelector('.btn-camera');
    const uploadBtn    = row.querySelector('.btn-upload');
    const cameraInput  = row.querySelector('.camera-input');
    const uploadInput  = row.querySelector('.upload-input');

    cameraBtn.addEventListener('click', () => cameraInput.click());
    uploadBtn.addEventListener('click', () => uploadInput.click());

    cameraInput.addEventListener('change', function () {
        handleImageFiles(row, rowId, this.files);
        this.value = ''; // reset so the same photo can be retaken if needed
    });

    uploadInput.addEventListener('change', function () {
        handleImageFiles(row, rowId, this.files);
        this.value = '';
    });
}

function handleImageFiles(row, rowId, fileList) {
    const files = Array.from(fileList);

    files.forEach(file => {
        if (!file.type.startsWith('image/')) return;

        // Basic size guard — 8MB per image
        if (file.size > 8 * 1024 * 1024) {
            showToast('warning', 'Too large', `${file.name} exceeds 8MB and was skipped.`);
            return;
        }

        rowImages[rowId].push(file);
    });

    renderRowThumbnails(row, rowId);
}

function renderRowThumbnails(row, rowId) {
    const thumbsRow = row.querySelector('.image-thumbs-row');
    const countBadge = row.querySelector('.image-count-badge');

    thumbsRow.innerHTML = '';

    rowImages[rowId].forEach((file, index) => {
        const url = URL.createObjectURL(file);

        const thumb = document.createElement('div');
        thumb.className = 'image-thumb';
        thumb.innerHTML = `
            <img src="${url}" alt="NOK evidence">
            <button type="button" class="thumb-remove" data-index="${index}">
                <span class="material-icons">close</span>
            </button>
        `;

        thumb.querySelector('.thumb-remove').addEventListener('click', function () {
            rowImages[rowId].splice(index, 1);
            renderRowThumbnails(row, rowId);
        });

        thumbsRow.appendChild(thumb);
    });

    if (rowImages[rowId].length > 0) {
        countBadge.style.display = 'inline-flex';
        countBadge.textContent = rowImages[rowId].length;
    } else {
        countBadge.style.display = 'none';
    }
}

function clearRowImages(row) {
    const rowId = row.dataset.rowId;
    rowImages[rowId] = [];
    row.querySelector('.image-thumbs-row').innerHTML = '';
    row.querySelector('.image-count-badge').style.display = 'none';
}
function loadcasesbylot(lotid, $selectEl) {
    $.ajax({
        url: App.routes.boxcasebylot,
        type: "GET",
        data: { lotid: lotid },
        success: function (response) {
            const $dropdown = $($selectEl);
            $dropdown.empty();
            $dropdown.append('<option value="">Select Case</option>');

            response.data.forEach(function (cases) {
                const option = new Option(cases.boxcase, cases.boxcase, false, false);
                $dropdown.append(option);
            });

            // Refresh Select2 to reflect newly loaded options
            $dropdown.trigger('change');
        },
        error: function () {
            showToast('danger', 'Error', 'Failed to load cases. Please try again.');
        }
    });
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


