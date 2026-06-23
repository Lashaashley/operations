/* ── Photo modal ─────────────────────────────────────────── */
function openPhotoModal()  { document.getElementById('photoModal').classList.add('open'); }
function closePhotoModal() { document.getElementById('photoModal').classList.remove('open'); }

document.getElementById('photoModal').addEventListener('click', function(e) {
    if (e.target === this) closePhotoModal();
});

document.getElementById('profile_photo_input').addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;

    document.getElementById('photoFileName').textContent = file.name;

    // Preview using blob URL — no base64, no CSP data: issues
    const img = document.getElementById('avatarPreview');
    if (img) {
        // Revoke previous blob URL to free memory
        if (img._blobUrl) {
            URL.revokeObjectURL(img._blobUrl);
        }

        const blobUrl = URL.createObjectURL(file);
        img._blobUrl  = blobUrl;  // store reference for cleanup
        img.src       = blobUrl;
    }
});

function validateImage(id) {
    const file = document.getElementById(id).files[0];
    if (!file) return false;
    const t = file.type.split('/').pop().toLowerCase();
    if (!['jpeg','jpg','png','gif'].includes(t)) {
        showToast('danger', 'Invalid file', 'Please select a JPG, PNG or GIF image.');
        document.getElementById(id).value = '';
        return false;
    }
    if (file.size > 1050000) {
        showToast('danger', 'File too large', 'Max upload size is 1 MB.');
        document.getElementById(id).value = '';
        return false;
    }
    return true;
}

/* ── Password visibility toggle ──────────────────────────── */
function togglePw(inputId, iconId) {
    const inp  = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    const isTxt = inp.type === 'text';
    inp.type = isTxt ? 'password' : 'text';
    if (icon) icon.textContent = isTxt ? 'visibility' : 'visibility_off';
}

/* ── Password strength ───────────────────────────────────── */
function checkStrength() {
    const pw    = document.getElementById('newpass').value;
    const fill  = document.getElementById('strength-fill');
    const label = document.getElementById('strength-label');
    const rules = document.getElementById('pw-rules');

    const checks = {
        upper:  /[A-Z]/.test(pw),
        lower:  /[a-z]/.test(pw),
        number: /[0-9]/.test(pw),
        symbol: /[^A-Za-z0-9]/.test(pw),
        length: pw.length >= 8
    };

    const labels = { upper:'Uppercase', lower:'Lowercase', number:'Number', symbol:'Symbol', length:'8+ chars' };
    const score = Object.values(checks).filter(Boolean).length;

    const levels = [
        {pct:0,  color:'',                text:''},
        {pct:20, color:'#ef4444',         text:'Very weak'},
        {pct:40, color:'#f97316',         text:'Weak'},
        {pct:60, color:'#eab308',         text:'Fair'},
        {pct:80, color:'#22c55e',         text:'Strong'},
        {pct:100,color:'var(--success)',  text:'Very strong'},
    ];

    const lvl = levels[Math.min(score, 5)];
    fill.style.width      = lvl.pct + '%';
    fill.style.background = lvl.color;
    label.textContent     = lvl.text;
    label.style.color     = lvl.color || 'var(--muted)';

    rules.innerHTML = Object.entries(checks).map(([key, ok]) =>
        `<span class="pw-rule ${ok ? 'ok' : 'err'}">
            <span class="material-icons">${ok ? 'check_circle' : 'radio_button_unchecked'}</span>
            ${labels[key]}
         </span>`
    ).join('');

    checkMatch();
}

/* ── Password match ──────────────────────────────────────── */
function checkMatch() {
    const pw  = document.getElementById('newpass').value;
    const cfm = document.getElementById('newpass_confirmation').value;
    const el  = document.getElementById('password-match-message');
    if (!cfm) { el.innerHTML = ''; return; }
    if (pw === cfm) {
        el.innerHTML = '<div class="pw-match ok"><span class="material-icons">check_circle</span> Passwords match</div>';
    } else {
        el.innerHTML = '<div class="pw-match err"><span class="material-icons">cancel</span> Passwords do not match</div>';
    }
}

