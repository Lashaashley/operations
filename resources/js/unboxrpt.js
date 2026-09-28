let issuesTable = null;
let activeLotId = null;

function loadIssuesTable() {
    if (issuesTable) {
        issuesTable.ajax.reload(null, false);
        return;
    }

    issuesTable = $('#users-table').DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: App.routes.unboxingrec,
            type: 'GET',
            error: function (xhr, error, thrown) {
                console.error('DataTable error:', error, thrown);
                showToast('danger', 'Error', 'Failed to load issues data.');
            }
        },
        columns: [
            {
        data: null,
        orderable: false,
        searchable: false,
        className: 'col-select',
        width: '36px',
        render: function(data, type, row) {
            return `<input type="checkbox"
                           class="row-select"
                           data-id="${row.actions}"
                           data-lot="${row.LotNumber}"
                           data-partnum="${row.PartNumber}">`;
        }
    },
            { data: 'Model', orderable: true },
            { data: 'LotNumber', orderable: true },
            { data: 'PartNumber', orderable: true },
            { 
                data: 'Quantity', 
                orderable: true,
                render: function(data) {
                    if (data > 0) {
                        return `<span style="color: #DC2626; font-weight: 700;">${data}</span>`;
                    }
                    return data;
                }
            },
            { data: 'CheckedAt', orderable: true },
            { data: 'CheckedBy', orderable: true },
            { 
                data: 'Comment', 
                orderable: true,
                render: function(data) {
                    // Truncate long comments
                    if (data && data.length > 50) {
                        return data.substring(0, 50) + '...';
                    }
                    return data || '—';
                }
            },
            {
                data: 'actions',
                orderable: false,
                searchable: false,
                render: function(data, type, row) {
                    return `
                        <div class="action-wrap">
                            <button class="action-trigger" data-action="toggle-menu">
                                <span class="material-icons">more_horiz</span>
                            </button>
                            <div class="action-menu">
                                <a href="#" class="view-issue" data-id="${data}">
                                    <span class="material-icons">visibility</span> View Details
                                </a>
                                <a href="#" class="view-images" data-id="${data}">
                                    <span class="material-icons">image</span> View Images
                                </a>
                            </div>
                        </div>`;
                }
            }
        ],
        order: [[1, 'asc']],
        pageLength: 25,
        dom: 'rtp',
        language: {
            processing: '<span style="color:var(--muted);font-size:13px;">Loading…</span>',
            emptyTable: 'No NOK issues found.',
            zeroRecords: 'No issues match your search.'
        },
        drawCallback: function () {
            const info = this.api().page.info();
            const total = info.recordsTotal.toLocaleString();
            const display = info.recordsDisplay.toLocaleString();
            document.getElementById('recordCount').textContent =
                info.recordsTotal === info.recordsDisplay
                    ? `${total} Issues`
                    : `${display} of ${total} Issues`;
        }
    });
}
/* ─── Bulk selection tracking ─────────────────────────────────────────── */

function getSelectedRows() {
    return Array.from(document.querySelectorAll('.row-select:checked'))
        .map(cb => ({
            id: cb.dataset.id,
            lot: cb.dataset.lot,
            partnum: cb.dataset.partnum,
        }));
}

function updateBulkButton() {
    const btn = document.getElementById('bulk-initiate-rob');
    if (!btn) return;

    const selected = getSelectedRows();
    const countEl = btn.querySelector('.bulk-count');

    if (selected.length === 0) {
        btn.disabled = true;
        btn.classList.remove('bulk-ready', 'bulk-invalid');
        btn.title = 'Select one or more rows to initiate rob';
        if (countEl) countEl.textContent = '';
        return;
    }

    const uniqueLots = [...new Set(selected.map(r => r.lot))];

    if (uniqueLots.length > 1) {
        btn.disabled = true;
        btn.classList.remove('bulk-ready');
        btn.classList.add('bulk-invalid');
        btn.title = 'All selected rows must be from the same Lot Number';
        if (countEl) countEl.textContent = `(${selected.length})`;
        return;
    }

    btn.disabled = false;
    btn.classList.remove('bulk-invalid');
    btn.classList.add('bulk-ready');
    btn.title = `Initiate rob for ${selected.length} issue(s) from Lot ${uniqueLots[0]}`;
    if (countEl) countEl.textContent = `(${selected.length})`;
}

