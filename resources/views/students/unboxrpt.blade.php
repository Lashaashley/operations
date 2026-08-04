<x-custom-admin-layout>
@vite(['resources/css/pages/unbox.css']) 
 
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
@vite(['resources/js/unboxrpt.js'])
    
</x-custom-admin-layout>

 

          