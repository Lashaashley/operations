/**
 * passexp.js
 * Interactions for the password-expired page.
 * Uses Material Icons (text content swap) — mirrors login.js patterns.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── Visibility toggles ───────────────────────────────────────────────────
    function attachToggle(toggleId, inputId) {
        const btn   = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        if (!btn || !input) return;

        btn.addEventListener('click', () => {
            const isHidden = input.type === 'password';
            input.type     = isHidden ? 'text' : 'password';
            btn.textContent = isHidden ? 'visibility_off' : 'visibility';
        });
    }

    attachToggle('toggle-new-pw',     'newpass');
    attachToggle('toggle-confirm-pw', 'newpass_confirmation');

    // ── Password strength & requirements ────────────────────────────────────
    const newPassInput  = document.getElementById('newpass');
    const strengthFill  = document.getElementById('passwordStrengthBar');
    const strengthLabel = document.getElementById('strengthLabel');

    const checks = {
        lengthCheck:    { el: document.getElementById('lengthCheck'),    test: v => v.length >= 8 },
        uppercaseCheck: { el: document.getElementById('uppercaseCheck'), test: v => /[A-Z]/.test(v) },
        lowercaseCheck: { el: document.getElementById('lowercaseCheck'), test: v => /[a-z]/.test(v) },
        numberCheck:    { el: document.getElementById('numberCheck'),    test: v => /[0-9]/.test(v) },
        specialCheck:   { el: document.getElementById('specialCheck'),   test: v => /[^A-Za-z0-9]/.test(v) },
    };

    const levels = [
        { label: '',       cls: '',       width: '0%'   },
        { label: 'Weak',   cls: 'weak',   width: '25%'  },
        { label: 'Fair',   cls: 'fair',   width: '50%'  },
        { label: 'Good',   cls: 'good',   width: '75%'  },
        { label: 'Strong', cls: 'strong', width: '100%' },
    ];

    function updateStrength(value) {
        let passed = 0;

        Object.values(checks).forEach(({ el, test }) => {
            const met     = test(value);
            const icon    = el.querySelector('.req-icon');

            el.classList.toggle('met', met);
            if (icon) icon.textContent = met ? 'check_circle' : 'radio_button_unchecked';

            if (met) passed++;
        });

        // Clear old strength classes
        strengthFill.classList.remove('weak', 'fair', 'good', 'strong');

        const level = value.length === 0 ? levels[0] : levels[passed] ?? levels[4];

        strengthFill.style.width = level.width;
        strengthLabel.textContent = level.label;

        if (level.cls) strengthFill.classList.add(level.cls);
    }

    if (newPassInput) {
        newPassInput.addEventListener('input', () => updateStrength(newPassInput.value));
    }

    // ── Confirm password match ───────────────────────────────────────────────
    const confirmInput  = document.getElementById('newpass_confirmation');
    const matchMsg      = document.getElementById('passwordMatchMessage');

    function checkMatch() {
        if (!confirmInput || !matchMsg || !newPassInput) return;

        const val = confirmInput.value;
        if (val.length === 0) {
            matchMsg.textContent = '';
            matchMsg.className   = 'field-hint';
            return;
        }

        const matches = val === newPassInput.value;
        matchMsg.textContent = matches ? 'Passwords match' : 'Passwords do not match';
        matchMsg.className   = matches ? 'field-hint match' : 'field-hint no-match';
    }

    if (confirmInput) confirmInput.addEventListener('input', checkMatch);
    if (newPassInput) newPassInput.addEventListener('input', checkMatch);

    // ── Logout link — submit hidden form ────────────────────────────────────
    // The logout button is already a submit button inside the POST form,
    // so no extra JS needed. This block is kept as a safety net in case
    // the template wires up an <a> instead.
    const logoutLink = document.getElementById('logoutroute');
    if (logoutLink) {
        logoutLink.addEventListener('click', e => {
            e.preventDefault();
            const form = document.getElementById('logout-form');
            if (form) form.submit();
        });
    }

});