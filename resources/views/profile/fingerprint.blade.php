<x-custom-admin-layout>
<!-- resources/views/profile/fingerprint.blade.php -->


<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header">
                    <h3 class="mb-0">
                        <span class="material-icons">fingerprint</span>
                        Biometric Authentication
                    </h3>
                </div>

                <div class="card-body">
                    @if (session('success'))
                        <div class="alert alert-success">
                            {{ session('success') }}
                        </div>
                    @endif

                    @if (session('error'))
                        <div class="alert alert-danger">
                            {{ session('error') }}
                        </div>
                    @endif

                    <!-- Registered Devices Section -->
                    <div class="registered-devices mb-4">
                        <h5>Registered Devices</h5>
                        <p class="text-muted">Devices you've registered for biometric login</p>
                        
                        <div id="authenticators-list">
                            <div class="text-center text-muted py-3" id="loading-authenticators">
                                <span class="spinner-border spinner-border-sm" role="status"></span>
                                Loading...
                            </div>
                        </div>
                    </div>

                    <hr>

                    <!-- Register New Device Section -->
                    <div class="register-device">
                        <h5>Register New Device</h5>
                        <p class="text-muted">
                            Register this device for quick login using fingerprint or face recognition.
                            <br>
                            <small>Current device: <span id="current-device-name">Detecting...</span></small>
                        </p>

                        <button id="register-fingerprint-btn" class="btn btn-primary btn-lg w-100">
                            <span class="material-icons">fingerprint</span>
                            Register This Device
                        </button>

                        <div id="register-status" class="mt-3" style="display: none;"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .authenticator-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        margin-bottom: 8px;
        background: #f8f9fa;
        transition: all 0.2s;
    }
    
    .authenticator-item:hover {
        background: #e9ecef;
    }
    
    .authenticator-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .device-icon {
        font-size: 28px;
        line-height: 1;
    }
    
    .device-details {
        display: flex;
        flex-direction: column;
    }
    
    .device-name {
        font-weight: 600;
        font-size: 16px;
    }
    
    .device-meta {
        font-size: 12px;
        color: #6c757d;
    }
    
    .device-status-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
    }
    
    .device-status-badge.active {
        background: #d4edda;
        color: #155724;
    }
    
    .btn-remove {
        padding: 4px 12px;
        font-size: 13px;
        border-radius: 6px;
    }
    
    #register-status {
        padding: 12px 16px;
        border-radius: 8px;
        font-weight: 500;
    }
    
    #register-status.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    #register-status.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    #register-status.info {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
    }
    
    #register-status.loading {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeeba;
    }
</style>

@vite(['resources/js/fingeradd.js'])
</x-custom-admin-layout>