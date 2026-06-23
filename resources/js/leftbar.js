(function () {
    'use strict';

    function init() {
        const menu        = document.getElementById('accordion-menu');
        if (!menu) return;

        const topItems    = menu.querySelectorAll(':scope > li');
        const current     = window.location.pathname.replace(/\/$/, '');

        // ── Submenu slide helpers ──────────────────────────────────────
        function slideDown(submenu) {
            submenu.style.display    = 'block';
            submenu.style.maxHeight  = '0';
            submenu.style.overflow   = 'hidden';
            submenu.style.transition = 'max-height 0.28s cubic-bezier(0.4,0,0.2,1)';
            // Force reflow then animate
            requestAnimationFrame(function () {
                submenu.style.maxHeight = submenu.scrollHeight + 'px';
            });
            submenu.addEventListener('transitionend', function handler() {
                submenu.style.maxHeight  = 'none';
                submenu.style.overflow   = '';
                submenu.style.transition = '';
                submenu.removeEventListener('transitionend', handler);
            }, { once: true });
        }

        function slideUp(submenu) {
            submenu.style.maxHeight  = submenu.scrollHeight + 'px';
            submenu.style.overflow   = 'hidden';
            submenu.style.transition = 'max-height 0.25s cubic-bezier(0.4,0,0.2,1)';
            requestAnimationFrame(function () {
                submenu.style.maxHeight = '0';
            });
            submenu.addEventListener('transitionend', function handler() {
                submenu.style.display    = 'none';
                submenu.style.maxHeight  = '';
                submenu.style.overflow   = '';
                submenu.style.transition = '';
                submenu.removeEventListener('transitionend', handler);
            }, { once: true });
        }

        // ── Open / close a parent li ───────────────────────────────────
        function openItem(li) {
            const sub = li.querySelector(':scope > .submenu');
            li.classList.add('open', 'active');
            if (sub) slideDown(sub);
        }

        function closeItem(li) {
            const sub = li.querySelector(':scope > .submenu');
            li.classList.remove('open', 'active');
            if (sub) slideUp(sub);
        }

        // ── Hide all submenus on page load (no flash) ──────────────────
        topItems.forEach(function (li) {
            const sub = li.querySelector(':scope > .submenu');
            if (sub) sub.style.display = 'none';
        });

        // ── Click handler for every top-level anchor ───────────────────
        topItems.forEach(function (li) {
            const a   = li.querySelector(':scope > a');
            const sub = li.querySelector(':scope > .submenu');
            if (!a) return;

            a.addEventListener('click', function (e) {
                const href = (a.getAttribute('href') || '').trim();
                const isToggle = href === 'javascript:;'
                              || href === 'javascript:void(0)'
                              || href === '#'
                              || href === '';

                // Parent toggle — swallow the navigation entirely
                if (isToggle || sub) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (!sub) return; // no children, nothing to do

                    const isOpen = li.classList.contains('open');

                    // Accordion — close all siblings
                    topItems.forEach(function (sibling) {
                        if (sibling !== li && sibling.classList.contains('open')) {
                            closeItem(sibling);
                        }
                    });

                    // Toggle self
                    if (isOpen) {
                        closeItem(li);
                    } else {
                        openItem(li);
                    }
                }
                // Real hrefs fall through and navigate normally
            });
        });

        // ── Active page highlight ──────────────────────────────────────
        // Child links
        menu.querySelectorAll('.submenu li a').forEach(function (a) {
            const href = (a.getAttribute('href') || '').trim();
            if (!href || href === '#' || href.startsWith('javascript')) return;

            let path;
            try {
                path = href.startsWith('http')
                    ? new URL(href).pathname
                    : '/' + href.replace(/^\//, '');
            } catch (e) { return; }

            if (path.replace(/\/$/, '') === current) {
                a.classList.add('active');
                a.closest('li')?.classList.add('active');

                // Open parent silently (no animation on page load)
                const parentLi = a.closest('#accordion-menu > li');
                if (parentLi) {
                    const sub = parentLi.querySelector(':scope > .submenu');
                    parentLi.classList.add('open', 'active');
                    if (sub) {
                        sub.style.display   = 'block';
                        sub.style.maxHeight = 'none';
                    }
                }
            }
        });

        // Top-level no-arrow links
        menu.querySelectorAll(':scope > li > a.no-arrow').forEach(function (a) {
            const href = (a.getAttribute('href') || '').trim();
            if (!href || href === '#' || href.startsWith('javascript')) return;

            let path;
            try {
                path = href.startsWith('http')
                    ? new URL(href).pathname
                    : '/' + href.replace(/^\//, '');
            } catch (e) { return; }

            if (path.replace(/\/$/, '') === current) {
                a.closest('li')?.classList.add('active');
            }
        });

        // ── Sidebar close button ───────────────────────────────────────
        document.getElementById('sidebarCloseBtn')
            ?.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                document.body.classList.remove('sidebar-open', 'open', 'left-sidebar-open');
                document.querySelector('.left-side-bar')?.classList.remove('open');
            });
    }

    // Run after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();