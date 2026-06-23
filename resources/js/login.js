const toggleBtn = document.getElementById('toggle-pw'); 
const pwInput   = document.getElementById('password');

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