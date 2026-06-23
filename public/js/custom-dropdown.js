// Custom dropdown handler that prevents dropdowns from closing
document.addEventListener('DOMContentLoaded', function() {
    // Keep track of which dropdowns should stay open
    let keepOpenDropdowns = [];
    let isNavigating = false;
    
    // Add click handler to dropdown toggles in the sidebar (EXCLUDING items with no-arrow class)
    document.querySelectorAll('.sidebar-menu .dropdown-toggle:not(.no-arrow)').forEach(function(toggle) {
        toggle.addEventListener('click', function(e) {
            const dropdown = this.closest('.dropdown');
            const submenu = dropdown.querySelector('.submenu');

            if (!submenu) {
                // No submenu? It's just a link — allow normal behavior
                return;
            }

            // If there is a submenu, prevent navigation and handle dropdown
            e.preventDefault();

            const menuText = dropdown.querySelector('.mtext').textContent.trim();
            localStorage.setItem('openDropdown', menuText);

            if (!keepOpenDropdowns.includes(dropdown)) {
                keepOpenDropdowns.push(dropdown);
            }
        });
    });
    
    // Add click handler to submenu items
    document.querySelectorAll('.sidebar-menu .submenu a').forEach(function(link) {
        link.addEventListener('click', function(e) {
            const dropdown = this.closest('.dropdown');
            isNavigating = true;
            
            // Keep track of this dropdown
            if (!keepOpenDropdowns.includes(dropdown)) {
                keepOpenDropdowns.push(dropdown);
            }
            
            // Store which dropdown contains the clicked link
            const menuText = dropdown.querySelector('.mtext').textContent.trim();
            localStorage.setItem('openDropdown', menuText);
        });
    });
    
    // Check for stored open dropdown
    const storedOpenDropdown = localStorage.getItem('openDropdown');
    if (storedOpenDropdown) {
        document.querySelectorAll('.sidebar-menu .dropdown').forEach(function(dropdown) {
            const menuText = dropdown.querySelector('.mtext');
            if (menuText && menuText.textContent.trim() === storedOpenDropdown) {
                // Open this dropdown
                const submenu = dropdown.querySelector('.submenu');
                if (submenu) {
                    dropdown.classList.add('show');
                    submenu.style.display = 'block';
                    
                    // Add to our tracking list
                    if (!keepOpenDropdowns.includes(dropdown)) {
                        keepOpenDropdowns.push(dropdown);
                    }
                }
            }
        });
    }
    
    // Very important - capture document clicks in the capture phase
    document.addEventListener('click', function(e) {
        // If we're navigating, don't interfere
        if (isNavigating) return;
        
        // If click is outside sidebar menu AND outside any kept-open dropdown, do nothing special
        if (!e.target.closest('.sidebar-menu')) return;
        
        // If click is on a dropdown-toggle, let the normal handler work
        if (e.target.closest('.dropdown-toggle')) return;
        
        // If click is inside a submenu, prevent it from closing the dropdown
        if (e.target.closest('.submenu')) {
            // This is the important part - stop the event from bubbling up
            // to document listeners that might close the dropdown
            e.stopPropagation();
        }
    }, true); // true = capture phase, important!
    
    // Override jQuery's dropdown behavior (if jQuery exists)
    if (typeof jQuery !== 'undefined') {
        // Wait a bit to make sure all jQuery plugins are loaded
        setTimeout(function() {
            // Override any document click handlers
            $(document).off('click.bs.dropdown.data-api');
            $(document).on('click.bs.dropdown.data-api', function(e) {
                // If click is in sidebar, don't close any dropdowns
                if ($(e.target).closest('.sidebar-menu').length) {
                    e.stopPropagation();
                    return false;
                }
            });
            
            // Keep the dropdown open even when clicking elsewhere
            const keepDropdownsOpen = function() {
                if (keepOpenDropdowns.length === 0) return;
                
                keepOpenDropdowns.forEach(function(dropdown) {
                    const $dropdown = $(dropdown);
                    $dropdown.addClass('show');
                    $dropdown.find('.submenu').show();
                });
                
                // Schedule the next check
                setTimeout(keepDropdownsOpen, 100);
            };
            
            // Start the keep-open loop
            keepDropdownsOpen();
        }, 500);
    }
    
    // More aggressive approach - monitor for class changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'class' && 
                mutation.target.classList.contains('dropdown')) {
                
                // Check if this is one of our tracked dropdowns that was closed
                if (keepOpenDropdowns.includes(mutation.target) && 
                    !mutation.target.classList.contains('show')) {
                    
                    // Re-open it
                    setTimeout(function() {
                        mutation.target.classList.add('show');
                        const submenu = mutation.target.querySelector('.submenu');
                        if (submenu) {
                            submenu.style.display = 'block';
                        }
                    }, 0);
                }
            }
        });
    });
    
    // Start observing all dropdown elements
    document.querySelectorAll('.sidebar-menu .dropdown').forEach(function(dropdown) {
        observer.observe(dropdown, { attributes: true });
    });
});