<x-custom-admin-layout>
@vite(['resources/css/pages/newuser.css']) 
 
<div class="user-create-page">
 
    <div class="page-heading">
        <h1>New Kits</h1>
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
 
                <div class="field fc-4">
                    <label>Model <span class="req">*</span></label>
                    <div class="select-wrap">
                            <select name="model" id="model" required>
                                <option value="">Select Model</option>
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
                <div class="field fc-4">
                    <label>Lot Number <span class="req">*</span></label>
                    <div class="pw-wrap" id="pwWrap1">
                        <input id="lotnum" name="lotnum"  type="text"
                               placeholder="Description" required
                                >
                    </div>
                    
                    <span class="field-error" id="lotnum-error"></span>
                </div>
 
                {{-- Confirm password --}}
                <div class="field fc-4">
                    <label>No. of Units <span class="req">*</span></label>
                    <div class="pw-wrap" id="pwWrap2">
                        <input id="unitsno" name="unitsno" type="number"
                               placeholder="Units" required>
                        
                    </div>
                    <span class="field-error" id="unitsno-error"></span>
                </div>
                
 
            </div>
        </div>
        {{-- ── Section 3: Units ─────────────────────────────────────── --}}
        <div class="section-head">
            <div class="section-icon"><span class="material-icons">directions_car</span></div>
            <h2 class="section-title">Unit Details</h2>
        </div>
        <div class="section-body">
            <div id="units-container">
                {{-- Unit rows injected here by JS --}}
            </div>
            <span class="field-error" id="units-error"></span>
            <button type="button" class="btn btn-add-unit" id="btn-add-unit">
                <span class="material-icons">add</span> Add Unit
            </button>
        </div>

        
 
        {{-- ── Action bar ──────────────────────────────────────── --}}
        <div class="action-bar">
            <button type="reset" class="btn btn-reset" id="btn-reset" >
                <span class="material-icons">restart_alt</span> Reset
            </button>
            <button type="submit" class="btn btn-save">
                <span class="material-icons">save</span> Create Kits
            </button>
        </div>
 
        </form>
 
        <div id="alertContainer"></div>
 
    </div>
</div>
    
@vite(['resources/js/createlot.js'])
    
</x-custom-admin-layout>

 

          