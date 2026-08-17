document.getElementById('dashDate').textContent =
    new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

let feedStartTimes = {};

function loadDashboard() {
    fetch(App.routes.dashboardData)
        .then(r => r.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            renderStats(data.stats);
            renderStatusChart(data.status_chart);
            renderActivityChart(data.activity_chart);
            renderNokChart(data.nok_chart);
            renderTodayFeed(data.today_activity);
        })
        .catch(() => {});
}

function renderStats(stats) {
    document.getElementById('stat-my-active').textContent = stats.my_active_count;
    document.getElementById('stat-lots-plant').textContent = stats.lots_in_plant;
    document.getElementById('stat-nok').textContent = stats.total_nok;
    document.getElementById('stat-pending-stations').textContent = stats.pending_stations;
}

// ── Chart 1: Lots by Current Station (donut) ──────────────────
function renderStatusChart(data) {
    Highcharts.chart('chart-status-distribution', {
        chart: { type: 'pie', height: 260 },
        title: { text: null },
        credits: { enabled: false },
        tooltip: { pointFormat: '<b>{point.y}</b> lot(s) ({point.percentage:.0f}%)' },
        plotOptions: {
            pie: {
                innerSize: '65%',
                dataLabels: { enabled: true, format: '{point.name}: {point.y}', style: { fontSize: '10px' } }
            }
        },
        series: [{ name: 'Lots', data: data }]
    });
}

// ── Chart 2: My Activity — Last 7 Days (stacked column) ────────
function renderActivityChart(data) {
    Highcharts.chart('chart-my-activity', {
        chart: { type: 'column', height: 260 },
        title: { text: null },
        credits: { enabled: false },
        xAxis: { categories: data.map(d => d.day) },
        yAxis: { title: { text: null }, allowDecimals: false },
        legend: { align: 'center', verticalAlign: 'bottom' },
        plotOptions: { column: { stacking: 'normal' } },
        series: [
            { name: 'Unboxing', data: data.map(d => d.unboxing), color: '#3B82F6' },
            { name: 'Line Feeding', data: data.map(d => d.linefeeding), color: '#10B981' },
        ]
    });
}

// ── Chart 3: NOK Issues by Station (bar) ───────────────────────
function renderNokChart(data) {
    Highcharts.chart('chart-nok-station', {
        chart: { type: 'bar', height: 280 },
        title: { text: null },
        credits: { enabled: false },
        xAxis: { categories: data.map(d => d.station), title: { text: null } },
        yAxis: { title: { text: null }, allowDecimals: false },
        legend: { enabled: false },
        series: [{
            name: 'NOK Issues',
            data: data.map(d => d.total),
            color: '#EF4444'
        }]
    });
}

// ── Live floor feed with ticking elapsed time ──────────────────
function renderTodayFeed(items) {
    const container = document.getElementById('today-activity-feed');

    if (items.length === 0) {
        container.innerHTML = '<p class="feed-empty">No one is currently active on the floor.</p>';
        return;
    }

    feedStartTimes = {};

    container.innerHTML = items.map((item, i) => {
        const initials = item.user.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        feedStartTimes[i] = new Date(item.started_at_iso);

        return `
        <div class="feed-item">
            <div class="feed-avatar">${initials}</div>
            <div class="feed-text">
                <strong>${item.user}</strong> is ${item.action.toLowerCase()} on Lot ${item.lotnum}
            </div>
            <div class="feed-time" id="feed-time-${i}">--</div>
        </div>`;
    }).join('');

    tickFeedTimers();
}

function tickFeedTimers() {
    Object.entries(feedStartTimes).forEach(([i, start]) => {
        const el = document.getElementById(`feed-time-${i}`);
        if (!el) return;
        const seconds = Math.floor((new Date() - start) / 1000);
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        el.textContent = m > 0 ? `${m}m ago` : `${s}s ago`;
    });
}

// ── Init ──────────────────────────────────────────────────────
loadDashboard();
setInterval(loadDashboard, 20000); // refresh every 20s
setInterval(tickFeedTimers, 1000); // tick times every second

function renderResumeCard(resume) {
    const card = document.getElementById('resume-card');

    if (!resume) {
        card.style.display = 'none';
        return;
    }

    card.style.display = 'flex';

    if (resume.type === 'unboxing') {
        document.getElementById('resume-title').textContent =
            `Unboxing — Lot ${resume.lotnum}, Case ${resume.boxcase}`;

        document.getElementById('resume-btn').href =
            `${App.routes.unboxPage}?lot_id=${resume.lot_id}&boxcase=${encodeURIComponent(resume.boxcase)}`;

    } else {
        document.getElementById('resume-title').textContent =
            `Line Feeding — Lot ${resume.lotnum}, Station ${resume.station}`;

        document.getElementById('resume-btn').href =
            `${App.routes.lfeedPage}?lot_id=${resume.lot_id}&station=${encodeURIComponent(resume.station)}`;
    }

    document.getElementById('resume-progress-text').textContent = resume.progress;
    document.getElementById('resume-progress-bar').style.width = `${resume.percent}%`;
}