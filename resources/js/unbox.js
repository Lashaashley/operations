
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
     if (currentTrackedLotId && currentTrackedLotId !== lotId) {
        endTracking(currentTrackedLotId);
    }

    if (lotid) { 
        loadcasebylot(lotid);
        loadLotProgress(lotid);
        startHeartbeat(lotid);
    } else {
        // Clear lots dropdown
        const $select = $('#case');
        $select.empty().append('<option value="">-- Select a Case --</option>');
          clearInterval(heartbeatInterval);
          currentTrackedLotId = null;
        
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

document.getElementById('btn-complete-case').addEventListener('click', function () {
    if (!currentLotId || !currentCase) return;

    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons">hourglass_top</span> Completing…';

    fetch(App.routes.partsCompleteCase, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value,
        },
        body: JSON.stringify({ lot_id: currentLotId, boxcase: currentCase }),
    })
    .then(r => r.json())
    .then(res => {
        if (res.error) throw new Error(res.error);

        showToast(res.nok_count > 0 ? 'warning' : 'success', 'Case Completed', res.message);
        btn.innerHTML = '<span class="material-icons">check_circle</span> Case Completed';
        loadLotProgress(currentLotId);
    })
    .catch(err => {
        showToast('danger', 'Error', err.message || 'Failed to complete case.');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-icons">task_alt</span> Complete Case';
    });
});
// ── Scanner detection state ─────────────────────────────────
let scanBuffer = '';
let lastKeyTime = 0;
const SCAN_SPEED_THRESHOLD = 50; // ms between keys — scanner types much faster than humans