// Delegate checkbox changes (works across pagination redraws)
$(document).on('change', '.row-select', updateBulkButton);

// Re-evaluate after every DataTable redraw (pagination, search, sort)
$(document).on('draw.dt', '#users-table', function() {
    updateBulkButton();
});

// Bulk initiate click
$(document).on('click', '#bulk-initiate-rob', function() {
    if (this.disabled) return;

    const selected = getSelectedRows();
    if (selected.length === 0) return;

    const uniqueLots = [...new Set(selected.map(r => r.lot))];
    if (uniqueLots.length > 1) {
        showToast('danger', 'Invalid Selection',
                  'All selected rows must be from the same Lot Number.');
        return;
    }

    const ids = selected.map(r => r.id).join(',');
    const url = `${App.routes.newRobPage}?issue_ids=${ids}`;
    console.log('[BulkRob] navigating to', url);
    window.location.href = url;
});

// ─── Initialize when document is ready ──────────────────────────────────
$(document).ready(function() {
    
    loadIssuesTable();

    // ─── Export to Excel ────────────────────────────────────────────────
    $('#export-excel').on('click', function() {
        const table = $('#users-table').DataTable();
        const data = table.rows({ search: 'applied' }).data().toArray();
        
        // Prepare data for export
        const exportData = data.map(row => ({
            'Model': row.Model,
            'Lot Number': row.LotNumber,
            'Part Number': row.PartNumber,
            'Shortage Qty': row.Quantity,
            'Checked At': row.CheckedAt,
            'Checked By': row.CheckedBy,
            'Comment': row.Comment
        }));
        
        // Convert to CSV
        const csv = convertToCSV(exportData);
        downloadCSV(csv, 'unboxing_issues.csv');
    });

    // ─── Export to PDF ──────────────────────────────────────────────────
    $('#export-pdf').on('click', function() {
        const table = $('#users-table').DataTable();
        const data = table.rows({ search: 'applied' }).data().toArray();
        
        // Open print dialog or generate PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Unboxing Issues Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #003366; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #003366; color: white; padding: 10px; text-align: left; }
                    td { padding: 8px; border-bottom: 1px solid #ddd; }
                    tr:nth-child(even) { background: #f9f9f9; }
                    .summary { margin-top: 20px; color: #666; }
                </style>
            </head>
            <body>
                <h1>Unboxing Issues Report</h1>
                <p>Generated: ${new Date().toLocaleString()}</p>
                <p>Total Issues: ${data.length}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Model</th>
                            <th>Lot Number</th>
                            <th>Part Number</th>
                            <th>Shortage Qty</th>
                            <th>Checked At</th>
                            <th>Checked By</th>
                            <th>Comment</th>
                        </tr>
                    </thead>
                    <tbody>`;
            
            data.forEach(row => {
                html += `
                    <tr>
                        <td>${row.Model || 'N/A'}</td>
                        <td>${row.LotNumber || 'N/A'}</td>
                        <td>${row.PartNumber || 'N/A'}</td>
                        <td>${row.Quantity || 0}</td>
                        <td>${row.CheckedAt || 'N/A'}</td>
                        <td>${row.CheckedBy || 'N/A'}</td>
                        <td>${row.Comment || '—'}</td>
                    </tr>`;
            });
            
            html += `
                    </tbody>
                </table>
                <div class="summary">
                    Total Issues: ${data.length} | 
                    Generated: ${new Date().toLocaleString()}
                </div>
            </body>
            </html>`;
            
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 500);
        }
    });

    // ─── Search functionality ──────────────────────────────────────────
    $('#dt-search').on('keyup', function() {
        const table = $('#users-table').DataTable();
        table.search(this.value).draw();
    });

    // ─── Page length functionality ─────────────────────────────────────
    $('#dt-length').on('change', function() {
        const table = $('#users-table').DataTable();
        table.page.len(parseInt(this.value)).draw();
    });

    // ─── Action menu toggle ────────────────────────────────────────────
    $(document).on('click', '.action-trigger', function(e) {
        e.stopPropagation();
        const menu = $(this).closest('.action-wrap').find('.action-menu');
        $('.action-menu').not(menu).removeClass('active');
        menu.toggleClass('active');
    });

    // ─── Close menus when clicking elsewhere ──────────────────────────
    $(document).on('click', function() {
        $('.action-menu').removeClass('active');
    });
});

// ─── Helper functions ────────────────────────────────────────────────────

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
        headers.map(header => {
            const value = row[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
document.addEventListener('DOMContentLoaded', function () {


$(document).on('click', '.view-issue', function (e) {
    e.preventDefault();
    const recordId = $(this).data('id');
    openIssueModal(recordId);
});

// ─── Open Issue Modal ──────────────────────────────────────────────────────
function openIssueModal(recordId) {
    console.log('=== openIssueModal ===');
    console.log('Record ID:', recordId);

   $('#recordid').val(recordId);
    
    // Reset modal state
    resetModalFields();
    
    // Show modal
    const modal = document.getElementById('updatekitsstatusModalBackdrop');
    if (modal) modal.style.display = 'flex';

    // Build the URL with the record ID
    const recordDetailUrl = App.routes.unboxrecord.replace('__id__', recordId);
    console.log('Fetching from URL:', recordDetailUrl);
    
    // Show loading state in the modal body
    showModalLoading(true);

    fetch(recordDetailUrl)
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Failed to load record details: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('=== API Response Data ===');
            console.log('Full response:', data);
            console.log('Images in response:', data.images);
            console.log('Images length:', data.images ? data.images.length : 0);
            
            showModalLoading(false);
            renderIssueDetails(data);
        })
        .catch(error => {
            console.error('❌ Error in openIssueModal:', error);
            showModalLoading(false);
            showToast('danger', 'Error', 'Failed to load record details: ' + error.message);
            // Close modal on error
            setTimeout(closeModal, 1500);
        });
}
// ─── Reset Modal Fields ──────────────────────────────────────────────────
function resetModalFields() {
    const fieldIds = [
        'modal-lotnum', 'modal-customer', 'modal-model', 'modal-boxcase',
        'modal-partnum', 'modal-partdesc', 'modal-required_qty', 'modal-counted_qty',
        'modal-shortage_qty', 'modal-status', 'modal-checkedby', 'modal-checkedat',
        'modal-comment'
    ];
    
    fieldIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '—';
        }
    });
    
    // Reset status to default
    const statusEl = document.getElementById('modal-status');
    if (statusEl) {
        statusEl.innerHTML = '—';
    }
    
    // Hide images section
    const imagesSection = document.getElementById('modal-images-section');
    if (imagesSection) {
        imagesSection.style.display = 'none';
    }
    
    // Clear images container
    const container = document.getElementById('modal-images-container');
    if (container) {
        container.innerHTML = '';
    }
    
    // Hide advance button
    const advanceBtn = document.getElementById('advance-status-btn');
    if (advanceBtn) {
        advanceBtn.style.display = 'none';
    }
}

// ─── Show Modal Loading ──────────────────────────────────────────────────
function showModalLoading(loading) {
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) return;
    
    if (loading) {
        modalBody.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; padding: 40px;">
                <div style="text-align: center;">
                    <div style="width: 40px; height: 40px; border: 4px solid #E5E7EB; border-top-color: #991B1B; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px;"></div>
                    <span style="color: #6B7280; font-size: 14px;">Loading issue details...</span>
                </div>
            </div>
        `;
    } else {
        // Restore the modal body - we need to rebuild it
        // In a real app, you'd have a function to build the modal HTML
        // For now, we'll let renderIssueDetails populate it
        // But we need to ensure the structure exists
        const body = document.querySelector('.modal-body');
        if (body) {
            // Check if the detail grid exists, if not rebuild it
            if (!body.querySelector('.detail-grid')) {
                body.innerHTML = `
                    <div class="detail-grid">
                        <div class="detail-item"><label>Lot Number</label><span id="modal-lotnum">—</span></div>
                        <div class="detail-item"><label>Customer</label><span id="modal-customer">—</span></div>
                        <div class="detail-item"><label>Model</label><span id="modal-model">—</span></div>
                        <div class="detail-item"><label>Box Case</label><span id="modal-boxcase">—</span></div>
                        <div class="detail-item"><label>Part Number</label><span id="modal-partnum">—</span></div>
                        <div class="detail-item"><label>Part Description</label><span id="modal-partdesc">—</span></div>
                        <div class="detail-item"><label>Required Qty</label><span id="modal-required_qty">—</span></div>
                        <div class="detail-item"><label>Counted Qty</label><span id="modal-counted_qty">—</span></div>
                        <div class="detail-item"><label>Shortage Qty</label><span id="modal-shortage_qty">—</span></div>
                        <div class="detail-item"><label>Status</label><span id="modal-status">—</span></div>
                        <div class="detail-item"><label>Checked By</label><span id="modal-checkedby">—</span></div>
                        <div class="detail-item"><label>Checked At</label><span id="modal-checkedat">—</span></div>
                        <div class="detail-item full-width"><label>Comment</label><span id="modal-comment" style="background: #F9FAFB; padding: 8px 12px; border-radius: 4px; display: block;">—</span></div>
                    </div>
                    <div id="modal-images-section" style="margin-top: 16px; display: none;">
                        <div class="section-divider"><span>Evidence Images</span></div>
                        <div id="modal-images-container" class="image-gallery"></div>
                    </div>
                `;
            }
        }
    }
}

// ─── Render Issue Details ──────────────────────────────────────────────────
// ─── Render Issue Details ──────────────────────────────────────────────────
let currentIssueRecordId = null;
function renderIssueDetails(data) {
  
    const { record, lot, images } = data;



    // Helper function to safely set text content
    function setTextContent(id, value, defaultValue = 'N/A') {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value || defaultValue;
        } else {
            console.warn('Element not found:', id);
        }
    }

    // Helper function to safely set HTML content
    function setHTMLContent(id, html) {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = html;
        } else {
            console.warn('Element not found:', id);
        }
    }
      currentIssueRecordId = record.record_id;

      console.log(currentIssueRecordId);

    // Lot info
    setTextContent('modal-lotnum', lot?.lotnum);
    setTextContent('modal-customer', lot?.cname);
    setTextContent('modal-model', lot?.mname);
    
    // Record info
    setTextContent('modal-boxcase', record?.boxcase);
    setTextContent('modal-partnum', record?.partnum);
    setTextContent('modal-partdesc', record?.partdesc);
    setTextContent('modal-required_qty', record?.required_qty);
    setTextContent('modal-counted_qty', record?.counted_qty);
    
    // Calculate shortage
    const shortage = (record?.required_qty || 0) - (record?.counted_qty || 0);
    const shortageElement = document.getElementById('modal-shortage_qty');
    if (shortageElement) {
        shortageElement.textContent = shortage > 0 ? shortage : '0';
        shortageElement.style.color = shortage > 0 ? '#DC2626' : '#065F46';
        shortageElement.style.fontWeight = '700';
    }
    
    // Status with badge
    const status = record?.status || 'N/A';
    const statusClass = status.toLowerCase();
    setHTMLContent('modal-status', `<span class="status-badge ${statusClass}">${status}</span>`);
    
    // Checked by and at
    setTextContent('modal-checkedby', record?.checked_by_name);
    setTextContent('modal-checkedat', record?.checked_at ? new Date(record.checked_at).toLocaleString() : null);
    
    // Comment
    setTextContent('modal-comment', record?.comment || 'No comment provided.');

    // ── Render Images ──
    const imagesSection = document.getElementById('modal-images-section');
    const imagesContainer = document.getElementById('modal-images-container');
    
   
    
    if (imagesSection && imagesContainer) {
        // Check if images exist and is an array with items
        const hasImages = images && Array.isArray(images) && images.length > 0;
       
        
        if (hasImages) {
           
            imagesSection.style.display = 'block';
            imagesContainer.innerHTML = '';
            
            // Log each image details
            images.forEach((image, index) => {
          
                
                const imgWrapper = document.createElement('div');
                imgWrapper.className = 'image-item';
                
                const img = document.createElement('img');
                // Prefer data (base64) over path
                img.src = image.data || image.path || '';
                img.alt = `Evidence ${index + 1}`;
                img.loading = 'lazy';
                
            
                
                // Handle image load error
                img.onerror = function() {
                    console.error(`❌ Failed to load image ${index + 1}:`, img.src);
                    this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"%3E%3Crect width="150" height="150" fill="%23F3F4F6"/%3E%3Ctext x="75" y="75" font-family="Arial" font-size="12" fill="%239CA3AF" text-anchor="middle" dominant-baseline="central"%3ENo Image%3C/text%3E%3C/svg%3E';
                };
                
                // Handle successful load
                img.onload = function() {
                 
                };
                
                const counter = document.createElement('span');
                counter.className = 'image-counter';
                counter.textContent = `${index + 1}/${images.length}`;
                
                imgWrapper.appendChild(img);
                imgWrapper.appendChild(counter);
                imagesContainer.appendChild(imgWrapper);

                imgWrapper.style.cursor = 'pointer';
                imgWrapper.addEventListener('click', () => openLightbox(images, index));
            });
            
            
        } else {
           
            if (images) {
                
            }
            
            imagesSection.style.display = 'block';
            imagesContainer.innerHTML = `
                <div class="no-images">
                    <span class="material-icons" style="font-size: 48px; display: block; margin: 0 auto 8px; color: #D1D5DB;">image_not_supported</span>
                    No images available for this issue.
                    <br>
                    <small style="color: #9CA3AF; font-size: 11px;">Debug: ${images ? `Received ${images.length || '0'} images` : 'No images data'}</small>
                </div>
            `;
        }
    } else {
        console.error('❌ Images section or container not found in DOM');
    }

    // Show/hide advance button if needed
    const advanceBtn = document.getElementById('advance-status-btn');
    if (advanceBtn) {
        if (record?.status === 'NOK') {
            advanceBtn.style.display = 'inline-flex';
            const label = document.getElementById('advance-btn-label');
            if (label) label.textContent = 'Mark Resolved';
        } else {
            advanceBtn.style.display = 'none';
        }
    }
    
    
}
let lightboxImages = [];
let lightboxIndex = 0;

function openLightbox(images, startIndex) {
    lightboxImages = images;
    lightboxIndex = startIndex;
    renderLightboxImage();
    document.getElementById('lightboxBackdrop').style.display = 'flex';
}

function renderLightboxImage() {
    const image = lightboxImages[lightboxIndex];
    document.getElementById('lightboxImage').src = image.data || image.path || '';
    document.getElementById('lightboxCounter').textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;

    // Hide nav arrows entirely when there's only one image
    const multiple = lightboxImages.length > 1;
    document.getElementById('lightboxPrev').style.display = multiple ? 'flex' : 'none';
    document.getElementById('lightboxNext').style.display = multiple ? 'flex' : 'none';
}

function closeLightbox() {
    document.getElementById('lightboxBackdrop').style.display = 'none';
}

document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightboxBackdrop').addEventListener('click', function (e) {
    if (e.target === this) closeLightbox(); // click outside the image closes it
});
document.getElementById('lightboxPrev').addEventListener('click', function () {
    lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
    renderLightboxImage();
});
document.getElementById('lightboxNext').addEventListener('click', function () {
    lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
    renderLightboxImage();
});
document.addEventListener('keydown', function (e) {
    if (document.getElementById('lightboxBackdrop').style.display !== 'flex') return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') document.getElementById('lightboxPrev').click();
    if (e.key === 'ArrowRight') document.getElementById('lightboxNext').click();
});
// ─── Close Modal ──────────────────────────────────────────────────────────
function closeModal() {
    document.getElementById('updatekitsstatusModalBackdrop').style.display = 'none';
    activeLotId = null;
}

// ─── Close Modal Events ──────────────────────────────────────────────────
// Close on backdrop click
document.getElementById('modalCloseBtn').addEventListener('click',  closeModal);
document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
document.getElementById('updatekitsstatusModalBackdrop').addEventListener('click', function (e) {
    if (e.target === this) closeModal(); // click outside closes
});




        $('#lot-select').select2({
    placeholder: 'Search for a lot…',
    allowClear: true,
    width: '100%',
    templateResult:    formatLotOption,  // dropdown items
    templateSelection: formatLotSelected // selected item
});
    $.ajax({
        url: App.routes.depts,
        type: "GET",
        success: function (response) {
            const dropdown = $('#model');
            dropdown.empty();
            dropdown.append('<option value="">Select Model</option>');
            response.data.forEach(function (model) {
                const $option = $('<option>')
                .val(model.id)           
                .text(model.mname); 
                dropdown.append($option);
            });
        },
        error: function () {
            alert('Failed to load branches. Please try again.');
        },
    });

    document.getElementById('initiate-rob-btn').addEventListener('click', function () {
    const currentIssueRecordId = $('#recordid').val();
    console.log('[InitiateRob] clicked, recordid =', currentIssueRecordId);

    if (!currentIssueRecordId) {
        showToast('danger', 'Error', 'No record selected.');
        return;
    }

    const url = `${App.routes.newRobPage}?issue_id=${currentIssueRecordId}`;
    console.log('[InitiateRob] navigating to', url);

    window.location.href = url;
});

    $('#model').on('change', function() {
    const modelId = $(this).val();
    if (modelId) { 
        loadLotsByModel(modelId);
    } else {
        // Clear lots dropdown
        const $select = $('#lot-select');
        $select.empty().append('<option value="">-- Select a Lot --</option>');
        
    }
});

 $('#lot-select').on('change', function() {
    const lotid = $(this).val();
    if (lotid) { 
        loadcasebylot(lotid);
    } else {
        // Clear lots dropdown
        const $select = $('#case');
        $select.empty().append('<option value="">-- Select a Case --</option>');
        
    }
});

let currentLotId  = null;
let currentCase   = null;

// Triggered when #case select changes
$('#case').on('change', function () {
    const boxcase = $(this).val();
    const lotId   = $('#lot-select').val();

    if (!boxcase || !lotId) {
        resetPartsContainer();
        return;
    }

    currentLotId = lotId;
    currentCase  = boxcase;

    loadPartsForCase(lotId, boxcase);
});


 document.getElementById('viewrpt').addEventListener('click', function () {
    const lotId = document.getElementById('lot-select').value;

    if (!lotId) {
        showToast('warning', 'Required', 'Please select a lot first.');
        return;
    }

    // Open modal in loading state
    document.getElementById('pdfModalBackdrop').style.display = 'flex';
    document.getElementById('pdf-loading').style.display      = 'flex';
    document.getElementById('pdf-frame').style.display        = 'none';
    document.getElementById('pdf-modal-title').textContent    = 'Generating Report…';

    fetch(`${App.routes.reportUnboxing}?lot_id=${lotId}`)
    .then(r => r.json())
    .then(data => {
        if (data.error) throw new Error(data.error);

        const byteCharacters = atob(data.pdf);
        const byteArray      = new Uint8Array([...byteCharacters].map(c => c.charCodeAt(0)));
        const blob           = new Blob([byteArray], { type: 'application/pdf' });
        const blobUrl        = URL.createObjectURL(blob);

        const frame = document.getElementById('pdf-frame');
        frame.src   = blobUrl;

        // Hide spinner, show iframe
        document.getElementById('pdf-loading').style.display = 'none';
        frame.style.display = 'block';

        document.getElementById('pdf-modal-title').textContent =
            `Lot ${data.lot_num} — Time Taken: ${data.time_taken}`;
    })
    .catch(err => {
        document.getElementById('pdfModalBackdrop').classList.remove('open');
        showToast('danger', 'Error', err.message || 'Failed to generate report.');
    });
});

document.getElementById('pdfModalClose').addEventListener('click', function () {
    document.getElementById('pdfModalBackdrop').style.display = 'none';
    document.getElementById('pdf-frame').src = '';
});


});


