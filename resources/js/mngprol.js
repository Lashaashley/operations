 function performSearch () {
        const searchValue = document.getElementById('searchValue').value;
        if (!searchValue.trim()) { clearFields(); return; }
 
        const category = document.getElementById('category').value;
        const code     = document.getElementById('codebal').value;
        const formula  = (document.getElementById('formular').value || '').trim();
        const codes    = formula ? (formula.match(/[A-Za-z]+\d+/g) || []) : [];
 
        $.ajax({
            url:    App.routes.staffdet,
            method: 'POST',
            data: {
                _token:         $('meta[name="csrf-token"]').attr('content'),
                searchCategory: document.getElementById('searchCategory').value,
                searchValue,
                category,
                code,
                codes
            },
            success: function (data) {
                if (!data.success) { clearFields(); showToast('danger', 'Error!', data.message); return; }
 
                $('#surname').val(data.surname);
                $('#workNumber').val(data.workNumber);
                $('#othername').val(data.othername);
                $('#department').val(data.department);
                $('#departmentname').val(data.departmentname);
                $('#epmpenperce').val(data.epmpenperce);
                $('#emplopenperce').val(data.emplopenperce);
                $('#pensionable').val(data.totalPensionAmount);
 
                /* Deduction formula amounts */
                const amounts = codes.map(c => data.existingCodes?.[c] || '');
                $('#camountf').val(amounts.join(','));
 
                if (category === 'balance') {
                    $('#cbalance').val(data.balance);
                    $('#balance').val(data.balance);
                    $('#amount').val(data.Amount);
                    setToggle('activeinacToggle', 'toggleLabel2', data.statdeduc);
                }
 
                if (category === 'loan') {
                    $('#balance').val(data.balance);
                    $('#amount').val(data.Amount);
                    setToggle('activeinaclonToggle', 'toggleLabel3', data.statdeduc);
                }
 
                document.getElementById('amount').focus();
            },
            error: function (xhr, status) {
                showToast('danger', 'Error!', status);
            }
        });
    }
    function setToggle(toggleId, labelId, statdeduc) {
        const active = statdeduc === '1' || statdeduc === '';
        const toggle = document.getElementById(toggleId);
        const label  = document.getElementById(labelId);
        if (toggle) toggle.checked = active;
        if (label)  label.textContent = active ? 'Active' : 'Inactive';
    }
 
    /* ── Validate ──────────────────────────────────────────── */
    function validateForm () {
        const required = ['month','year','pitem','workNumber','department','amount','balance'];
 
        if ($('#pensionContainer').is(':visible')) required.push('epmpenperce','emplopenperce');
        if ($('#otContainer').is(':visible'))      required.push('quantity','otdate','formular');
 
        let valid = true;
 
        required.forEach(function (id) {
            const el  = document.getElementById(id);
            const val = el ? el.value.trim() : '';
            if (!val) {
                valid = false;
                el?.classList.add('is-invalid');
            } else {
                el?.classList.remove('is-invalid');
            }
        });
 
        if (!valid) showToast('danger', 'Invalid!', 'Please fill in all required fields.');
        return valid;
    }
 
    /* ── Submit ────────────────────────────────────────────── */
    function submitForm () {
        const selectedParameter = $('#pitem').val();
        const btn = $('#submitBtn');
        const origHtml = btn.html();
        let choicesInstance  = null;
 
        btn.html('<span class="material-icons" style="font-size:14px;animation:spin 1s linear infinite">sync</span> Posting…').prop('disabled', true);
 
        const formData = {
            month:      $('#month').val(),
            year:       $('#year').val(),
            parameter:  selectedParameter,
            surname:    $('#surname').val(),
            othername:  $('#othername').val(),
            workNumber: $('#workNumber').val(),
            department: $('#department').val(),
            amount:     $('#amount').val(),
            category:   $('#category').val(),
            enddate:    $('#enddate').val(),
            months:     $('#months').val(),
            balance:    $('#balance').val()
        };
 
        if ($('#pensionContainer').is(':visible')) {
            formData.epmpenperce  = $('#epmpenperce').val();
            formData.emplopenperce= $('#emplopenperce').val();
        }
 
        if ($('#otContainer').is(':visible')) {
            formData.quantity = $('#quantity').val();
            formData.otdate   = $('#otdate').val();
            formData.formular = $('#formular').val();
        }
 
        /* Open value logic — consolidated */
        if ($('#Open').is(':visible'))
            formData.openvalue = $('#activeinacToggle').prop('checked') ? '1' : '0';
        else if ($('#hiddenContainer').is(':visible'))
            formData.openvalue = $('#activeinaclonToggle').prop('checked') ? '1' : '0';
        else if ($('#category').val() === 'normal')
            formData.openvalue = '1';
 
        $.ajax({
            url:  App.routes.paysubmit,
            type: 'POST',
            data: formData,
            headers: { 'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') },
            dataType: 'json',
            success: function (result) {
                if (result.success) {
                    showToast('success', 'Success!', 'Payroll item saved.');
                    setTimeout(() => fetchData(selectedParameter), 100);
                    ['surname','workNumber','othername','department','departmentname',
                     'epmpenperce','emplopenperce','pensionable','balance','amount',
                     'quantity','otdate'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.value = '';
                    });
                    /* Clear Choices selection */
                    if (choicesInstance) choicesInstance.setChoiceByValue('');
                } else {
                    showToast('danger', 'Invalid!', result.message || 'An error occurred.');
                }
            },
            error: function (xhr, status, error) {
                showToast('danger', 'Error: ' + error, true);
            },
            complete: function () {
                btn.html(origHtml).prop('disabled', false);
            }
        });
    }
 
