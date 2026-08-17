// resources/js/fingeradd.js
import { startRegistration } from '@simplewebauthn/browser';
document.addEventListener('DOMContentLoaded', function() {
    // Get routes from the app config
    const appConfig = document.getElementById('appConfig');
    let routes = {};
    
    if (appConfig) {
        try {
            routes = JSON.parse(appConfig.dataset.routes);
        } catch (e) {
            console.error('Failed to parse routes:', e);
        }
    }

    // Device detection
    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let deviceType = 'unknown';
        let deviceName = 'Unknown Device';
        let platform = 'Unknown';
        
        // Detect device type
        if (/Mobi|Android|iPhone|iPad/i.test(ua)) {
            if (/iPad|Tablet/i.test(ua)) {
                deviceType = 'tablet';
            } else {
                deviceType = 'mobile';
            }
        } else {
            deviceType = 'desktop';
        }
        
        // Detect platform and device name
        if (/Windows/i.test(ua)) {
            platform = 'Windows';
            deviceName = 'Windows PC';
            if (/Windows NT 10.0/i.test(ua)) deviceName = 'Windows 10/11 PC';
        } else if (/Mac OS X/i.test(ua)) {
            platform = 'macOS';
            deviceName = 'Mac';
        } else if (/iPhone/i.test(ua)) {
            platform = 'iOS';
            deviceName = 'iPhone';
        } else if (/iPad/i.test(ua)) {
            platform = 'iOS';
            deviceName = 'iPad';
        } else if (/Android/i.test(ua)) {
            platform = 'Android';
            const match = ua.match(/Android\s+([\d.]+)/);
            const version = match ? match[1] : '';
            deviceName = `Android${version ? ' ' + version : ''}`;
        } else if (/Linux/i.test(ua)) {
            platform = 'Linux';
            deviceName = 'Linux PC';
        }
        
        return { deviceType, deviceName, platform };
    }

    const deviceInfo = getDeviceInfo();
    
    // Update device name display
    const deviceNameElement = document.getElementById('current-device-name');
    if (deviceNameElement) {
        deviceNameElement.textContent = `${deviceInfo.deviceName} (${deviceInfo.platform})`;
    }

    // Load registered authenticators
    function loadAuthenticators() {
        const listContainer = document.getElementById('authenticators-list');
        if (!listContainer) return;
        
        listContainer.innerHTML = `
            <div class="text-center text-muted py-3">
                <span class="spinner-border spinner-border-sm" role="status"></span>
                Loading...
            </div>
        `;

        // Use the route from config
        const url = App.routes.fingerprintAuthenticators;
        
        fetch(url, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
    if (data.success && data.authenticators && data.authenticators.length > 0) {
        let html = '';
        data.authenticators.forEach(auth => {
            const lastUsed = auth.last_used_at ?
                `Last used: ${new Date(auth.last_used_at).toLocaleString()}` :
                'Never used';

            html += `
                <div class="authenticator-item">
                    <div class="authenticator-info">
                        <span class="device-icon material-icons">fingerprint</span>
                        <div class="device-details">
                            <span class="device-name">${escapeHtml(auth.device_name)}</span>
                            <span class="device-meta">
                                Registered: ${new Date(auth.created_at).toLocaleString()}
                                <br>
                                ${lastUsed}
                            </span>
                        </div>
                    </div>
                    <div>
                        <button onclick="removeAuthenticator(${auth.id})"
                                class="btn btn-danger btn-remove ms-2">
                            Remove
                        </button>
                    </div>
                </div>
            `;
        });
        listContainer.innerHTML = html;
    } else {
        listContainer.innerHTML = `
            <div class="text-center text-muted py-3">
                <span class="material-icons" style="font-size: 48px;">devices_off</span>
                <p class="mt-2">No devices registered yet.</p>
                <small>Register this device below to enable biometric login.</small>
            </div>
        `;
    }
})
        .catch(error => {
            console.error('Error loading authenticators:', error);
            listContainer.innerHTML = `
                <div class="alert alert-danger">
                    Failed to load registered devices. Please refresh the page.
                    <br>
                    <small>${error.message}</small>
                </div>
            `;
        });
    }

    function getDeviceIcon(type) {
        const icons = {
            'mobile': '📱',
            'tablet': '📟',
            'desktop': '💻',
            'unknown': '🖥️'
        };
        return icons[type] || icons.unknown;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Register fingerprint
    const registerBtn = document.getElementById('register-fingerprint-btn');
    const statusDiv = document.getElementById('register-status');

    if (registerBtn) {
        registerBtn.addEventListener('click', async function() {
            try {
        showStatus('Requesting registration options...', 'loading');

        // 1. Get options from the server (Spatie action generates + stores the challenge)
        const optionsResponse = await fetch(App.routes.fingerprintRegisterOptions, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
        });

        if (!optionsResponse.ok) {
            throw new Error(`Server error: ${optionsResponse.status}`);
        }

        const options = await optionsResponse.json();

        console.log('Options from server:', options); 

        showStatus('Please scan your fingerprint or use face recognition...', 'info');

        // 2. Let simplewebauthn/browser handle the whole navigator.credentials.create() ceremony
        //    — no manual base64/ArrayBuffer conversion needed, it's built in.
        let registrationResponse;
try {
    registrationResponse = await startRegistration({ optionsJSON: options });
} catch (err) {
    console.error('startRegistration failed:', err);
    throw err;
}

        showStatus('Verifying fingerprint registration...', 'loading');

        // 3. Send the raw options + the registration response back for verification/storage
        const verifyResponse = await fetch(App.routes.fingerprintRegisterVerify, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
            body: JSON.stringify({
                options: JSON.stringify(options),
                passkey: JSON.stringify(registrationResponse),
                device_name: deviceInfo.deviceName,
            }),
        });

        if (!verifyResponse.ok) {
            throw new Error(`Server error: ${verifyResponse.status}`);
        }

        const data = await verifyResponse.json();

        if (data.success) {
            showStatus('✅ Fingerprint registered successfully!', 'success');
            setTimeout(() => {
                loadAuthenticators();
                registerBtn.disabled = false;
                registerBtn.innerHTML = '<span class="material-icons">fingerprint</span> Register This Device';
            }, 1500);
        } else {
            throw new Error(data.message || 'Registration verification failed');
        }
    } catch (error) {
        showStatus(`❌ ${error.message}`, 'error');
        registerBtn.disabled = false;
    }
        });
    }

    function showStatus(message, type) {
        if (!statusDiv) return;
        statusDiv.style.display = 'block';
        statusDiv.textContent = message;
        statusDiv.className = type;
    }

    function getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.content : '';
    }

    // Remove authenticator - make it global so it can be called from onclick
    window.removeAuthenticator = function(id) {
        if (!confirm('Remove this device from biometric authentication? This cannot be undone.')) {
            return;
        }

        const removeBtn = document.querySelector(`.authenticator-item button[onclick="removeAuthenticator(${id})"]`);
        if (removeBtn) {
            removeBtn.disabled = true;
            removeBtn.textContent = 'Removing...';
        }

        // Replace :id in the route
        const url = routes.fingerprintRemove ? routes.fingerprintRemove.replace(':id', id) : `/fingerprint/authenticators/${id}`;

        fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                loadAuthenticators();
                showStatus('Device removed successfully.', 'success');
            } else {
                alert('Failed to remove device: ' + (data.message || 'Unknown error'));
                if (removeBtn) {
                    removeBtn.disabled = false;
                    removeBtn.textContent = 'Remove';
                }
            }
        })
        .catch(error => {
            console.error('Error removing authenticator:', error);
            alert('Error removing device. Please try again.');
            if (removeBtn) {
                removeBtn.disabled = false;
                removeBtn.textContent = 'Remove';
            }
        });
    };

    // Load authenticators on page load
    loadAuthenticators();
});