document.addEventListener('keydown', function (e) {
    // Ignore if user is typing in a real input (qty, comment, selects)
    const activeTag = document.activeElement.tagName;
    const isFormField = ['INPUT', 'SELECT', 'TEXTAREA'].includes(activeTag)
        && document.activeElement.id !== 'scanner-capture';

    if (isFormField) return;

    const now = Date.now();
    const gap = now - lastKeyTime;
    lastKeyTime = now;

    if (e.key === 'Enter') {
        if (scanBuffer.length > 2) {
            processScan(scanBuffer.trim());
        }
        scanBuffer = '';
        return;
    }

    // If gap is too large, this is likely a fresh scan starting (or stray keypress) — reset buffer
    if (gap > 300) {
        scanBuffer = '';
    }

    if (e.key.length === 1) { // printable character
        scanBuffer += e.key;
    }
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


      function resetPartsContainer() {
    document.getElementById('parts-container').innerHTML = `
        <div class="parts-placeholder">
            <span class="material-icons">inbox</span>
            <p>Select a case to view its parts.</p>
        </div>`;
    document.getElementById('progress-badge').style.display = 'none';
    document.getElementById('complete-case-bar').style.display = 'none';
}

function loadPartsForCase(lotId, boxcase) {
    const container = document.getElementById('parts-container');
    container.innerHTML = `<div class="parts-placeholder">
        <span class="material-icons">hourglass_top</span><p>Loading parts…</p>
    </div>`;

    fetch(`${App.routes.partsForCase}?lot_id=${lotId}&boxcase=${encodeURIComponent(boxcase)}`)
        .then(r => r.json())
        .then(res => renderParts(res))
        .catch(() => {
            container.innerHTML = `<div class="parts-placeholder">
                <span class="material-icons">error</span><p>Failed to load parts.</p>
            </div>`;
        });
}

function renderParts(res) {
    const container = document.getElementById('parts-container');

    if (res.data.length === 0) {
        container.innerHTML = `<div class="parts-placeholder">
            <span class="material-icons">inbox</span><p>No parts found for this case.</p>
        </div>`;
        return;
    }

    container.innerHTML = res.data.map(part => buildPartCard(part)).join('');

    updateProgressBadge(res.checked_count, res.total_count);
    renderCaseProgress(res.checked_count, res.total_count);

    document.getElementById('complete-case-bar').style.display = 'flex';

    const completeBtn = document.getElementById('btn-complete-case');
    if (res.is_completed) {
        completeBtn.innerHTML = '<span class="material-icons">check_circle</span> Case Completed';
        completeBtn.disabled = true;
        completeBtn.style.opacity = '0.6';
    } else {
        completeBtn.innerHTML = '<span class="material-icons">task_alt</span> Complete Case';
        completeBtn.disabled = false;
        completeBtn.style.opacity = '1';
    }

    attachPartCardListeners();
}

function buildPartCard(part) {
    const cardClass = part.status === 'OK' ? 'checked-ok' : part.status === 'NOK' ? 'checked-nok' : '';
    const showComment = part.status === 'NOK' ? 'show' : '';

    // Fix: don't let null/undefined leak into the input value
    const countedQtyValue = (part.counted_qty === null || part.counted_qty === undefined)
        ? ''
        : part.counted_qty;

    return `
    <div class="part-card ${cardClass}" data-part-id="${part.part_id}" data-partnum="${part.partnum}">
        <div class="part-card-main">

            <div class="part-info">
                <div class="part-num">${part.partnum}</div>
                <div class="part-desc">${part.partdesc}</div>
            </div>

            <div class="part-station-tag">
                <span class="material-icons">precision_manufacturing</span>
                ${part.station}
            </div>

            <div class="qty-input-group">
                <input type="number" class="counted-qty-input" value="${countedQtyValue}" min="0">
                <span class="qty-required">/ ${part.required_qty}</span>
            </div>

            <div class="status-toggle">
                <button type="button" class="status-btn ok ${part.status === 'OK' ? 'active' : ''}" data-status="OK">
                    <span class="material-icons">check</span>
                </button>
                <button type="button" class="status-btn nok ${part.status === 'NOK' ? 'active' : ''}" data-status="NOK">
                    <span class="material-icons">close</span>
                </button>
            </div>

            <div class="save-indicator">
                <span class="material-icons">check_circle</span>
            </div>

        </div>

        <div class="part-comment-input ${showComment}">
            <input type="text" class="comment-input" placeholder="Comment (reason for shortage/issue)"
                   value="${part.comment || ''}">
        </div>
    </div>`;
}

function updateProgressBadge(checked, total) {
    const badge = document.getElementById('progress-badge');
    badge.style.display = 'inline-block';
    badge.textContent = `${checked} / ${total} checked`;
    badge.style.background = checked === total ? '#D1FAE5' : '#EFF6FF';
    badge.style.color      = checked === total ? '#065F46' : '#1D4ED8';
}

function attachPartCardListeners() {
    document.querySelectorAll('.part-card').forEach(card => {
        const partId       = card.dataset.partId;
        const qtyInput      = card.querySelector('.counted-qty-input');
        const statusBtns    = card.querySelectorAll('.status-btn');
        const commentBlock  = card.querySelector('.part-comment-input');
        const commentInput  = card.querySelector('.comment-input');

        statusBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                statusBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const status = this.dataset.status;
                card.classList.toggle('checked-ok',  status === 'OK');
                card.classList.toggle('checked-nok', status === 'NOK');
                commentBlock.classList.toggle('show', status === 'NOK');

                saveRow(partId, card, status);
            });
        });

        qtyInput.addEventListener('blur', function () {
            const activeBtn = card.querySelector('.status-btn.active');
            if (activeBtn) saveRow(partId, card, activeBtn.dataset.status);
        });

        commentInput.addEventListener('blur', function () {
            const activeBtn = card.querySelector('.status-btn.active');
            if (activeBtn) saveRow(partId, card, activeBtn.dataset.status);
        });
    });
}

