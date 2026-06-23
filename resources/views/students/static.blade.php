<x-custom-admin-layout>
 
@vite(['resources/css/pages/static.css']) 
 
<div class="static-page">
 
    <div class="page-heading">
        <h1>Static Information</h1>
        <p>Manage organisation details, customers, models, variables and system settings.</p>
    </div>
 
    <div class="toast-wrap" id="toastWrap"></div>
 
    {{-- Session flash --}}
    @if(session('success'))
        <div class="divfex" >
            <span class="material-icons font16" >check_circle</span>
            {{ session('success') }}
        </div>
    @endif
 
    {{-- ── Unified tab navigation ── --}}
    
 
    {{-- Legacy alert (hidden, JS may use it) --}}
    <div id="status-message" class="alert alert-dismissible fade custom-alert hidden" role="alert" >
        <strong id="alert-title"></strong> <span id="alert-message"></span>
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    </div>
 
    {{-- ── Tab bar ──────────────────────────────────────────── --}}
    <div class="tab-bar">
        <button class="tab-btn active" id="tabactive">
            <span class="material-icons">business</span> Org Structure
        </button>
        <button class="tab-btn" id="tabbranches" >
            <span class="material-icons">loyalty</span> Customers
        </button>
        <button class="tab-btn" id="tab-depts">
            <span class="material-icons">airport_shuttle</span> Models
        </button>
        <button class="tab-btn" id="tab-status">
            <span class="material-icons">view_timeline</span> Status
        </button>
    </div>
 
    <div class="tab-body">
 
        {{-- ═══════════ ORG STRUCTURE ═══════════ --}}
        <div id="taborgstruct" class="tab-panel active">
            <div class="split-layout">
                <div class="s-card">
                    <div class="s-card-head">
                        <div class="s-icon"><span class="material-icons">business</span></div>
                        <span class="s-card-title">Organisation Details</span>
                    </div>
                    <div class="s-card-body">
                        <form enctype="multipart/form-data" id="orgstrucf" method="post" data-storestaticinfo-url="">
                            @csrf
                            <div class="field">
                                <label>Name</label>
                                <input name="sname" type="text" required autocomplete="off">
                            </div>
                            <div class="field">
                                <label>Slogan</label>
                                <input name="motto" type="text" required autocomplete="off">
                            </div>
                            <div class="field">
                                <label>Logo</label>
                                <div class="file-upload-wrap">
                                    <label class="file-upload-label" for="file">
                                        <span class="material-icons">upload</span> Choose
                                    </label>
                                    <input name="file" id="file" type="file" accept=".png,.jpg,.jpeg"
                                           >
                                    <span class="file-name-display">No file chosen</span>
                                </div>
                                <span class="field-error" id="file-error"></span>
                            </div>
                            <div class="field">
                                <label>P.O Box</label>
                                <input name="pobox" type="text" required autocomplete="off">
                            </div>
                            <div class="field">
                                <label>Email</label>
                                <input name="email" type="email" required autocomplete="off">
                            </div>
                            <div class="field">
                                <label>Address</label>
                                <input name="Address" type="text" required autocomplete="off">
                            </div>
                            <button type="submit" class="btn btn-save">
                                <span class="material-icons">save</span> Save
                            </button>
                        </form>
                    </div>
                </div>
 
                <div class="s-card">
                    <div class="s-card-head">
                        <div class="s-icon purple"><span class="material-icons">list</span></div>
                        <span class="s-card-title">Organisation Records</span>
                    </div>
                    <div class="s-card-body">
                        <div class="data-wrap">
                            <table class="s-table data-table table stripe hover nowrap">
                                <thead>
                                    <tr>
                                        <th hidden>ID</th>
                                        <th>Name</th>
                                        <th>Logo</th>
                                        <th>Slogan</th>
                                        <th hidden>P.O. Box</th>
                                        <th hidden>Email</th>
                                        <th hidden>Address</th>
                                        <th>Options</th>
                                    </tr>
                                </thead>
                                <tbody id="structure-table-body"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
 
        {{-- ═══════════ BRANCHES ═══════════ --}}
        <div id="tabstatcodes" class="tab-panel">
            <div class="split-layout">
                <div class="s-card">
                    <div class="s-card-head">
                        <div class="s-icon green"><span class="material-icons">loyalty</span></div>
                        <span class="s-card-title"> Add Customer</span>
                    </div>
                    <div class="s-card-body">
                        <form id="campusform" method="post"  data-storebranches-url="{{ route('customers.store') }}">
                            @csrf
                            <div class="field">
                                <label>Customer Name</label>
                                <input name="branchname" id="branchname" type="text" required autocomplete="off">
                            </div>
                            <button type="submit" class="btn btn-save">
                                <span class="material-icons">save</span> Save
                            </button>
                        </form>
                    </div>
                </div>
                <div class="s-card">
                    <div class="s-card-head">
                        <div class="s-icon purple"><span class="material-icons">list</span></div>
                        <span class="s-card-title">Customer List</span>
                    </div>
                    <div class="s-card-body">
                        <div class="data-wrap">
                            <table class="s-table data-table table stripe hover nowrap">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Options</th>
                                    </tr>
                                </thead>
                                <tbody id="campuses-table-body"></tbody>
                            </table>
                            <div id="pagination-controls" class="mt-3"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
 
        {{-- ═══════════ DEPARTMENTS ═══════════ --}}
        <div id="tabdepts" class="tab-panel">
            <div class="split-layout">
                <div class="s-card">
                    <div class="s-card-head">
                        <div class="s-icon orange"><span class="material-icons">airport_shuttle</span></div>
                        <span class="s-card-title">Add Model</span>
                    </div>
                    <div class="s-card-body">
                        <form id="deptsform" method="post" data-storedepts-url="{{ route('models.store') }}">
                            @csrf
                            <div class="field">
                                <label>Customer</label>
                                <div class="select-wrap">
                                    <select name="brid" id="brid" required>
                                        <option value="">Select Customer</option>
                                    </select>
                                </div>
                                <span class="field-error" id="brid-error"></span>
                            </div>
                            <div class="field">
                                <label>Model Name</label>
                                <input name="modelname" id="modelname" type="text" required autocomplete="off">
                            </div>
                            <button type="submit" class="btn btn-save">
                                <span class="material-icons">save</span> Save
                            </button>
                        </form>
                    </div>
                </div>
                <div class="s-card">
                    <div class="s-card-head">
                        <div class="s-icon purple"><span class="material-icons">list</span></div>
                        <span class="s-card-title">Models</span>
                    </div>
                    <div class="s-card-body">
                        <div class="data-wrap">
                            <table class="s-table data-table table stripe hover nowrap">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Branch</th>
                                        <th>Department</th>
                                        <th>Options</th>
                                    </tr>
                                </thead>
                                <tbody id="depts-table-body"></tbody>
                            </table>
                            <div id="pagination-depts" class="mt-3"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="tabstatus" class="tab-panel">
            <div class="split-layout">
                <div class="s-card">
                    <div class="s-card-head">
                        <div class="s-icon teal"><span class="material-icons">view_timeline</span></div>
                        <span class="s-card-title"> Add Status</span>
                    </div>
                    <div class="s-card-body">
                        <form id="statusform" method="post"  data-storestatus-url="{{ route('status.store') }}">
                            @csrf
                            <div class="field">
                                <label>Status Name</label>
                                <input name="stname" id="stname" type="text" required autocomplete="off">
                            </div>
                            <button type="submit" class="btn btn-save">
                                <span class="material-icons">save</span> Save
                            </button>
                        </form>
                    </div>
                </div>
                <div class="s-card">
                    <div class="s-card-head">
                        <div class="s-icon purple"><span class="material-icons">list</span></div>
                        <span class="s-card-title">Status List</span>
                    </div>
                    <div class="s-card-body">
                        <div class="data-wrap">
                            <table class="s-table data-table table stripe hover nowrap">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Options</th>
                                    </tr>
                                </thead>
                                <tbody id="status-table-body"></tbody>
                            </table>
                            <div id="pagination-controls" class="mt-3"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
 
      
 
    </div>{{-- /tab-body --}}
