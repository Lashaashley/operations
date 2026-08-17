// resources/js/login.js
import { startAuthentication } from '@simplewebauthn/browser';
const toggleBtn = document.getElementById('toggle-pw');
const pwInput = document.getElementById('password');

toggleBtn.addEventListener('click', () => {
    const isPassword = pwInput.type === 'password';
    pwInput.type = isPassword ? 'text' : 'password';
    toggleBtn.textContent = isPassword ? 'visibility_off' : 'visibility';
});

// ─── CSRF token auto-refresh (silent) ────────────────────────────────────────
(function () {
    const rawAttr = document.documentElement.dataset.sessionLifetime;
    const SESSION_MINUTES = parseInt(rawAttr ?? '5', 10);
    const reloadAfterMs = Math.max((SESSION_MINUTES * 60 - 60), 60) * 1000;

    console.log('[CSRF Refresh] data-session-lifetime attr:', rawAttr);
    console.log('[CSRF Refresh] SESSION_MINUTES parsed:', SESSION_MINUTES);
    console.log('[CSRF Refresh] Will reload in ms:', reloadAfterMs);
    console.log('[CSRF Refresh] Will reload in seconds:', reloadAfterMs / 1000);
    console.log('[CSRF Refresh] Reload scheduled at:', new Date(Date.now() + reloadAfterMs).toLocaleTimeString());

    setTimeout(() => {
        console.log('[CSRF Refresh] Reloading now...');
        window.location.reload();
    }, reloadAfterMs);
})();

// ─── FINGERPRINT AUTHENTICATION ──────────────────────────────────────────────

class FingerprintAuth {
    constructor() {
        this.available = false;
        this.credentialId = null;
        this.publicKey = null;
        this.isSupported = this.checkSupport();
        
        // Define routes directly since we're not using the layout
        const baseUrl = window.Laravel?.basePath || this.getBaseUrl();
        
        // Define routes with the base URL
        this.routes = {
            challenge: baseUrl + '/fingerprint/challenge',
            verify: baseUrl + '/fingerprint/verify',
        };
        
        console.log('Fingerprint routes:', this.routes);
        if (this.isSupported) {
            this.init();
        }
    }

    checkSupport() {
        return window.PublicKeyCredential && 
               typeof window.PublicKeyCredential === 'function' &&
               navigator.credentials &&
               navigator.credentials.get;
    }

    async init() {
        try {
            // Check if browser supports WebAuthn
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            this.available = available;
            
            if (available) {
                const btn = document.getElementById('fingerprint-login-btn');
                if (btn) {
                    btn.style.display = 'flex';
                    // We don't check for registered fingerprints here because the user is not authenticated
                    // The button will be available, but clicking it will check if there are registered devices
                }
            }
        } catch (error) {
            console.error('Fingerprint init error:', error);
            const btn = document.getElementById('fingerprint-login-btn');
            if (btn) btn.style.display = 'none';
        }
    }

    async authenticate() {
    if (!this.available) {
        this.showStatus('Fingerprint authentication is not available on this device.', 'error');
        return;
    }

    const btn = document.getElementById('fingerprint-login-btn');

    try {
        this.showStatus('Requesting authentication options...', 'info');
        if (btn) btn.disabled = true;

        const optionsResponse = await fetch(this.routes.challenge, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        if (!optionsResponse.ok) {
            if (optionsResponse.status === 404) {
                this.showStatus('No registered devices found. Please set up fingerprint in profile settings.', 'error');
            } else {
                throw new Error('Failed to get options: ' + optionsResponse.status);
            }
            if (btn) btn.disabled = false;
            return;
        }

        const options = await optionsResponse.json();

        this.showStatus('Please scan your fingerprint...', 'info');

        const authenticationResponse = await startAuthentication({ optionsJSON: options });

        this.showStatus('Verifying fingerprint...', 'info');

        const verifyResponse = await fetch(this.routes.verify, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                options: JSON.stringify(options),
                passkey: JSON.stringify(authenticationResponse),
            })
        });

        if (!verifyResponse.ok) {
            throw new Error('Verification failed: ' + verifyResponse.status);
        }

        const verifyData = await verifyResponse.json();

        if (verifyData.success) {
            this.showStatus('Fingerprint verified! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = verifyData.redirect || '/dashboard';
            }, 500);
        } else {
            this.showStatus('Fingerprint verification failed. Please try again.', 'error');
            if (btn) btn.disabled = false;
        }
    } catch (error) {
        console.error('Fingerprint authentication error:', error);

        let errorMessage = 'Fingerprint authentication failed. Please try again or use password.';
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Fingerprint authentication was cancelled. Please try again.';
        } else if (error.name === 'AbortError') {
            errorMessage = 'Fingerprint authentication timed out. Please try again.';
        }

        this.showStatus(errorMessage, 'error');
        if (btn) btn.disabled = false;
    }
}

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('fingerprint-status');
        if (!statusElement) return;
        statusElement.textContent = message;
        statusElement.className = 'fingerprint-status ' + type;
        statusElement.style.display = 'block';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize fingerprint if we're on the login page
    if (document.getElementById('fingerprint-login-btn')) {
        window.fingerprintAuth = new FingerprintAuth();

        // Fingerprint login button
        const fingerprintBtn = document.getElementById('fingerprint-login-btn');
        if (fingerprintBtn) {
            fingerprintBtn.addEventListener('click', () => {
                if (window.fingerprintAuth) {
                    window.fingerprintAuth.authenticate();
                }
            });
        }
    }
});