(function () {
    'use strict';
 
    /* ── State ────────────────────────────────────────────── */
    let choicesInstance  = null;
    let modalOpenedOnce  = false;
 
    /* ── Modal open ────────────────────────────────────────── */
    $('#exampleModal').on('show.bs.modal', function () {
 
       
    });
 
    /* ── Fetch staff list ──────────────────────────────────── */
    function fetchStaff(term) {
        $.ajax({
            url:      App.routes.staffsearch,
            method:   'GET',
            data:     { term },
            dataType: 'json',
            success: function (data) {
                const items = (data.results || []).map(r => ({ value: r.emp_id, label: r.label }));
                if (choicesInstance) {
                    choicesInstance.clearChoices();
                    choicesInstance.setChoices(items, 'value', 'label', true);
                }
            },
            error: function (xhr) {
                console.error('Staff search error:', xhr.responseText);
            }
        });
    }
 
    /* ── populateCategory (called by onchange on #pitem) ───── */
    window.populateCategory = function () {
        const pitem    = document.getElementById('pitem');
        const opt      = pitem.options[pitem.selectedIndex];
        const amount   = document.getElementById('amount');
        const balance  = document.getElementById('balance');
 
        amount.readOnly  = false; amount.value  = '';
        balance.readOnly = false; balance.value = '';
 
        document.getElementById('category').value  = opt.getAttribute('data-category')  || '';
        document.getElementById('increREDU').value = opt.getAttribute('data-increredu') || '';
        document.getElementById('codebal').value   = opt.getAttribute('data-code')      || '';
        document.getElementById('formular').value  = opt.getAttribute('data-formular')  || '';
 
        toggleHiddenContainer();
        toggleHiddenContainer2();
        toggleHiddenContainer4();
        cleartxt2();
    };
 
    /* ── Container toggles ─────────────────────────────────── */
    window.toggleHiddenContainer = function () {
        const cat = document.getElementById('category').value;
        document.getElementById('hiddenContainer').style.display  = cat === 'loan'    ? 'block' : 'none';
        document.getElementById('hiddenContainer2').style.display = cat === 'balance' ? 'block' : 'none';
    };
 
    window.toggleHiddenContainer2 = function () {
        const val = document.getElementById('pitem').value;
        document.getElementById('pensionContainer').style.display = val === 'Pension' ? 'block' : 'none';
    };
 
    window.toggleHiddenContainer4 = function () {
        const fVal   = (document.getElementById('formular').value || '').trim();
        const otBox  = document.getElementById('otContainer');
        const amount = document.getElementById('amount');
        const balance= document.getElementById('balance');
 
        if (fVal) {
            otBox.style.display     = 'block';
            amount.readOnly         = true;
            balance.readOnly        = true;
            document.getElementById('otdate').required = true;
        } else {
            otBox.style.display     = 'none';
            document.getElementById('formular').value = '';
        }
    };
 
    window.cleartxt2 = function () {
        ['balance','balend','duration','quantity','camountf'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    };
 
    /* ── searchstaffdet (called by onchange on #searchValue) ── */
    window.searchstaffdet = function () { performSearch(); };
 
   
    
 
    $('#submitBtn').on('click', function (e) {
        e.preventDefault();
        if (validateForm()) submitForm();
    });
 
    /* ── Calculation helpers ─────────────────────────────────
       (unchanged logic, just cleaner) */
    window.calculateMonthsAndEndDate = function () {
        const balance = parseFloat($('#balance').val());
        const amount  = parseFloat($('#amount').val());
        if (!isNaN(balance) && !isNaN(amount) && amount !== 0) {
            const months = balance / amount;
            $('#months').val(months.toFixed(2));
            updateEndDate(months);
        }
    };
 
    window.recalculateAmount = function () {
        const balance = parseFloat($('#balance').val());
        const months  = parseFloat($('#months').val());
        if (!isNaN(balance) && !isNaN(months) && months !== 0) {
            $('#amount').val((balance / months).toFixed(2));
            updateEndDate(months);
        }
    };
 
    window.calcbalancedates = function () {
        const balance  = parseFloat($('#balance').val());
        const duration = parseFloat($('#duration').val());
        if (!isNaN(balance) && !isNaN(duration)) {
            $('#amount').val((balance / duration).toFixed(2));
            updateEndDate2(duration);
        }
    };
 
    function updateEndDate (months) {
        const d = new Date();
        const end = new Date(d.getFullYear(), d.getMonth() + Math.ceil(months), 0);
        $('#enddate').val(end.toLocaleString('default', { month: 'long' }) + ' ' + end.getFullYear());
    }
 
    function updateEndDate2 (duration) {
        const d = new Date();
        const end = new Date(d.getFullYear(), d.getMonth() + Math.ceil(duration), 0);
        $('#balend').val(end.toLocaleString('default', { month: 'long' }) + ' ' + end.getFullYear());
    }
 
    /* Wire calculation listeners once DOM is ready */
    document.addEventListener('DOMContentLoaded', function () {
        document.getElementById('amount')  ?.addEventListener('input', calculateMonthsAndEndDate);
        document.getElementById('balance') ?.addEventListener('input', calculateMonthsAndEndDate);
        document.getElementById('months')  ?.addEventListener('input', recalculateAmount);
        document.getElementById('duration')?.addEventListener('input', calcbalancedates);
        document.getElementById('quantity')?.addEventListener('input', executeFormula); // existing function
 
        /* Toggle: Fixed / Open */
        document.getElementById('fixedOpenToggle')?.addEventListener('change', function () {
            const isOpen = this.checked;
            document.getElementById('toggleLabel').textContent   = isOpen ? 'Open' : 'Fixed';
            document.getElementById('Fixed').style.display       = isOpen ? 'none' : 'block';
            document.getElementById('Open').style.display        = isOpen ? 'flex' : 'none';
            updateAmountFieldState();
            cleartxt2();
        });
 
        /* Toggle: balance active/inactive */
        document.getElementById('activeinacToggle')?.addEventListener('change', function () {
            document.getElementById('toggleLabel2').textContent = this.checked ? 'Active' : 'Inactive';
        });
 
        /* Toggle: loan active/inactive */
        document.getElementById('activeinaclonToggle')?.addEventListener('change', function () {
            document.getElementById('toggleLabel3').textContent = this.checked ? 'Active' : 'Inactive';
        });
 
        function updateAmountFieldState () {
            const increREDU = document.getElementById('increREDU').value;
            const amount    = document.getElementById('amount');
            if (increREDU === 'Reducing') {
                amount.readOnly = true;
                amount.value    = '0';
            } else if (increREDU === 'Increasing') {
                amount.readOnly = false;
                amount.value    = '';
            }
        }
        $('#pitem').on('change', function() {
     populateCategory()  
    });

    $('#searchValue').on('change', function() {
     searchstaffdet()  
    });
    $('#empmodal').on('click', function () {
       
        /* Load payroll items into Select2 */
        $.ajax({
            
            url: App.routes.getcodes,
            type: 'GET',
            success: function (response) {
                const $sel = $('#pitem');
                $sel.empty().append('<option value="">Select Item</option>');
 
                (response.data || []).forEach(function (item) {
                    $sel.append(
                        $('<option>', {
                            value:              item.cname,
                            'data-code':        item.code,
                            'data-category':    item.category,
                            'data-increredu':   item.increREDU,
                            'data-formular':    item.formularinpu
                        }).text(item.code + ' - ' + item.cname)
                    );
                });
 
                /* Init / reinit Select2 — destroy first to avoid duplicates */
                if ($sel.hasClass('select2-hidden-accessible')) $sel.select2('destroy');
 
                $sel.select2({
                    placeholder: 'Select Item',
                    allowClear: true,
                    dropdownParent: $('#exampleModal'),
                    width: '100%'
                });
            },
            error: function () {
               showToast('danger', 'Error!', 'Failed to load payroll items.');
            }
        });
 
        /* Init Choices.js on staff dropdown — destroy old instance first */
        const rawEl = document.getElementById('searchValue');
        if (!rawEl) return;
 
        if (choicesInstance) {
            try { choicesInstance.destroy(); } catch (e) {}
            choicesInstance = null;
        }
 
        choicesInstance = new Choices(rawEl, {
            searchEnabled:         true,
            placeholderValue:      'Search staff…',
            searchPlaceholderValue:'Type to search…',
            allowHTML:             true,
            shouldSort:            false,
            itemSelectText:        '',
            noResultsText:         'No matching staff',
            searchResultLimit:     50,   /* show up to 50 results */
        });
 
        /* Debounced AJAX search */
        let searchTimer = null;
 
        /* Listen on the internal Choices input */
        function attachChoicesSearch () {
            const inner = rawEl.closest('.choices')?.querySelector('.choices__input--cloned');
            if (!inner) { setTimeout(attachChoicesSearch, 60); return; }
 
            inner.addEventListener('input', function () {
                clearTimeout(searchTimer);
                const term = this.value.trim();
                searchTimer = setTimeout(() => fetchStaff(term), 280);
            });
        }
 
        attachChoicesSearch();
        fetchStaff('');   /* initial full load */
    });
    });
 
    /* ── Table helpers ─────────────────────────────────────── */
    window.clearFields = function () {
        ['surname','workNumber','othername','department','departmentname',
         'epmpenperce','emplopenperce','pensionable','balance'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const toggle = document.getElementById('activeinacToggle');
        if (toggle) { toggle.checked = false; }
        const label  = document.getElementById('toggleLabel2');
        if (label)  label.textContent = 'Inactive';
    };
 
    window.populateTable = function (data) {
        const table = $('#contentTable2').DataTable();
        table.clear();
        let total = 0;
        data.forEach(function (item) {
            table.row.add([
                item.Surname + ' ' + item.othername,
                item.WorkNo,
                item.dept,
                item.PCode,
                item.Amount
            ]);
            total += parseFloat(item.Amount) || 0;
        });
        table.draw();
        document.getElementById('totalsvar').value = total.toFixed(2);
    };
 
    window.fetchData = function (parameter) {
        $.ajax({
            url:  App.routes.fetchitems,
            type: 'POST',
            data: { _token: $('meta[name="csrf-token"]').attr('content'), parameter },
            success: function (response) {
                if (response.success) populateTable(response.data);
            },
            error: function (xhr, status, error) {
                console.error('fetchData error:', status, error);
            }
        });
    };
 
})();

        const currentMonth = $('#currentMonth').val();
const currentYear = $('#currentYear').val();
 
// Add event listener to the button
document.getElementById('preview-totals-btn').addEventListener('click', function () {
    const currentMonth = $('#currentMonth').val();
    const currentYear  = $('#currentYear').val();

    // Set the message dynamically
    document.getElementById('confirmTotalsMessage').textContent =
        `Are you sure you want to process totals for ${currentMonth} ${currentYear}?`;

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('confirmTotalsModal'));
    modal.show();

    // Confirm button handler — use once so it doesn't stack on repeated clicks
    const confirmBtn = document.getElementById('confirmTotalsConfirm');
    confirmBtn.onclick = function () {
        modal.hide();
        processPayrollTotals(currentMonth, currentYear);
    };
});

/**
 * Process payroll totals with SSE progress tracking
 */
// ✅ Add this utility near the top of your file (or in a shared utils file)
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function processPayrollTotals(month, year) {

    // ── Modal instances ───────────────────────────────────────────────────
    const progressModal = new bootstrap.Modal(document.getElementById('progressTotalsModal'));
    const successModal  = new bootstrap.Modal(document.getElementById('successTotalsModal'));
    const errorModal    = new bootstrap.Modal(document.getElementById('errorTotalsModal'));

    const progressBar = document.getElementById('bs-progress-bar');
    const progressMsg = document.getElementById('bs-progress-message');

    // ── Helper: update progress bar ───────────────────────────────────────
    function updateProgressBar(percent, message) {
        progressBar.style.width     = percent + '%';
        progressBar.textContent     = percent + '%';
        progressBar.setAttribute('aria-valuenow', percent);
        progressMsg.textContent     = message || '';
    }

    // ── Helper: show error modal ──────────────────────────────────────────
    function showError(message) {
        progressModal.hide();
        document.getElementById('error-modal-message').textContent = message;
        errorModal.show();
    }

    // ── Show progress modal ───────────────────────────────────────────────
    updateProgressBar(0, 'Initializing process...');
    progressModal.show();

    // ── SSE ───────────────────────────────────────────────────────────────
    const url = App.routes.autocalc
        + '?month=' + encodeURIComponent(month)
        + '&year='  + encodeURIComponent(year)
        + '&t='     + Date.now();

    const evtSource  = new EventSource(url);
    let   lastPercent = 0;

    evtSource.addEventListener('progress', function (event) {
        try {
            const data = JSON.parse(event.data);
            updateProgressBar(data.percent, data.message);
            lastPercent = data.percent;
        } catch (e) {
            console.error('Error parsing progress event:', e);
        }
    });

    evtSource.addEventListener('complete', function (event) {
        try {
            const data = JSON.parse(event.data);
            updateProgressBar(100, 'Processing complete!');
            evtSource.close();

            const safeMessage   = escapeHtml(data.message) || 'Totals processed successfully!';
            const safeGrossPays = data.totalGrossPays
                ? escapeHtml(formatCurrency(data.totalGrossPays))
                : null;

            setTimeout(() => {
                progressModal.hide();

                document.getElementById('success-message').textContent = safeMessage;

                const grossEl = document.getElementById('success-gross');
                grossEl.textContent = safeGrossPays
                    ? 'Total Gross Pays: ' + safeGrossPays
                    : '';

                successModal.show();
            }, 500);

        } catch (e) {
            console.error('Error parsing complete event:', e);
            evtSource.close();
            showError('Processing completed but response parsing failed.');
        }
    });

    evtSource.addEventListener('error', function (event) {
        console.error('SSE error event:', event);
        evtSource.close();

        let errorMessage = 'An error occurred while processing totals.';
        try {
            if (event.data) {
                const data = JSON.parse(event.data);
                if (data?.message) errorMessage = data.message;
            }
        } catch (e) {
            console.error('Error parsing error event data:', e);
        }

        showError(errorMessage);
    });

    evtSource.onerror = function (error) {
        console.error('EventSource connection error:', error);
        if (lastPercent < 100) {
            evtSource.close();
            showError(
                evtSource.readyState === EventSource.CLOSED
                    ? 'Connection lost. Please check your internet connection and try again.'
                    : 'An unexpected error occurred. Please try again.'
            );
        }
    };
}

/**
 * Update progress bar and message
 */
function updateProgressBar(percent, message) {
    const progressBar = document.getElementById('swal-progress-bar');
    const progressMessage = document.getElementById('swal-progress-message');
    
    if (progressBar) {
        progressBar.style.width = percent + '%';
        progressBar.setAttribute('aria-valuenow', percent);
        progressBar.textContent = Math.round(percent) + '%';
    }
    
    if (progressMessage) {
        progressMessage.textContent = message;
    }
}

/**
 * Show error message
 */
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Processing Error',
        text: message,
        confirmButtonText: 'OK'
    });
}
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES'
    }).format(amount);
}
    let currentPage = 1;
        let currentSearch = '';

        // Load deductions
        function loadDeductions(page = 1, search = '') {
    currentPage = page;
    currentSearch = search;

    $.ajax({
        url: App.routes.getwuth,
        type: 'GET',
        data: {
            page: page,
            search: search,
            per_page: 10
        },
        dataType: 'json',
        beforeSend: function() {
            // ✅ Static HTML only — no user/server data, safe as-is
            $('#tableBody').html(`
                <tr>
                    <td colspan="7" class="text-center">
                        <i class="fa fa-spinner fa-spin"></i> Loading...
                    </td>
                </tr>
            `);
        },
        success: function(response) {
            if (response.status === 'success') {

                
                const safeMonth = escapeHtml(response.period.month);
                const safeYear  = escapeHtml(response.period.year);

                $('#period-info').html(`
                    <i class="fa fa-calendar"></i> 
                    <strong>Active Period:</strong> ${safeMonth} ${safeYear}
                `);

                renderTable(response.data);
                renderPagination(response.pagination);

                // ✅ These use .text() — already safe
                $('#total-records').text(`Total Records: ${response.pagination.total}`);
                $('#showing-info').text(
                    `Showing ${response.pagination.from || 0} to ${response.pagination.to || 0} of ${response.pagination.total} entries`
                );

            } else {

               
                const $errorRow = $('<tr>');
                const $errorCell = $('<td>')
                    .attr('colspan', '7')
                    .addClass('text-center text-danger')
                    .text(response.message);

                $errorRow.append($errorCell);
                $('#tableBody').empty().append($errorRow);
            }
        },
        error: function(xhr, status, error) {
            console.error('Load error:', error);

            // ✅ Static string only — no server data, safe as-is
            $('#tableBody').html(`
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        Error loading data. Please try again.
                    </td>
                </tr>
            `);
        }
    });
}

        // Render table rows
        function renderTable(data) {
    const $tableBody = $('#tableBody');

    if (data.length === 0) {
        // ✅ Static string only — no server data, safe as-is
        $tableBody.html(`
            <tr>
                <td colspan="7" class="text-center">No records found</td>
            </tr>
        `);
        return;
    }

    // ✅ Build rows via DOM methods — no string interpolation of server data
    $tableBody.empty();

    data.forEach(row => {
        const $tr = $('<tr>')
            .addClass('clickable-row')
            .on('click', function() { highlightRow(this); });

        // Each cell uses .text() — neutralizes any HTML in server data
        [
            row.full_name,
            row.work_no,
            row.department,
            row.code,
            row.name,
            row.category
        ].forEach(function(value) {
            $('<td>').text(value).appendTo($tr);
        });

        // Amount cell has extra class
        $('<td>')
            .addClass('text-right')
            .text(row.amount)
            .appendTo($tr);

        $tableBody.append($tr);
    });
}

        // Render pagination
        function renderPagination(pagination) {
    const $pagination = $('#pagination');

    if (pagination.last_page <= 1) {
        $pagination.empty();
        return;
    }

    // ✅ Whitelist-validate numeric values from server before use
    const currentPage = parseInt(pagination.current_page, 10);
    const lastPage    = parseInt(pagination.last_page, 10);

    // Guard against non-numeric server data
    if (isNaN(currentPage) || isNaN(lastPage)) {
        console.error('Invalid pagination data received');
        return;
    }

    $pagination.empty();

    // ✅ Helper — builds a single <li><a> page item safely
    function makePageItem(label, page, isActive = false, isDisabled = false) {
        const $li = $('<li>').addClass('page-item');

        if (isDisabled) {
            $li.addClass('disabled');
            $('<span>').addClass('page-link').text(label).appendTo($li);
        } else {
            if (isActive) $li.addClass('active');
            $('<a>')
                .addClass('page-link')
                .attr('href', '#')
                .attr('data-page', page)   // ✅ .attr() escapes automatically
                .text(label)               // ✅ .text() never renders HTML
                .appendTo($li);
        }
        return $li;
    }

    // Previous button
    if (currentPage > 1) {
        $pagination.append(makePageItem('Previous', currentPage - 1));
    }

    // Page numbers
    for (let i = 1; i <= lastPage; i++) {
        if (
            i === 1 ||
            i === lastPage ||
            (i >= currentPage - 2 && i <= currentPage + 2)
        ) {
            $pagination.append(makePageItem(i, i, i === currentPage));
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            $pagination.append(makePageItem('...', null, false, true));
        }
    }

    // Next button
    if (currentPage < lastPage) {
        $pagination.append(makePageItem('Next', currentPage + 1));
    }
}

        // Highlight row on click
        function highlightRow(row) {
            $(row).siblings().removeClass('table-active');
            $(row).addClass('table-active');
        }

        // Event handlers
        $(document).ready(function() {
            $('#contentTable2').DataTable({
        columnDefs: [
            { targets: 2, width: '80px' } // Department column
        ],
        autoWidth: false,
        data: [], // Start with empty data
        columns: [
            { title: "Name" },
            { title: "Work number" },
            { title: "Department" },
            { title: "Parameter Code" },
            { title: "Amount" }
        ]
    });

                $('#pitem').on('change', function() {
        var selectedParameter = $(this).val();
        if (selectedParameter) {
            fetchData(selectedParameter);
        } else {
            function clearTable() {
        $('#contentTable2 tbody').empty();
    }
        }
    });
            // Initial load
            loadDeductions();

            // Search button
            $('#searchBtn').on('click', function() {
                const search = $('#searchInput').val();
                loadDeductions(1, search);
            });

            // Clear button
            $('#clearBtn').on('click', function() {
                $('#searchInput').val('');
                loadDeductions(1, '');
            });

            // Search on Enter key
            $('#searchInput').on('keypress', function(e) {
                if (e.which === 13) {
                    $('#searchBtn').click();
                }
            });

            // Pagination click
            $(document).on('click', '#pagination a', function(e) {
                e.preventDefault();
                const page = $(this).data('page');
                if (page) {
                    loadDeductions(page, currentSearch);
                }
            });
            $('.toggle-checkbox').on('change', function () {
    let checkbox = $(this);
    let isChecked = checkbox.is(':checked');
    let model = checkbox.data('model');
    let fieldName = checkbox.next('label').text();
    let action = isChecked ? 'activate' : 'deactivate';

    // Revert temporarily
    checkbox.prop('checked', !isChecked);

    if (confirm(`Are you sure you want to ${action} ${fieldName}?`)) {

        $.ajax({
            url: App.routes.tstatus,
            method: "POST",
            data: {
                _token: "{{ csrf_token() }}",
                model: model,
                status: isChecked ? 'ACTIVE' : 'INACTIVE'
            },
            success: function (response) {
                checkbox.prop('checked', isChecked);
                showToast('success', 'Success!', fieldName + " updated successfully.");
            },
            error: function () {
                showToast('danger', 'Invalid file', "Error updating " + fieldName);
            }
        });

    }
});


 document.getElementById('quantity').addEventListener('input', executeFormula);

    $('#pitem').on('change', function() {
        var selectedParameter = $(this).val();
        if (selectedParameter) {
            fetchData(selectedParameter);
        } else {
            function clearTable() {
        $('#contentTable2 tbody').empty();
    }
        }
    });

     $('#exampleModal').on('hidden.bs.modal', function () {
        // Reset the form
        clearFields();
        //$('#payrollForm')[0].reset();
        $('#pitem').val('').trigger('change');
        //$('#searchValue').val('').trigger('change');
       //choicesSearchValue.removeActiveItems();


    });
    $('#employeeModal').on('hidden.bs.modal', function () {
        // Reset the form
        clearFields2();
    });

    document.querySelectorAll('[data-toggle="tooltip"], [data-bs-toggle="tooltip"]')
    .forEach(el => new bootstrap.Tooltip(el, { trigger: 'hover focus', boundary: 'window' }));
    
    // Enhanced tooltip for disabled button
    const previewBtn = document.getElementById('preview-totals-btn');
if (previewBtn) {
    const tt = new bootstrap.Tooltip(previewBtn, { trigger: 'hover focus', html: true });
    previewBtn.addEventListener('mouseenter', () => {
        if (previewBtn.disabled) tt.show();
    });
}
    
    
    
    $('#NofityApprover').on('click', function (e) {
    e.preventDefault();

    const month = $('#currentMonth').val();
    const year  = $('#currentYear').val();

    if (!month || !year) {
        bsAlert({ icon: 'error', title: 'Error', message: 'Month and year are required' });
        return;
    }

    bsConfirm({
        icon:         'warning',
        title:        'Notify Approver?',
        message:      `Are you sure you want to submit the netpay for ${month} ${year} for approval? Make sure you have run Auto Calculate first.`,
        confirmText:  'Yes, Notify',
        cancelText:   'Cancel',
        confirmClass: 'btn-warning',
        onConfirm:    () => sendNotification(month, year)
    });
});

function sendNotification(month, year) {
    const loadingModal = bootstrap.Modal.getOrCreateInstance(
        document.getElementById('progressTotalsModal')
    );
    document.getElementById('bs-progress-message').textContent = 'Notifying...';
    document.getElementById('bs-progress-bar').style.width     = '100%';
    document.getElementById('bs-progress-bar').textContent     = '';
    loadingModal.show();

    $.ajax({
        url:    App.routes.netnofityapp,
        method: 'POST',
        data:   { month, year },
        success: function (response) {
            loadingModal.hide();
            bsAlert({ icon: 'success', title: 'Notified!', message: response.message });
        },
        error: function (xhr) {
            loadingModal.hide();
            bsAlert({
                icon:    'error',
                title:   'Error',
                message: xhr.responseJSON?.message || 'Failed to approve netpay'
            });
        }
    });
}
    


        });