function loadLotsByModel(modelId) {
    const $select = $('#lot-select');

    // Reset and show loading
    $select.empty().append('<option value="">Loading…</option>').trigger('change');

    fetch(`${App.routes.getLotsByModel}?modelId=${modelId}`)
        .then(r => r.json())
        .then(response => {
            $select.empty().append('<option value="">-- Select a Lot --</option>');

            if (response.data.length === 0) {
                $select.append('<option disabled>No lots found for this model</option>');
            } else {
                response.data.forEach(lot => {
                    // Create option with proper data attributes
                    const option = document.createElement('option');
                    option.value = lot.id;
                    option.textContent = lot.lotnum;
                    
                    // Store data attributes
                    $(option).data('color', lot.color);
                    $(option).data('status', lot.status);
                    $(option).data('statusid', lot.statusid); // Store the statusid
                    
                    $select.append(option);
                });
            }

            $select.trigger('change'); // refresh Select2
        })
        .catch(() => {
            $select.empty().append('<option value="">Failed to load lots</option>');
            $select.trigger('change');
        });
}


function formatLotOption(option) {
    if (!option.id) return $('<span>' + option.text + '</span>'); // placeholder

    const color  = $(option.element).data('color');
    const status = $(option.element).data('status');

    return $(`
        <div style="display:flex; align-items:center; justify-content:space-between; padding:2px 0;">
            <span style="font-weight:500;">${option.text}</span>
            <span style="
                background-color: ${color};
                color: #fff;
                padding: 2px 8px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
            ">${status}</span>
        </div>
    `);
}

// Renders the selected option in the input box
function formatLotSelected(option) {
    if (!option.id) return option.text;

    const color  = $(option.element).data('color');
    const status = $(option.element).data('status');

    return $(`
        <span style="display:flex; align-items:center; gap:8px;">
            <span>${option.text}</span>
            <span style="
                background-color: ${color};
                color: #fff;
                padding: 1px 7px;
                border-radius: 15px;
                font-size: 9px;
                font-weight: 500;
            ">${status}</span>
        </span>
    `);
}


 function loadcasebylot(lotid) {
        $.ajax({
          url: App.routes.getbylot,
          type: "GET",
          data: { lotid: lotid },
          success: function (response) {
            const dropdown = $('#case');
            dropdown.empty();
            dropdown.append('<option value="">Select Case</option>');
            

            response.data.forEach(function (cases) {
                const $option = $('<option>')
                .val(cases.boxcase)           
                .text(cases.boxcase); 
                dropdown.append($option);
            });
          },
          error: function () {
            alert('Failed to load Cases. Please try again.');
          }
        });
      }

      function sanitize2(str) {
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
    const safeType    = sanitize2(type);
    const safeTitle   = sanitize2(title);
    const safeMessage = sanitize2(message);

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

