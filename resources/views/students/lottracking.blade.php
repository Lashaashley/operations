<x-custom-admin-layout>
@vite(['resources/css/pages/musers.css']) 


<div class="users-page">

    <div class="page-header">
        <div class="page-heading">
            <h1>Track Kits</h1>
            <p>View and manage all kits.</p>
        </div>
    </div>

    <div class="toast-wrap" id="toastWrap"></div>

    <!-- Table card -->
    <div class="table-card">

        <div class="table-toolbar">
            <div class="toolbar-left">
                <div class="toolbar-icon"><span class="material-icons">manage_accounts</span></div>
                <div>
                    <div class="toolbar-title">All Kits</div>
                    <div class="toolbar-subtitle" id="recordCount">Loading…</div>
                </div>
            </div>
            <div class="toolbar-right">
                <div class="search-box">
                    <span class="material-icons">search</span>
                    <input type="text" id="dt-search" placeholder="Search kits…">
                </div>
                <select id="dt-length" class="page-length-select">
                    <option value="10">10 / page</option>
                    <option value="25" selected>25 / page</option>
                    <option value="50">50 / page</option>
                    <option value="100">100 / page</option>
                </select>
            </div>
        </div>

        <div class="table-wrap">
            <table id="users-table" class="stripe hover nowrap" >
                <thead>
                    <tr>
                        <th>Lot Number</th>
                        <th>Units</th>
                        <th>Customer</th>
                        <th>Model</th>
                        <th>Status</th>
                        <th class="datatable-nosort">Option</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>

    </div>
</div>

<!-- Edit kits Modal — pure custom, no Bootstrap dependency -->
<div class="modal-backdrop-custom" id="updatekitsstatusModalBackdrop">
    <div id="edituserModal">
        <div class="modal-card">

            <div class="modal-header">
                <div class="modal-header-icon"><span class="material-icons">vehicle</span></div>
                <span class="modal-header-title">Status Change</span>
                <button class="modal-close-btn" data-dismiss="modal" id="modalCloseBtn">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="modal-body">
    <!-- Lot Info -->
    <div class="lot-info-grid">
        <div class="lot-info-item">
            <span class="lot-info-label">Lot Number</span>
            <span class="lot-info-value" id="modal-lotnum">—</span>
        </div>
        <div class="lot-info-item">
            <span class="lot-info-label">Customer</span>
            <span class="lot-info-value" id="modal-customer">—</span>
        </div>
        <div class="lot-info-item">
            <span class="lot-info-label">Model</span>
            <span class="lot-info-value" id="modal-model">—</span>
        </div>
        <div class="lot-info-item">
            <span class="lot-info-label">Units</span>
            <span class="lot-info-value" id="modal-units">—</span>
        </div>
    </div>

    <!-- Current Status -->
    <p class="modal-section-label" style="margin-top:16px;">Current Status</p>
    <div id="modal-current-status">—</div>

    <!-- History Timeline -->
    <p class="modal-section-label" style="margin-top:20px;">Status History</p>
    <div id="modal-history-timeline" class="timeline-wrap">
        <p style="color:var(--muted); font-size:13px;">Loading…</p>
    </div>

    <!-- Next Status Action -->
    <div id="modal-next-action" style="margin-top:20px; display:none;">
        <p class="modal-section-label">Next Station</p>
        <div id="modal-next-status-preview"></div>
    </div>

    <!-- Completed State -->
    <div id="modal-completed-state" style="display:none; margin-top:16px; 
         text-align:center; padding:12px; background:#D1FAE5; border-radius:8px;">
        <span class="material-icons" style="color:#10B981; vertical-align:middle;">
            check_circle
        </span>
        <span style="color:#065F46; font-weight:600; margin-left:6px;">
            All stages completed
        </span>
    </div>
</div>

<!-- Footer — advance button shown/hidden by JS -->
<div class="modal-footer">
    <button type="button" class="btn btn-ghost" data-dismiss="modal" id="modalCancelBtn">
        <span class="material-icons">close</span> Cancel
    </button>
    <button type="button" class="btn btn-save" id="advance-status-btn" style="display:none;">
        <span class="material-icons">arrow_forward</span>
        <span id="advance-btn-label">Advance Status</span>
    </button>
</div>         
            </div>
            </form>

        </div>
    </div>
</div>

 @vite(['resources/js/lottracking.js'])


</x-custom-admin-layout>