function saveRow(partId, card, status) {
    const qty     = card.querySelector('.counted-qty-input').value;
    const comment = card.querySelector('.comment-input').value;
    const requiredQty = card.querySelector('.qty-required').textContent.replace('/', '').trim();

    const currentLotId = $('#lot-select').val();
    const currentCase = $('#case').val();

    // Debug: Log the data being sent
    console.log('Sending data:', {
        part_id: partId,
        lot_id: currentLotId,
        boxcase: currentCase,
        required_qty: requiredQty,
        counted_qty: qty,
        status: status,
        comment: comment,
    });

    fetch(App.routes.partsSaveRow, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value,
        },
        body: JSON.stringify({
            part_id:      partId,
            lot_id:       currentLotId,
            boxcase:      currentCase,
            required_qty: requiredQty,
            counted_qty:  qty,
            status:       status,
            comment:      comment,
        }),
    })
    .then(r => {
        // Log the full response for debugging
        console.log('Response status:', r.status);
        return r.json().then(data => ({ status: r.status, data }));
    })
    .then(({ status, data }) => {
        if (status === 422) {
            console.error('Validation errors:', data.errors);
            throw new Error(Object.values(data.errors).flat().join(', '));
        }
        if (data.error) throw new Error(data.error);
        
        const indicator = card.querySelector('.save-indicator');
        indicator.classList.add('show');
        setTimeout(() => indicator.classList.remove('show'), 1500);

        refreshProgress();
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('danger', 'Error', error.message || 'Failed to save this part.');
    });
}

function refreshProgress() {
    const currentLotId = $('#lot-select').val();
    const total   = document.querySelectorAll('.part-card').length;
    const checked = document.querySelectorAll('.part-card.checked-ok, .part-card.checked-nok').length;
    updateProgressBadge(checked, total);
    renderCaseProgress(checked, total);   // ← add this

    // Refresh lot-wide progress too (cheap call, keeps numbers live)
    if (currentLotId) loadLotProgress(currentLotId);
}
function processScan(scannedCode) {
    const currentLotId = $('#lot-select').val();
    const currentCase = $('#case').val();
    if (!currentLotId || !currentCase) {
        showScanAlert('error', 'Select a case before scanning.');
        return;
    }

    const card = document.querySelector(`.part-card[data-partnum="${scannedCode}"]`);

    if (!card) {
        showScanAlert('error', `Part "${scannedCode}" not found in this case.`);
        playBeep(false);
        return;
    }

    incrementScannedQty(card);
    showScanAlert('success', `Scanned: ${scannedCode}`);
    playBeep(true);
}

function incrementScannedQty(card) {
    const qtyInput   = card.querySelector('.counted-qty-input');
    const requiredQty= parseInt(card.querySelector('.qty-required').textContent.replace('/', '').trim());
    const partId     = card.dataset.partId;

    let currentQty = parseInt(qtyInput.value) || 0;
    currentQty += 1;
    qtyInput.value = currentQty;

    // Visual feedback
    card.classList.remove('scan-flash-ok', 'scan-flash-error', 'overscanned');
    void card.offsetWidth; // restart animation

    if (currentQty === requiredQty) {
        card.classList.add('scan-flash-ok');
        setStatusButton(card, 'OK');
        saveRow(partId, card, 'OK');

    } else if (currentQty > requiredQty) {
        card.classList.add('overscanned');
        showScanAlert('error', `Overscanned! ${currentQty}/${requiredQty} — please review.`);
        // Don't auto-set status — technician must review and decide
        saveRowSilent(partId, card, null); // save qty without forcing a status

    } else {
        card.classList.add('scan-flash-ok');
        // Still under required — update qty but don't force OK/NOK yet
        saveRowSilent(partId, card, null);
    }

    updateScanCountBadge(card, currentQty, requiredQty);
}
function updateScanCountBadge(card, current, required) {
    let badge = card.querySelector('.scan-count-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'scan-count-badge';
        card.querySelector('.qty-input-group').appendChild(badge);
    }
    badge.textContent = `${current}/${required} scanned`;
}

function setStatusButton(card, status) {
    const btns = card.querySelectorAll('.status-btn');
    btns.forEach(b => b.classList.toggle('active', b.dataset.status === status));
    card.classList.toggle('checked-ok',  status === 'OK');
    card.classList.toggle('checked-nok', status === 'NOK');
    card.querySelector('.part-comment-input').classList.toggle('show', status === 'NOK');
}

