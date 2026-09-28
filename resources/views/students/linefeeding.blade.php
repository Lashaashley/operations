<x-custom-admin-layout>
@vite(['resources/css/pages/lfeed.css']) 
 
<div class="user-create-page">
 
    <div class="page-heading">
        <h1>Line Feeding</h1>
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
                    <label>Station <span class="req">*</span></label>
                    <div class="select-wrap">
                            <select name="station" id="station" required>
                                <option value="">Select station</option>
                            </select>
                        </div>
                        <span class="field-error" id="station-error"></span>
                </div>

            </div>
        </div>

        {{-- ── Section 2: Parts Checklist ──────────────────────────── --}}
<div class="section-head">
    <div class="section-icon"><span class="material-icons">zoom_out_map</span></div>
    <h2 class="section-title">Station Parts Checklist</h2>
     <div class="progress-badge" id="progress-badge" style="display:none;"></div>
   
</div>

<!-- Lot-wide progress panel -->
<div class="progress-panel" id="lot-progress-panel" style="display:none;">
    <div class="progress-stat">
        <div class="progress-stat-header">
            <span>Stations Completed</span>
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
            <p>Select a station to view its parts.</p>
        </div>
    </div>
</div>
<input type="text" id="scanner-capture" autocomplete="off"
       style="position:absolute; opacity:0; height:0; width:0; pointer-events:none;">

<!-- Two-tech confirmation panel -->
<div class="confirmation-panel" id="confirmation-panel" style="display:none;">
    <div class="confirm-slot" id="logistics-slot">
        <div class="confirm-slot-icon"><span class="material-icons">local_shipping</span></div>
        <div class="confirm-slot-body">
            <div class="confirm-slot-label">Logistics Technician</div>
            <div class="confirm-slot-status" id="logistics-status">Not confirmed</div>
        </div>
        <button type="button" class="btn-confirm-tech" data-role="logistics">
            <span class="material-icons">fingerprint</span> Confirm
        </button>
    </div>

    <div class="confirm-slot" id="assembly-slot">
        <div class="confirm-slot-icon"><span class="material-icons">build</span></div>
        <div class="confirm-slot-body">
            <div class="confirm-slot-label">Assembly Technician</div>
            <div class="confirm-slot-status" id="assembly-status">Not confirmed</div>
        </div>
        <button type="button" class="btn-confirm-tech" data-role="assembly">
            <span class="material-icons">fingerprint</span> Confirm
        </button>
    </div>
</div>
 
<div class="action-bar" id="complete-case-bar" style="display:none;">
    <button type="button" class="btn btn-save" id="btn-complete-case" disabled>
        <span class="material-icons">task_alt</span> Complete Station
    </button>
</div>

<!-- Draft identity confirmation modal (password stand-in for fingerprint) -->
<div class="modal-backdrop-custom" id="confirmModalBackdrop">
    <div class="modal-card" style="max-width:420px;">
        <div class="modal-header">
            <div class="modal-header-icon"><span class="material-icons">draw</span></div>
            <span class="modal-header-title" id="confirm-modal-title">Confirm Identity</span>
            <button class="modal-close-btn" id="confirmModalClose">
                <span class="material-icons">close</span>
            </button>
        </div>
        <div class="modal-body">
            <div class="field">
                <label>Technician</label>
                <select id="confirm-tech-select" class="form-select">
                    <option value="">Select your name...</option>
                </select>
                <span class="field-error" id="confirm-tech-error"></span>
            </div>

            <div class="field" style="margin-top:12px;">
                <label>Sign below to confirm</label>
                <div class="signature-pad-wrap">
                    <canvas id="signature-pad" class="signature-canvas"></canvas>
                </div>
                <button type="button" class="btn btn-ghost btn-sm" id="signatureClearBtn" style="margin-top:6px;">
                    Clear
                </button>
                <span class="field-error" id="confirm-signature-error"></span>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-ghost" id="confirmModalCancel">Cancel</button>
            <button type="button" class="btn btn-save" id="confirmModalSubmit">
                <span class="material-icons">check</span> Confirm
            </button>
        </div>
    </div>
</div>
        
 
        </form>
 
        <div id="alertContainer"></div>
 
    </div>
</div>
    
@vite(['resources/js/lfeed.js'])
    
</x-custom-admin-layout>

 

          