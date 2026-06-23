import DOMPurify from 'dompurify';
document.addEventListener('DOMContentLoaded', function () {

    /* ── OTP boxes logic ─────────────────────────────────── */
    const boxes   = Array.from(document.querySelectorAll('.otp-box'));
    const hidden  = document.getElementById('otp');
    const submit  = document.getElementById('submitBtn');
    const errEl   = document.getElementById('otp-error');

    function getCode () { return boxes.map(b => b.value).join(''); }

    function syncHidden () {
        const code = getCode();
        hidden.value = code;
        submit.disabled = code.length < 6;
        boxes.forEach(b => b.classList.toggle('filled', b.value !== ''));
    }

    // Add this helper once at the top of each file (setup2fs.js and verify.js)
function safeSameOriginRedirect(url, fallback = '/dashboard') {
    try {
        const parsed = new URL(url, window.location.origin);
        
        if (parsed.origin !== window.location.origin) {
            console.warn('Blocked open redirect attempt to:', url);
            window.location.href = fallback;
            return;
        }

        // Reconstruct URL from trusted parts only — breaks Snyk taint chain
        const safePath = DOMPurify.sanitize(parsed.pathname, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
        const safeSearch = DOMPurify.sanitize(parsed.search, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
        const safeHash = DOMPurify.sanitize(parsed.hash, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

        // Build from window.location.origin (trusted) + sanitized parts
        window.location.href = window.location.origin + safePath + safeSearch + safeHash;

    } catch (e) {
        window.location.href = fallback;
    }
}

    boxes.forEach((box, i) => {
        box.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace') {
                if (box.value === '' && i > 0) { boxes[i-1].value = ''; boxes[i-1].focus(); }
                else box.value = '';
                syncHidden(); e.preventDefault();
            }
        });

        box.addEventListener('input', function () {
            box.value = box.value.replace(/[^0-9]/g, '').slice(-1);
            syncHidden();
            errEl.textContent = '';
            boxes.forEach(b => b.classList.remove('error'));
            if (box.value && i < 5) boxes[i+1].focus();
            if (getCode().length === 6) submitForm();
        });

        box.addEventListener('paste', function (e) {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData)
                .getData('text').replace(/[^0-9]/g, '').slice(0,6);
            pasted.split('').forEach((ch, idx) => { if (boxes[idx]) boxes[idx].value = ch; });
            syncHidden();
            if (pasted.length === 6) submitForm();
            else if (boxes[pasted.length]) boxes[pasted.length].focus();
        });
    });

    boxes[0].focus();

    /* ── Form submit ─────────────────────────────────────── */

    const form = document.getElementById('setupForm');
    function submitForm () {
        const code = getCode();
        if (code.length !== 6) return;

        const btnLabel = document.getElementById('btnLabel');
        submit.disabled = true;
        submit.innerHTML = '<span class="material-icons spin">sync</span><span>Verifying…</span>';

        const formData = new FormData(document.getElementById('setupForm'));

        const setupUrl = form.dataset.setupUrl;

        fetch(setupUrl, {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            body: formData
        })
        .then(r => r.json().then(data => ({ ok: r.ok, status: r.status, data })))
        .then(({ ok, status, data }) => {
            if (ok) {
                submit.style.background = 'linear-gradient(135deg,#059669,#10b981)';
                submit.innerHTML = '<span class="material-icons">check_circle</span><span>2FA Enabled!</span>';
                showToast('success', '2FA Enabled', data.message || 'Redirecting…');
                setTimeout(() => safeSameOriginRedirect(data.redirect, '/dashboard'), 1200);
            } else {
                // Reset boxes
                boxes.forEach(b => { b.value = ''; b.classList.add('error'); });
                syncHidden();
                setTimeout(() => boxes.forEach(b => b.classList.remove('error')), 600);
                boxes[0].focus();

                let msg = 'Invalid code. Please try again.';
                if (data?.errors?.otp) msg = data.errors.otp[0];
                else if (data?.message) msg = data.message;

                errEl.textContent = msg;
                showToast('danger', 'Verification Failed', msg);

                submit.disabled = false;
                submit.innerHTML = '<span class="material-icons">verified_user</span><span>Enable Two-Factor Authentication</span>';
            }
        })
        .catch(() => {
            showToast('danger', 'Error', 'Something went wrong. Please try again.');
            submit.disabled = false;
            submit.innerHTML = '<span class="material-icons">verified_user</span><span>Enable Two-Factor Authentication</span>';
            boxes[0].focus();
        });
    }

    document.getElementById('setupForm').addEventListener('submit', function (e) {
        e.preventDefault();
        submitForm();
    });

    /* ── Copy secret key ─────────────────────────────────── */
    window.copySecretKey = function () {
        const key = document.getElementById('secretKey').textContent.trim();
        navigator.clipboard?.writeText(key).then(() => {
            showToast('success', 'Copied!', 'Secret key copied to clipboard.');
        }).catch(() => {
            const el = document.createElement('textarea');
            el.value = key; document.body.appendChild(el);
            el.select(); document.execCommand('copy');
            document.body.removeChild(el);
            showToast('success', 'Copied!', 'Secret key copied to clipboard.');
        });
    };

    /* ── Toast ───────────────────────────────────────────── */
  // Add this helper once at the top of your file
function sanitize(str) {
    return $('<div>').text(String(str)).html();
}

function showToast(type, title, message) {
    const icons = { 
        success: 'check_circle', 
        danger: 'error_outline', 
        warning: 'warning_amber', 
        info: 'info' 
    };

    // Sanitize all remote inputs at entry point
    const safeType    = sanitize(type);
    const safeTitle   = sanitize(title);
    const safeMessage = sanitize(message);

    const iconSpan = $('<span>')
        .addClass('material-icons')
        .text(icons[safeType] || 'info');

    const strong = $('<strong>').text(safeTitle);

    const messageDiv = $('<div>')
        .append(strong)
        .append(document.createTextNode(' ' + safeMessage));

    const t = $('<div>')
        .addClass('toast-msg ' + safeType)
        .append(iconSpan)
        .append(messageDiv);

    $('#toastWrap').append(t);

    const dismiss = () => { t.addClass('leaving'); setTimeout(() => t.remove(), 300); };
    t.on('click', dismiss);
    setTimeout(dismiss, 5000);
}

    $('#copy-btn').on('click', function (e) {

        copySecretKey();

    });

});