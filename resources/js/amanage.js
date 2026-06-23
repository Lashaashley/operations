  
  // ✅ Add at very top of amanage.js to confirm load order on server

  
  $(document).ready(function() {


     if (typeof $.fn.DataTable !== 'function') {
        console.error('DataTables library not loaded!');
        showToast('danger', 'Error', 'DataTables library failed to load.');
        return;
    }
    
    loadBranches();
    loadDepartments();
    loadBanks();
    loadBankBranches();
    loadPayrollTypes();
            // Initialize DataTable with server-side processing
            const table = $('#agents-table').DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: App.routes.amanage,
            type: 'GET',
            error: function () {
                showToast('danger', 'Error', 'Failed to load agent data.');
            }
        },
        columns: [
            {
                data: null,
                orderable: true,
                render: function (data, type, row) {
                    return `
                        <div class="agent-cell">
                            <img class="agent-avatar"
                                 src="${row.profile_photo}"
                                 alt="${row.full_name}"
                                 onerror="this.src='{{ asset('uploads/NO-IMAGE-AVAILABLE.jpg') }}'">
                            <span class="agent-name">${row.full_name}</span>
                        </div>`;
                }
            },
            { data: 'emp_id',      orderable: true },
            { data: 'stafftype',   orderable: true },
            { data: 'department',  orderable: true },
            { data: 'designation', orderable: true },
            {
                data: 'status',
                orderable: true,
                render: function (data) {
                    const isActive = data === 'ACTIVE';
                    return `
                        <span class="status-badge ${isActive ? 'active' : 'inactive'}">
                            <span class="dot"></span>${data}
                        </span>`;
                }
            },
            {
                data: 'actions',
                orderable: false,
                searchable: false,
                render: function (data) {
    return `
        <div class="action-wrap">
            <button class="action-trigger" data-action="toggle-menu">
                <span class="material-icons">more_horiz</span>
            </button>
            <div class="action-menu">
                <a href="#" class="edit-agent" data-id="${data}">
                    <span class="material-icons">edit</span> Edit User
                </a>
            </div>
        </div>`;
}
            }
        ],
        order: [[1, 'asc']], // Order by emp_id
                pageLength: 25,
                lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
                dom: 'rtp',
                language: {
                    processing: '<span style="color:var(--muted);font-size:13px;">Loading…</span>',
                    emptyTable: "No staff members found",
                    zeroRecords: "No matching staff members found"
                },
        drawCallback: function () {
            const info = this.api().page.info();
            const total = info.recordsTotal.toLocaleString();
            const display = info.recordsDisplay.toLocaleString();
            document.getElementById('recordCount').textContent =
                info.recordsTotal === info.recordsDisplay
                    ? `${total} Agents`
                    : `${display} of ${total} Agents`;
        }
    });

    /* ── Wire custom search ────────────────────────────── */
    let searchTimer;
    document.getElementById('dt-search').addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => table.search(this.value).draw(), 350);
    });

    /* ── Wire custom page length ───────────────────────── */
    document.getElementById('dt-length').addEventListener('change', function () {
        table.page.len(parseInt(this.value)).draw();
    });

    /* ── Close menus on outside click ─────────────────── */
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.action-wrap')) {
            document.querySelectorAll('.action-menu.open')
                    .forEach(m => m.classList.remove('open'));
        }
    });

            // Edit agent
            $('#agents-table').on('click', '.edit-agent', function(e) {
                e.preventDefault();
                var agentId = $(this).data('id');
               loadUserData(agentId);
            });

            // Terminate agent
            $('#agents-table').on('click', '.terminate-agent', function(e) {
                e.preventDefault();
                var agentId = $(this).data('id');
                $('#terminate-agent-id').val(agentId);
                $('#terminatModal').modal('show');
            });

            // Confirm termination
            $('#confirm-terminate').on('click', function() {
                var agentId = $('#terminate-agent-id').val();
                
                $.ajax({
                    url: `/agents/${agentId}/terminate`,
                    type: 'POST',
                    data: {
                        _token: '{{ csrf_token() }}'
                    },
                    success: function(response) {
                        if (response.success) {
                            showToast('success', 'Success!', response.message);
                            $('#terminatModal').modal('hide');
                            table.ajax.reload(null, false); // Reload table without resetting pagination
                        } else {
                           
                            showToast('danger', 'Error!', response.message);
                        }
                    },
                    error: function(xhr) {
                       
                        showToast('danger', 'Error!', 'Error terminating staff member');
                    }
                });
            });

            $('#closemodal').on('click', '.close', function(e) {
                closeEditStaffModal();
            });


              $('#staffForm').on('submit', function (e) {
    e.preventDefault();
    
    // Clear previous errors
    $('.is-invalid').removeClass('is-invalid');
    $('.invalid-feedback').remove();
    


    const id = $('#agentno').val();
    const formData = new FormData(this);

        const form = document.getElementById('staffForm');
        const baseUrl = form.dataset.updateUrl;
        const url = `${baseUrl}/${id}`;

    const submitBtn = $(this).find('button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn.html('<i class="fa fa-spinner fa-spin"></i> Updating...').prop('disabled', true);
    
    formData.append('_method', 'POST');
    
    $.ajax({ 
        url: url,
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        },
        success: function (response) {
            showToast('success', 'Success!', response.message);
            $('#editstaffModal').modal('hide');
            
            // Optionally reload the data table or refresh the page
            if (typeof table !== 'undefined') {
                table.ajax.reload();
            }
        },
        error: function (xhr) {
            console.error('Error response:', xhr.responseJSON);
            
            if (xhr.status === 422) {
                // Validation errors
                let errors = xhr.responseJSON.errors;
                
                $.each(errors, function (key, messages) {
                    // Find the input field
                    let input = $(`[name="${key}"]`);
                    
                    // Add error class
                    input.addClass('is-invalid');
                    
                    // Add error message
                    input.after(`<div class="invalid-feedback d-block">${messages[0]}</div>`);
                });
                
                showToast('danger', 'Validation Error!', 'Please check the form for errors.');
            } else if (xhr.status === 404) {
                showToast('danger', 'Error!', 'Agent not found.');
            } else {
                let errorMessage = xhr.responseJSON?.message || 'Error updating agent.';
                showToast('danger', 'Error!', errorMessage);
            }
        },
        complete: function() {
            submitBtn.html(originalText).prop('disabled', false);
        }
    });
});

