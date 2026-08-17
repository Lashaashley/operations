
<html>
<head>
    <meta charset="utf-8">
    <title>{{ config('app.name', 'Corepay') }}</title>
    
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('images/apple-touch-icon.png') }}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('images/favicon-32x32.png') }}">
    <link rel="icon" type="image/png" sizes="16x16" href="{{ asset('images/favicon-16x16.png') }}">
    
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <!-- CSS only in head -->
    <link rel="stylesheet" type="text/css" href="{{ asset('vendors/styles/core.css') }}">
    <link rel="stylesheet" type="text/css" href="{{ asset('vendors/styles/style.css') }}">

   
    <link rel="stylesheet" href="{{ asset('src/plugins/select2/dist/css/select2.min.css') }}">
    
    @vite(['resources/css/app.scss', 'resources/js/app.js'])
    @stack('styles')
</head>
<body>
    <div class="wrapper">
        @include('layouts.partials.header')
        @include('layouts.partials.left-sidebar')
        
        <div class="main-container">
            @include('layouts.partials.navbar')
            
            <div class="pd-ltr-20">
                {{ $slot }}
            </div>
            
            @include('layouts.partials.right-sidebar')
        </div>
    </div>

    {{-- ── Generic Alert Modal ─────────────────────────────────────────────── --}}
    <div class="modal fade" id="alertModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header border-0">
                    <h5 class="modal-title" id="alertModalTitle"></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <div id="alertModalIcon" class="fs-1 mb-3"></div>
                    <p id="alertModalMessage" class="mb-0"></p>
                </div>
                <div class="modal-footer border-0 justify-content-center">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal" id="alertModalOk">OK</button>
                </div>
            </div>
        </div>
    </div>

    {{-- ── Generic Confirm Modal ────────────────────────────────────────────── --}}
    <div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true"
         data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header border-0">
                    <h5 class="modal-title" id="confirmModalTitle"></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <div id="confirmModalIcon" class="fs-1 mb-3"></div>
                    <p id="confirmModalMessage" class="mb-0"></p>
                </div>
                <div class="modal-footer border-0 justify-content-center">
                    <button type="button" class="btn btn-secondary" id="confirmModalCancel">Cancel</button>
                    <button type="button" class="btn btn-primary"   id="confirmModalOk">Confirm</button>
                </div>
            </div>
        </div>
    </div>

    {{-- ── Progress Modal (reused for loading states) ───────────────────────── --}}
    <div class="modal fade" id="progressTotalsModal" tabindex="-1" aria-hidden="true"
         data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header border-0">
                    <h5 class="modal-title">
                        <span class="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                    </h5>
                </div>
                <div class="modal-body">
                    <div class="progress" style="height: 25px;">
                        <div id="bs-progress-bar"
                             class="progress-bar progress-bar-striped progress-bar-animated"
                             role="progressbar"
                             style="width: 0%;"
                             aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                            0%
                        </div>
                    </div>
                    <p id="bs-progress-message" class="mt-3 mb-0 text-center">Please wait...</p>
                </div>
            </div>
        </div>
    </div>
    <script src="{{ asset('vendors/scripts/core.js') }}"></script>
    <script src="{{ asset('vendors/scripts/process.js') }}"></script>
    <script src="{{ asset('vendors/scripts/layout-settings.js') }}"></script>

   



     @php
$routes = [
  
     "login"  => route("login"),
     
    "rolesdrop"  => route("roles.getDropdown"),
    "rolesgetall"  => route("roles.getall"),
    "savemodules"  => route("modules.save"),
    "getrmodule"  => route("modules.getRoleModules"),
    "modulesass"  => route("modules.assign"),
    "branchesup"  => url("customers", ["id" => "__id__"]),
    "branches"    => route("customers.getDropdown"),
    "branchesgetall" => route("customers.getall"),
    "depts"       => route("models.getDropdown"),
    "deptsgetall" => route("models.getall"),
    "deptsup"  => url("models", ["id" => "__id__"]),
    "getbycamp"  => route("models.getByCampus"),
    "getbyselmodel"  => route("lot.getByModel"),
    "getbylot"  => route("case.getBylot"),
    "statusup"  => url("status", ["id" => "__id__"]),
    "status"    => route("status.getDropdown"),
    "dropstatus"    => route("zones.getDropdown"),
    "storestatus"    => route("status.store"),
    "storezones"    => route("zones.store"),
    "statusgetall" => route("status.getall"),
    "boxcasebylot" => route("boxcase.getBylot"),
    "zonesgetall" => route("zones.getall"),
    "newlot"    => route("createlot.store"),
    "lottracking"     => route("lots.data"),
    "lottrackingDetail" => route("lot.detail", ["id" => "__id__"]),
    "lottrackingAdvance" => route("lot.advance", ["id" => "__id__"]),
    "getLotsByModel" => route("lots.bymodel"),
    "getLotsByModelandlot" => route("lots.bymodellot"),
    "getbymodel"  => route("parts.getBymodel"),
    "lotActivityHeartbeat" => route("lotactivity.heartbeat"),
    "lotActivityEnd"       => route("lotactivity.end"),
    "lotActivityList"      => route("lotactivity.list"),
    "recieved"    => route("recieve.store"),
    "reportReceiving" => route("report.receiving"),
    "partsForCase"      => route("parts.forcase"),
    "partsSaveRow"       => route("parts.saverow"),
    "partsCompleteCase"  => route("parts.completecase"),
    "reportUnboxing" => route("report.unboxing"),
    "partsLotProgress" => route("parts.lotprogress"),
    "partsIdentify" => route("parts.identify"),
    "unboxActivityHeartbeat" => route("unboxactivity.heartbeat"),
    "unboxActivityEnd"       => route("unboxactivity.end"),
    "reportKitsInventory" => route("report.kitsinventory"),
    "stationsbylot" => route("stations.getBylot"),
    "reportUnboxing" => route("report.unboxing"),
    "lfeedParts"    => route("lfeed.parts"),
    "lfeedConfirm"  => route("lfeed.confirm"),
    "fingerprintStationChallenge"  => route("fingerprint.station-challenge"),
    "lfeedComplete" => route("lfeed.complete"),
    "lfeedSaveRow" => route("lfeed.saverow"),
    "reportLineFeeding" => route("report.linefeeding"),
    "dashboardData" => route("dashboard.data"),
     "fingerprintChallenge"      => route("fingerprint.challenge"),
    "fingerprintVerify"         => route("fingerprint.verify"),
    "fingerprintCheck"          => route("fingerprint.check"),
    "fingerprintAuthenticators" => route("fingerprint.authenticators.list"),
    "fingerprintRegisterOptions"=> route("fingerprint.register.options"),
    "fingerprintRegisterVerify" => route("fingerprint.register.verify"),
    "fingerprintRemove"         => route("fingerprint.authenticators.remove", ['id' => ':id']),
    "partsFindCase" => route("parts.findcase"),
    "partsSuggestions" => route("parts.suggestions"),

    
    
    
];
@endphp

<div id="appConfig" data-routes='@json($routes)'></div>   
</body>
</html>