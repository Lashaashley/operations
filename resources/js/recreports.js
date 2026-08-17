document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('viewrpt').addEventListener('click', function () {
    const lotId = document.getElementById('lot-select').value;

    if (!lotId) {
        showToast('warning', 'Required', 'Please select a lot first.');
        return;
    }

    // Open modal in loading state
    document.getElementById('pdfModalBackdrop').style.display = 'flex';
    document.getElementById('pdf-loading').style.display      = 'flex';
    document.getElementById('pdf-frame').style.display        = 'none';
    document.getElementById('pdf-modal-title').textContent    = 'Generating Report…';

    fetch(`${App.routes.reportReceiving}?lot_id=${lotId}`)
    .then(r => r.json())
    .then(data => {
        if (data.error) throw new Error(data.error);

        const byteCharacters = atob(data.pdf);
        const byteArray      = new Uint8Array([...byteCharacters].map(c => c.charCodeAt(0)));
        const blob           = new Blob([byteArray], { type: 'application/pdf' });
        const blobUrl        = URL.createObjectURL(blob);

        const frame = document.getElementById('pdf-frame');
        frame.src   = blobUrl;

        // Hide spinner, show iframe
        document.getElementById('pdf-loading').style.display = 'none';
        frame.style.display = 'block';

        document.getElementById('pdf-modal-title').textContent =
            `Lot ${data.lot_num} — Time Taken: ${data.time_taken}`;
    })
    .catch(err => {
        document.getElementById('pdfModalBackdrop').classList.remove('open');
        showToast('danger', 'Error', err.message || 'Failed to generate report.');
    });
});
document.getElementById('viewlfeedrpt').addEventListener('click', function () {
    const lotId = document.getElementById('lineflot').value;

    if (!lotId) {
        showToast('warning', 'Required', 'Please select a lot first.');
        return;
    }

    document.getElementById('pdfModalBackdrop').classList.add('open');
    document.getElementById('pdf-loading').style.display = 'flex';
    document.getElementById('pdf-frame').style.display   = 'none';
    document.getElementById('pdf-modal-title').textContent = 'Generating Line Feeding Report…';

    fetch(`${App.routes.reportLineFeeding}?lot_id=${lotId}`)
        .then(r => r.json())
        .then(data => {
            if (data.error) throw new Error(data.error);

            const byteCharacters = atob(data.pdf);
            const byteArray = new Uint8Array([...byteCharacters].map(c => c.charCodeAt(0)));
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const frame = document.getElementById('pdf-frame');
            frame.src = URL.createObjectURL(blob);

            document.getElementById('pdf-loading').style.display = 'none';
            frame.style.display = 'block';
            document.getElementById('pdf-modal-title').textContent = `Lot ${data.lot_num} — Line Feeding Report`;
        })
        .catch(err => {
            document.getElementById('pdfModalBackdrop').classList.remove('open');
            showToast('danger', 'Error', err.message || 'Failed to generate report.');
        });
});
document.getElementById('pdfModalClose').addEventListener('click', function () {
    document.getElementById('pdfModalBackdrop').style.display = 'none';
    document.getElementById('pdf-frame').src = '';
});

    // Reusable helper — add once at top of preports.js

    /* ── Tab switching ─────────────────────────────────────── */
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const tabId    = this.dataset.tab;
            const approved = this.dataset.netpayApproved;
 
            // Block if disabled
            if (this.classList.contains('disabled')) {
                showToast('warning', 'Access Restricted',
                    'Bank Interface requires netpay approval (' + (this.dataset.netpayStatus || '') + ').');
                return;
            }
 
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
 
            this.classList.add('active');
            const panel = document.getElementById('panel-' + tabId);
            if (panel) panel.classList.add('active');
        });
    });
 
    /* ── Expose openTab for any legacy inline calls ────────── */
    window.openTab = function (event, tabId) {
        const btn = document.querySelector('[data-tab="' + tabId + '"]');
        if (btn) btn.click();
    };

   
    $('#lot-select').select2({
    placeholder: 'Search for a lot…',
    allowClear: true,
    width: '100%',
    templateResult:    formatLotOption,  // dropdown items
    templateSelection: formatLotSelected // selected item
});

$('#lineflot').select2({
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

            const dropdown2 = $('#ki-customer');
            dropdown2.empty();
            dropdown2.append('<option value="">Select Customer</option>');
            response.data.forEach(function (branch) {
                const $option = $('<option>')
                .val(branch.id)           
                .text(branch.cname); 
                dropdown.append($option);

                const $option2 = $('<option>')
                .val(branch.id)           
                .text(branch.cname); 
                dropdown2.append($option2);
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

       $('#ki-customer').on('change', function() {
          const selectedCampusId = $(this).val();
          if (selectedCampusId) {
            loadmodelsByCust2(selectedCampusId);
           
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

$('#linefmodel').on('change', function() {
    const modelId = $(this).val();
    if (modelId) { 
        loadLotsByModel2(modelId);
    } else {
        // Clear lots dropdown
        const $select = $('#lineflot');
        $select.empty().append('<option value="">-- Select a Lot --</option>');
        
    }
});

document.getElementById('viewkitsrpt').addEventListener('click', function () {
    const customerId    = document.getElementById('ki-customer').value;
    const modelId        = document.getElementById('ki-model').value;
    const includeUnits    = document.getElementById('ki-include-units').checked;

    document.getElementById('pdfModalBackdrop').classList.add('open');
    document.getElementById('pdf-loading').style.display = 'flex';
    document.getElementById('pdf-frame').style.display   = 'none';
    document.getElementById('pdf-modal-title').textContent = 'Generating Kits Inventory Report…';

    const params = new URLSearchParams();
    if (customerId) params.append('customer_id', customerId);
    if (modelId)    params.append('model_id', modelId);
    params.append('include_units', includeUnits ? '1' : '0');

    fetch(`${App.routes.reportKitsInventory}?${params.toString()}`)
        .then(r => r.json())
        .then(data => {
            if (data.error) throw new Error(data.error);

            const byteCharacters = atob(data.pdf);
            const byteArray = new Uint8Array([...byteCharacters].map(c => c.charCodeAt(0)));
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const frame = document.getElementById('pdf-frame');
            frame.src = URL.createObjectURL(blob);

            document.getElementById('pdf-loading').style.display = 'none';
            frame.style.display = 'block';
            document.getElementById('pdf-modal-title').textContent = 'Kits Inventory Report';
        })
        .catch(err => {
            document.getElementById('pdfModalBackdrop').classList.remove('open');
            showToast('danger', 'Error', err.message || 'Failed to generate report.');
        });
});


$.ajax({
        url: App.routes.depts,
        type: "GET",
        success: function (response) {
            const dropdown = $('#linefmodel');
            dropdown.empty();
            dropdown.append('<option value="">Select Model</option>');
            response.data.forEach(function (model) {
                const $option = $('<option>')
                .val(model.id)           
                .text(model.mname); 
                dropdown.append($option);
            });
        },
        error: function () {
            alert('Failed to load Models. Please try again.');
        },
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

      function loadmodelsByCust2(campusId) {
        $.ajax({
          url: App.routes.getbycamp,
          type: "GET",
          data: { campusId: campusId },
          success: function (response) {
            const dropdown = $('#ki-model');
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

function loadLotsByModel2(modelId) {
    const $select = $('#lineflot');

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