$('#registrationForm').on('submit', function (e) {
                e.preventDefault();
                const id = $('#aggentno').val(); // Fetch the ID value correctly
                const formData = new FormData(this);

                const form = document.getElementById('registrationForm');
                const base2Url = form.dataset.regupdateUrl;
                const url2 = `${base2Url}/${id}`;

                const submitBtn = $(this).find('button[type="submit"]');
                const originalText = submitBtn.html();
                submitBtn.html('<i class="fa fa-spinner fa-spin"></i> Updating...').prop('disabled', true);
                
               
                formData.append('_method', 'POST');
                $.ajax({ 
                    url: url2, // Adjust route as needed
                    type: 'POST',
                    data: formData,
                    contentType: false,
                    processData: false,
                    headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                    },
                    success: function (response) {
                        showToast('success', 'Success!', response.message);
                        
                    },
                    error: function (xhr) {
                        if (xhr.status === 422) {
                            let errors = xhr.responseJSON.errors;
                            $.each(errors, function (key, value) {
                                $(`#${key}-error`).html(value[0]);
                            });
                            showToast('danger', 'Error!', 'Please check the form for errors.');
                        } else {
                            showToast('danger', 'Error!', 'Error updating Agent.');
                        }
                    },
                    complete: function() {
                        submitBtn.html(originalText).prop('disabled', false);
                    }
                });
            });

            $('#bank').on('change', function() {
                const selectedCampusId = $(this).val();
                if (selectedCampusId) {
                    loadBranches2(selectedCampusId);
                } else {
                    const classDropdown = $('#branch');
                    classDropdown.empty();
                    classDropdown.append('<option value="">Select Branch</option>');
                }
        
            });
            $('#branch').on('change', function() {
                const branch = $(this).val();
                const bank = $('#bank').val();
                if (branch) {
                    fetchcodes2(bank,branch);
                } else {

                }
        
            });

            
        });

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

    // Click outside — close all menus
    document.querySelectorAll('.action-menu.open').forEach(function (m) {
        m.classList.remove('open');
    });
});
       
        function loadUserData(userId) {
    // Show loading state
   
    showToast('success', 'Please Wait!', 'Loading user data...');
    // Load all dropdowns and user data in parallel
    Promise.all([
        
        
        loadUserDetails(userId)
    ]).then(() => {
       
        showToast('success', 'Success!', 'User data loaded successfully');
    }).catch(error => {
       
        showToast('danger', 'Error!', 'Failed to load some data: ' + error.message);
    });
}

