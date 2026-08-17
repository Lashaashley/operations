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


// ── Predictive search on manual-partnum ─────────────────────────
let suggestionDebounce = null;
let suggestionSelectedIndex = -1;
let currentSuggestions = [];

const manualInput = document.getElementById('manual-partnum');
const suggestionsBox = document.getElementById('suggestions-dropdown');

manualInput.addEventListener('input', function () {
    const query = this.value.trim();

    clearTimeout(suggestionDebounce);
    suggestionSelectedIndex = -1;

    if (query.length < 2) {
        suggestionsBox.style.display = 'none';
        return;
    }

    // Debounce so we don't fire a request per keystroke
    suggestionDebounce = setTimeout(() => fetchSuggestions(query), 250);
});

function fetchSuggestions(query) {
    fetch(`${App.routes.partsSuggestions}?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(res => renderSuggestions(res.data))
        .catch(() => { suggestionsBox.style.display = 'none'; });
}

function renderSuggestions(suggestions) {
    currentSuggestions = suggestions;

    if (suggestions.length === 0) {
        suggestionsBox.innerHTML = `<div class="suggestions-empty">No matching parts found.</div>`;
        suggestionsBox.style.display = 'block';
        return;
    }

    suggestionsBox.innerHTML = suggestions.map((s, i) => `
        <div class="suggestion-item" data-index="${i}" data-partnum="${s.partnum}">
            <div class="suggestion-main">
                <div class="suggestion-desc">${s.partdesc}</div>
                <div class="suggestion-partnum">${s.partnum}</div>
            </div>
            <span class="suggestion-model-tag">${s.model ?? '—'}</span>
        </div>
    `).join('');

    suggestionsBox.style.display = 'block';

    suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', function () {
            const partnum = this.dataset.partnum;
            manualInput.value = partnum;
            suggestionsBox.style.display = 'none';
            identifyPart(partnum);
        });
    });
}

// Keyboard navigation through suggestions
manualInput.addEventListener('keydown', function (e) {
    const items = suggestionsBox.querySelectorAll('.suggestion-item');

    if (suggestionsBox.style.display === 'block' && items.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            suggestionSelectedIndex = Math.min(suggestionSelectedIndex + 1, items.length - 1);
            highlightSuggestion(items);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            suggestionSelectedIndex = Math.max(suggestionSelectedIndex - 1, 0);
            highlightSuggestion(items);
            return;
        }
        if (e.key === 'Enter' && suggestionSelectedIndex >= 0) {
            e.preventDefault();
            items[suggestionSelectedIndex].click();
            return;
        }
        if (e.key === 'Escape') {
            suggestionsBox.style.display = 'none';
            return;
        }
    }

    // Original Enter behavior — direct part number lookup when no suggestion selected
    if (e.key === 'Enter' && suggestionSelectedIndex === -1) {
        e.preventDefault();
        const value = this.value.trim();
        if (value) {
            suggestionsBox.style.display = 'none';
            identifyPart(value);
            this.value = '';
        }
    }
});

function highlightSuggestion(items) {
    items.forEach((item, i) => {
        item.style.background = i === suggestionSelectedIndex ? '#EEF2FF' : '';
    });
}

// Close suggestions when clicking outside
document.addEventListener('click', function (e) {
    if (!e.target.closest('.manual-entry-wrap')) {
        suggestionsBox.style.display = 'none';
    }
});


// ── Find Case ────────────────────────────────────────────────
document.getElementById('find-case-btn').addEventListener('click', findCase);
document.getElementById('find-case-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        findCase();
    }
});

function findCase() {
    const caseno = document.getElementById('find-case-input').value.trim();
    if (!caseno) return;

    const resultArea = document.getElementById('identify-result');
    resultArea.innerHTML = `<div class="identify-placeholder">
        <span class="material-icons">hourglass_top</span><p>Looking up case ${caseno}…</p>
    </div>`;

    fetch(`${App.routes.partsFindCase}?caseno=${encodeURIComponent(caseno)}`)
        .then(r => r.json())
        .then(res => {
            if (!res.found) {
                renderNotFound(res.message);
                return;
            }
            renderCaseResult(res.data);
        })
        .catch(() => renderNotFound('Something went wrong while searching.'));
}

function renderCaseResult(matches) {
    const cards = matches.map(m => `
        <div class="lot-match-card">
            <div class="lot-match-top">
                <div class="lot-num-tag">
                    <span class="material-icons">local_shipping</span>
                    Lot: ${m.lotnum ?? '—'} &nbsp;·&nbsp; Container: ${m.containerno ?? '—'}
                </div>
                <span class="case-zone-badge">
                    <span class="material-icons" style="font-size:16px;">place</span>
                    ${m.zone}
                </span>
            </div>

            <div class="lot-match-details">
                <div class="lmd-item">
                    <div class="lmd-label">Customer</div>
                    <div class="lmd-value">${m.customer ?? '—'}</div>
                </div>
                <div class="lmd-item">
                    <div class="lmd-label">Model</div>
                    <div class="lmd-value">${m.model ?? '—'}</div>
                </div>
                <div class="lmd-item">
                    <div class="lmd-label">Case No</div>
                    <div class="lmd-value">${m.caseno}</div>
                </div>
                <div class="lmd-item">
                    <div class="lmd-label">Status</div>
                    <div class="lmd-value">${m.status ?? '—'}</div>
                </div>
            </div>

            ${m.comment ? `<div class="lot-match-comment"><strong>Comment:</strong> ${m.comment}</div>` : ''}
        </div>
    `).join('');

    document.getElementById('identify-result').innerHTML = `
        <div class="identify-card">
            <div class="identify-header">
                <div>
                    <div class="identify-partnum">Case Lookup</div>
                    <div class="identify-partdesc">${matches.length} match(es) found</div>
                </div>
            </div>
            <div class="lot-match-list">${cards}</div>
        </div>`;
}