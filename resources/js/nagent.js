 $(document).ready(function() {
    

            $('#staffForm').on('submit', function (e) { 
    e.preventDefault();

    var form = this; // Reference the form element
    var formData = new FormData(form); // Use FormData to handle file uploads

    const storeagentUrl = form.dataset.storeagentUrl;
    
    const submitBtn = $(form).find('button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn.html('<i class="fa fa-spinner fa-spin"></i> Saving...').prop('disabled', true);

    $.ajax({
   url: storeagentUrl,
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    dataType: 'json',
    success: function (response) {
        // Remove JSON.parse - dataType: 'json' already parses it
        if (response.status === 'success') {
            var empid = response.empid;
            var empidElements = document.querySelectorAll('.empid');
            empidElements.forEach(function (element) {
                element.value = empid;
            });
            showToast('success','Success!', 'Agent Records Successfully Added. ID: ' + empid);
            form.reset();
           
        } else if (response.status === 'error') {
            showToast('danger', 'Error!', response.message);
        }
    },
    error: function (xhr) {
    if (xhr.status === 422) {
        let errors = xhr.responseJSON.errors;
        let firstError = Object.values(errors)[0][0];
        showToast('danger', 'Error!', firstError);
    } else {
        showToast('danger', 'Error!', 'An error occurred. Please try again.');
    }
},
    complete: function () {
        submitBtn.html(originalText).prop('disabled', false);
    }
});
});

const form2 = document.getElementById('registrationForm');

$('#registrationForm').on('submit', function (e) {
    e.preventDefault();

    const form = this;

    // Stop if HTML5 validation fails
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    const regagentUrl = form2.dataset.regagentUrl;
    const formData = new FormData(form);
    const submitBtn = $('#load');
    const originalText = submitBtn.html();

    submitBtn.html('<i class="fa fa-spinner fa-spin"></i> Saving...')
             .prop('disabled', true);

    $.ajax({
        url: regagentUrl,
        method: "POST",
        data: formData,
        processData: false,
        contentType: false,
        dataType: "json",

        success: function (response) {
            if (response.status === 'success') {
                showToast('success', 'Success!','Registration saved successfully');
                form.reset();
            } else {
                showToast ('danger', 'Error!', response.message ?? 'Save failed');
            }
        },

        error: function (xhr) {
            if (xhr.status === 422) {
                const errors = xhr.responseJSON.errors;
                const firstError = Object.values(errors)[0][0];
                showToast('danger', 'Error!', firstError);
            } else {
                showToast('danger', 'Error!', 'An unexpected error occurred');
            }
        },

        complete: function () {
            submitBtn.html(originalText).prop('disabled', false);
        }
    });
});

           $.ajax({
        url: App.routes.branches,
        type: "GET",
        success: function (response) {
            const dropdown = $('#brid');
           
            dropdown.empty();
           

            // Add default options
            dropdown.append('<option value="">Select Branch</option>');
            dropdown.append('<option value="0">Overall</option>');
           


            // Populate with branches
            response.data.forEach(function (branch) {
                const $option = $('<option>')
                .val(branch.ID)           // ✅ .val() automatically escapes
                .text(branch.branchname); // ✅ .text() never renders HTML
                dropdown.append($option);
            });
        },
        error: function () {
            showToast('danger', 'Error!', 'Failed to load branches. Please try again.');
        },
    }); 
    $('#brid').on('change', function() {
          const selectedCampusId = $(this).val();
          if (selectedCampusId) {
            loadClassesByCampus(selectedCampusId);
          } else {
            // Clear classes dropdown if no campus is selected
          const classDropdown = $('#dept');
          classDropdown.empty();
          classDropdown.append('<option value="">Select Department</option>');
        }
        
      });
      $('#bank').on('change', function() {
          const selectedCampusId = $(this).val();
          if (selectedCampusId) {
            loadBranches(selectedCampusId);
          } else {
            // Clear classes dropdown if no campus is selected
          const classDropdown = $('#branch');
          classDropdown.empty();
          classDropdown.append('<option value="">Select Branch</option>');
        }
        
      });
      $('#branch').on('change', function() {
          const branch = $(this).val();
          const bank = $('#bank').val();
          if (branch) {
            fetchcodes(bank,branch);
          } else {

         
        }
        
      });
        });
      function loadClassesByCampus(campusId) {
        $.ajax({
          url: App.routes.getbycamp,
          type: "GET",
          data: { campusId: campusId },
          success: function (response) {
            const dropdown = $('#dept');
            dropdown.empty();
            dropdown.append('<option value="">Select Department</option>');
            

            response.data.forEach(function (classes) {
                const $option = $('<option>')
                .val(classes.ID)           
                .text(classes.DepartmentName); 
                dropdown.append($option);
            });
          },
          error: function () {
            alert('Failed to load classes. Please try again.');
          }
        });
      }
      function loadBranches(campusId) {
        $.ajax({
          url: App.routes.getbybank,
          type: "GET",
          data: { campusId: campusId },
          success: function (response) {
            const dropdown = $('#branch');
            dropdown.empty();
            dropdown.append('<option value="">Select Branch</option>');
            
            response.data.forEach(function (branches) {
                const $option = $('<option>')
                .val(branches.Branch)           
                .text(branches.Branch); 
                dropdown.append($option);
            });
          },
          error: function () {
            showToast('danger', 'Error!','Failed to load classes. Please try again.');
          }
        });
      }
      function fetchcodes(bank, branch) {
        $.ajax({
          url:  App.routes.codebybank,
          type: "GET",
          data: { bank: bank,
            branch: branch
           },
          success: function (response) {
            response.data.forEach(function (branches) {
              document.getElementById('bcode').value = branches.BranchCode;
              document.getElementById('swiftcode').value = branches.swiftcode;
              document.getElementById('bankcode').value = branches.BankCode;
              
            });
          },
          error: function () {
            showToast('danger', 'Error!','Failed to load classes. Please try again.');
          }
        });
      }
      

       document.addEventListener('DOMContentLoaded', function() {
    var unionCheckbox = $('#unionized');
var unionContainer = $('#union-container');
var unionnoInput = $('#unionno');

var disaCheckbox = $('#isdisabled');
var disaContainer = $('#disabled-container');
var disanInput = $('#disabinfo');

// Initialize containers as hidden with sliding capability
unionContainer.hide();
disaContainer.hide();

// Disability checkbox handler
if (disaCheckbox.length && disaContainer.length && disanInput.length) {
    disaCheckbox.on('change', function() {
        if (this.checked) {
            disaContainer.slideDown(300, function() {
                disanInput.attr('required', true);
                disanInput.val('');
                disanInput.focus();
            });
        } else {
            disanInput.removeAttr('required');
            disaContainer.slideUp(300, function() {
                disanInput.val('N/A');
            });
        }
    });
}


// Union checkbox handler
if (unionCheckbox.length && unionContainer.length && unionnoInput.length) {
    unionCheckbox.on('change', function() {
        if (this.checked) {
            unionContainer.slideDown(300, function() {
                unionnoInput.attr('required', true);
                unionnoInput.val('');
                unionnoInput.focus();
            });
        } else {
            unionnoInput.removeAttr('required');
            unionContainer.slideUp(300, function() {
                unionnoInput.val('N/A');
            });
        }
    });
}



    var nhshcheck = document.getElementById('nhif_shif');
    var nhifnoInput = document.getElementById('nhifno');
    var nhiffile = document.getElementById('nhifno_proof');
    if (nhshcheck && nhifnoInput && nhiffile) {
        // Disable the nhifno input by default on page load
        nhifnoInput.disabled = true;
        nhiffile.disabled = true;

        nhshcheck.addEventListener('change', function() {
            if (this.checked) {
                nhifnoInput.disabled = false;
                nhiffile.disabled = false;
                nhifnoInput.setAttribute('required', true);
            } else {
                nhifnoInput.disabled = true;
                nhiffile.disabled = true;
                nhifnoInput.removeAttribute('required');
                $('#nhifno').val('N/A');
                
            }
        });
    }
    
    var nssfcheck = document.getElementById('nssf');
    var nssfnoInput = document.getElementById('nssfno');
    var nssffile = document.getElementById('nssf_proof');
    if (nssfcheck && nssfnoInput && nssffile) {
        // Disable the nhifno input by default on page load
        nssfnoInput.disabled = true;
        nssffile.disabled = true;

        nssfcheck.addEventListener('change', function() {
            if (this.checked) {
                nssfnoInput.disabled = false;
                nssffile.disabled = false;
                nssfnoInput.setAttribute('required', true);
            } else {
                nssfnoInput.disabled = true;
                nssffile.disabled = true;
                nssfnoInput.removeAttribute('required');
                $('#nssfno').val('N/A');
                
            }
        });
    }

    var pencheck = document.getElementById('pensyes');
    var pensionInput = document.getElementById('pension');
    var pensionfile = document.getElementById('pension_proof');
    if (pencheck && pensionInput && pensionfile) {
        // Disable the nhifno input by default on page load
        pensionInput.disabled = true;
        pensionfile.disabled = true;

        pencheck.addEventListener('change', function() {
            if (this.checked) {
                pensionInput.disabled = false;
                pensionfile.disabled = false;
                pensionInput.setAttribute('required', true);
            } else {
                pensionInput.disabled = true;
                pensionfile.disabled = true;
                pensionInput.removeAttribute('required');
                $('#pension').val('N/A');
                
            }
        });
    }
   $('#tab-registration').on('click', function() {
    $.ajax({
        url:  App.routes.getptypes,
        type: "GET",
        success: function (response) {
            const dropdown = $('#proltype');
            dropdown.empty();
            dropdown.append('<option value="">Select Payroll</option>');
           

            response.data.forEach(function (paytype) {
                const $option = $('<option>')
                .val(paytype.ID)          
                .text(paytype.pname);
                dropdown.append($option);
            });
        },
        error: function () {
            showToast('danger', 'Error!', 'Failed to load branches. Please try again.');
        },
    });
    $.ajax({
        url: App.routes.getbanks,
        type: "GET",
        success: function (response) {
            const dropdown = $('#bank');
            dropdown.empty();
            dropdown.append('<option value="">Select Bank</option>');
            

            response.data.forEach(function (bank) {
                const $option = $('<option>')
                .val(bank.Bank)          
                .text(bank.Bank);
                dropdown.append($option);
            });
        },
        error: function () {
            showToast('danger', 'Error!',  'Failed to load branches. Please try again.');
        },
    }); 
});
const source = document.getElementById('agentno');
    const target = document.getElementById('aggentno');

    source.addEventListener('input', function () {
        target.value = this.value;
    });

    const tabBtns  = document.querySelectorAll('.tab-btn');
    const panels   = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
        });
    });

    /* ── Union number toggle ───────────────────── */
    document.getElementById('unionized').addEventListener('change', function () {
        const container = document.getElementById('union-container');
        container.style.display = this.checked ? 'block' : 'none';
    });

    /* ── Auto-advance to Registration tab after staff save ── */
    document.getElementById('staffForm').addEventListener('submit', function () {
        // Mark staff tab complete
        document.getElementById('badge-staffInfo').classList.add('show');
        // Switch to registration tab after short delay
        setTimeout(() => {
            document.querySelector('[data-tab="registration"]').click();
        }, 400);
    });
});
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