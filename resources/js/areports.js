document.addEventListener('DOMContentLoaded', function () {
 
    const modal       = document.getElementById('pdfModal');
    const modalTitle  = document.getElementById('pdfModalTitle');
    const modalBody   = document.getElementById('pdfModalBody');
    const loading     = document.getElementById('pdfLoading');
    const errorPanel  = document.getElementById('pdfError');
    const errorMsg    = document.getElementById('pdfErrorMsg');
    const downloadBtn = document.getElementById('downloadPdfBtn');
    const printBtn    = document.getElementById('printPdfBtn');
    const closeBtn    = document.getElementById('pdfModalClose');
 
    let currentPdfUrl = null;
 
    /* ── Open / close helpers ────────────────────────── */
    function openModal(title) {
        modalTitle.textContent = title;
        loading.style.display  = 'flex';
        errorPanel.style.display = 'none';
        downloadBtn.style.display = 'none';
        printBtn.style.display    = 'none';
 
        // Remove any existing iframe
        const old = modalBody.querySelector('iframe');
        if (old) old.remove();
 
        if (currentPdfUrl) {
            URL.revokeObjectURL(currentPdfUrl);
            currentPdfUrl = null;
        }
 
        modal.classList.add('open');
    }
 
    function closeModal() {
        modal.classList.remove('open');
        if (currentPdfUrl) {
            URL.revokeObjectURL(currentPdfUrl);
            currentPdfUrl = null;
        }
    }
 
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
 
    /* ── Render PDF from base64 ──────────────────────── */
function renderPdf(base64, filename) {
 
    // ── Validation 1: type check ──────────────────────────────────────────────
    if (!base64 || typeof base64 !== 'string') {
        console.error('Invalid PDF data: empty or wrong type');
        showUserError('Invalid PDF data received');
        return;
    }
 
    // ── Validation 2: base64 format ───────────────────────────────────────────
    if (!isValidBase64(base64)) {
        console.error('Invalid base64 format');
        showUserError('Invalid PDF format');
        return;
    }
 
    try {
        // ── Validation 3: size limit (DoS prevention) ─────────────────────────
        const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB
        const estimatedSize = base64.length * 0.75;
        if (estimatedSize > MAX_PDF_BYTES) {
            console.error('PDF too large:', estimatedSize);
            showUserError('PDF file too large (max 10 MB)');
            return;
        }
 
        // ── Decode ────────────────────────────────────────────────────────────
        let bytes;
        try {
            bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        } catch (decodeError) {
            console.error('Base64 decode failed:', decodeError);
            showUserError('Invalid PDF encoding');
            return;
        }
 
        // ── Validation 4: PDF magic bytes ─────────────────────────────────────
        // Every valid PDF starts with %PDF- (hex: 25 50 44 46 2D)
        // This rejects HTML, SVG, JavaScript, or any other content masquerading
        // as a PDF before it ever reaches the browser's PDF renderer.
        if (!isValidPdfHeader(bytes)) {
            console.error('Invalid PDF header — possible content injection attempt');
            showUserError('Invalid PDF file format');
            return;
        }
 
        // ── Validation 5: suspicious PDF content ─────────────────────────────
        // Checks for /JS, /JavaScript, /AA (auto-action), /OpenAction inside
        // the PDF byte stream — these are the vectors for PDF-embedded attacks.
        // Legitimate payroll reports will never contain these.
        if (containsSuspiciousPdfContent(bytes)) {
            console.error('PDF contains suspicious content — rendering blocked');
            showUserError('PDF contains unsafe content and cannot be displayed');
            return;
        }
 
        // ── Revoke any previous blob URL ──────────────────────────────────────
        // Prevent memory leaks from previous renders
        if (currentPdfUrl) {
            URL.revokeObjectURL(currentPdfUrl);
            currentPdfUrl = null;
        }
 
        // ── Create blob URL ───────────────────────────────────────────────────
        const blob = new Blob([bytes], { type: 'application/pdf' });
        currentPdfUrl = URL.createObjectURL(blob);
 
        // ── Build iframe ──────────────────────────────────────────────────────
        const iframe = document.createElement('iframe');
        iframe.id    = 'pdfFrame';
        iframe.title = 'PDF Viewer'; // accessibility
        iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
 
        // Append #toolbar=0 to suppress the PDF viewer's built-in toolbar.
        // This is cosmetic — it prevents users seeing a second download button
        // inside the viewer. It has no security effect.
        iframe.src = currentPdfUrl + '#toolbar=0&navpanes=0&scrollbar=0';
 
        // NOTE: sandbox attribute intentionally omitted.
        // See the security model explanation at the top of this function.
        // DO NOT add sandbox here — it will cause "blocked by Chrome" again.
 
        // NOTE: iframe.csp intentionally omitted.
        // It is non-standard, inconsistently supported, and 'default-src none'
        // was preventing the PDF renderer from loading its own resources.
 
        // ── Clear modal and render ────────────────────────────────────────────
        while (modalBody.firstChild) {
            modalBody.removeChild(modalBody.firstChild);
        }
 
        loading.style.display = 'none';
        modalBody.appendChild(iframe);
 
        downloadBtn.style.display = '';
        printBtn.style.display    = '';
 
        // ── Download handler ──────────────────────────────────────────────────
        downloadBtn.onclick = () => {
    // ✅ Validate and sanitize URL before any DOM interaction
    if (!currentPdfUrl || typeof currentPdfUrl !== 'string') {
        console.error('Invalid PDF URL');
        showUserError('Cannot download PDF: invalid URL');
        return;
    }

    // ✅ Strict blob URL validation
    const isBlobUrl = /^blob:[a-z0-9-]+$/i.test(currentPdfUrl.split('#')[0].split('?')[0]);
    
    if (!isBlobUrl) {
        console.error('Unexpected PDF URL scheme, aborting download');
        showUserError('Cannot download PDF: invalid URL');
        return;
    }

    // ✅ Sanitize filename
    const safeFilename = sanitizeFilename(filename);

    // ✅ Create anchor with validated, safe values
    const a = document.createElement('a');
    a.href = currentPdfUrl; // Already validated as safe blob URL
    a.download = safeFilename;
    a.rel = 'noopener noreferrer';

    // ✅ This is safe - element created with DOM API, no HTML parsing
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        if (document.body.contains(a)) {
            document.body.removeChild(a);
        }
    }, 100);
};
 
        // ── Print handler ─────────────────────────────────────────────────────
        printBtn.onclick = () => {
            try {
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                } else {
                    showUserError('Please wait for the PDF to finish loading before printing.');
                }
            } catch (printError) {
                console.error('Print failed:', printError);
                showUserError('Unable to print. Please download the PDF and print from your PDF reader.');
            }
        };
 
        // ── Cleanup on modal close ────────────────────────────────────────────
        // Use .one() instead of .on() to avoid stacking multiple handlers
        // if the modal is opened and closed repeatedly in the same session.
        $('#reportModal').one('hidden.bs.modal', function () {
            if (currentPdfUrl) {
                URL.revokeObjectURL(currentPdfUrl);
                currentPdfUrl = null;
            }
        });
 
    } catch (error) {
        console.error('PDF rendering error:', error);
        showUserError('Failed to load PDF. Please try again.');
    }
}

