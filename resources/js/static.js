


    function openTab(evt, tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');
    const panel = document.getElementById(tabId);
    if (panel) panel.classList.add('active');
}


        $(document).ready(function() {
           
           
            loadcampuses();
            loadstatus();
        
           

          
            

    

           
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
            $(document).on('click', '[data-target="#editSchoolModal"]', function () { 
    const id = $(this).data('id');
    const name = $(this).data('name');
    const motto = $(this).data('motto');
    const pobox = $(this).data('pobox');
    const email = $(this).data('email');
    const physaddres = $(this).data('physaddres');
    const logo = $(this).data('logo');

    // Clear previous errors
    $('.text-danger').html('');
    
    // Set form values
    const form = $('#editSchoolForm');
    form.find('#ID').val(id);
    form.find('#schoolName').val(name);
    form.find('#schoolMotto').val(motto);
    form.find('#schoolPobox').val(pobox);
    form.find('#schoolEmail').val(email);
    form.find('#schoolPhysaddres').val(physaddres);
    form.find('#schoolLogoPreview').attr('src', logo);
});
$(document).on('click', '[data-target="#editemailModal"]', function () {
    const id = $(this).data('id');
    const name = $(this).data('name');
    const host = $(this).data('host');
    const port = $(this).data('port');
    const username = $(this).data('username');
    const password = $(this).data('password');
     const from_email = $(this).data('from_email');
     const encryption = $(this).data('encryption');
    
    // Clear previous errors
    $('.text-danger').html('');
    
    // Set form values
    const form = $('#editmailForm');
    form.find('#ID').val(id);
    form.find('#eeName').val(name);
    form.find('#ehost').val(host);
    form.find('#eport').val(port);
    form.find('#eusername').val(username);
    form.find('#epassword').val(password);
    form.find('#eemailaddress').val(from_email);
     form.find('#eencryption').val(encryption);
   
});
         
            
           


  
            $('#campusform').on('submit', function(e) { 
                e.preventDefault();
                $('.text-danger').html('');
                let formData = new FormData(this);

                var form = this; // Reference the form element
                const storebranchesUrl = form.dataset.storebranchesUrl;
                
                const submitBtn = $(this).find('button[type="submit"]');
                const originalText = submitBtn.html();
                submitBtn.html('<span class="material-icons" style="font-size:14px;animation:spin 1s linear infinite">sync</span> Saving…').prop('disabled', true);
                
                $.ajax({
                    url: storebranchesUrl,
                    type: "POST",
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function(response) {
                        showToast('success', 'Success!', response.message);
                        $('#campusform')[0].reset();
                        loadcampuses();
                    },
                    error: function(xhr) {
                        if (xhr.status === 422) {
                            let errors = xhr.responseJSON.errors;
                            $.each(errors, function(key, value) {
                                $('#' + key + '-error').html(value[0]);
                            });
                            showToast('danger', 'Error!', 'Please check the form for errors.');
                        } else {
                            showToast('danger', 'Error!', 'Error adding student');
                        }
                    },
                    complete: function() {
                        submitBtn.html(originalText).prop('disabled', false);
                    }
                });
            });


            $('#statusform').on('submit', function(e) { 
                e.preventDefault();
                $('.text-danger').html('');
                let formData = new FormData(this);

                var form = this; // Reference the form element
                const storestatusUrl = form.dataset.storestatus;
                
                const submitBtn = $(this).find('button[type="submit"]');
                const originalText = submitBtn.html();
                submitBtn.html('<span class="material-icons" style="font-size:14px;animation:spin 1s linear infinite">sync</span> Saving…').prop('disabled', true);
                console.log(storestatusUrl);
                $.ajax({
                    url: App.routes.storestatus,
                    type: "POST",
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function(response) {
                        showToast('success', 'Success!', response.message);
                        $('#statusform')[0].reset();
                        loadstatus();
                    },
                    error: function(xhr) {
                        if (xhr.status === 422) {
                            let errors = xhr.responseJSON.errors;
                            $.each(errors, function(key, value) {
                                $('#' + key + '-error').html(value[0]);
                            });
                            showToast('danger', 'Error!', 'Please check the form for errors.');
                        } else {
                            showToast('danger', 'Error!', 'Error adding Status');
                        }
                    },
                    complete: function() {
                        submitBtn.html(originalText).prop('disabled', false);
                    }
                });
            });
 

            $('#deptsform').on('submit', function(e) { 
                e.preventDefault();
                $('.text-danger').html('');
                let formData = new FormData(this);

                var form = this; // Reference the form element
                const storedeptsUrl = form.dataset.storedeptsUrl;
                
                const submitBtn = $(this).find('button[type="submit"]');
                const originalText = submitBtn.html();
                submitBtn.html('<span class="material-icons" style="font-size:14px;animation:spin 1s linear infinite">sync</span> Saving…').prop('disabled', true);
                
                $.ajax({
                    url: storedeptsUrl,
                    type: "POST",
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function(response) {
                        showToast('success', 'Success!', response.message);
                        $('#deptsform')[0].reset();
                        loaddepts();
                    },
                    error: function(xhr) {
                        if (xhr.status === 422) {
                            let errors = xhr.responseJSON.errors;
                            $.each(errors, function(key, value) {
                                $('#' + key + '-error').html(value[0]);
                            });
                            showToast('danger', 'Error!', 'Please check the form for errors.');
                        } else {
                            showToast('danger', 'Error!', 'Error adding student');
                        }
                    },
                    complete: function() {
                        submitBtn.html(originalText).prop('disabled', false);
                    }
                });
            });
            $('#editcampuslForm').on('submit', function (e) {
                e.preventDefault();
                const id = $('#editcampusModal #ID').val(); // Fetch the ID value correctly
                const formData = new FormData(this);

                const submitBtn = $(this).find('button[type="submit"]');
                const originalText = submitBtn.html();
                submitBtn.html('<span class="material-icons" style="font-size:14px;animation:spin 1s linear infinite">sync</span> Posting…').prop('disabled', true);
                
               
                formData.append('_method', 'POST');
                $.ajax({ 
                    url: App.routes.branchesup.replace('__id__', id), // Adjust route as needed
                    type: 'POST',
                    data: formData,
                    contentType: false,
                    processData: false,
                    headers: {
                        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                    },
                    success: function (response) {
                        showToast('success', 'Success!', response.message);
                        
                        hideModal('editcampusModal');
                        loadcampuses(); // Reload the table
                        // 
                    },
                    error: function (xhr) {
                        if (xhr.status === 422) {
                            let errors = xhr.responseJSON.errors;
                            $.each(errors, function (key, value) {
                                $(`#${key}-error`).html(value[0]);
                            });
                            showToast('danger', 'Error!', 'Please check the form for errors.');
                        } else {
                            showToast('danger', 'Error!', 'Error updating organization info.');
                        }
                    },
                    complete: function() {
                        submitBtn.html(originalText).prop('disabled', false);
                    }
                });
            });
             $.ajax({
        url: App.routes.branches,
        type: "GET",
        success: function (response) {
            const dropdown = $('#branch2');
            const dropdown1 = $('#branch3'); // The dropdown element
            const dropdown2 = $('#branch4');
            dropdown.empty();
            dropdown1.empty(); // Clear existing options
            dropdown2.empty();

            // Add default options
            dropdown.append('<option value="">Select campus</option>');
            dropdown.append('<option value="0">Overall</option>');
            dropdown1.append('<option value="">Select campus</option>');
            dropdown1.append('<option value="0">Overall</option>');
            dropdown2.append('<option value="">Select campus</option>');
            dropdown2.append('<option value="0">Overall</option>');
            

            response.data.forEach(function (branch) {
                const $option = $('<option>')
                .val(branch.ID)           // ✅ .val() automatically escapes
                .text(branch.branchname); // ✅ .text() never renders HTML
                dropdown.append($option);
                dropdown1.append($option);
                dropdown2.append($option);
            });
        },
        error: function () {
            alert('Failed to load branches. Please try again.');
        },
    });

    $(document).on('click', '[data-target="#editcampusModal"]', function () {
    const id = $(this).data('id');
    const branchname = $(this).data('branchname');
    

    // Clear previous errors
    $('.text-danger').html('');
    
    // Set form values
    const form = $('#editcampuslForm');
    form.find('#ID').val(id);
    form.find('#editbranchname').val(branchname);
   
});

$('#tab-depts').on('click', function() {

    $.ajax({
        url: App.routes.branches,
        type: "GET",
        success: function (response) {
            const dropdown = $('#brid');
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
    loaddepts();


});
$('#tabactive').on('click', function () {
        openTab(event,'taborgstruct');
    });

    $('#tabbranches').on('click', function () {
       openTab(event,'tabstatcodes');
    });

     $('#tab-depts').on('click', function () {
       openTab(event,'tabdepts');
    });

     $('#tab-status').on('click', function () {
       openTab(event,'tabstatus');
    });

   
 $('#file').on('change', function() {
validateFile(file);
});  
});
        function validateFile(inputId) {
    const fileInput = document.getElementById(inputId);
    const file = fileInput.files[0];
    const allowedTypes = ['image/png', 'image/jpeg'];
    const maxSize = 2 * 1024 * 1024; // 2 MB

    if (!allowedTypes.includes(file.type)) {
        alert('Only PNG and JPEG files are allowed.');
        fileInput.value = ''; // Reset the input
        return false;
    }

    if (file.size > maxSize) {
        alert('File size should not exceed 2 MB.');
        fileInput.value = ''; // Reset the input
        return false;
    }
    return true;
}
function loadcampuses(page = 1) {
    $.ajax({
       url: `${App.routes.branchesgetall}?page=${page}`,
        type: "GET",
        success: function (response) {
            const tableBody = $('#campuses-table-body');
            const paginationControls = $('#pagination-controls');

            tableBody.empty();
            paginationControls.empty();

            // Populate table rows
            response.data.forEach(function(row) {
    const tr = $('<tr>');
    
    // ✅ ID cell
    tr.append($('<td>').text(row.id));
    
    // ✅ Branch name cell
    tr.append($('<td>').text(row.cname));
    
    // ✅ Actions cell with dropdown
    const actionsTd = $('<td>');
    
    // Dropdown wrapper
    const dropdownDiv = $('<div>').addClass('dropdown');
    
    // Dropdown toggle button
    const dropdownToggle = $('<a>')
        .addClass('btn btn-link font-24 p-0 line-height-1 no-arrow dropdown-toggle')
        .attr('href', '#')
        .attr('role', 'button')
        .attr('data-toggle', 'dropdown');
    
    const toggleIcon = $('<span>')
        .addClass('material-icons')
        .text('more_horiz');
    
    dropdownToggle.append(toggleIcon);
    dropdownDiv.append(dropdownToggle);
    
    // Dropdown menu
    const dropdownMenu = $('<div>')
        .addClass('dropdown-menu dropdown-menu-right dropdown-menu-icon-list');
    
    // Edit menu item
    const editItem = $('<a>')
        .addClass('dropdown-item')
        .attr('href', '#')
        .attr('data-toggle', 'modal')
        .attr('data-target', '#editcampusModal')
        .attr('data-id', row.ID)
        .attr('data-branchname', row.branchname);
    
    const editIcon = $('<span>')
        .addClass('material-icons')
        .text('edit_note');
    
    // ✅ Use DOM text node for "Edit" text
    editItem.append(editIcon);
    editItem.append(document.createTextNode(' Edit'));
    
    dropdownMenu.append(editItem);
    dropdownDiv.append(dropdownMenu);
    actionsTd.append(dropdownDiv);
    tr.append(actionsTd);
    
    tableBody.append(tr);
});

            // Handle pagination controls dynamically
            const { current_page, last_page } = response.pagination;

            

            for (let i = 1; i <= last_page; i++) {
                paginationControls.append(`
                    <button class="btn ${i === current_page ? 'btn-primary' : 'btn-light'}" data-page="${i}">${i}</button>
                `);
            }

           
        },
        error: function () {
            showToast('danger', 'Error!', 'Failed to load table data');
        }
    });
}


function loadstatus(page = 1) {
    $.ajax({
       url: `${App.routes.statusgetall}?page=${page}`,
        type: "GET",
        success: function (response) {
            const tableBody = $('#status-table-body');
            const paginationControls = $('#pagination-controls');

            tableBody.empty();
            paginationControls.empty();

            // Populate table rows
            response.data.forEach(function(row) {
    const tr = $('<tr>');
    
    // ✅ ID cell
    tr.append($('<td>').text(row.id));
    
    // ✅ Branch name cell
    tr.append($('<td>').text(row.statusn));
    
    // ✅ Actions cell with dropdown
    const actionsTd = $('<td>');
    
    // Dropdown wrapper
    const dropdownDiv = $('<div>').addClass('dropdown');
    
    // Dropdown toggle button
    const dropdownToggle = $('<a>')
        .addClass('btn btn-link font-24 p-0 line-height-1 no-arrow dropdown-toggle')
        .attr('href', '#')
        .attr('role', 'button')
        .attr('data-toggle', 'dropdown');
    
    const toggleIcon = $('<span>')
        .addClass('material-icons')
        .text('more_horiz');
    
    dropdownToggle.append(toggleIcon);
    dropdownDiv.append(dropdownToggle);
    
    // Dropdown menu
    const dropdownMenu = $('<div>')
        .addClass('dropdown-menu dropdown-menu-right dropdown-menu-icon-list');
    
    // Edit menu item
    const editItem = $('<a>')
        .addClass('dropdown-item')
        .attr('href', '#')
        .attr('data-toggle', 'modal')
        .attr('data-target', '#editcampusModal')
        .attr('data-id', row.ID)
        .attr('data-branchname', row.branchname);
    
    const editIcon = $('<span>')
        .addClass('material-icons')
        .text('edit_note');
    
    // ✅ Use DOM text node for "Edit" text
    editItem.append(editIcon);
    editItem.append(document.createTextNode(' Edit'));
    
    dropdownMenu.append(editItem);
    dropdownDiv.append(dropdownMenu);
    actionsTd.append(dropdownDiv);
    tr.append(actionsTd);
    
    tableBody.append(tr);
});

            // Handle pagination controls dynamically
            const { current_page, last_page } = response.pagination;

            

            for (let i = 1; i <= last_page; i++) {
                paginationControls.append(`
                    <button class="btn ${i === current_page ? 'btn-primary' : 'btn-light'}" data-page="${i}">${i}</button>
                `);
            }

           
        },
        error: function () {
            showToast('danger', 'Error!', 'Failed to load table data');
        }
    });
}



// Add once at top of static.js
function sanitize(str) {
    return $('<div>').text(String(str ?? '')).html();
}

function sanitizeRow(row) {
    return {
        ID:         sanitize(row.ID),
        name:       sanitize(row.name),
        motto:      sanitize(row.motto),
        pobox:      sanitize(row.pobox),
        email:      sanitize(row.email),
        physaddres: sanitize(row.physaddres),
        logo:       sanitize(row.logo || ''),
    };
}


$(document).on('click', '#pagination-controls button', function () {
    const page = $(this).data('page');
    loadcampuses(page);
});


function sanitizedeptRow(row) {
    return {
        ID:    sanitize(row.id),
        customer: sanitize(row.customer),
        mname: sanitize(row.mname),
    };
}
function loaddepts(page = 1) {
    $.ajax({
        url: `${App.routes.deptsgetall}?page=${page}`,
        type: "GET",
        success: function (response) {
            const tableBody = $('#depts-table-body');
            const paginationControls = $('#pagination-depts');
            tableBody.empty();
            paginationControls.empty();

            // Populate table rows
           response.data.forEach(function(rawRow) {
    const row = sanitizedeptRow(rawRow); // ← sanitize at entry
    const tr = $('<tr>');

    tr.append($('<td hidden>').text(row.ID));
    tr.append($('<td>').text(row.customer));
    tr.append($('<td>').text(row.mname));
  

    const actionsTd = $('<td>');
    const dropdownDiv = $('<div>').addClass('dropdown');

    const dropdownToggle = $('<a>')
        .addClass('btn btn-link font-24 p-0 line-height-1 no-arrow dropdown-toggle')
        .attr('href', '#')
        .attr('role', 'button')
        .attr('data-toggle', 'dropdown')
        .append($('<span>').addClass('material-icons').text('more_horiz'));

    dropdownDiv.append(dropdownToggle);

    const editItem = $('<a>')
        .addClass('dropdown-item')
        .attr('href', '#')
        .attr('data-toggle', 'modal')
        .attr('data-target', '#edithouseModal')
        .attr('data-id',    row.id)
        .attr('data-brid', row.customer)
        .attr('data-mname', row.mname)
        .append($('<span>').addClass('material-icons').text('edit_note'))
        .append(document.createTextNode(' Edit'));

    const dropdownMenu = $('<div>')
    .addClass('dropdown-menu dropdown-menu-right dropdown-menu-icon-list');

// ✅ Explicitly validate editItem is a safe jQuery object before appending
if (editItem instanceof $ || editItem.jquery) {
    // Verify it contains no unsafe content
    const itemHtml = editItem[0].outerHTML;
    if (!/<script|<img|<svg|<iframe|<object|<embed/i.test(itemHtml)) {
        dropdownMenu.append(editItem);
    } else {
        console.warn('Blocked potentially unsafe element');
    }
}

    dropdownDiv.append(dropdownMenu); //line 1123
    actionsTd.append(dropdownDiv);
    tr.append(actionsTd);
    tableBody.append(tr);
});

            // Handle pagination controls dynamically
            const { current_page, last_page } = response.pagination;

            for (let i = 1; i <= last_page; i++) {
                paginationControls.append(`
                    <button class="btn ${i === current_page ? 'btn-primary' : 'btn-light'}" data-page="${i}">${i}</button>
                `);
            }

            // Add click event for pagination buttons
            paginationControls.find('button').on('click', function () {
                const page = $(this).data('page');
                loaddepts(page); // Load houses for the clicked page
            });
        },
        error: function () {
            showToast('danger', 'Error!', 'Failed to load table data');
        }
    });
}
function sanitizebankRow(row) {
    return {
        ID:    sanitize(row.ID),
        Bank: sanitize(row.Bank),
        BankCode: sanitize(row.BankCode),
        Branch: sanitize(row.Branch),
        BranchCode: sanitize(row.BranchCode),
        swiftcode: sanitize(row.swiftcode),
    };
}


// Add this helper once at the top of your file
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
            $('.close').on('click', function() {
                const alert = $(this).closest('.custom-alert');
                alert.removeClass('show');
                setTimeout(() => {
                    alert.hide();
                }, 500);
            });