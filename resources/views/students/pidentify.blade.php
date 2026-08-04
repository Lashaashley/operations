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

            <div class="manual-entry-wrap">
                <input type="text" id="manual-partnum" placeholder="Or type part number and press Enter">
            </div>
        </div>

        <!-- Result area -->
        <div id="identify-result">
            <div class="identify-placeholder">
                <span class="material-icons">qr_code_2</span>
                <p>Scan a part barcode to see its details here.</p>
            </div>
        </div>

    </div>
</div>

@vite(['resources/js/pidentify.js'])

</x-custom-admin-layout>