// Separate functions for each dropdown
function loadBranches() {
    return $.ajax({
        url: App.routes.branches,
        type: 'GET',
        success: function(response) {
            const $dropdown = $('#brid');
            $dropdown.empty();

            // ✅ Static default — no server data, safe as-is
            $('<option>').val('').text('Select Branch').appendTo($dropdown);
            $('<option>').val('0').text('Overall').appendTo($dropdown);

            response.data.forEach(function(branch) {
                // ✅ DOM methods — no template literal with server data
                $('<option>')
                    .val(branch.ID)               // ✅ .val() escapes automatically
                    .text(branch.branchname)  // ✅ .text() never renders HTML
                    .appendTo($dropdown);
            });
        },
        error: function() {
            throw new Error('Failed to load branches');
        }
    });
}

function loadDepartments() {
    return $.ajax({
        url: App.routes.depts,
        type: 'GET',
        success: function(response) {
            const $dropdown = $('#dept');
            $dropdown.empty();

            // ✅ Static default — no server data, safe as-is
            $('<option>').val('').text('Select Department').appendTo($dropdown);

            response.data.forEach(function(dept) {
                // ✅ DOM methods — no template literal with server data
                $('<option>')
                    .val(dept.ID)               // ✅ .val() escapes automatically
                    .text(dept.DepartmentName)  // ✅ .text() never renders HTML
                    .appendTo($dropdown);
            });
        },
        error: function() {
            throw new Error('Failed to load departments');
        }
    });
}

function loadBranches2(campusId) {
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
            alert('Failed to load classes. Please try again.');
          }
        });
      }

      function fetchcodes2(bank, branch) {
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
            alert('Failed to load classes. Please try again.');
          }
        });
      }

function loadBanks() {
    return $.ajax({
        url: App.routes.getbanks,
        type: 'GET',
        success: function(response) {
            const $dropdown = $('#bank');
            $dropdown.empty();

            // ✅ Static default — no server data, safe as-is
            $('<option>').val('').text('Select Bank').appendTo($dropdown);

            response.data.forEach(function(bank) {
                // ✅ DOM methods — no template literal with server data
                $('<option>')
                    .val(bank.Bank)               // ✅ .val() escapes automatically
                    .text(bank.Bank)  // ✅ .text() never renders HTML
                    .appendTo($dropdown);
            });
        },
        error: function() {
            throw new Error('Failed to load banks');
        }
    });
}

function loadBankBranches() {
    return $.ajax({
        url: App.routes.getbranches,
        type: 'GET',
        success: function(response) {
            const $dropdown = $('#branch');
            $dropdown.empty();

            // ✅ Static default — no server data, safe as-is
            $('<option>').val('').text('Select Branch').appendTo($dropdown);

            response.data.forEach(function(branch) {
                // ✅ DOM methods — no template literal with server data
                $('<option>')
                    .val(branch.Branch)               // ✅ .val() escapes automatically
                    .text(branch.Branch)  // ✅ .text() never renders HTML
                    .appendTo($dropdown);
            });
        },
        error: function() {
            throw new Error('Failed to load branches');
        }
    });
}




function loadPayrollTypes() {
    return $.ajax({
        url: App.routes.getptypes,
        type: 'GET',
        success: function(response) {
            const $dropdown = $('#proltype');
            $dropdown.empty();

            // ✅ Static default — no server data, safe as-is
            $('<option>').val('').text('Select Payroll').appendTo($dropdown);

            response.data.forEach(function(paytype) {
                // ✅ DOM methods — no template literal with server data
                $('<option>')
                    .val(paytype.ID)               // ✅ .val() escapes automatically
                    .text(paytype.pname)  // ✅ .text() never renders HTML
                    .appendTo($dropdown);
            });
        },
        error: function() {
            throw new Error('Failed to payroll types');
        }
    });
}

