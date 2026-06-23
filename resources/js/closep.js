   import DOMPurify from 'dompurify';
   document.addEventListener('DOMContentLoaded', function () {
 
    /* ── Email chip toggle ────────────────────────────────── */
    const emailChip = document.getElementById('emailChip');
    const emailCb   = document.getElementById('send_email');
 
    emailChip.addEventListener('click', function (e) {
        // Prevent double-firing from label's default checkbox behaviour
        e.preventDefault();
        emailCb.checked = !emailCb.checked;
        emailChip.classList.toggle('on', emailCb.checked);
    });
 
    /* ── Progress modal global helpers (existing JS uses these) */
    window.openProgressModal = function (msg) {
        document.getElementById('progress-message').textContent = msg || 'Processing…';
        document.getElementById('progress-bar').style.width = '5%';
        document.getElementById('progress-modal').classList.add('open');
    };
 
    window.updateProgressBar = function (pct) {
        document.getElementById('progress-bar').style.width = pct + '%';
    };
 
    window.closeProgressModal = function () {
        document.getElementById('progress-modal').classList.remove('open');
        document.getElementById('progress-bar').style.width = '0%';
    };
 
    /* ── Legacy show/hide for #progress-modal (old inline style) */
    // Some old JS does: document.getElementById('progress-modal').style.display = 'flex'
    // We intercept with a MutationObserver so both approaches work.
    const pmEl = document.getElementById('progress-modal');
    const observer = new MutationObserver(function () {
        if (pmEl.style.display === 'flex' || pmEl.style.display === 'block') {
            pmEl.style.display = '';
            pmEl.classList.add('open');
        } else if (pmEl.style.display === 'none') {
            pmEl.style.display = '';
            pmEl.classList.remove('open');
        }
    });
    observer.observe(pmEl, { attributes: true, attributeFilter: ['style'] });
 
    /* ── Toast ────────────────────────────────────────────── */
    window.showMessage = function (msg, isError) {
        showToast(isError ? 'danger' : 'success', isError ? 'Error' : 'Success', msg);
    };
 
    function showToast (type, title, message) {
        const wrap  = document.getElementById('toastWrap');
        const icons = { success:'check_circle', danger:'error_outline', warning:'warning_amber' };
        const t = document.createElement('div');
        t.className = 'toast-msg ' + type;
        t.innerHTML = '<span class="material-icons">' + (icons[type] || 'info') + '</span>'
                    + '<div><strong>' + title + '</strong> ' + message + '</div>';
        wrap.appendChild(t);
        const dismiss = () => { t.classList.add('leaving'); setTimeout(() => t.remove(), 300); };
        t.addEventListener('click', dismiss);
        setTimeout(dismiss, 6000);
    }
 
});
        function updateProgress(percent, message, stats) {
    progressBar.style.width = percent + '%';
    progressBar.textContent = percent + '%';
    progressMessage.textContent = message;
    progressStats.textContent = stats;
}
        document.addEventListener('DOMContentLoaded', function() {
            $('#period')
        .html('<option value="">Loading...</option>');
    
    $.ajax({
        url: App.routes.summarydata,
        type: 'GET',
        dataType: 'json',
        cache: true,
        timeout: 30000,
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        },
        success: function(data) {
    if (data.error) {
        // ✅ Use safe console logging
        console.error("Error:", data.error);
        
        // Handle session expiration
        if (data.error === 'Session expired' || data.error === 'Unauthorized access') {
            showMessage('Your session has expired. Please login again.', true);
            window.location.href = App.routes.login;
            return;
        }
        
        // ✅ Don't concatenate error into string - pass as parameter
        showMessage('Error loading data: ' + data.error, true);
    } else if (data.success) {
        // ✅ Safe period dropdown population
        const $period = $('#period');
        $period.empty();
        
        // Default option
        $period.append($('<option>').val('').text('Select Period'));
        
        // Validate periodOptions exists and is array
        if (Array.isArray(data.periodOptions)) {
            data.periodOptions.forEach(function(opt) {
                if (opt && opt.value !== undefined) {
                    $period.append(
                        $('<option>')
                            .val(opt.value)
                            .text(opt.text || opt.value)
                    );
                }
            });
        }
    }
},
        error: function(xhr, status, error) {
            console.error("Error: " + error);
            
            if (xhr.status === 403) {
                showMessage('Security token expired. Please refresh the page.', true);
                location.reload();
            } else if (xhr.status === 401) {
                showMessage('Your session has expired. Please login again.', true);
                window.location.href = App.routes.login;
            } else {
                showMessage('Failed to load data. Please refresh the page.', true);
            }
        }
    });
    // Function to format month number to month name
    function getMonthName(monthNumber) {
        const monthNames = ["January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"];
        return monthNames[monthNumber - 1];
    }

    // Add click event listener to the #load button
   document.getElementById('load').addEventListener('click', function (event) {
    event.preventDefault();

    const selectedYear      = $('#currentYear').val();
    const selectedMonthName = $('#currentMonth').val();
    const submitBtn         = this;
    const originalText      = submitBtn.innerHTML;

    bsConfirm({
        icon:         'warning',
        title:        'Are you sure?',
        message:      `Are you sure you want to close the period ${selectedMonthName} ${selectedYear}?`,
        confirmText:  'Yes, close period',
        cancelText:   'No, cancel',
        confirmClass: 'btn-primary',
        onConfirm:    () => closePeriod(selectedMonthName, selectedYear, submitBtn, originalText)
    });
});

function closePeriod(month, year, submitBtn, originalText) {

    // ── Spinner on button ─────────────────────────────────────────────────
    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Closing...';
    submitBtn.disabled  = true;

    // ── Show progress modal ───────────────────────────────────────────────
    const loadingModal = bootstrap.Modal.getOrCreateInstance(
        document.getElementById('progressTotalsModal')
    );
    const progressBar = document.getElementById('bs-progress-bar');
    const progressMsg = document.getElementById('bs-progress-message');

    let progress = 0;
    progressBar.style.width   = '0%';
    progressBar.textContent   = '0%';
    progressMsg.textContent   = 'Processing period closing...';
    loadingModal.show();

    // Simulate progress while request is in flight
    const progressInterval = setInterval(() => {
        if (progress < 90) {
            progress += 5;
            progressBar.style.width = progress + '%';
            progressBar.textContent = progress + '%';
            progressBar.setAttribute('aria-valuenow', progress);
        }
    }, 200);

    // ── AJAX request ──────────────────────────────────────────────────────
    fetch(App.routes.periodclose, {
        method: 'POST',
        headers: {
            'Content-Type':     'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN':     document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: new URLSearchParams({ month, year })
    })
    .then(response => response.json())
    .then(data => {
        clearInterval(progressInterval);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled  = false;

        if (data.status === 'success') {
            progressBar.style.width = '100%';
            progressBar.textContent = '100%';
            progressMsg.textContent = 'Period closed successfully!';

            setTimeout(() => {
                loadingModal.hide();
                bsAlert({ icon: 'success', title: 'Period Closed', message: 'Period closed successfully!' });
            }, 500);
        } else {
            throw new Error(data.message);
        }
    })
    .catch(error => {
        clearInterval(progressInterval);
        loadingModal.hide();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled  = false;

        bsAlert({
            icon:    'error',
            title:   'Error',
            message: `An error occurred while closing the period. ${error.message}`
        });
    });
}
});
document.addEventListener('DOMContentLoaded', function() {
   const form = document.getElementById('bulkPayslipForm');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressMessage = document.getElementById('progressMessage');
const progressStats = document.getElementById('progressStats');
const generateBtn = document.getElementById('generateBtn');
const downloadLinksSection = document.getElementById('downloadLinksSection');
const downloadLinks = document.getElementById('downloadLinks');

let directoryHandle = null; // For File System Access API

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const period = document.getElementById('period').value;
    const downloadMethod = document.getElementById('download_method').value;
    const sendEmail = document.getElementById('send_email').checked;
    
    if (!period) {
        alert('Please select a period');
        return;
    }

    // Confirm if sending emails
    if (sendEmail) {
        const confirmEmail = confirm(
            'You are about to send payslips via email to all employees.\n\n' +
            '• PDFs will be password-protected with KRA PIN\n' +
            '• Only employees with valid email addresses will receive payslips\n\n' +
            'Continue?'
        );
        
        if (!confirmEmail) {
            return;
        }
    }

    // For individual downloads, request directory access first
    if (downloadMethod === 'individual') {
        if (!('showDirectoryPicker' in window)) {
            alert('Your browser does not support folder selection. Please use ZIP download method.');
            return;
        }
        
        try {
            directoryHandle = await window.showDirectoryPicker();
        } catch (err) {
            if (err.name !== 'AbortError') {
                alert('Failed to select directory: ' + err.message);
            }
            return;
        }
    }

    // Show progress section
    progressSection.style.display = 'block';
    downloadLinksSection.style.display = 'none';
    downloadLinks.innerHTML = '';
    generateBtn.disabled = true;
    
    // Reset progress
    const initialMessage = sendEmail ? 
        'Starting payslip generation and email delivery...' : 
        'Starting bulk payslip generation...';
    updateProgress(0, initialMessage, '0/0 employees');

    try {
        // Start generation
        const response = await fetch(App.routes.bulkgenerate, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                period: period,
                download_method: downloadMethod,
                send_email: sendEmail
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            // Start polling for progress
            pollProgress(data.job_id, downloadMethod, sendEmail);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        alert('Error: ' + error.message);
        generateBtn.disabled = false;
        progressSection.style.display = 'none';
    }
});

function pollProgress(jobId, downloadMethod, sendEmail) {

    const progressInterval = setInterval(async function() {
        try {

            const url = App.routes.payslipProgress.replace('__id__', jobId);

            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'success') {
                const progress = data.progress;

                let stats = `${progress.success} success, ${progress.failed} failed of ${progress.total} total`;

                if (sendEmail) {
                    stats += ` | Emailed: ${progress.emailed}, Email failed: ${progress.email_failed}`;
                }

                updateProgress(progress.progress, progress.message, stats);

                if (progress.progress >= 100) {
    clearInterval(progressInterval);
    generateBtn.disabled = false;

    // ✅ Build completion messages safely
    const messages = [];

    if (progress.failed > 0) {
        const span = document.createElement('span');
        span.className = 'text-warning';
        span.textContent = `⚠️ Completed with ${progress.failed} errors.`;
        messages.push(document.createElement('br'), span);
    }

    if (sendEmail && progress.email_failed > 0) {
        const span = document.createElement('span');
        span.className = 'text-warning';
        span.textContent = `⚠️ ${progress.email_failed} emails failed.`;
        messages.push(document.createElement('br'), span);
    }

    if (sendEmail && progress.emailed > 0) {
        const span = document.createElement('span');
        span.className = 'text-success';
        span.textContent = `✉️ ${progress.emailed} emailed!`;
        messages.push(document.createElement('br'), span);
    }

    if (progress.failed === 0 && (!sendEmail || progress.email_failed === 0)) {
        const span = document.createElement('span');
        span.className = 'text-success';
        span.textContent = '✅ All processed successfully!';
        messages.push(document.createElement('br'), span);
    }

    // ✅ Append all messages safely
    messages.forEach(element => {
        progressMessage.appendChild(element);
    });

    if (!sendEmail || downloadMethod === 'zip' || downloadMethod === 'individual') {
        if (downloadMethod === 'zip') {
            downloadZipFile(jobId);
        } else {
            downloadIndividualFiles(jobId);
        }
    }
}

            } else {
                clearInterval(progressInterval);
                alert('Error: ' + data.message);
                generateBtn.disabled = false;
            }

        } catch (error) {
            clearInterval(progressInterval);
            console.error('Polling error:', error);
            alert('Error: ' + error.message);
            generateBtn.disabled = false;
        }

    }, 2000);
}



