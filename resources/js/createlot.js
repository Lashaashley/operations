
document.addEventListener('DOMContentLoaded', function () {
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
          } else {
            // Clear classes dropdown if no campus is selected
          const classDropdown = $('#model');
          classDropdown.empty();
          classDropdown.append('<option value="">Select Model</option>');
        }
        
      });

      // ── Init ──────────────────────────────────────────────────────
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

       $(document).ready(function() {

$('#createuser').on('submit', function(e) { 
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
    
    const submitBtn = $(this).find('button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn.html('<span class="material-icons" style="font-size:14px;animation:spin 1s linear infinite">sync</span> Creating…').prop('disabled', true);
    
    // Store reference to form for use in callbacks
    const form = this;
    
    fetch(App.routes.newlot, {
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
                       name="units[${rowId}][chassis_number]" 
                       placeholder="Chassis Number" 
                       autocomplete="off"
                       required>
                <div class="ghost-overlay"></div>
            </div>
            <span class="field-error chassis-error"></span>
        </div>

        <div class="field">
            <div class="ghost-input-wrap">
                <input type="text" 
                       class="engine-input" 
                       name="units[${rowId}][engine_number]" 
                       placeholder="Engine Number" 
                       autocomplete="off"
                       required>
                <div class="ghost-overlay"></div>
            </div>
            <span class="field-error engine-error"></span>
        </div>

        <button type="button" class="btn-remove-unit" data-row-id="${rowId}">
            <span class="material-icons" style="font-size:18px;">close</span>
        </button>
    `;

    document.getElementById('units-container').appendChild(row);

    attachGhostHint(row.querySelector('.chassis-input'), () => lastChassisValue, (v) => lastChassisValue = v);
    attachGhostHint(row.querySelector('.engine-input'),  () => lastEngineValue,  (v) => lastEngineValue  = v);

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
            ? `${currentRows} of ${unitsNo} units added`
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


