// ✅ CORRECT order — globals FIRST, then everything else
import jQuery from 'jquery';
import * as Popper from '@popperjs/core';
import * as bootstrap from 'bootstrap';
import 'bootstrap';
import DataTable from 'datatables.net-bs5';
import 'datatables.net-responsive-bs5';

import Alpine from 'alpinejs';
import select2 from 'select2';
import Highcharts from 'highcharts';



// ✅ Set ALL globals immediately — Vite hoists imports so these
// run as soon as the module executes
window.jQuery  = jQuery;
window.$       = jQuery;
window.Popper  = Popper;
window.bootstrap = bootstrap;
window.DataTable = DataTable;
$.fn.dataTable   = DataTable;
window.Highcharts = Highcharts;


select2(window);

// CSRF
const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (token) {
    jQuery.ajaxSetup({
        headers: { 'X-CSRF-TOKEN': token }
    });
}



// Bootstrap modal helpers
window.showModal = function (id) {
    const el = document.getElementById(id);
    if (!el) return console.error(`Modal #${id} not found`);
    (bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el)).show();
};
window.hideModal = function (id) {
    const el = document.getElementById(id);
    if (!el) return console.error(`Modal #${id} not found`);
    bootstrap.Modal.getInstance(el)?.hide();
};

// App routes
window.App = window.App || {};
function initAppRoutes() {
    const el = document.getElementById('appConfig');
    if (el) {
        try {
            window.App.routes = JSON.parse(el.dataset.routes);
        } catch (e) {
            window.App.routes = {};
        }
    } else {
        window.App.routes = {};
    }
    window.App.route = function (key) {
        const url = window.App.routes[key];
        if (!url) console.error(`App.route: unknown key "${key}"`);
        return url;
    };
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppRoutes);
} else {
    initAppRoutes();
}


window.bsAlert = function ({ icon = 'info', title = '', message = '', onClose = null } = {}) {
    const icons = {
        success: '<i class="bi bi-check-circle-fill text-success" style="font-size:2.5rem"></i>',
        error:   '<i class="bi bi-x-circle-fill text-danger"     style="font-size:2.5rem"></i>',
        warning: '<i class="bi bi-exclamation-triangle-fill text-warning" style="font-size:2.5rem"></i>',
        info:    '<i class="bi bi-info-circle-fill text-primary" style="font-size:2.5rem"></i>',
    };

    document.getElementById('alertModalTitle').textContent   = title;
    document.getElementById('alertModalMessage').textContent = message;
    document.getElementById('alertModalIcon').innerHTML      = icons[icon] ?? icons.info;

    const modalEl = document.getElementById('alertModal');
    const modal   = bootstrap.Modal.getOrCreateInstance(modalEl);

    if (onClose) {
        modalEl.addEventListener('hidden.bs.modal', onClose, { once: true });
    }

    modal.show();
};

// ── bsConfirm — replaces Swal.fire for confirmations ─────────────────────────
window.bsConfirm = function ({
    icon         = 'warning',
    title        = 'Are you sure?',
    message      = '',
    confirmText  = 'Confirm',
    cancelText   = 'Cancel',
    confirmClass = 'btn-primary',
    onConfirm    = null,
} = {}) {
    const icons = {
        success: '<i class="bi bi-check-circle-fill text-success" style="font-size:2.5rem"></i>',
        error:   '<i class="bi bi-x-circle-fill text-danger"     style="font-size:2.5rem"></i>',
        warning: '<i class="bi bi-exclamation-triangle-fill text-warning" style="font-size:2.5rem"></i>',
        info:    '<i class="bi bi-info-circle-fill text-primary" style="font-size:2.5rem"></i>',
    };

    document.getElementById('confirmModalTitle').textContent   = title;
    document.getElementById('confirmModalMessage').textContent = message;
    document.getElementById('confirmModalIcon').innerHTML      = icons[icon] ?? icons.warning;

    const okBtn     = document.getElementById('confirmModalOk');
    const cancelBtn = document.getElementById('confirmModalCancel');

    okBtn.textContent     = confirmText;
    okBtn.className       = `btn ${confirmClass}`;
    cancelBtn.textContent = cancelText;

    const modalEl = document.getElementById('confirmModal');
    const modal   = bootstrap.Modal.getOrCreateInstance(modalEl);

    // Replace onclick each time to avoid stacking handlers
    okBtn.onclick = function () {
        modal.hide();
        if (onConfirm) onConfirm();
    };

    cancelBtn.onclick = function () {
        modal.hide();
    };

    modal.show();
};

// Alpine last — it scans the DOM on start
window.Alpine = Alpine;
Alpine.start();