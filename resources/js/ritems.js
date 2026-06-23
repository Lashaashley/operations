  $(document).ready(function(){

    const prosstySelect   = document.getElementById('whitempen');
    prosstySelect.addEventListener('change', function () {
       populateCategory4();

    });

           $('#withholdingForm').on('submit', function(e) {
    e.preventDefault();

    var formData = $(this).serialize();

    $.ajax({
        url: App.routes.ritemsupdate,
        type: 'POST',
        data: formData,
        dataType: 'json',    // ← IMPORTANT
        success: function(response){
            if(response.success) {
                showToast('success','Success!', response.message);
            } else {
                showToast('danger', 'Error!', response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error(xhr.responseText);
        }
    });
});

$('#openwitho').click(function() {
    populatewit();
});

$('#savewhGroup').click(function() {
    var pitem = $('#whitempen').val();
    var code  = $('#codewhg').val();

    $.ajax({
        url: App.routes.wthgroups,
        type: 'POST',
        data: {
            pitem: pitem,
            code: code
        },
        dataType: 'json',
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        },
       success: function(data) {
    if (data.success) {
        showToast('success','Success!', 'WH group added.');

        // ✅ Build new row via DOM — no template literal with raw data
        const $row = $('<tr>').on('click', function() {
            highlightRow(this);
        });

        // ✅ data.ID from server — .text() keeps it safe
        $('<td>')
            .attr('hidden', true)
            .text(data.ID)
            .appendTo($row);

        // ✅ code and pitem are user inputs — still must be escaped
        //    .text() handles this automatically
        $('<td>').text(code).appendTo($row);
        $('<td>').text(pitem).appendTo($row);

        $('#whCodesTable tbody').append($row);
        $('#addwhGroupModal').modal('hide');

    } else {
        showToast('danger', 'Error!', data.message);
    }
},
        error: function(xhr) {
            console.error(xhr.responseText);
            showToast('danger', 'Error!', 'Error occurred while adding WH group.');
        }
    });
});
$('#deletewhGroup').click(function(e) {
    e.preventDefault();
    e.stopPropagation();

    var selectedRow = $('#whCodesTable tbody tr.highlight');

    if (selectedRow.length === 0) {
        showToast('danger', 'Error!', 'Please select an Item to delete.');
        return;
    }

    var id = selectedRow.find('td:first').text();

    if (confirm('Are you sure you want to delete this WH group?')) {
        $.ajax({
            url: App.routes.wthgroupsdelete,
            type: 'POST',
            data: { id: id },
            dataType: 'json',
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            },
            success: function(data) {
                if (data.success) {
                    selectedRow.remove();
                    showToast('success','Success!', 'Withholding group removed.');
                } else {
                    showToast('danger', 'Error!', data.message);
                }
            },
            error: function(xhr) {
               
                showToast('danger', 'Error!', 'Error occurred while deleting WH group.');
            }
        });
    }
});




    $('#wholdingcodes').on('click', function() {

    $.ajax({
        url: App.routes.ritemsgetcode,
        type: 'GET',
        success: function(response) {
            const $dropdown = $('#whitempen');
            $dropdown.empty();

            // ✅ Static default option — safe as-is
            $('<option>').val('').text('Select Item').appendTo($dropdown);

            response.data.forEach(function(statutoryOption) {
                // ✅ Build <option> via DOM — no template literal with server data
                $('<option>')
                    .attr('data-category', statutoryOption.code)  // ✅ .attr() escapes automatically
                    .val(statutoryOption.cname)                    // ✅ .val() escapes automatically
                    .text(statutoryOption.cname)                   // ✅ .text() never renders HTML
                    .appendTo($dropdown);                          // ✅ appending a DOM node, not a string
            });
        },
        error: function() {
            alert('Failed to load items. Please try again.');
        }
    });
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
function populateCategory4() {
    var select = document.getElementById('whitempen');
    var code = document.getElementById('codewhg');
    var selectedOption = select.options[select.selectedIndex];
    code.value = selectedOption.getAttribute('data-category');
}
function highlightRow(row) {
    var parentTable = row.closest('table');
    
    var tableRows = parentTable.getElementsByTagName('tr');

    for (var i = 0; i < tableRows.length; i++) {
        tableRows[i].classList.remove('highlight');
    }
    row.classList.add('highlight');
}

function populatewit(){
 
        var type = 'whbracket'; // Set type to fetch data for shifbracket
console.log('show modal');
        // Make an AJAX request to fetch the data
        $.ajax({
    url: App.routes.getwith,
    type: 'GET',
    data: { type: type },
    dataType: 'json',  // ✅ Important: automatically parses JSON for you
    success: function(data) {  // ✅ 'data' is already a JS object
        if (data.success) { 
            $('#cnamewh').val(data.cname);
            $('#codewh').val(data.code);
            $('#Percentagewl').val(data.wpercentage);

           $('#whCodesTable tbody').empty();

if (data.groups && data.groups.length > 0) {
    $('#whCodesTable').show();

    console.log(data);
    data.groups.forEach(function(group) {
        // ✅ Create <tr> via DOM — no string concatenation of server data
        const $row = $('<tr>').on('click', function() {
            highlightRow(this);
        });

        // ✅ hidden ID cell
        $('<td>')
            .attr('hidden', true)
            .text(group.ID)        // ✅ .text() neutralizes any HTML
            .appendTo($row);

        // ✅ code cell
        $('<td>')
            .text(group.code)      // ✅ safe
            .appendTo($row);

        // ✅ cname cell
        $('<td>')
            .text(group.cname)     // ✅ safe
            .appendTo($row);

        $('#whCodesTable tbody').append($row);
    });

} else {
    console.log('No withholding groups data available');
    $('#whCodesTable').hide();
}
        } else {
            console.error('Error fetching data:', data.message);
        }
    },
    error: function(jqXHR, textStatus, errorThrown){
        console.error('AJAX Error:', textStatus, errorThrown);
        console.error(jqXHR.responseText);
    }
});
}