/* ── Generate password ───────────────────────────────────── */
function genPassword() {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const nums  = '23456789';
    const syms  = '!@#$%^&*_-+=?';
    const all   = upper + lower + nums + syms;
    let pw = [
        upper[Math.floor(Math.random() * upper.length)],
        lower[Math.floor(Math.random() * lower.length)],
        nums [Math.floor(Math.random() * nums.length)],
        syms [Math.floor(Math.random() * syms.length)],
    ];
    for (let i = pw.length; i < 14; i++) pw.push(all[Math.floor(Math.random() * all.length)]);
    pw = pw.sort(() => Math.random() - .5).join('');

    document.getElementById('newpass').value = pw;
    document.getElementById('newpass_confirmation').value = pw;
    document.getElementById('newpass').type = 'text';
    document.getElementById('newpass_confirmation').type = 'text';
    document.getElementById('eyeNew').textContent    = 'visibility_off';
    document.getElementById('eyeConfirm').textContent = 'visibility_off';
    checkStrength();
    showToast('success', 'Password Generated', 'A strong password has been set in both fields.');
}

/* ── Change password form ────────────────────────────────── */
$(document).ready(function() {

    const form = document.getElementById('changepassf');

$('#changepassf').on('submit', function(e) {
    e.preventDefault();

    const password = $('#newpass').val();
    const confirm  = $('#newpass_confirmation').val();
    const current  = $('#current_password').val();

    $('.field-error').html('');

    if (!current) { showToast('danger', 'Error', 'Current password is required.'); return; }
    if (password !== confirm) { showToast('danger', 'Error', 'New passwords do not match.'); return; }
    if (!validatePassword(password)) { showToast('danger', 'Error', 'Password does not meet requirements.'); return; }

    const userId = $('#userid').val();
    const url = form.dataset.changepassUrl.replace('__id__', userId);

    const btn  = $('#changepass');
    const orig = btn.html();

    btn.prop('disabled', true).html('<span class="material-icons spin">sync</span> Saving…');

    $.ajax({
        url: url,
        type: 'POST',
        data: new FormData(this),
        processData: false,
        contentType: false,
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
            'X-HTTP-Method-Override': 'PUT'
        },
        success: function(response) {
            if (response.status === 'success') {
                showToast('success', 'Password Updated', response.message);
                $('#changepassf')[0].reset();

                document.getElementById('strength-fill').style.width = '0%';
                document.getElementById('strength-label').textContent = '';
                document.getElementById('pw-rules').innerHTML = '';
                document.getElementById('password-match-message').innerHTML = '';
            }
        },
        error: function(xhr) {
            if (xhr.status === 422) {
                const errors = xhr.responseJSON.errors || {};
                $.each(errors, function(key, val) {
                    $('#' + key + '-error').html(val[0]);
                });
                showToast('danger', 'Validation Error', 'Please check the form for errors.');
            } else {
                showToast('danger', 'Error', 'Something went wrong.');
            }
        },
        complete: function() {
            btn.prop('disabled', false).html(orig);
        }
    });
});

    // Spinner style
    $('<style nonce="{{ $cspNonce }}">.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style>').appendTo('head');


    $('#pw-btn').on('click', function () {
        togglePw('current_password','eyeCurrent');
     });

     $('#pw-btn2').on('click', function () {
        togglePw('newpass','eyeNew');
     });
      $('#pw-btn3').on('click', function () {
        togglePw('newpass_confirmation','eyeConfirm');
     });

      $('#newpass').on('input', function () {
        checkStrength();
     });

     $('#newpass_confirmation').on('input', function () {
        checkMatch();
     });

     $('#generate-password').on('click', function () {
        genPassword();
     });

      $('#profile_photo_input').on('change', function () {
        validateImage('profile_photo_input');
     });

      $('#btn-icon').on('click', function () {
        closePhotoModal();
     });
     $('#btn-ghost').on('click', function () {
        closePhotoModal();
     });
     $('#edit-btn').on('click', function () {
        openPhotoModal();
     });
});

function validatePassword(password) {
    if (password.length < 8) return false;
    const rules = [/[A-Z]/.test(password), /[a-z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
    return rules.filter(Boolean).length >= 3;
}

/* ── Toast ───────────────────────────────────────────────── */
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

/* Legacy shim */
function showMessage(msg, type) {
    showToast(type === 'success' ? 'success' : 'danger', type === 'success' ? 'Success' : 'Error', msg);
}