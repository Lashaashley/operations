<x-custom-admin-layout>

@vite(['resources/css/pages/dashboard.css'])

<div class="dashboard-page">

    @if(!Auth::user()->google2fa_secret)
    @endif

    <div class="dash-heading">
        <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {{ Auth::user()->name }}. Here's what's happening on the floor.</p>
        </div>
        <div class="dash-date">
            <span class="material-icons">calendar_today</span>
            <span id="dashDate"></span>
        </div>
    </div>
    <!-- Continue where you left off -->
<div class="resume-card" id="resume-card" style="display:none;">
    <div class="resume-card-icon">
        <span class="material-icons">history</span>
    </div>
    <div class="resume-card-body">
        <div class="resume-card-label">Continue where you left off</div>
        <div class="resume-card-title" id="resume-title">—</div>
        <div class="resume-card-progress-wrap">
            <div class="progress-bar-track small">
                <div class="progress-bar-fill" id="resume-progress-bar" style="width:0%; background:#4F46E5;"></div>
            </div>
            <span class="resume-progress-text" id="resume-progress-text">—</span>
        </div>
    </div>
    <a href="#" class="btn btn-save resume-btn" id="resume-btn">
        <span class="material-icons">play_arrow</span> Resume
    </a>
</div>

    {{-- ── Stat cards ───────────────────────────────────────── --}}
    <div class="stat-grid">

        <div class="stat-card blue">
            <div class="stat-card-top">
                <div>
                    <div class="stat-card-label">My Active Work</div>
                    <div class="stat-card-value" id="stat-my-active">—</div>
                    <div class="stat-card-sub">lot(s) currently tracked to you</div>
                </div>
                <div class="stat-icon blue"><span class="material-icons">person_pin_circle</span></div>
            </div>
        </div>

        <div class="stat-card green">
            <div class="stat-card-top">
                <div>
                    <div class="stat-card-label">Kits In Plant</div>
                    <div class="stat-card-value" id="stat-lots-plant">—</div>
                    <div class="stat-card-sub">across all stages</div>
                </div>
                <div class="stat-icon green"><span class="material-icons">local_shipping</span></div>
            </div>
        </div>

        <div class="stat-card purple">
            <div class="stat-card-top">
                <div>
                    <div class="stat-card-label">Flagged Issues</div>
                    <div class="stat-card-value" id="stat-nok">—</div>
                    <div class="stat-card-sub">NOK across unboxing &amp; line feeding</div>
                </div>
                <div class="stat-icon purple"><span class="material-icons">report_problem</span></div>
            </div>
        </div>

        <div class="stat-card amber">
            <div class="stat-card-top">
                <div>
                    <div class="stat-card-label">Pending Stations</div>
                    <div class="stat-card-value" id="stat-pending-stations">—</div>
                    <div class="stat-card-sub">not yet completed</div>
                </div>
                <div class="stat-icon amber"><span class="material-icons">event</span></div>
            </div>
        </div>

    </div>

    {{-- ── Charts ────────────────────────────────────────────── --}}
    <div class="chart-grid">

        <div class="chart-card">
            <div class="chart-card-head">
                <h3>Kits by Current Station</h3>
            </div>
            <div id="chart-status-distribution" class="chart-container"></div>
        </div>

        <div class="chart-card">
            <div class="chart-card-head">
                <h3>My Activity — Last 7 Days</h3>
            </div>
            <div id="chart-my-activity" class="chart-container"></div>
        </div>

        <div class="chart-card wide">
            <div class="chart-card-head">
                <h3>Flagged Issues by Station</h3>
            </div>
            <div id="chart-nok-station" class="chart-container"></div>
        </div>

        <div class="chart-card wide">
            <div class="chart-card-head">
                <h3>Live on the Floor</h3>
                <span class="chart-card-link">See all →</span>
            </div>
            <div id="today-activity-feed" class="activity-feed">
                <p class="feed-empty">Loading…</p>
            </div>
        </div>

    </div>

</div>

<!-- Highcharts -->
<script src="https://code.highcharts.com/highcharts.js"></script>

@vite(['resources/js/dashboard.js'])

</x-custom-admin-layout>