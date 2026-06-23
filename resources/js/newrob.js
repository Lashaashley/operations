
document.addEventListener('DOMContentLoaded', function () {
    $('#lot-select').select2({
    placeholder: 'Search for a lot…',
    allowClear: true,
    width: '100%',
    templateResult:    formatLotOption,  // dropdown items
    templateSelection: formatLotSelected // selected item
});
 $('#robbedlot').select2({
    placeholder: 'Search for a lot…',
    allowClear: true,
    width: '100%',
    templateResult:    formatLotOption,  // dropdown items
    templateSelection: formatLotSelected // selected item
});

$('#partnumber').select2({
    placeholder: 'Search for a pnumber…',
    allowClear: true,
    width: '100%'
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
        loadpartsBymodel(modelId);
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

      $('#partnumber').on('change', function() {
    const selectedOption = $(this).find(':selected');
    
    // Get the stored data from the selected option
    const partdesc = selectedOption.data('partdesc') || '';
    const quantity = selectedOption.data('quantity') || '';
    
    // Populate the fields
    $('#partdescription').val(partdesc);
    $('#quanitity').val(quantity);
});

     $('#lot-select').on('change', function() {
    const selectedOption = $(this).find(':selected');
    const modelId = $('#model').val();
    
    // Get the stored statusid from the selected option
    const statusid = selectedOption.data('statusid');
    
    if (modelId) {
        loadLotsByModelandlot(modelId, statusid);
    } else {
        const $select = $('#robbedlot');
        $select.empty().append('<option value="">-- Select a Lot --</option>');
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

      function loadpartsBymodel(modelid) {
    $.ajax({
        url: App.routes.getbymodel,
        type: "GET",
        data: { modelid: modelid },
        success: function (response) {
            const dropdown = $('#partnumber');
            dropdown.empty();
            dropdown.append('<option value="">Select Partnumber</option>');
            
            response.data.forEach(function (parts) {
                const $option = $('<option>')
                    .val(parts.id)
                    .text(parts.partnum)
                    // Store additional data as data attributes
                    .data('partdesc', parts.partdesc)
                    .data('quantity', parts.quantity);
                
                dropdown.append($option);
            });
        },
        error: function () {
            alert('Failed to load Parts. Please try again.');
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


// Call this when a model is selected — pass the model ID
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




function loadLotsByModelandlot(modelId, statusid) {
    const $select = $('#robbedlot');

    // Reset and show loading
    $select.empty().append('<option value="">Loading…</option>').trigger('change');

    // Fix: Use & instead of ? for second parameter
    fetch(`${App.routes.getLotsByModelandlot}?modelId=${modelId}&statusid=${statusid}`)
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

       $(document).ready(function() {

   
       });