<x-custom-admin-layout>
@vite(['resources/css/pages/pitems.css']) 
 
<div class="user-create-page">
 
    <div class="page-heading">
        <h1>New Rob Request</h1>
    </div>
 
    <div class="toast-wrap" id="toastWrap"></div>
 
    <div class="form-card">
 
        {{-- ── Section 1: Account Info ────────────────────────── --}}
        <div class="section-head">
            <div class="section-icon"><span class="material-icons">launch</span></div>
            <h2 class="section-title">Origin</h2>
        </div>
 
        <form name="createuser" id="createuser" method="POST" enctype="multipart/form-data">
        @csrf
 
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
                        <span class="field-error" id="model-error"></span>
                </div>

                <div class="field fc-3">
                    <label>Lot To be robbed <span class="req">*</span></label>
                    <div class="select-wrap">
                        <select id="robbedlot" name="robbedlot" style="width:100%">
                            <option value="">-- Select a Lot --</option>
                        </select>
                        </div>
                        <span class="field-error" id="model-error"></span>
                </div>
            </div>
        </div>
 
        {{-- ── Section 2: Password ─────────────────────────────── --}}
        <div class="section-head">
            <div class="section-icon"><span class="material-icons">description</span></div>
            <h2 class="section-title">Details</h2>
        </div>
 
        <div class="section-body">
            <div class="fgrid">
 
                {{-- Password --}}
                <div class="field fc-3">
                    <label>Part Number<span class="req">*</span></label>
                    <div class="select-wrap">
                        <select id="partnumber" name="partnumber" style="width:100%">
                            <option value="">-- Select a Partnumber --</option>
                        </select>
                        </div>
                        <span class="field-error" id="partnumber-error"></span>
                </div>
                
 
                {{-- Confirm password --}}
                <div class="field fc-4">
                    <label>Desctription</label>
                    <div class="pw-wrap" id="pwWrap2">
                        <input id="partdescription" name="partdescription" type="text"
                               placeholder="Part Description" required readonly>
                        
                    </div>
                    <span class="field-error" id="partdescription-error"></span>
                </div>
                <div class="field fc-2">
                    <label>Quantity</label>
                    <div class="pw-wrap" id="pwWrap2">
                        <input id="quanitity" name="quanitity" type="text"
                               placeholder="Quantity" required readonly>
                        
                    </div>
                    <span class="field-error" id="quanitity-error"></span>
                </div>

                <!-- For a wider textarea, use fc-6 or fc-12 -->
<div class="field fc-4">
    <label>Reason <span class="req">*</span></label>
    <textarea id="reason" name="reason" 
              placeholder="Enter reason..." 
              required></textarea>
    <span class="field-error" id="reason-error"></span>
</div>
                </div>
                
 
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
    
@vite(['resources/js/newrob.js'])
    
</x-custom-admin-layout>