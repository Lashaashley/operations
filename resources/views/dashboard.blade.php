<x-custom-admin-layout>



@vite(['resources/css/pages/dashboard.css']) 

<div class="dashboard-page">

    {{-- ── 2FA Security Banner ──────────────────────────────── --}}
    @if(!Auth::user()->google2fa_secret)

    @endif

    {{-- ── Page heading ─────────────────────────────────────── --}}
    <div class="dash-heading">
        <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {{ Auth::user()->name }}. Here's an overview of your payroll.</p>
        </div>
        <div class="dash-date">
            <span class="material-icons">calendar_today</span>
            <span id="dashDate"></span>
        </div>
    </div>

    {{-- ── Stat cards ───────────────────────────────────────── --}}
    <div class="stat-grid">

        {{-- Head count --}}
        <div class="stat-card blue">
            
            
        </div>

        {{-- Branch stats --}}
        <div class="stat-card green">
            
            
        </div>

        {{-- Placeholder card 3 — ready for future metric --}}
        <div class="stat-card purple">
            <div class="stat-card-top">
                <div>
                    <div class="stat-card-label">Payroll Status</div>
                    <div class="stat-card-value" id="dashPayrollStatus">—</div>
                    <div class="stat-card-sub" id="dashPayrollSub">Current period</div>
                </div>
                <div class="stat-icon purple"><span class="material-icons">receipt_long</span></div>
            </div>
        </div>

        {{-- Placeholder card 4 — ready for future metric --}}
        <div class="stat-card amber">
            <div class="stat-card-top">
                <div>
                    <div class="stat-card-label">Period</div>
                    <div class="stat-card-value" id="dashPeriodValue">—</div>
                    <div class="stat-card-sub">Active payroll period</div>
                </div>
                <div class="stat-icon amber"><span class="material-icons">event</span></div>
            </div>
        </div>

    </div>

    {{-- ── Charts ────────────────────────────────────────────── --}}
    

</div>{{-- /dashboard-page --}}

{{-- Data bridge for dash.js — unchanged --}}





</x-custom-admin-layout>