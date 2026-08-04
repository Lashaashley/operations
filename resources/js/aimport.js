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


       $('#model').on('change', function() {
          const selectedCampusId = $(this).val();
          if (selectedCampusId) {
            loadlotbymodel(selectedCampusId);
          } else {
            // Clear classes dropdown if no campus is selected
          const classDropdown = $('#lotnumber');
          classDropdown.empty();
          classDropdown.append('<option value="">Select lot</option>');
        }
        
      });


    const page = document.getElementById('importPage');

if (!page) return; // safety

const duplicateReportUrl = page.dataset.duplicateReportUrl;
    const dropZone   = document.getElementById('dropZone');
    const fileInput  = document.getElementById('excelFile');
    const filePill   = document.getElementById('filePill');
    const fileName   = document.getElementById('fileName');
    const removeFile = document.getElementById('removeFile');
    const uploadBtn  = document.getElementById('uploadBtn');
    const cancelBtn  = document.getElementById('cancelUpload');
    const rowCount   = document.getElementById('rowCount');
    const rowCountNum= document.getElementById('rowCountNum');
    const emptyReview= document.getElementById('emptyReview');
    const tableContainer = document.getElementById('tableContainer');
    const resultMsg  = document.getElementById('resultMsg');

    /* ── Drag & drop visual ──────────────────────────── */
    dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFile(fileInput.files[0]);
    });

    /* ── Remove file ─────────────────────────────────── */
    removeFile.addEventListener('click', clearFile);

    cancelBtn.addEventListener('click', clearFile);

    function clearFile() {
        fileInput.value = '';
        filePill.classList.remove('show');
        uploadBtn.disabled = true;
        tableContainer.innerHTML = '';
        emptyReview.style.display = '';
        rowCount.style.display = 'none';
        cancelBtn.style.display = 'none';
        resultMsg.style.display = 'none';
    }

    function cellValue(cell) {
    if (cell === null || cell === undefined) return '';
    if (typeof cell === 'object') {
        // Date object
        if (cell instanceof Date) return cell.toLocaleDateString();
        // Formula cell { formula, result }
        if (cell.result !== undefined) return cell.result;
        // Rich text { richText: [{text}] }
        if (cell.richText) return cell.richText.map(r => r.text).join('');
        return '';
    }
    return cell;
}

   async function getExcelJS() {
    if (window.ExcelJS) return window.ExcelJS;  // already loaded
    const { default: ExcelJS } = await import('exceljs');
    window.ExcelJS = ExcelJS;
    return ExcelJS;
}

    /* ── Handle selected file ────────────────────────── */
    async function handleFile(file) {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        showToast('danger', 'Invalid file', 'Please select an .xlsx or .xls file.');
        return;
    }

    fileName.textContent = file.name;
    filePill.classList.add('show');
    uploadBtn.disabled = false;

    try {
        const ExcelJS  = await getExcelJS(); 
        const workbook  = new ExcelJS.Workbook();
        const buffer    = await file.arrayBuffer();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.worksheets[0];

        if (!worksheet) {
            showToast('danger', 'Empty file', 'No sheets found in this workbook.');
            return;
        }

        // Convert to 2D array same as XLSX.utils.sheet_to_json(ws, { header: 1 })
        const data = [];
        worksheet.eachRow({ includeEmpty: true }, function(row) { 
            data.push(row.values.slice(1)); // slice(1) removes ExcelJS's undefined index 0
        });

        if (!data.length) {
            emptyReview.style.display = '';
            tableContainer.innerHTML = '';
            return;
        }

        emptyReview.style.display = 'none';
        cancelBtn.style.display   = '';
        rowCountNum.textContent   = data.length - 1;
        rowCount.style.display    = '';

        // Build preview table — identical to before
        let html = '<table class="review-table"><thead><tr>';
        data[0].forEach(h => html += `<th>${h ?? ''}</th>`);
        html += '</tr></thead><tbody>';

        data.slice(1, 51).forEach(row => {
            html += '<tr>';
            row.forEach(cell => html += `<td>${cell ?? ''}</td>`);
            html += '</tr>';
        });

        html += '</tbody></table>';
        tableContainer.innerHTML = html;

        if (data.length > 51) {
            tableContainer.innerHTML += `<p class="innerht">
                Showing first 50 of ${data.length - 1} rows.</p>`;
        }

    } catch (err) {
        console.error(err);
        showToast('danger', 'Parse error', 'Could not read the file. Please check the format.');
    }
}

    /* ── Form submit ─────────────────────────────────── */
    const form = document.getElementById('importForm');
    document.getElementById('importForm').addEventListener('submit', function (e) {

    e.preventDefault();

    const formData = new FormData(this);

    const importUrl = form.dataset.importUrl;
    openProgress('Uploading file…');

    const xhr = new XMLHttpRequest();

    /* Upload Progress (0–30%) */
    xhr.upload.onprogress = function (evt) {
        if (evt.lengthComputable) {
            const percent = Math.round((evt.loaded / evt.total) * 30);
            updateProgress(percent, 'Uploading file…');
        }
    };

    /* Processing Progress (30–95%) */
    xhr.onprogress = function () {

        const lines = xhr.responseText
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0);

        try {

            const last = JSON.parse(lines[lines.length - 1]);

            if (last.status === 'progress') {

                const mappedProgress = 30 + Math.round((last.progress / 100) * 65);

                updateProgress(
                    mappedProgress,
                    `${last.message} (${last.success} saved, ${last.errors} errors)`
                );

            }

        } catch (err) {}

    };

    xhr.onreadystatechange = function () {

        if (xhr.readyState !== 4) return;

        updateProgress(100, 'Finalizing…');

        try {

            const lines = xhr.responseText
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.length > 0);

            const res = JSON.parse(lines[lines.length - 1]);

            if (xhr.status >= 200 && xhr.status < 300 && res.status === 'success') {

                if (res.has_duplicate_report) {

                    showToast('warning', 'Import Complete', res.message);

                    document.getElementById('progressMessage').textContent = res.message;
                    document.getElementById('progressFill').style.width = '100%';
                    document.getElementById('progressPct').textContent = '100%';

                    document.querySelector('.progress-modal-icon .material-icons').textContent = 'warning_amber';
                    document.querySelector('#progressModal h3').textContent = 'Import Complete';

                    const modalCard = document.querySelector('.progress-modal-card');

                    modalCard.querySelectorAll('.modal-download-btn').forEach(el => el.remove());

                    const dlBtn = document.createElement('a');
                    dlBtn.href = duplicateReportUrl;
                    dlBtn.download = true;
                    dlBtn.className = 'btn btn-upload';
                    dlBtn.style.cssText = 'margin-top:16px;height:38px;font-size:13px;justify-content:center;';
                    dlBtn.innerHTML = '<span class="material-icons">download</span> Download Exception Report';

                    modalCard.appendChild(dlBtn);

                    const closeBtn = document.createElement('button');

                    closeBtn.className = 'btn btn-outline modal-download-btn';
                    closeBtn.style.cssText = 'margin-top:8px;height:38px;font-size:13px;justify-content:center;color:var(--muted);';

                    closeBtn.innerHTML = '<span class="material-icons">close</span> Close';

                    closeBtn.onclick = () => {

                        closeProgress();

                        modalCard.querySelectorAll('.modal-download-btn').forEach(el => el.remove());

                        document.querySelector('.progress-modal-icon .material-icons').textContent = 'sync';
                        document.querySelector('#progressModal h3').textContent = 'Importing Data…';

                    };

                    modalCard.appendChild(closeBtn);

                } else {

                    showToast('success', 'Imported!', res.message || 'Agents imported successfully.');

                    showResult(
                        'success',
                        `${res.message} — ${res.success} saved, ${res.errors} skipped.`
                    );

                    setTimeout(closeProgress, 600);

                }

                clearFile();

            } else {

                showToast('danger', 'Import failed', res.message || 'Something went wrong.');
                showResult('danger', res.message || 'Import failed.');
                closeProgress();

            }

        } catch (err) {

            console.error('Parse error:', err, xhr.responseText);
            showToast('danger', 'Error', 'Could not read server response.');
            closeProgress();

        }

    };

    xhr.open('POST', importUrl);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.send(formData);

});

    /* ── Progress helpers ────────────────────────────── */
    function openProgress(msg) {
        document.getElementById('progressMessage').textContent = msg;
        document.getElementById('progressModal').classList.add('open');
        updateProgress(5, msg);
    }

    function updateProgress(pct, msg) {
        document.getElementById('progressFill').style.width = pct + '%';
        document.getElementById('progressPct').textContent  = pct + '%';
        if (msg) document.getElementById('progressMessage').textContent = msg;
    }

    function closeProgress() {
        document.getElementById('progressModal').classList.remove('open');
        updateProgress(0, '');
    }

    /* ── Inline result ───────────────────────────────── */