</div>{{-- /static-page --}}
 
 
{{-- ═══════════ EDIT MODALS — all IDs and form names preserved ═══════════ --}}
 
{{-- Edit Org --}}
<div class="modal fade" id="editSchoolModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Edit Organisation</h5>
                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
            </div>
            <div class="modal-body">
                <form id="editSchoolForm" enctype="multipart/form-data">
                    @csrf
                    <input type="hidden" id="ID" name="id">
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>Name</label>
                            <input type="text" class="form-control" id="schoolName" name="name">
                            <span class="text-danger" id="name-error"></span>
                        </div>
                        <div class="form-group col-md-6">
                            <label>Slogan</label>
                            <input type="text" class="form-control" id="schoolMotto" name="motto">
                            <span class="text-danger" id="motto-error"></span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>P.O Box</label>
                        <input type="text" class="form-control" id="schoolPobox" name="pobox">
                        <span class="text-danger" id="pobox-error"></span>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>Email</label>
                            <input type="email" class="form-control" id="schoolEmail" name="email">
                            <span class="text-danger" id="email-error"></span>
                        </div>
                        <div class="form-group col-md-6">
                            <label>Address</label>
                            <input type="text" class="form-control" id="schoolPhysaddres" name="physaddres">
                            <span class="text-danger" id="physaddres-error"></span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Logo</label>
                        <input type="file" class="form-control" id="schoolLogo" name="logo">
                        <img id="schoolLogoPreview" src="" alt="Logo" >
                        <span class="text-danger" id="logo-error"></span>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary btn" data-dismiss="modal">Cancel</button>
                <button type="submit" form="editSchoolForm" class="btn btn-primary">Save Changes</button>
            </div>
        </div>
    </div>
