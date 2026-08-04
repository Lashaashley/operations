document.addEventListener('DOMContentLoaded', function () {

        $('#lot-select').select2({
    placeholder: 'Search for a lot…',
    allowClear: true,
    width: '100%',
    templateResult:    formatLotOption,  // dropdown items
    templateSelection: formatLotSelected // selected item
});
    $.ajax({
        url: App.routes.depts,
        type: "GET",
        success: function (response) {
            const dropdown = $('#model');
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
            alert('Failed to load branches. Please try again.');
        },
    });

    $('#model').on('change', function() {
    const modelId = $(this).val();
    if (modelId) { 
        loadLotsByModel(modelId);
    } else {
        // Clear lots dropdown
        const $select = $('#lot-select');
        $select.empty().append('<option value="">-- Select a Lot --</option>');
        
    }
});

 $('#lot-select').on('change', function() {
    const lotid = $(this).val();
    if (lotid) { 
        loadcasebylot(lotid);
    } else {
        // Clear lots dropdown
        const $select = $('#case');
        $select.empty().append('<option value="">-- Select a Case --</option>');
        
    }
});

let currentLotId  = null;
let currentCase   = null;

// Triggered when #case select changes
$('#case').on('change', function () {
    const boxcase = $(this).val();
    const lotId   = $('#lot-select').val();

    if (!boxcase || !lotId) {
        resetPartsContainer();
        return;
    }

    currentLotId = lotId;
    currentCase  = boxcase;

    loadPartsForCase(lotId, boxcase);
});


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

    fetch(`${App.routes.reportUnboxing}?lot_id=${lotId}`)
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

document.getElementById('pdfModalClose').addEventListener('click', function () {
    document.getElementById('pdfModalBackdrop').style.display = 'none';
    document.getElementById('pdf-frame').src = '';
});


});


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

// Renders the selected option in the input box
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


 function loadcasebylot(lotid) {
        $.ajax({
          url: App.routes.getbylot,
          type: "GET",
          data: { lotid: lotid },
          success: function (response) {
            const dropdown = $('#case');
            dropdown.empty();
            dropdown.append('<option value="">Select Case</option>');
            

            response.data.forEach(function (cases) {
                const $option = $('<option>')
                .val(cases.boxcase)           
                .text(cases.boxcase); 
                dropdown.append($option);
            });
          },
          error: function () {
            alert('Failed to load Cases. Please try again.');
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

