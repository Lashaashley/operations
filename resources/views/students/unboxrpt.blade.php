<x-custom-admin-layout>
@vite(['resources/css/pages/unbox.css']) 
@vite(['resources/css/pages/musers.css']) 
 
<div class="user-create-page">
 
    <div class="page-heading">
        <h1>Unboxing Check Reports</h1>
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
                <button class="btn btn-save view-rpt" id="viewrpt">
                    <span class="material-icons">visibility</span> View
                </button>
                

            </div>
        </div>
        
 
        </form>
 
        <div id="alertContainer"></div>
 
    </div>
    
        <div class="table-card">

        <div class="table-toolbar">
            <div class="toolbar-left">
                <div class="toolbar-icon"><span class="material-icons">manage_accounts</span></div>
                <div>
                    <div class="toolbar-title">Unboxing Issues</div>
                    <div class="toolbar-subtitle" id="recordCount">Loading…</div>
                </div>
            </div>
            <div class="toolbar-right">
                <div class="search-box">
                    <span class="material-icons">search</span>
                    <input type="text" id="dt-search" placeholder="Search…">
                </div>
                <select id="dt-length" class="page-length-select">
                    <option value="10">10 / page</option>
                    <option value="25" selected>25 / page</option>
                    <option value="50">50 / page</option>
                    <option value="100">100 / page</option>
                </select>
                <button id="export-excel" class="btn-export btn-export-sm btn-export-excel"><span class="material-icons">grid_on</span> Excel</button>
                <button id="export-pdf" class="btn-export btn-export-sm btn-export-pdf"><span class="material-icons">picture_as_pdf</span> PDF</button>
                <button id="bulk-initiate-rob" class="btn-export btn-export-sm btn-bulk-rob" disabled>
                    <span class="material-icons">swap_horiz</span>
                    Initiate Rob
                    <span class="bulk-count"></span>
                </button>
            </div>
        </div>

        <div class="table-wrap">
            <table id="users-table" class="stripe hover nowrap" >
                <thead>
                    <tr>
                        <th>Rob</th>
                        <th>Model</th>
                        <th>Lot Number</th>
                        <th>Part Number</th>
                        <th>Shortage qnt</th>
                        <th>Checked At</th>
                        <th>Checked By</th>
                        <th>Comment</th>
                        <th class="datatable-nosort">Option</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>
</div>
<!-- Modal Backdrop -->
<div class="modal-backdrop-custom" id="updatekitsstatusModalBackdrop">
    <div id="edituserModal">
        <div class="modal-card">

            <div class="modal-header">
                <div class="modal-header-icon"><span class="material-icons">assignment_late</span></div>
                <span class="modal-header-title">Unboxing Issue Details</span>
                <button class="modal-close-btn" data-dismiss="modal" id="modalCloseBtn">
                    <span class="material-icons">close</span>
                </button>
            </div>

             <input type="hidden" name="recordid" id="recordid" value="">

            <div class="modal-body">
                <!-- Record Information -->
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Lot Number</label>
                        <span id="modal-lotnum">—</span>
                    </div>
                    <div class="detail-item">
                        <label>Customer</label>
                        <span id="modal-customer">—</span>
                    </div>
                    <div class="detail-item">
                        <label>Model</label>
                        <span id="modal-model">—</span>
                    </div>
                    <div class="detail-item">
                        <label>Box Case</label>
                        <span id="modal-boxcase">—</span>
                    </div>
                    <div class="detail-item">
                        <label>Part Number</label>
                        <span id="modal-partnum">—</span>
                    </div>
                    <div class="detail-item">
                        <label>Part Description</label>
                        <span id="modal-partdesc">—</span>
                    </div>
                    <div class="detail-item">
                        <label>Required Qty</label>
                        <span id="modal-required_qty">—</span>
                    </div>
                    <div class="detail-item">
                        <label>Counted Qty</label>
                        <span id="modal-counted_qty">—</span>
                    </div>
                    <div class="detail-item">
                        <label>Shortage Qty</label>
                        <span id="modal-shortage_qty">—</span>
                    </div>
                    <div class="detail-item">
                        <label>Status</label>
                        <span id="modal-status">—</span>
                    </div>
                    <div class="detail-item">
                        <label>Checked By</label>
                        <span id="modal-checkedby">—</span>
                    </div>
                    <div class="detail-item">
                        <label>Checked At</label>
                        <span id="modal-checkedat">—</span>
                    </div>
                    <div class="detail-item full-width">
                        <label>Comment</label>
                        <span id="modal-comment" style="background: #F9FAFB; padding: 8px 12px; border-radius: 4px; display: block;">—</span>
                    </div>
                </div>

                <!-- Images Section -->
                <div id="modal-images-section" style="margin-top: 16px; display: none;">
                    <div class="section-divider">
                        <span>Evidence Images</span>
                    </div>
                    <div id="modal-images-container" class="image-gallery">
                        <!-- Images will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="modal-footer">
                <button type="button" class="btn btn-ghost" data-dismiss="modal" id="modalCancelBtn">
                    <span class="material-icons">close</span> Close
                </button>
                <button type="button" class="btn btn-warning" id="initiate-rob-btn">
                    <span class="material-icons">swap_horiz</span> Initiate Rob
                </button>
                <button type="button" class="btn btn-save" id="advance-status-btn" style="display:none;">
                    <span class="material-icons">check_circle</span>
                    <span id="advance-btn-label">Mark Resolved</span>
                </button>
            </div>
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
<div class="lightbox-backdrop" id="lightboxBackdrop" style="display:none;">
    <button type="button" class="lightbox-close" id="lightboxClose">
        <span class="material-icons">close</span>
    </button>
    <button type="button" class="lightbox-nav lightbox-prev" id="lightboxPrev">
        <span class="material-icons">chevron_left</span>
    </button>
    <img id="lightboxImage" class="lightbox-image" src="" alt="Evidence image">
    <button type="button" class="lightbox-nav lightbox-next" id="lightboxNext">
        <span class="material-icons">chevron_right</span>
    </button>
    <div class="lightbox-counter" id="lightboxCounter">1 / 1</div>
</div>

@vite(['resources/js/unboxrpt.js'])
    
</x-custom-admin-layout>

 

          