// ✅ Helper: Validate base64 format 
function isValidBase64(str) {
    // Check length is multiple of 4
    if (str.length % 4 !== 0) return false;
    
    // Check characters are valid base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) return false;
    
    // Additional check: shouldn't contain HTML tags even when decoded
    try {
        const decoded = atob(str);
        // Block obvious HTML/script tags
        if (/<script|javascript:|onerror|onload/i.test(decoded)) {
            console.warn('Potential XSS detected in base64 content');
            return false;
        }
    } catch (e) {
        return false;
    }
    
    return true;
}

// ✅ Helper: Validate PDF header (magic bytes)
function isValidPdfHeader(bytes) {
    if (!bytes || bytes.length < 8) return false;
    
    // PDF signature: %PDF- (bytes: 37 80 68 70 45)
    const isValid = bytes[0] === 37 &&  // %
                    bytes[1] === 80 &&  // P
                    bytes[2] === 68 &&  // D
                    bytes[3] === 70 &&  // F
                    bytes[4] === 45;    // -
    
    if (!isValid) return false;
    
    // Check for version (1.0-1.7, 2.0)
    const version = String.fromCharCode(bytes[5], bytes[6], bytes[7]);
    if (!/^\d\.\d$/.test(version)) return false;
    
    return true;
}

// ✅ Helper: Check for suspicious PDF content (JavaScript)
function containsSuspiciousPdfContent(bytes) {
    // Convert to string for pattern matching
    const str = new TextDecoder('latin1').decode(bytes.slice(0, 10000)); // Check first 10KB
    
    // Look for JavaScript indicators in PDF
    const suspiciousPatterns = [
        /\/JavaScript/i,
        /\/JS\s/i,
        /\/Launch\s/i,
        /\/EmbeddedFile/i,
        /\/RichMedia\s/i,
        /\/AA\s/i,        // Additional Actions
        /\/OpenAction\s/i,
        /\/SubmitForm/i
    ];
    
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(str)) {
            console.warn('Suspicious PDF feature detected:', pattern);
            return true;
        }
    }
    
    return false;
}

