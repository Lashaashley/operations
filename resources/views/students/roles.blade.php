<x-custom-admin-layout>
<head>
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
@vite(['resources/css/pages/roles.css']) 

<div class="roles-page">

    <div class="page-heading">
        <h1>Roles Management</h1>
       
    </div>

    <div class="toast-wrap" id="toastWrap"></div>

    @if(session('success'))
        <div class="diveone" >
            <span class="material-icons font17" >check_circle</span>
            {{ session('success') }}
        </div>
    @endif

    {{-- ── Tab bar ──────────────────────────────────────────── --}}
    <div class="tab-bar">
        <button class="tab-btn active" data-tab="deductions">
            <span class="material-icons">add_circle</span> Create Roles
        </button>
        <button class="tab-btn" data-tab="summaries" id="summaries-tab">
            <span class="material-icons">admin_panel_settings</span> Module Allocation
        </button>
    </div>

    <div class="tab-body">

        {{-- ═══════════════════════════════════════
             TAB 1 — CREATE ROLES
        ═══════════════════════════════════════ --}}
        <div class="tab-panel active" id="panel-deductions">
            <div class="roles-layout">

                {{-- Left: Create role form --}}
                <div class="r-card">
                    <div class="r-card-head">
                        <div class="r-card-icon"><span class="material-icons">add_circle</span></div>
                        <span class="r-card-title">New Role</span>
                    </div>
                    <div class="r-card-body">
                        <form id="rolesform" method="post" data-storerole-url="{{ route('roles.store') }}">
                            @csrf
                            <div class="field">
                                <label>Role Name <span class="req">*</span></label>
                                <input name="rolename" id="rolename" type="text"
                                       placeholder="e.g. Admin" required autocomplete="off">
                                <span class="field-error" id="rolename-error"></span>
                            </div>
                            <div class="field">
                                <label>Description</label>
                                <textarea name="rdesc" id="rdesc" placeholder="Brief description of this role's permissions…" autocomplete="off"></textarea>
                            </div>
                            <button type="submit" class="btn btn-create">
                                <span class="material-icons">save</span> Create Role
                            </button>
                        </form>
                    </div>
                </div>

                {{-- Right: Roles table --}}
                <div class="r-card">
                    <div class="r-card-head">
                        <div class="r-card-icon purple"><span class="material-icons">list</span></div>
                        <span class="r-card-title">All Roles</span>
                    </div>
                    <div class="r-card-body">
                        <div class="overflowx" >
                            <table class="roles-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Description</th>
                                        <th>Options</th>
                                    </tr>
                                </thead>
                                <tbody id="roles-table-body">
                                    <tr>
                                        <td colspan="4" class="yexyalin" >
                                            Loading roles…
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div id="pagination-controls"></div>
                    </div>
                </div>

            </div>
        </div>

        {{-- ═══════════════════════════════════════
             TAB 2 — MODULE ALLOCATION
        ═══════════════════════════════════════ --}}
        <div class="tab-panel" id="panel-summaries">
            <div class="modules-panel-body">

                <form id="moduleAssignForm">
                    @csrf

                    {{-- Role selector --}}
                    <div class="modules-top-row">
                        <div class="field minmargin" >
                            <label>Select Role <span class="req">*</span></label>
                            <div class="select-wrap">
                                <select name="roleid" id="roleid" required>
                                    <option value="">— Select Role —</option>
                                </select>
                            </div>
                            <span class="field-error" id="roleid-error"></span>
                        </div>
                    </div>

                    {{-- Modules tree --}}
                    <div class="modules-scroll" id="modulesContainer">
                        @php
                            function renderButtonsModern($buttons, $parentId = null) {
                                if ($parentId === null) {
                                    // Top level: render parent items with their children
                                    $html = '';
                                    foreach ($buttons as $button) {
                                        if ($button->parentid == null && $button->isparent == 'YES') {
                                            $html .= '<div class="module-group">';

                                            // Parent row
                                            $html .= '<div class="module-parent"  >';
                                            $html .= '<input class="module-checkbox" type="checkbox" name="modules[]" value="' . $button->ID . '" id="module' . $button->ID . '" data-parent="true" data-button-id="' . $button->ID . '">';
                                            $html .= '<div class="m-checkbox"><span class="material-icons">check</span></div>';

                                            // Icon
                                            if ($button->icon) {
                                                if (str_contains($button->icon, '.png') || str_contains($button->icon, '.jpg') || str_contains($button->icon, '.svg')) {
                                                    $html .= '<div class="m-parent-icon"><img src="' . asset($button->icon) . '" alt=""></div>';
                                                } else {
                                                    $html .= '<div class="m-parent-icon"><span class="material-icons fontcolor" >folder</span></div>';
                                                }
                                            } else {
                                                $html .= '<div class="m-parent-icon"><span class="material-icons fontcolor" >folder</span></div>';
                                            }

                                            $html .= '<span class="m-parent-name">' . htmlspecialchars($button->Bname) . '</span>';
                                            $html .= '</div>'; // /module-parent

                                            // Children
                                            $html .= '<div class="module-children">';
                                            foreach ($buttons as $child) {
                                                if ($child->parentid == $button->ID) {
                                                    $html .= '<div class="module-child" >';
                                                    $html .= '<input class="module-checkbox" type="checkbox" name="modules[]" value="' . $child->ID . '" id="module' . $child->ID . '" data-child-of="' . $button->ID . '">';
                                                    $html .= '<div class="m-checkbox"><span class="material-icons">check</span></div>';
                                                    $html .= '<span class="m-child-name">' . htmlspecialchars($child->Bname) . '</span>';
                                                    $html .= '</div>';
                                                }
                                            }
                                            $html .= '</div>'; // /module-children

                                            $html .= '</div>'; // /module-group
                                        }
                                    }
                                    return $html;
                                }
                                return '';
                            }

                            echo renderButtonsModern($buttons);
                        @endphp
                    </div>

                    {{-- Action row --}}
                    <div class="modules-actions">
                        <button type="button" class="btn btn-assign" id="assignBtn">
                            <span class="material-icons">assignment</span> Assign Modules
                        </button>
                        <button type="button" class="btn btn-select" id="selectAllBtn">
                            <span class="material-icons">done_all</span> Select All
                        </button>
                        <button type="button" class="btn btn-clear" id="deselectAllBtn">
                            <span class="material-icons">close</span> Deselect All
                        </button>
                        <a href="{{ route('roles.report') }}" class="btn btn-report" target="_blank">
                            <span class="material-icons">picture_as_pdf</span> Roles Report
                        </a>
                    </div>

                </form>

                <div id="alertContainer" class="mt-4"></div>

            </div>
        </div>

    </div>{{-- /tab-body --}}
</div>{{-- /roles-page --}}



@vite(['resources/js/roles.js'])

</x-custom-admin-layout>