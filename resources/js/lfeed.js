
import { startAuthentication } from '@simplewebauthn/browser';
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
   /*   if (currentTrackedLotId && currentTrackedLotId !== lotId) {
        endTracking(currentTrackedLotId);
    }*/

    if (lotid) { 
        loadcasebylot(lotid);
       // loadLotProgress(lotid);
       // startHeartbeat(lotid);
    } else {
        // Clear lots dropdown
        const $select = $('#station');
        $select.empty().append('<option value="">-- Select a Station --</option>');
          //clearInterval(heartbeatInterval);
          //currentTrackedLotId = null;
        
    }
});

  let currentLotId  = null;
let currentStation = null;
let pendingConfirmRole = null;

$('#station').on('change', function () {
    const station = $(this).val();
    const lotId   = $('#lot-select').val();

    if (!station || !lotId) return;

    currentLotId   = lotId;
    currentStation = station;

    loadPartsForStation(lotId, station);
});

function loadPartsForStation(lotId, station) {
    const container = document.getElementById('parts-container');
    container.innerHTML = `<div class="parts-placeholder">
        <span class="material-icons">hourglass_top</span><p>Loading parts…</p>
    </div>`;

    fetch(`${App.routes.lfeedParts}?lot_id=${lotId}&station=${encodeURIComponent(station)}`)
        .then(r => r.json())
        .then(res => renderStationParts(res))
        .catch(() => {
            container.innerHTML = `<div class="parts-placeholder">
                <span class="material-icons">error</span><p>Failed to load parts.</p>
            </div>`;
        });
}

function renderStationParts(res) {
    const container = document.getElementById('parts-container');

    if (res.data.length === 0) {
        container.innerHTML = `<div class="parts-placeholder">
            <span class="material-icons">inbox</span><p>No parts found for this station.</p>
        </div>`;
        return;
    }

    container.innerHTML = res.data.map(part => buildLineFeedPartCard(part)).join('');

    document.getElementById('confirmation-panel').style.display = 'flex';
    document.getElementById('complete-case-bar').style.display  = 'flex';

    renderConfirmationState(res.confirmation);
    attachLineFeedListeners();       // ← new
}

function attachLineFeedListeners() {
    document.querySelectorAll('#parts-container .part-card').forEach(card => {
        const partId = card.dataset.partId;
        const statusBtns   = card.querySelectorAll('.status-btn');
        const commentBlock = card.querySelector('.part-comment-input');
        const commentInput = card.querySelector('.comment-input');

        statusBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                statusBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const status = this.dataset.status;
                card.classList.toggle('checked-ok',  status === 'OK');
                card.classList.toggle('checked-nok', status === 'NOK');
                commentBlock.classList.toggle('show', status === 'NOK');

                saveLineFeedRow(partId, card, status);
            });
        });

        commentInput.addEventListener('blur', function () {
            const active = card.querySelector('.status-btn.active');
            if (active) saveLineFeedRow(partId, card, active.dataset.status);
        });
    });
}

function saveLineFeedRow(partId, card, status) {
    const comment = card.querySelector('.comment-input').value;

    fetch(App.routes.lfeedSaveRow, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value,
        },
        body: JSON.stringify({
            part_id: partId, lot_id: currentLotId, station: currentStation,
            status: status, comment: comment,
        }),
    })
    .then(r => r.json())
    .then(res => {
        if (res.error) throw new Error(res.error);
        const indicator = card.querySelector('.save-indicator');
        indicator.classList.add('show');
        setTimeout(() => indicator.classList.remove('show'), 1500);
    })
    .catch(() => showToast('danger', 'Error', 'Failed to save this part.'));
}

function buildLineFeedPartCard(part) {
    const short = part.required_qty - part.unboxed_qty;
    const isShort = short > 0;
    const cardClass = part.lf_status === 'NOK' ? 'checked-nok' : 'checked-ok';
    const showComment = part.lf_status === 'NOK' ? 'show' : '';

    return `
    <div class="part-card ${cardClass}" data-part-id="${part.part_id}">
        <div class="part-card-main" style="grid-template-columns: 1fr 80px 80px 90px 20px;">
            <div class="part-info">
                <div class="part-num">${part.partnum}</div>
                <div class="part-desc">${part.partdesc}</div>
                ${part.unbox_status === 'NOK'
                    ? `<div style="font-size:9px; color:#991B1B; margin-top:2px;">
                         ⚠ Unboxing flagged: ${part.unbox_comment ?? 'issue noted'}
                       </div>`
                    : ''}
            </div>

            <div style="text-align:center;">
                <div style="font-size:9px; color:var(--muted); text-transform:uppercase;">Required</div>
                <div style="font-size:14px; font-weight:700;">${part.required_qty}</div>
            </div>

            <div style="text-align:center;">
                <div style="font-size:9px; color:var(--muted); text-transform:uppercase;">Unboxed</div>
                <div style="font-size:14px; font-weight:700; color:${isShort ? '#DC2626' : '#059669'};">
                    ${part.unboxed_qty}
                </div>
            </div>

            <!-- Line feeding's own OK/NOK toggle -->
            <div class="status-toggle-group">
                <button type="button" class="status-btn ok ${part.lf_status === 'OK' ? 'active' : ''}" data-status="OK">
                    <span class="material-icons">check</span>
                </button>
                <button type="button" class="status-btn nok ${part.lf_status === 'NOK' ? 'active' : ''}" data-status="NOK">
                    <span class="material-icons">close</span>
                </button>
            </div>

            <div class="save-indicator">
                <span class="material-icons">check_circle</span>
            </div>
        </div>

        <div class="part-comment-input ${showComment}">
            <input type="text" class="comment-input" placeholder="Comment (describe the issue found now)"
                   value="${part.lf_comment || ''}">
        </div>
    </div>`;
}

