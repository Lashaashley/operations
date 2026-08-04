<x-custom-admin-layout>
<head>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @vite(['resources/css/pages/recreports.css'])
</head>
 
<div class="reports-page">
 
    <div class="page-heading">
        <h1>Receiving Reports</h1>
        
    </div>
 
    <div class="toast-wrap" id="toastWrap"></div>
 
    @if(session('success'))
        <div class="locked-banner backver">
            <span class="material-icons versuccess">check_circle</span>
            <span>{{ session('success') }}</span>
        </div>
    @endif
 
    
 
    {{-- ── Tab bar ──────────────────────────────────────────── --}}
    <div class="tab-bar" id="tabBar">
        <button class="tab-btn active" data-tab="deductions">
            <span class="material-icons">select_all</span> Per Lot
        </button>
        <button class="tab-btn" data-tab="summaries" id="summaries-tab">
            <span class="material-icons">summarize</span> Summaries
        </button>
        <button class="tab-btn" data-tab="overview" id="overview-tab">
            <span class="material-icons">bar_chart</span> Overview
        </button>
        <button class="tab-btn" data-tab="variance" id="variance-tab">
            <span class="material-icons">compare_arrows</span> Variance Reports
        </button>
      
    </div>
 
    {{-- ── Tab body ─────────────────────────────────────────── --}}
    <div class="tab-body">
 
       
        <div class="tab-panel active" id="panel-deductions">
            <div class="report-section">
                <div class="report-section-head">
                    <div class="rs-icon"><span class="material-icons">polymer</span></div>
                    General Kits Recieving Report
                </div>
                <div class="report-section-body">
                    <div class="filter-row">
                        <div class="filter-field minwidth20">
                            <label>Customer</label>
                            <div class="select-wrap">
                                <select name="customer" id="customer" required>
                                    <option value="">Select Customer</option>
                                </select>
                            </div>
                        </div>
                        <div class="filter-field">
                            <label>Model</label>
                            <div class="select-wrap">
                                <select name="model" id="model" required>
                                    <option value="">Select Model</option>
                                </select>
                            </div>
                        </div>
                        <div class="filter-field">
                            <label>Lot Number</label>
                            <div class="select-wrap">
                                 <select id="lot-select" name="lot_id" style="width:100%">
                                    <option value="">-- Select a Lot --</option>
                                </select>
                            </div>
                        </div>
                        <button class="btn btn-view view-rpt" id="viewrpt">
                            <span class="material-icons">visibility</span> View
                        </button>
                    </div>
                </div>
            </div>
            <div class="report-section">
    <div class="report-section-head">
        <div class="rs-icon"><span class="material-icons">inventory_2</span></div>
        Kits Inventory Report
    </div>
    <div class="report-section-body">
        <div class="filter-row">
            <div class="filter-field minwidth20">
                <label>Customer</label>
                <div class="select-wrap">
                    <select name="customer" id="ki-customer">
                        <option value="">All Customers</option>
                    </select>
                </div>
            </div>
            <div class="filter-field">
                <label>Model</label>
                <div class="select-wrap">
                    <select name="model" id="ki-model">
                        <option value="">All Models</option>
                    </select>
                </div>
            </div>

            <div class="filter-field toggle-field">
                <label>Include Individual Units</label>
                <label class="status-toggle" title="Include chassis/engine numbers">
                    <input type="checkbox" id="ki-include-units">
                    <span class="toggle-track">
                        <span class="toggle-thumb"></span>
                        <span class="toggle-label-ok">YES</span>
                        <span class="toggle-label-nok">NO</span>
                    </span>
                </label>
            </div>

            <button class="btn btn-view view-rpt" id="viewkitsrpt">
                <span class="material-icons">visibility</span> View
            </button>
        </div>
    </div>
</div>
        </div>
 
      
 
       
 
    </div>{{-- /tab-body --}}
</div>{{-- /reports-page --}}
 
{{-- ── Progress modal (download) ────────────────────────────── --}}
<div class="progress-modal-backdrop" id="progress-modal">
    <div class="progress-modal-card">
        <h3>Downloading…</h3>
        <p id="progress-message">Preparing your file.</p>
        <div class="progress-track">
            <div class="progress-fill" id="progress-bar"></div>
        </div>
    </div>
</div>


<div class="pdf-modal-backdrop" id="pdfModalBackdrop">
    <div class="pdf-modal-card">
        <div class="pdf-modal-header">
            <div class="pdf-modal-icon">
                <span class="material-icons">picture_as_pdf</span>
            </div>
            <span class="pdf-modal-title" id="pdf-modal-title">
                Receiving Report
            </span>
            <div class="pdf-modal-actions">
                <button class="btn-icon" id="pdfModalClose">
                    <span class="material-icons">close</span>
                </button>
            </div>
        </div>

        <div class="pdf-modal-body" id="staffrpt-pdf-container">
            <!-- Loading spinner -->
            <div class="pdf-loading" id="pdf-loading">
                <span class="material-icons">sync</span>
                <span>Loading report…</span>
            </div>

            <!-- ✅ iframe is NOW inside pdf-modal-body -->
            <iframe id="pdf-frame" style="display:none;"></iframe>
        </div>

    </div>
</div>
    
                

    





@vite(['resources/js/recreports.js'])

</x-custom-admin-layout>