// ✅ Helper: Sanitize filename strictly
function sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
        return 'download.pdf';
    }
    
    // Remove path traversal attempts
    let safe = filename.replace(/\.\./g, '');
    
    // Keep only alphanumeric, dash, underscore, dot
    safe = safe.replace(/[^a-zA-Z0-9\-_.]/g, '');
    
    // Ensure it ends with .pdf
    if (!safe.toLowerCase().endsWith('.pdf')) {
        safe += '.pdf';
    }
    
    // Limit length
    safe = safe.substring(0, 255);
    
    // Fallback if empty
    return safe || 'document.pdf';
}

// ✅ Helper: Show user-friendly error
function showUserError(message) {
    if (typeof showMessage === 'function') {
        showMessage(message, true);
    } else {
        alert(message); // Fallback
    }
    
    // Clear modal content
    if (modalBody) {
        modalBody.innerHTML = `<div class="alert alert-danger m-3">${escapeHtml(message)}</div>`;
    }
}

// ✅ Helper: Escape HTML for error messages
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
 
    /* ── Show error inside modal ─────────────────────── */
    function showPdfError(msg) {
        loading.style.display      = 'none';
        errorPanel.style.display   = 'flex';
        errorMsg.textContent       = msg || 'Failed to generate the report.';
    }
 
    /* ── Fetch & display report ──────────────────────── */
    function fetchReport(url, title, filename) {
        openModal(title);
 
        fetch(url, {
            method:  'POST',
            headers: {
                'X-CSRF-TOKEN':  document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'Accept':        'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(r => {
            if (!r.ok) return r.json().then(d => Promise.reject(d.message || 'Server error'));
            return r.json();
        })
        .then(data => {
            if (data.success && data.pdf) {
                renderPdf(data.pdf, filename);
            } else {
                showPdfError(data.message || 'Failed to generate PDF.');
                showToast('danger', 'Report Error', data.message || 'Could not generate the report.');
            }
        })
        .catch(err => {
            const msg = typeof err === 'string' ? err : 'Error fetching report.';
            showPdfError(msg);
            showToast('danger', 'Request Failed', msg);
        });
    }
 
    /* ── Wire report buttons ─────────────────────────── */
    document.getElementById('openFullReport').addEventListener('click', () => {
    window.open(App.routes.allstaffreport, '_blank');
});
 
    // Add more report button wiring here as needed:
    // document.getElementById('openDeptReport')?.addEventListener('click', () => fetchReport(...));
 
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


$('#wopenFullReport').on('click', function(e) {
    e.preventDefault();

    // Open modal + show loader
    document.getElementById('staffReportModal').classList.add('open');
    document.getElementById('staffPdfLoading').style.display = 'flex';

    // Remove old iframe
    var old = document.getElementById('staffPdfContainer').querySelector('iframe');
    if (old) old.remove();

    // Create hidden POST form targeting a hidden iframe
    const iframeName = 'staffReportFrame';

    // Create iframe first
    var iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    iframe.onload = function() {
        document.getElementById('staffPdfLoading').style.display = 'none';
    };
    document.getElementById('staffPdfContainer').appendChild(iframe);

    // Create form that targets the iframe
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = App.routes.allstaffreport;
    form.target = iframeName; // 👈 POST into the iframe, not a new tab

    // CSRF token
    const token = document.createElement('input');
    token.type = 'hidden';
    token.name = '_token';
    token.value = document.querySelector('meta[name="csrf-token"]').content;
    form.appendChild(token);

    // Submit form into iframe
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form); // clean up
});

// Close modal
document.getElementById('closeStaffModal').addEventListener('click', function() {
    document.getElementById('staffReportModal').classList.remove('open');

    // Optional: kill iframe to stop any background loading
    var old = document.getElementById('staffPdfContainer').querySelector('iframe');
    if (old) old.remove();
});

// Close on backdrop click
document.getElementById('staffReportModal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.remove('open');
        var old = document.getElementById('staffPdfContainer').querySelector('iframe');
        if (old) old.remove();
    }
});

// Download button — same URL but forces download
document.getElementById('downloadStaffReport').addEventListener('click', function() {
    var link = document.createElement('a');
    link.href = App.routes.allstaffreport;
    link.download = 'Full_Staff_Report.pdf';
    link.click();
});

 
});