<x-custom-admin-layout>
@vite(['resources/css/pages/pidentify.css'])

<div class="user-create-page">

    <div class="page-heading">
        <h1>Part Identifier</h1>
        <p>Scan a part's barcode to view its details.</p>
    </div>

    <div class="toast-wrap" id="toastWrap"></div>

    <div class="form-card">

    <!-- Scanner status + manual fallback -->
    <div class="scan-input-row">
        <div class="scanner-status listening" id="scanner-status">
            <span class="material-icons">qr_code_scanner</span>
            <span id="scanner-status-text">Ready — scan a part</span>
        </div>

        <div class="manual-entry-wrap" style="position:relative;">
            <input type="text" id="manual-partnum" placeholder="Scan, type part number, or search description…" autocomplete="off">
            <div class="suggestions-dropdown" id="suggestions-dropdown" style="display:none;"></div>
        </div>
    </div>

    <!-- Find Case row -->
    <div class="scan-input-row" style="margin-top:10px;">
        <div class="find-case-wrap">
            <span class="material-icons">inventory_2</span>
            <input type="text" id="find-case-input" placeholder="Find a case number…" autocomplete="off">
            <button type="button" id="find-case-btn">
                <span class="material-icons">search</span> Find
            </button>
        </div>
    </div>

    <!-- Result area -->
    <div id="identify-result">
        <div class="identify-placeholder">
            <span class="material-icons">qr_code_2</span>
            <p>Scan a part barcode, search a part, or find a case to see details here.</p>
        </div>
    </div>

</div>
</div>

@vite(['resources/js/pidentify.js'])

</x-custom-admin-layout>