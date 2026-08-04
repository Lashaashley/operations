<x-custom-admin-layout>

@vite(['resources/css/pages/massign.css']) 

<div class="assign-page">

    <div class="page-heading">
        <h1>Assign Modules</h1>
        <p>Select a user and assign them a role to control their access permissions.</p>
    </div>

    <div class="toast-wrap" id="toastWrap"></div>

    <form id="moduleAssignForm">
    @csrf

    <div class="assign-layout">

        {{-- ── Left: User selection + actions ──────────────── --}}
        <div class="assign-card">
            <div class="card-head">
                <div class="card-icon"><span class="material-icons">person</span></div>
                <div>
                    <p class="card-title">Select User</p>
                    <p class="card-subtitle">Choose who to assign a role to</p>
                </div>
            </div>

            <div class="card-body">

                <div class="field">
                    <label>User <span class="userspan">*</span></label>
                    <div class="select-wrap">
                        <select name="users" id="users" required>
                            <option value="">— Select User —</option>
                            @foreach($users as $user)
                                <option value="{{ $user->id }}">{{ $user->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <span class="field-error" id="users-error"></span>
                </div>

                <!-- Selected user display -->
                <div class="selected-user" id="selectedUserDisplay">
                    <div class="user-avatar">
                        <span class="material-icons">person</span>
                    </div>
                    <span class="selected-user-name" id="selectedUserName"></span>
                </div>

                <!-- Selected role feedback -->
                <div class="selected-role-badge" id="selectedRoleBadge">
                    <span class="material-icons">verified_user</span>
                    <span id="selectedRoleName">No role selected</span>
                </div>

                <div class="action-stack">
                    <button type="button" class="btn btn-assign" id="assignBtn">
                        <span class="material-icons">assignment_ind</span>
                        Assign Role
                    </button>
                    <button type="button" class="btn btn-deselect" id="deselectAllBtn">
                        <span class="material-icons">radio_button_unchecked</span>
                        Clear Selection
                    </button>
                </div>

            </div>
        </div>

        {{-- ── Right: Roles list ─────────────────────────── --}}
        <div class="assign-card">
            <div class="card-head">
                <div class="card-icon backone">
                    <span class="material-icons backtwo">admin_panel_settings</span>
                </div>
                <div class="flex1">
                    <p class="card-title">Available Roles</p>
                    <p class="card-subtitle">Select one role to assign</p>
                </div>
                <span class="spanassign">
                    {{ count($roles) }} {{ Str::plural('role', count($roles)) }}
                </span>
            </div>

            <div class="card-body">
                <div class="roles-scroll" id="rolesContainer">
                    @if(count($roles) > 0)
                        @foreach($roles as $role)
                            <div class="role-item">
                                <input class="role-checkbox" type="radio"
                                       name="role" value="{{ $role->ID }}"
                                       id="role{{ $role->ID }}"
                                       data-name="{{ $role->rolename }}">
                                <label for="role{{ $role->ID }}">
                                    <div class="role-dot"></div>
                                    <div class="role-label-text">
                                        <span class="role-name">{{ $role->rolename }}</span>
                                        @if($role->rdesc)
                                            <span class="role-desc">{{ $role->rdesc }}</span>
                                        @endif
                                    </div>
                                </label>
                            </div>
                        @endforeach
                    @else
                        <div class="roles-empty">
                            <span class="material-icons">admin_panel_settings</span>
                            <p>No roles available. Create roles first.</p>
                        </div>
                    @endif
                </div>
            </div>
        </div>

    </div>

    </form>

    <div id="alertContainer"></div>

</div>




 @vite(['resources/js/massign.js'])
</x-custom-admin-layout>