</div>
 
{{-- Edit Stream --}}
<div class="modal fade" id="editstreamModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Edit Stream</h5>
                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
            </div>
            <div class="modal-body">
                <form id="editstreamForm">
                    @csrf
                    <input type="hidden" id="ID" name="id">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" class="form-control" id="editstrmname" name="strmname">
                        <span class="text-danger" id="strmname-error"></span>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                <button type="submit" form="editstreamForm" class="btn btn-primary">Save Changes</button>
            </div>
        </div>
    </div>
</div>
 
{{-- Edit Branch --}}
<div class="modal fade" id="editcampusModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Edit Branch</h5>
                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
            </div>
            <div class="modal-body">
                <form id="editcampuslForm">
                    @csrf
                    <input type="hidden" id="ID" name="id">
                    <div class="form-group">
                        <label>Branch Name</label>
                        <input type="text" class="form-control" id="editbranchname" name="branchname">
                        <span class="text-danger" id="branchname-error"></span>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                <button type="submit" form="editcampuslForm" class="btn btn-primary">Save Changes</button>
            </div>
        </div>
    </div>
</div>
 
{{-- Edit Department --}}
<div class="modal fade" id="edithouseModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Edit Department</h5>
                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
            </div>
            <div class="modal-body">
                <form id="edithouseForm">
                    @csrf
                    <input type="hidden" id="ID" name="id">
                    <div class="form-group">
                        <label>Branch</label>
                        <select name="brid" id="branch3" class="form-control custom-select" required>
                            <option value="">Select Customer</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Department</label>
                        <input type="text" class="form-control" id="edithousename" name="DepartmentName">
                        <span class="text-danger" id="DepartmentName-error"></span>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                <button type="submit" form="edithouseForm" class="btn btn-primary">Save Changes</button>
            </div>
        </div>
    </div>
</div>

 
{{-- Edit Email Config --}}
<div class="modal fade" id="editemailModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Email Configuration</h5>
                <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
            </div>
            <form name="editmailForm" id="editmailForm" method="post">
                @csrf
                <div class="modal-body">
                    <input type="hidden" name="id" id="ID">
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>Name</label>
                            <input type="text" class="form-control" id="eeName" name="name" required>
                        </div>
                        <div class="form-group col-md-6">
                            <label>Host</label>
                            <input type="text" class="form-control" id="ehost" name="host" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>Port</label>
                            <input type="text" class="form-control" id="eport" name="port" required>
                        </div>
                        <div class="form-group col-md-6">
                            <label>Username</label>
                            <input type="text" class="form-control" id="eusername" name="username" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>Password</label>
                            <input type="text" class="form-control" id="epassword" name="password" required>
                        </div>
                        <div class="form-group col-md-6">
                            <label>Encryption</label>
                            <input type="text" class="form-control" id="eencryption" name="encryption" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="text" class="form-control" id="eemailaddress" name="from_email" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
</div>
@vite([
    'resources/js/static.js'
])
</x-custom-admin-layout>
