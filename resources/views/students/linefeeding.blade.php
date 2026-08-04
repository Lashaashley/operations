<x-custom-admin-layout>
@vite(['resources/css/pages/unbox.css']) 
 
<div class="user-create-page">
 
    <div class="page-heading">
        <h1>Unboxing</h1>
    </div>
 
    <div class="toast-wrap" id="toastWrap"></div>
 
    <div class="form-card">
 
        {{-- ── Section 1: Account Info ────────────────────────── --}}
        <div class="section-head">
            <div class="section-icon"><span class="material-icons">launch</span></div>
            <h2 class="section-title">Origin</h2>
        </div>
 
        <form name="unboxform" id="unboxform" method="POST" enctype="multipart/form-data">
        @csrf
 
        <div class="section-body">
            <div class="fgrid">
                <div class="field fc-4">
                    <label>Model <span class="req">*</span></label>
                    <div class="select-wrap">
                            <select name="model" id="model" required>
                                <option value="">Select Model</option>
                            </select>
                        </div>
                        <span class="field-error" id="model-error"></span>
                </div>

                <div class="field fc-3">
                    <label>Lot Number <span class="req">*</span></label>
                    <div class="select-wrap">
                        <select id="lot-select" name="lot_id" style="width:100%">
                            <option value="">-- Select a Lot --</option>
                        </select>
                        </div>
                        <span class="field-error" id="lot_id-error"></span>
                </div>

                <div class="field fc-4">
                    <label>Case <span class="req">*</span></label>
                    <div class="select-wrap">
                            <select name="case" id="case" required>
                                <option value="">Select case</option>
                            </select>
                        </div>
                        <span class="field-error" id="case-error"></span>
                </div>

            </div>
        </div>

        {{-- ── Section 2: Parts Checklist ──────────────────────────── --}}
<div class="section-head">
    <div class="section-icon"><span class="material-icons">directions_car</span></div>
    <h2 class="section-title">Parts Checklist</h2>
     <div class="progress-badge" id="progress-badge" style="display:none;"></div>
    <div class="scanner-status" id="scanner-status">
        <span class="material-icons">qr_code_scanner</span>
        <span id="scanner-status-text">Scanner ready</span>
    </div>
</div>

<!-- Lot-wide progress panel -->
<div class="progress-panel" id="lot-progress-panel" style="display:none;">
    <div class="progress-stat">
        <div class="progress-stat-header">
            <span>Cases Completed</span>
            <span class="progress-stat-value" id="cases-progress-text">0 / 0</span>
        </div>
        <div class="progress-bar-track">
            <div class="progress-bar-fill cases-fill" id="cases-progress-bar" style="width:0%"></div>
        </div>
    </div>

    <div class="progress-stat">
        <div class="progress-stat-header">
            <span>Parts Checked (Lot-wide)</span>
            <span class="progress-stat-value" id="parts-progress-text">0 / 0</span>
        </div>
        <div class="progress-bar-track">
            <div class="progress-bar-fill parts-fill" id="parts-progress-bar" style="width:0%"></div>
        </div>
    </div>

    <div class="progress-issue-badge" id="lot-nok-badge" style="display:none;">
        <span class="material-icons">warning</span>
        <span id="lot-nok-count">0</span> flagged issue(s) lot-wide
    </div>
</div>

<div class="section-body">
    <!-- Case-level progress badge, shown once a case is selected -->
    <div class="case-progress-bar-wrap" id="case-progress-wrap" style="display:none;">
        <div class="case-progress-label">
            <span>This case:</span>
            <span id="case-progress-text">0 / 0 parts checked</span>
        </div>
        <div class="progress-bar-track small">
            <div class="progress-bar-fill case-fill" id="case-progress-bar" style="width:0%"></div>
        </div>
    </div>

    <div id="parts-container">
        <div class="parts-placeholder">
            <span class="material-icons">inbox</span>
            <p>Select a case to view its parts.</p>
        </div>
    </div>
</div>
<input type="text" id="scanner-capture" autocomplete="off"
       style="position:absolute; opacity:0; height:0; width:0; pointer-events:none;">

<div class="action-bar" id="complete-case-bar" style="display:none;">
    <button type="button" class="btn btn-save" id="btn-complete-case">
        <span class="material-icons">task_alt</span> Complete Case
    </button>
</div>
        
 
        </form>
 
        <div id="alertContainer"></div>
 
    </div>
</div>
    
@vite(['resources/js/unbox.js'])
    
</x-custom-admin-layout>

 

          