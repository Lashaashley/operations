<x-custom-admin-layout>
@vite(['resources/css/pages/reclot.css']) 
 
<div class="user-create-page">
 
    <div class="page-heading">
        <h1>Container Receiving Checklist</h1>
    </div>
 
    <div class="toast-wrap" id="toastWrap"></div>
 
    <div class="form-card">
 
        {{-- ── Section 1: Account Info ────────────────────────── --}}
        <div class="section-head">
            <div class="section-icon"><span class="material-icons">launch</span></div>
            <h2 class="section-title">Origin</h2>
        </div>
 
        <form name="recievelot" id="recievelot" method="POST" enctype="multipart/form-data">
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
                    <label>Lot Received <span class="req">*</span></label>
                    <div class="select-wrap">
                        <select id="lot-select" name="lot_id" style="width:100%">
                            <option value="">-- Select a Lot --</option>
                        </select>
                        </div>
                        <span class="field-error" id="lot_id-error"></span>
                </div>
            </div>
        </div>
 
        {{-- ── Section 2: Password ─────────────────────────────── --}}
        <div class="section-head">
            <div class="section-icon"><span class="material-icons">list</span></div>
            <h2 class="section-title">Container Info</h2>
        </div>
 
        <div class="section-body">
            <div class="fgrid">
 
                {{-- Password --}}
                <div class="field fc-4">
                    <label>Container Number <span class="req">*</span></label>
                    <div class="pw-wrap" id="pwWrap1">
                        <input id="contnumber" name="contnumber"  type="text"
                               placeholder="Container" required
                                >
                    </div>
                    
                    <span class="field-error" id="contnumber-error"></span>
                </div>
 
                {{-- Confirm password --}}
                <div class="field fc-3">
                    <label>Seal Number<span class="req">*</span></label>
                    <div class="pw-wrap" id="pwWrap2">
                        <input id="sealno" name="sealno" type="number"
                               placeholder="Seal" required>
                        
                    </div>
                    <span class="field-error" id="sealno-error"></span>
                </div>

                <div class="field fc-2">
                    <label>Time In<span class="req">*</span></label>
                    <div class="pw-wrap" id="pwWrap2">
                        <input id="timein" name="timein" type="time"
                               placeholder="Seal" required>
                        
                    </div>
                    <span class="field-error" id="timein-error"></span>
                </div>

               

                <div class="field fc-2">
                    <label>Time Out<span class="req">*</span></label>
                    <div class="pw-wrap" id="pwWrap2">
                        <input id="timeout" name="timeout" type="time"
                               placeholder="Seal" required>
                        
                    </div>
                    <span class="field-error" id="timeout-error"></span>
                </div>

                 <div class="field fc-3">
                    <label>Cases<span class="req">*</span></label>
                    <div class="pw-wrap" id="pwWrap2">
                        <input id="unitsno" name="unitsno" type="number"
                               placeholder="Seal" required value="10">
                        
                    </div>
                    <span class="field-error" id="timein-error"></span>
                </div>
                
 
            </div>
        </div>
        {{-- ── Section 3: Units ─────────────────────────────────────── --}}
        <div class="section-head">
            <div class="section-icon"><span class="material-icons">indeterminate_check_box</span></div>
            <h2 class="section-title">Case Details</h2>
        </div>
        <div class="section-body">
            <div id="units-container">
                {{-- Unit rows injected here by JS --}}
            </div>
            <span class="field-error" id="units-error"></span>
            <button type="button" class="btn btn-add-unit" id="btn-add-unit">
                <span class="material-icons">add</span> Add Case
            </button>
        </div>

        
 
        {{-- ── Action bar ──────────────────────────────────────── --}}
        <div class="action-bar">
            <button type="reset" class="btn btn-reset" id="btn-reset" >
                <span class="material-icons">restart_alt</span> Reset
            </button>
            <button type="submit" class="btn btn-save">
                <span class="material-icons">save</span> Submit
            </button>
        </div>
 
        </form>
 
        <div id="alertContainer"></div>
 
    </div>
</div>
    
@vite(['resources/js/recieve.js'])
    
</x-custom-admin-layout>

 

          