<x-custom-admin-layout>
@vite(['resources/css/pages/newrob.css']) 
 
<div class="user-create-page">
 
    <div class="page-heading">
        <h1>New Rob Request</h1>
    </div>
 
    <div class="toast-wrap" id="toastWrap"></div>
    @if(session('error'))
<script>
    document.addEventListener('DOMContentLoaded', function() {
        showToast('danger', 'Error', @json(session('error')));
    });
</script>
@endif
 
    <div class="form-card">
 
        {{-- ── Section 1: Account Info ────────────────────────── --}}
        <div class="section-head">
            <div class="section-icon"><span class="material-icons">launch</span></div>
            <h2 class="section-title">Origin</h2>
        </div>
 
        <form name="robbingform" id="robbingform" method="POST" enctype="multipart/form-data">
        @csrf
         <input type="text" name="issue_id" id="issue_id" value="">
 
        <div class="section-body">
            <div class="fgrid">
                <div class="field fc-3">
                    <label>Customer <span class="req">*</span></label>
                    <div class="select-wrap">
                            <select name="customer" id="customer" required>
                                <option value="">Select Customer</option>
                            </select>
                        </div>
                        <span class="field-error" id="customer-error"></span>
                </div>
 
                <div class="field fc-3">
                    <label>Model <span class="req">*</span></label>
                    <div class="select-wrap">
                            <select name="model" id="model" required>
                                <option value="">Select Model</option>
                            </select>
                        </div>
                        <span class="field-error" id="model-error"></span>
                </div>

                <div class="field fc-3">
                    <label>Lot Affected <span class="req">*</span></label>
                    <div class="select-wrap">
                        <select id="lot-select" name="lot_id" style="width:100%">
                            <option value="">-- Select a Lot --</option>
                        </select>
                        </div>
                        <span class="field-error" id="lot_id-error"></span>
                </div>

                <div class="field fc-3">
                    <label>Lot To be robbed <span class="req">*</span></label>
                    <div class="select-wrap">
                        <select id="robbedlot" name="robbedlot" style="width:100%">
                            <option value="">-- Select a Lot --</option>
                        </select>
                        </div>
                        <span class="field-error" id="robbedlot-error"></span>
                </div>
            </div>
        </div>
 
        {{-- ── Section 2: Password ─────────────────────────────── --}}
        {{-- ── Section 2: Details ─────────────────────────── --}}
<div class="section-head">
    <div class="section-icon"><span class="material-icons">description</span></div>
    <h2 class="section-title">Details</h2>
</div>

<div class="section-body">
    <div id="part-rows-container">
        {{-- Rows injected here by JS --}}
    </div>
    <span class="field-error" id="part-rows-error"></span>
    <button type="button" class="btn btn-add-unit" id="btn-add-part-row">
        <span class="material-icons">add</span> Add Part
    </button>
</div>
 
        
        </div>

        
 
        {{-- ── Action bar ──────────────────────────────────────── --}}
        <div class="action-bar">
            <button type="reset" class="btn btn-reset" id="btn-reset" >
                <span class="material-icons">restart_alt</span> Reset
            </button>
            <button type="submit" class="btn btn-save">
                <span class="material-icons">start</span> Request
            </button>
        </div>
 
        </form>
 
        <div id="alertContainer"></div>
 
    </div>
</div>
<!-- DEBUG: bootstrap raw -->

    <script>
    window.robBootstrap = {!! json_encode($bootstrapData ?? null) !!};
</script>
@vite(['resources/js/newrob.js'])
    
</x-custom-admin-layout>