let activeStartTimes = {}; // id -> Date object, for live ticking
let tickInterval = null;

function loadActivity() {
    fetch(App.routes.lotActivityList)
        .then(r => r.json())
        .then(data => renderActivity(data))
        .catch(() => {});
}

function renderActivity(data) {
    // Summary stats
    document.getElementById('stat-active-count').textContent = data.summary.active_count;
    document.getElementById('stat-active-lots').textContent  = data.summary.distinct_lots;
    document.getElementById('stat-longest').textContent = data.summary.longest_running
        ? formatElapsed(new Date(data.summary.longest_running))
        : '—';

    renderActiveGroups(data.active_grouped);
    renderHistory(data.history);

    // Rebuild live-tick map
    activeStartTimes = {};
    data.active.forEach(a => {
        activeStartTimes[a.id] = new Date(a.started_at_iso);
    });
}

function renderActiveGroups(grouped) {
    const container = document.getElementById('active-groups-container');

    const actionNames = Object.keys(grouped || {});

    if (actionNames.length === 0) {
        container.innerHTML = `<div class="wh-empty-state">
            <span class="material-icons">bedtime</span>
            <p>No activity right now — the floor is quiet.</p>
        </div>`;
        return;
    }

    container.innerHTML = actionNames.map(action => {
        const items = grouped[action];
        return `
        <div class="action-group">
            <div class="action-group-header">
                <span class="material-icons">bolt</span>
                ${action}
                <span class="action-group-count">${items.length} active</span>
            </div>
            <div class="activity-cards-grid">
                ${items.map(item => buildActivityCard(item)).join('')}
            </div>
        </div>`;
    }).join('');
}

function buildActivityCard(item) {
    const initials = item.user.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return `
    <div class="activity-card" data-id="${item.id}">
        <div class="activity-card-top">
            <div class="activity-avatar">${initials}</div>
            <div>
                <div class="activity-user-name">${item.user}</div>
                <div class="activity-lot-tag">
                    <span class="material-icons" style="font-size:12px;">local_shipping</span>
                    Lot ${item.lotnum}
                </div>
            </div>
        </div>
        <div class="activity-timer">
            <div>
                <div class="activity-timer-value" id="timer-${item.id}">--:--</div>
                <div class="activity-timer-label">Elapsed</div>
            </div>
            <div class="live-tag"><span class="pulse-dot"></span> Live</div>
        </div>
    </div>`;
}

function renderHistory(history) {
    const tbody = document.getElementById('history-tbody');

    if (history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="wh-loading-row">No recent activity.</td></tr>`;
        return;
    }

    tbody.innerHTML = history.map(h => `
        <tr>
            <td>${h.user}</td>
            <td>${h.action}</td>
            <td>${h.lotnum}</td>
            <td>${formatDateTime(h.started_at)}</td>
            <td>${formatDateTime(h.ended_at)}</td>
            <td class="duration-cell">${h.duration}</td>
        </tr>
    `).join('');
}

// ── Live ticking ────────────────────────────────────────────
function tickTimers() {
    Object.entries(activeStartTimes).forEach(([id, startTime]) => {
        const el = document.getElementById(`timer-${id}`);
        if (el) el.textContent = formatElapsed(startTime);
    });
}

function formatElapsed(startTime) {
    const now = new Date();
    const diffMs = now - startTime;
    const totalSeconds = Math.floor(diffMs / 1000);

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function formatDateTime(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
}

// ── Init ──────────────────────────────────────────────────
loadActivity();
setInterval(loadActivity, 12000);  // refresh data every 12s
setInterval(tickTimers, 1000);     // tick the visible timers every second