function saveRowSilent(partId, card, status) {
    const qty     = card.querySelector('.counted-qty-input').value;
    const comment = card.querySelector('.comment-input').value;
    const requiredQty = card.querySelector('.qty-required').textContent.replace('/', '').trim();

    // Determine status: use explicit param, or existing active button, or leave for later
    const activeBtn = card.querySelector('.status-btn.active');
    const finalStatus = status || (activeBtn ? activeBtn.dataset.status : null);

    if (!finalStatus) return; // nothing to save yet — no status decided

    fetch(App.routes.partsSaveRow, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value,
        },
        body: JSON.stringify({
            part_id: partId, lot_id: currentLotId, boxcase: currentCase,
            required_qty: requiredQty, counted_qty: qty,
            status: finalStatus, comment: comment,
        }),
    })
    .then(r => r.json())
    .then(() => refreshProgress())
    .catch(() => {});
}
function showScanAlert(type, message) {
    const alertEl = document.createElement('div');
    alertEl.className = `scan-alert ${type}`;
    alertEl.innerHTML = `
        <span class="material-icons">${type === 'success' ? 'check_circle' : 'error'}</span>
        ${message}`;
    document.body.appendChild(alertEl);
    setTimeout(() => alertEl.remove(), 5000);
}

function playBeep(success) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = success ? 880 : 220;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
}

// Load lot-wide progress — call this when a lot is selected AND after any save
function loadLotProgress(lotId) {
    if (!lotId) {
        document.getElementById('lot-progress-panel').style.display = 'none';
        return;
    }

    fetch(`${App.routes.partsLotProgress}?lot_id=${lotId}`)
        .then(r => r.json())
        .then(data => renderLotProgress(data))
        .catch(() => {});
}

function renderLotProgress(data) {
    const panel = document.getElementById('lot-progress-panel');
    panel.style.display = 'flex';

    document.getElementById('cases-progress-text').textContent =
        `${data.completed_cases} / ${data.total_cases}`;
    document.getElementById('cases-progress-bar').style.width = `${data.cases_percent}%`;

    document.getElementById('parts-progress-text').textContent =
        `${data.checked_parts} / ${data.total_parts}`;
    document.getElementById('parts-progress-bar').style.width = `${data.parts_percent}%`;

    const nokBadge = document.getElementById('lot-nok-badge');
    if (data.nok_parts > 0) {
        nokBadge.style.display = 'flex';
        document.getElementById('lot-nok-count').textContent = data.nok_parts;
    } else {
        nokBadge.style.display = 'none';
    }
}


// Update case-level progress bar — called from renderParts()
function renderCaseProgress(checked, total) {
    const wrap = document.getElementById('case-progress-wrap');
    wrap.style.display = 'block';

    document.getElementById('case-progress-text').textContent = `${checked} / ${total} parts checked`;
    const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
    document.getElementById('case-progress-bar').style.width = `${percent}%`;
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
            $('.close').on('click', function() {
                const alert = $(this).closest('.custom-alert');
                alert.removeClass('show');
                setTimeout(() => {
                    alert.hide();
                }, 500);
            });


let heartbeatInterval = null;
let currentTrackedLotId = null;

function startHeartbeat(lotId) {
    currentTrackedLotId = lotId;

    sendHeartbeat(lotId); // fire immediately

    if (heartbeatInterval) clearInterval(heartbeatInterval);

    heartbeatInterval = setInterval(() => {
        if (currentTrackedLotId) sendHeartbeat(currentTrackedLotId);
    }, 10000); // every 10 seconds
}

function sendHeartbeat(lotId) { 
    fetch(`${App.routes.unboxActivityHeartbeat}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value,
        },
        body: JSON.stringify({ lot_id: lotId }),
    }).catch(() => { /* silent fail — non-critical */ });
}

function endTracking(lotId) {
    if (!lotId) return;

    // Use sendBeacon for reliable delivery even on tab close
    const payload = JSON.stringify({ lot_id: lotId });
    const formData = new FormData();
    formData.append('lot_id', lotId);
    formData.append('_token', document.querySelector('input[name="_token"]').value);

    navigator.sendBeacon(App.routes.unboxActivityEnd, formData);
}
// End tracking when user leaves the page
window.addEventListener('beforeunload', function () {
    if (currentTrackedLotId) {
        endTracking(currentTrackedLotId);
    }
});