function showEditStaffModal() {
    const modalElement = document.getElementById('editstaffModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } else {
        console.error('Modal element not found');
    }
}

function closeEditStaffModal() {
    const modal = document.getElementById('editstaffModal');;
    if (modal) modal.hide();
}

function loadUserDetails(userId) {
    return $.ajax({
        url: App.routes.getuser.replace('__id__', userId),
        type: 'GET',
        success: function(response) {
            if (response.status === 'success') {
                const agent = response.agent;
                
                
                // Populate basic fields
                $('#agentno').val(agent.emp_id || '');
                $('#firstname').val(agent.FirstName || '');
                $('#lastname').val(agent.LastName || '');
                $('#email').val(agent.EmailId || '');
                $('#phonenumber').val(agent.Phonenumber || '');
                $('#dob').val(agent.Dob || '');
                $('#gender').val(agent.Gender || '');
                $('#brid').val(agent.brid);
                $('#dept').val(agent.Department);
                
                // Handle checkbox fields (YES/NO values)
                setCheckboxValue('#nhif_shif', agent.nhif);
                setCheckboxValue('#nssf', agent.nssf);
                setCheckboxValue('#contractor', agent.contractor);
                setCheckboxValue('#unionized', agent.unionized);
                setCheckboxValue('#nssfopt', agent.nssfopt);
                
                // Populate other fields
                $('#unionno').val(agent.unionno || '');
                $('#idno').val(agent.idno || '');
                $('#nhifno').val(agent.nhifno || '');
                $('#krapin').val(agent.kra || '');
                $('#nssfno').val(agent.nssfno || '');
                $('#paymentMethod').val(agent.paymode || '');
                $('#proltype').val(agent.payrolty || '');
                
                // Bank details
                $('#bank').val(agent.Bank || '');
                $('#branch').val(agent.Branch || '');
                $('#bcode').val(agent.BranchCode || '');
                $('#swiftcode').val(agent.swiftcode || '');
                $('#bankcode').val(agent.BankCode || '');
                $('#account').val(agent.AccountNo || '');
                $('#aggentno').val(agent.emp_id || '');
                
                // Show modal
                const modalElement = document.getElementById('editstaffModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

               
            }
        },
        error: function(xhr) {
            throw new Error('Failed to load user data');
        }
    });
}

// Helper function to set checkbox based on YES/NO value
function setCheckboxValue(selector, value) {
    const checkbox = $(selector);
    if (value === 'YES') {
        checkbox.prop('checked', true);
    } else {
        checkbox.prop('checked', false);
    }
}

// Helper function to get checkbox value as YES/NO
function getCheckboxValue(selector) {
    return $(selector).is(':checked') ? 'YES' : 'NO';
}

// Function to collect form data for update
function getFormData() {
    return {
        emp_id: $('#agentno').val(),
        FirstName: $('#firstname').val(),
        LastName: $('#lastname').val(),
        EmailId: $('#email').val(),
        Phonenumber: $('#phonenumber').val(),
        Dob: $('#dob').val(),
        Gender: $('#gender').val(),
        brid: $('#brid').val(),
        Department: $('#dept').val(),
        nhif: getCheckboxValue('#nhif_shif'),
        nssf: getCheckboxValue('#nssf'),
        contractor: getCheckboxValue('#contractor'),
        unionized: getCheckboxValue('#unionized'),
        nssfopt: getCheckboxValue('#nssfopt'),
        unionno: $('#unionno').val(),
        idno: $('#idno').val(),
        nhifno: $('#nhifno').val(),
        kra: $('#krapin').val(),
        nssfno: $('#nssfno').val(),
        paymode: $('#paymentMethod').val(),
        payrolty: $('#proltype').val(),
        Bank: $('#bank').val(),
        Branch: $('#branch').val(),
        BranchCode: $('#bcode').val(),
        swiftcode: $('#swiftcode').val(),
        BankCode: $('#bankcode').val(),
        AccountNo: $('#account').val()
    };
}



document.addEventListener('DOMContentLoaded', function () {

    /* ── Tab switching ────────────────────────── */
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
            $('.close').on('click', function() {
                const alert = $(this).closest('.custom-alert');
                alert.removeClass('show');
                setTimeout(() => {
                    alert.hide();
                }, 500);
            });