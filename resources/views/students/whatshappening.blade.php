<x-custom-admin-layout>
@vite(['resources/css/pages/whatshappening.css'])

<div class="user-create-page">

    <div class="page-heading">
        <h1>What's Happening</h1>
        <p>Live view of activity on the floor.</p>
    </div>

    <div class="toast-wrap" id="toastWrap"></div>

    <!-- Summary stat cards -->
    <div class="wh-summary-row">
        <div class="wh-stat-card">
            <span class="material-icons">groups</span>
            <div>
                <div class="wh-stat-num" id="stat-active-count">0</div>
                <div class="wh-stat-label">Active Technicians</div>
            </div>
        </div>
        <div class="wh-stat-card">
            <span class="material-icons">local_shipping</span>
            <div>
                <div class="wh-stat-num" id="stat-active-lots">0</div>
                <div class="wh-stat-label">Kits In Progress</div>
            </div>
        </div>
        <div class="wh-stat-card longest">
            <span class="material-icons">schedule</span>
            <div>
                <div class="wh-stat-num" id="stat-longest">—</div>
                <div class="wh-stat-label">Longest Running</div>
            </div>
        </div>
        <div class="wh-live-indicator">
            <span class="pulse-dot"></span> Live
        </div>
    </div>

    <!-- Active activity, grouped by action -->
    <div id="active-groups-container">
        <div class="wh-empty-state">
            <span class="material-icons">hourglass_empty</span>
            <p>Loading current activity…</p>
        </div>
    </div>

    <!-- History table -->
    <div class="form-card" style="margin-top:24px;">
        <div class="section-head">
            <div class="section-icon"><span class="material-icons">history</span></div>
            <h2 class="section-title">Recent Activity</h2>
        </div>

        <div class="wh-history-table-wrap">
            <table class="wh-history-table">
                <thead>
                    <tr>
                        <th>Technician</th>
                        <th>Action</th>
                        <th>Lot</th>
                        <th>Started</th>
                        <th>Ended</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody id="history-tbody">
                    <tr><td colspan="6" class="wh-loading-row">Loading…</td></tr>
                </tbody>
            </table>
        </div>
    </div>

</div>

@vite(['resources/js/whatshappening.js'])

</x-custom-admin-layout>