<x-custom-admin-layout>


<!-- Use the correct paired CSS + JS versions -->
@vite(['resources/css/pages/aimport.css'])

<div id="importPage"
     data-duplicate-report-url="{{ route('import.employees.upload') }}">
</div>
<div class="import-page">

    <!-- Page heading -->
    <div class="page-heading">
        <h1>Import Data</h1>
        <p>Upload an Excel file to bulk-import agent records into the system.</p>
    </div>

    <!-- Toast -->
    <div class="toast-wrap" id="toastWrap"></div>

    <!-- Two-column layout -->
    <div class="import-layout">

        <!-- ── Left: Upload card ────────────────────────────── -->
        <div class="import-card">
            <div class="card-top">
                <div class="card-icon">
                    <span class="material-icons">upload_file</span>
                </div>
                <div>
                    <p class="card-title">Upload File</p>
                    <p class="card-subtitle">Excel (.xlsx) · Max 10 MB</p>
                </div>
            </div>

            <div class="card-body">

                <!-- Template download -->
                <a href="{{ route('import.template') }}" class="template-banner">
                    <span class="material-icons">table_chart</span>
                    <div class="template-banner-text">
                        <strong>Download Template</strong>
                        <span>Get the correct column structure</span>
                    </div>
                    <span class="material-icons marginleft">download</span>
                </a>

                <form id="importForm" enctype="multipart/form-data" data-import-url="{{ route('import.employees.upload') }}">
                    @csrf

                    <div class="field">
                        <label>Customer</label>
                        <div class="select-wrap">
                            <select name="customer" id="customer" required>
                                <option value="">Select Customer</option>
                            </select>
                        </div>
                        <span class="field-error" id="customer-error"></span>
                    </div>
                    <div class="field">
                        <label>Model</label>
                        <div class="select-wrap">
                            <select name="model" id="model" required>
                                <option value="">Select Model</option>
                            </select>
                        </div>
                        <span class="field-error" id="model-error"></span>
                    </div>
                    <div class="field">
                        <label>Lot Number</label>
                        <div class="select-wrap">
                            <select name="lotnumber" id="lotnumber" required>
                                <option value="">Select Lot Number</option>
                            </select>
                        </div>
                        <span class="field-error" id="lotnumber-error"></span>
                    </div>

                    <!-- Drop zone -->
                    <div class="drop-zone" id="dropZone">
                        <input type="file" name="excelFile" id="excelFile"
                               accept=".xlsx,.xls" required>
                        <div class="dz-icon">
                            <span class="material-icons">cloud_upload</span>
                        </div>
                        <p class="dz-label">Drop your file here</p>
                        <p class="dz-hint">or click to browse</p>
                    </div>

                    <!-- Selected file pill -->
                    <div class="file-pill" id="filePill">
                        <span class="material-icons">description</span>
                        <span id="fileName">file.xlsx</span>
                        <span class="material-icons remove-file" id="removeFile">close</span>
                    </div>

                    <button type="submit" class="btn btn-upload" id="uploadBtn" disabled>
                        <span class="material-icons">upload</span>
                        <span id="uploadBtnLabel">Upload and Import</span>
                    </button>

                    <div id="resultMsg" class="result-msg hidden" >
                        <div class="result-header">
                            <span class="material-icons result-icon"></span>
                            <span class="result-title"></span>
                        </div>
                        <div class="result-details"></div>
                        <div class="result-actions"></div>
                    </div>
                </form>
            </div>
        </div>

        <!-- ── Right: Review card ───────────────────────────── -->
        <div class="import-card">
            <div class="card-top">
                <div class="card-icon success-icon">
                    <span class="material-icons">preview</span>
                </div>
                <div class="flexone">
                    <p class="card-title">
                        Preview
                        <span class="row-count hidden" id="rowCount" >
                            <span class="material-icons font13" >table_rows</span>
                            <span id="rowCountNum">0</span> rows
                        </span>
                    </p>
                    <p class="card-subtitle">Review data before it is imported</p>
                </div>
                <button class="btn btn-outline hidden" id="cancelUpload" >
                    <span class="material-icons">close</span> Clear
                </button>
            </div>

            <div class="card-body paddingzero">

                <!-- Empty state -->
                <div class="empty-review" id="emptyReview">
                    <span class="material-icons">table_view</span>
                    <p>Select an Excel file to preview its contents here.</p>
                </div>

                <!-- Table -->
                <div id="tableContainer"></div>

            </div>
        </div>

    </div><!-- /import-layout -->
</div><!-- /import-page -->

<!-- Progress modal -->
<div class="progress-modal-backdrop" id="progressModal">
    <div class="progress-modal-card">
        <div class="progress-modal-icon">
            <span class="material-icons">sync</span>
        </div>
        <h3>Importing Data…</h3>
        <p id="progressMessage">Preparing your file, please wait.</p>
        <div class="progress-track">
            <div class="progress-fill" id="progressFill"></div>
        </div>
        <span class="progress-pct" id="progressPct">0%</span>
    </div>
</div>



@vite(['resources/js/aimport.js'])

</x-custom-admin-layout>