function showResult(type, msg) {
    const icon = type === 'success' ? 'check_circle' : 
                 type === 'warning' ? 'warning_amber' : 'error_outline';
    
    // ✅ Set class name safely
    resultMsg.className = `result-msg ${type}`;
    
    // ✅ Clear existing content
    resultMsg.innerHTML = '';
    
    // ✅ Create icon span safely
    const iconSpan = document.createElement('span');
    iconSpan.className = 'material-icons';
    iconSpan.textContent = icon; // Material Icons use ligatures, textContent works
    
    // ✅ Create text node for message
    const msgText = document.createTextNode(msg);
    
    // ✅ Append safely - no HTML parsing involved
    resultMsg.appendChild(iconSpan);
    resultMsg.appendChild(msgText);
    
    // Show the element
    resultMsg.style.display = 'block';
}

    /* ── Toast ───────────────────────────────────────── */
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

      function loadlotbymodel(modelid) {
        $.ajax({
          url: App.routes.getbyselmodel,
          type: "GET",
          data: { modelid: modelid },
          success: function (response) {
            const dropdown = $('#lotnumber');
            dropdown.empty();
            dropdown.append('<option value="">Select Lot</option>');
            

            response.data.forEach(function (lots) {
                const $option = $('<option>')
                .val(lots.id)           
                .text(lots.lotnum); 
                dropdown.append($option);
            });
          },
          error: function () {
            alert('Failed to load Lots. Please try again.');
          }
        });
      }