// Download as ZIP file


async function downloadZipFile(jobId) {
    try {
        const statusMsg = document.createElement('br');
        const statusText = document.createTextNode('Preparing ZIP file...');
        progressMessage.appendChild(statusMsg);
        progressMessage.appendChild(statusText);

        // Sanitize jobId since it flows into the URL
        const safeJobId = DOMPurify.sanitize(String(jobId), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
        const zipurl = App.routes.downloadzip.replace('__id__', encodeURIComponent(safeJobId));
        
        const response = await fetch(zipurl);
        if (!response.ok) throw new Error('Failed to download ZIP file');

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;

        // Sanitize period value used in filename
        const periodElement = document.getElementById('period');
        const rawPeriod = periodElement ? periodElement.value : 'unknown';
        const safePeriod = DOMPurify.sanitize(String(rawPeriod), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
                            .replace(/[^a-zA-Z0-9_\-]/g, '_'); // extra: only safe filename chars
        a.download = `Payslips_${safePeriod}.zip`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);

        const successBr = document.createElement('br');
        const successSpan = document.createElement('span');
        successSpan.className = 'text-success';
        successSpan.textContent = 'ZIP file downloaded successfully!';
        progressMessage.appendChild(successBr);
        progressMessage.appendChild(successSpan);

    } catch (error) {
        console.error('Error downloading ZIP:', error.message);
        const errorBr = document.createElement('br');
        const errorSpan = document.createElement('span');
        errorSpan.className = 'text-danger';
        errorSpan.textContent = `Error downloading ZIP: ${error.message}`;
        progressMessage.appendChild(errorBr);
        progressMessage.appendChild(errorSpan);
    }
}

// Download individual files using File System Access API
async function downloadIndividualFiles(jobId) {
    try {
        progressMessage.innerHTML += '<br>Downloading files to selected folder...';
        
        // Get list of files
        

        const indiviurl = App.routes.downloadindivi.replace('__id__', jobId);
        const response = await fetch(indiviurl);
        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error('Failed to get file list');
        }

        const files = data.files;
        let downloaded = 0;

        for (const file of files) {
            try {
                // Download file content
               
                const blob = await fileResponse.blob();

                // Create file in selected directory
                const fileHandle = await directoryHandle.getFileHandle(file.filename, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();

                downloaded++;
                updateProgress(
                    Math.round((downloaded / files.length) * 100),
                    `Saving files... ${downloaded}/${files.length}`,
                    `Downloaded to your selected folder`
                );
            } catch (err) {
                console.error(`Failed to save ${file.filename}:`, err);
            }
        }

        progressMessage.innerHTML += `<br><span class="text-success">${downloaded} files saved to your selected folder!</span>`;
    } catch (error) {
        alert('Error downloading files: ' + error.message);
    }
}

// Fallback: Show download links if File System Access API fails
async function showDownloadLinks(jobId) {
    try {
        

        const urldownlink = App.routes.downloadindivi.replace('__id__', jobId);
        
        const response = await fetch(urldownlink);

        const data = await response.json();

        if (data.status === 'success') {
            downloadLinksSection.style.display = 'block';
            
            data.files.forEach(file => {
                const link = document.createElement('a');
               
                link.className = 'list-group-item list-group-item-action';
                link.download = file.filename;
                link.textContent = file.filename;
                link.target = '_blank';
                downloadLinks.appendChild(link);
            });
        }
    } catch (error) {
        console.error('Error loading download links:', error);
    }
}
});