function renderConfirmationState(conf) {
    updateSlot('logistics', conf.logistics_confirmed, conf.logistics_tech_name, conf.logistics_confirmed_at);
    updateSlot('assembly',  conf.assembly_confirmed,  conf.assembly_tech_name,  conf.assembly_confirmed_at);

    const completeBtn = document.getElementById('btn-complete-case');

    if (conf.is_completed) {
        completeBtn.disabled = true;
        completeBtn.innerHTML = '<span class="material-icons">check_circle</span> Station Completed';
    } else {
        completeBtn.disabled = !(conf.logistics_confirmed && conf.assembly_confirmed);
        completeBtn.innerHTML = '<span class="material-icons">task_alt</span> Complete Station';
    }
}

function updateSlot(role, confirmed, name, confirmedAt) {
    const slot   = document.getElementById(`${role}-slot`);
    const status = document.getElementById(`${role}-status`);
    const btn    = slot.querySelector('.btn-confirm-tech');

    if (confirmed) {
        slot.classList.add('confirmed');
        status.textContent = `Confirmed by ${name}`;
        btn.disabled = true;
        btn.innerHTML = '<span class="material-icons">check</span> Confirmed';
    } else {
        slot.classList.remove('confirmed');
        status.textContent = 'Not confirmed';
        btn.disabled = false;
        btn.innerHTML = '<span class="material-icons">fingerprint</span> Confirm';
    }
}


// ── Confirm button opens draft modal ──
document.getElementById('confirmation-panel').addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-confirm-tech');
    if (!btn || btn.disabled) return;

    pendingConfirmRole = btn.dataset.role;
    runFingerprintConfirmation(pendingConfirmRole);
});

async function runFingerprintConfirmation(role) {
    const statusText = document.getElementById('confirm-status-text');

    document.getElementById('confirm-modal-title').textContent =
        `Confirm as ${role === 'logistics' ? 'Logistics' : 'Assembly'} Technician`;
    statusText.textContent = 'Place your finger on the scanner...';
    document.getElementById('confirmModalBackdrop').style.display = 'flex';

    try {
        const optionsResponse = await fetch(App.routes.fingerprintStationChallenge, {
            method: 'GET',
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
        });
        if (!optionsResponse.ok) throw new Error('Failed to get challenge');
        const options = await optionsResponse.json();

        const authenticationResponse = await startAuthentication({ optionsJSON: options });

        statusText.textContent = 'Verifying...';

        const verifyResponse = await fetch(App.routes.lfeedConfirm, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value,
            },
            body: JSON.stringify({
                lot_id: currentLotId,
                station: currentStation,
                role: role,
                options: JSON.stringify(options),
                passkey: JSON.stringify(authenticationResponse),
            }),
        });

        const res = await verifyResponse.json();

        if (res.error) {
            statusText.textContent = res.error;
            return;
        }

        document.getElementById('confirmModalBackdrop').style.display = 'none';
        showToast('success', 'Confirmed', `${res.confirmed_name} confirmed as ${res.role}.`);
        loadPartsForStation(currentLotId, currentStation);
    } catch (error) {
        console.error(error);
        let msg = 'Fingerprint confirmation failed. Please try again.';
        if (error.name === 'NotAllowedError') msg = 'Scan cancelled or timed out.';
        statusText.textContent = msg;
    }
}


document.getElementById('confirmModalCancel').addEventListener('click', closeConfirmModal);
document.getElementById('confirmModalClose').addEventListener('click', closeConfirmModal);
function closeConfirmModal() {
    document.getElementById('confirmModalBackdrop').style.display = 'none';
}


// ── Complete Station ──
document.getElementById('btn-complete-case').addEventListener('click', function () {
    if (!currentLotId || !currentStation) return;

    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<span class="material-icons">hourglass_top</span> Completing…';

    fetch(App.routes.lfeedComplete, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('input[name="_token"]').value,
        },
        body: JSON.stringify({ lot_id: currentLotId, station: currentStation }),
    })
    .then(r => r.json())
    .then(res => {
        if (res.error) throw new Error(res.error);

        showToast('success', 'Station Completed', res.message);
        btn.innerHTML = '<span class="material-icons">check_circle</span> Station Completed';
        // Optionally auto-advance to next station in the dropdown here
    })
    .catch(err => {
        showToast('danger', 'Error', err.message || 'Failed to complete station.');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-icons">task_alt</span> Complete Station';
    });
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
          url: App.routes.stationsbylot,
          type: "GET",
          data: { lotid: lotid },
          success: function (response) {
            const dropdown = $('#station');
            dropdown.empty();
            dropdown.append('<option value="">Select Station</option>');
            

            response.data.forEach(function (stations) {
                const $option = $('<option>')
                .val(stations.station)           
                .text(stations.station); 
                dropdown.append($option);
            });
          },
          error: function () {
            alert('Failed to load Station. Please try again.');
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
            $('.close').on('click', function() {
                const alert = $(this).closest('.custom-alert');
                alert.removeClass('show');
                setTimeout(() => {
                    alert.hide();
                }, 500);
            });