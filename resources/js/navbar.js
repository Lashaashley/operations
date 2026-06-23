document.addEventListener('DOMContentLoaded', function () {

    const header = document.querySelector('.header');

    if (!header) return;

    const LIFETIME_MS = parseInt(header.dataset.sessionLifetime) * 60 * 1000;
    const LOGOUT_URL  = header.dataset.logoutUrl;
    const LOGIN_URL   = header.dataset.loginUrl;
    const PING_URL    = header.dataset.sessionPing;

    const banner   = document.getElementById('sessionWarning');
    const textEl   = document.getElementById('sessionWarningText');
    const extendBtn= document.getElementById('sessionExtendBtn');

    let sessionStart  = Date.now();
    let warningShown  = false;
    let countdownTick = null;

    function resetTimer() {
        sessionStart = Date.now();
        warningShown = false;
        banner.classList.add('hidden');
        clearInterval(countdownTick);
    }

    function showWarning() {
        if (!warningShown) {
            warningShown = true;
            banner.classList.remove('hidden');

            countdownTick = setInterval(function () {
                const elapsed = Date.now() - sessionStart;
                const remaining = Math.max(0, Math.ceil((LIFETIME_MS - elapsed) / 1000));

                textEl.textContent =
                    `Your session expires in ${remaining} second${remaining !== 1 ? 's' : ''}.`;

                if (remaining <= 0) {
                    clearInterval(countdownTick);

                    fetch(LOGOUT_URL, {
                        method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': getCSRF(),
                            'Content-Type': 'application/json'
                        }
                    }).finally(function () {
                        window.location.href = LOGIN_URL;
                    });
                }
            }, 1000);
        }
    }

    function getCSRF() {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    }

    setInterval(function () {
        const elapsed   = Date.now() - sessionStart;
        const remaining = LIFETIME_MS - elapsed;

        if (remaining <= 15000) {
            showWarning();
        }
    }, 1000);

    if (extendBtn) {
        extendBtn.addEventListener('click', function () {
            fetch(PING_URL, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': getCSRF(),
                    'Content-Type': 'application/json'
                }
            }).then(r => {
                if (r.ok) resetTimer();
            });
        });
    }

    let throttle = null;

    ['click', 'keydown', 'mousemove', 'scroll'].forEach(function (evt) {
        document.addEventListener(evt, function () {

            if (throttle) return;

            throttle = setTimeout(function () {

                if (warningShown) {
                    fetch(PING_URL, {
                        method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': getCSRF(),
                            'Content-Type': 'application/json'
                        }
                    }).then(r => {
                        if (r.ok) resetTimer();
                    });
                } else {
                    sessionStart = Date.now();
                }

                throttle = null;

            }, 2000);

        }, { passive: true });
    });

});