function cleartxt2(){
        $('#balance').val('');
        $('#balend').val('');
        $('#duration').val('');
        $('#quantity').val('');
        $('#camountf').val('');
    }

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

    
    
function highlightAndPopulateRow(row) {
    // Remove highlight from all rows
    $('#employeeDataTable tbody tr').removeClass('highlight');
    
    // Add highlight to clicked row
    $(row).addClass('highlight');
    
    // Populate input fields
    $('#inputID').val($(row).find('td:eq(0)').text());
    $('#inputPCode').val($(row).find('td:eq(1)').text());
    $('#inputname').val($(row).find('td:eq(2)').text());
    $('#inputAmount').val($(row).find('td:eq(3)').text());
    $('#inputBalance').val($(row).find('td:eq(4)').text());
}

function cleartxt(){
                    $('#inputID').val('');
                    $('#inputPCode').val('');
                    $('#inputname').val('');
                    $('#inputAmount').val('');
                    $('#inputBalance').val('');
}
    // Get the current date, month, and year










  

function showErrorMessage(message) {
    let errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'errorMessage';
        document.body.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.left = '20px';
    errorDiv.style.backgroundColor = '#f44336';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '15px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    errorDiv.style.zIndex = '1051'; 
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 2000);
}

document.addEventListener('DOMContentLoaded', function() {
    var rows = document.querySelectorAll("#contentTable tbody tr");
    var viewButton = document.querySelector('.btn-info');

    rows.forEach(function(row) {
        row.addEventListener("click", function() {
            highlightRow(this);
        });
    });

  
});


    









function clearFields2() {     
    $('#empname').val('');
    $('#empname1').val('');
    $('#inputPCode').val('');
    $('#inputname').val('');
    $('#inputAmount').val('');
    $('#inputBalance').val('');
}
function searchstaffdet(){ 
    performSearch();
}
function searchstaffdet2(){ 
    
}





       
import * as math from 'mathjs';

function executeFormula() {
    var formula = $('#formular').val();
    var amounts = $('#camountf').val().split(',');
    var quantity = parseFloat($('#quantity').val());
    var codes = formula.match(/[A-Za-z]+\d+/g);

    codes.forEach(function(code, index) {
        var amount = amounts[index];
        if (amount === '') {
            amount = quantity;
        }
        formula = formula.replace(code, amount);
    });

    try {
        // Safe formula evaluation — no eval()
        var result = math.evaluate(formula);
        $('#amount').val(parseFloat(result).toFixed(2));
    } catch (error) {
        console.error('Error evaluating formula:', error);
        $('#amount').val('Error');
    }
}