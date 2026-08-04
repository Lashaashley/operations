// ── Scanner detection (same pattern as unboxing page) ────────────
let scanBuffer = '';
let lastKeyTime = 0;

document.addEventListener('keydown', function (e) {
    const activeTag = document.activeElement.tagName;
    const isFormField = ['INPUT', 'SELECT', 'TEXTAREA'].includes(activeTag);

    if (isFormField) return; // let manual input field work normally

    const now = Date.now();
    const gap = now - lastKeyTime;
    lastKeyTime = now;

    if (e.key === 'Enter') {
        if (scanBuffer.length > 2) identifyPart(scanBuffer.trim());
        scanBuffer = '';
        return;
    }

    if (gap > 300) scanBuffer = '';

    if (e.key.length === 1) scanBuffer += e.key;
});

// Manual entry fallback
document.getElementById('manual-partnum').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const value = this.value.trim();
        if (value) {
            identifyPart(value);
            this.value = '';
        }
    }
});


// ── Lookup + render ────────────────────────────────────────────
function identifyPart(partnum) {
    const resultArea = document.getElementById('identify-result');
    resultArea.innerHTML = `<div class="identify-placeholder">
        <span class="material-icons">hourglass_top</span><p>Looking up ${partnum}…</p>
    </div>`;

    setScannerStatus('searching', `Looking up ${partnum}…`);

    fetch(`${App.routes.partsIdentify}?partnum=${encodeURIComponent(partnum)}`)
        .then(r => r.json())
        .then(res => {
            if (!res.found) {
                renderNotFound(res.message);
                setScannerStatus('error', 'Part not found');
                return;
            }
            renderIdentifyResult(res);
            setScannerStatus('success', `Found: ${res.partnum}`);
        })
        .catch(() => {
            renderNotFound('Something went wrong while searching.');
            setScannerStatus('error', 'Lookup failed');
        });
}

function setScannerStatus(type, text) {
    const el = document.getElementById('scanner-status');
    const label = document.getElementById('scanner-status-text');
    label.textContent = text;

    el.classList.remove('listening');
    el.style.background = type === 'success' ? '#ECFDF5' : type === 'error' ? '#FEF2F2' : '#EFF6FF';
    el.style.color      = type === 'success' ? '#065F46' : type === 'error' ? '#991B1B' : '#1D4ED8';

    setTimeout(() => {
        el.classList.add('listening');
        el.style.background = '#EFF6FF';
        el.style.color = '#1D4ED8';
        label.textContent = 'Ready — scan a part';
    }, 2500);
}

function renderNotFound(message) {
    document.getElementById('identify-result').innerHTML = `
        <div class="identify-not-found">
            <span class="material-icons">search_off</span>
            <p>${message}</p>
        </div>`;
}

function renderIdentifyResult(res) {
    const firstMatch = res.data[0];

    const lotCards = res.data.map(lot => {
        let statusClass = 'pending';
        let statusLabel = 'Not Yet Checked';

        if (lot.is_checked) {
            statusClass = lot.status === 'OK' ? 'ok' : 'nok';
            statusLabel = lot.status;
        }

        const cardClass = lot.status === 'NOK' ? 'has-nok' : lot.status === 'OK' ? 'checked-ok' : '';

        return `
        <div class="lot-match-card ${cardClass}">
            <div class="lot-match-top">
                <div class="lot-num-tag">
                    <span class="material-icons">local_shipping</span>
                    Lot: ${lot.lotnum ?? '—'}
                </div>
                <span class="status-pill ${statusClass}">${statusLabel}</span>
            </div>

            <div class="lot-match-details">
                <div class="lmd-item">
                    <div class="lmd-label">Customer</div>
                    <div class="lmd-value">${lot.customer ?? '—'}</div>
                </div>
                <div class="lmd-item">
                    <div class="lmd-label">Model</div>
                    <div class="lmd-value">${lot.model ?? '—'}</div>
                </div>
                <div class="lmd-item">
                    <div class="lmd-label">Case</div>
                    <div class="lmd-value">${lot.boxcase ?? '—'}</div>
                </div>
                <div class="lmd-item">
                    <div class="lmd-label">Qty Required</div>
                    <div class="lmd-value">${lot.required_qty ?? '—'}</div>
                </div>
            </div>

            ${lot.is_checked ? `
            <div class="lot-match-details" style="margin-top:8px;">
                <div class="lmd-item">
                    <div class="lmd-label">Qty Counted</div>
                    <div class="lmd-value">${lot.counted_qty ?? '—'}</div>
                </div>
                <div class="lmd-item">
                    <div class="lmd-label">Checked By</div>
                    <div class="lmd-value">${lot.checked_by ?? '—'}</div>
                </div>
                <div class="lmd-item" style="grid-column: span 2;">
                    <div class="lmd-label">Checked At</div>
                    <div class="lmd-value">${lot.checked_at ?? '—'}</div>
                </div>
            </div>` : ''}

            ${lot.status === 'NOK' && lot.comment ? `
            <div class="lot-match-comment">
                <strong>Issue:</strong> ${lot.comment}
            </div>` : ''}
        </div>`;
    }).join('');

    document.getElementById('identify-result').innerHTML = `
        <div class="identify-card">
            <div class="identify-header">
                <div>
                    <div class="identify-partnum">${firstMatch.partnum}</div>
                    <div class="identify-partdesc">${firstMatch.partdesc}</div>
                </div>
                <div class="identify-station-badge">
                    <span class="material-icons">precision_manufacturing</span>
                    ${firstMatch.station}
                </div>
            </div>

            <div class="lot-match-list">
                ${lotCards}
            </div>
        </div>`;
}