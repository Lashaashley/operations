<x-custom-admin-layout>

@vite(['resources/css/pages/edit.css'])
<div class="profile-page">

    <div class="page-heading">
        <h1>My Profile</h1>
        <p>Manage your account information and security settings.</p>
    </div>

    <div class="toast-wrap" id="toastWrap"></div>

    <div class="profile-layout">

        {{-- ── Left: Avatar + profile info + 2FA ───────────── --}}
        <div class="divfive">

            {{-- Avatar card --}}
            <div class="p-card">
                <div class="avatar-section">
                    <div class="avatar-ring">
                        <img src="{{ Auth::user()->profile_photo ? asset('storage/' . Auth::user()->profile_photo) : asset('images/NO-IMAGE-AVAILABLE.jpg') }}"
                             alt="{{ Auth::user()->name }}"
                             id="avatarPreview">
                        <div class="avatar-edit-btn" id="edit-btn" title="Change photo">
                            <span class="material-icons">edit</span>
                        </div>
                    </div>
                    <div>
                        <p class="avatar-name">{{ Auth::user()->name }}</p>
                        <p class="avatar-email">{{ Auth::user()->email }}</p>
                    </div>
                </div>

                <div class="p-card-body paddingtop">
                    <form method="post" action="{{ route('profile.update') }}">
                        @csrf
                        @method('patch')

                        <div class="field">
                            <label>Name <span class="req">*</span></label>
                            <input id="name" name="name" type="text"
                                   value="{{ old('name', $user->name) }}"
                                   required autofocus autocomplete="name">
                            @error('name')
                                <span class="field-error">{{ $message }}</span>
                            @enderror
                        </div>

                        <div class="field">
                            <label>Email <span class="req">*</span></label>
                            <input id="email" name="email" type="email"
                                   value="{{ old('email', $user->email) }}"
                                   required autocomplete="username">
                            @error('email')
                                <span class="field-error">{{ $message }}</span>
                            @enderror

                            @if ($user instanceof \Illuminate\Contracts\Auth\MustVerifyEmail && ! $user->hasVerifiedEmail())
                                <div class="unverified-banner">
                                    <span class="material-icons">warning_amber</span>
                                    <span>
                                        Email unverified.
                                        <button form="send-verification" class="btnsendver"
                                                >
                                            Resend verification
                                        </button>
                                    </span>
                                </div>
                                @if(session('status') === 'verification-link-sent')
                                    <span class="field-success">✓ Verification link sent.</span>
                                @endif
                            @endif
                        </div>

                        <div class="btn-row">
                            <button type="submit" class="btn btn-save">
                                <span class="material-icons">save</span> Save
                            </button>
                            @if(session('status') === 'profile-updated')
                                <span class="prosuccess">
                                    <span class="material-icons font15">check_circle</span> Saved
                                </span>
                            @endif
                        </div>
                    </form>
                </div>
            </div>

            {{-- 2FA card --}}
           

        </div>

        {{-- ── Right: Change password ────────────────────────── --}}
        <div class="p-card">
            <div class="p-card-head">
                <div class="p-card-icon purple"><span class="material-icons">key</span></div>
                <span class="p-card-title">Update Password</span>
            </div>
            <div class="p-card-body">
                @if(auth()->user()->passkeys()->exists())
    <div class="alert alert-success">
        <span class="material-icons">check_circle</span>
        You have {{ auth()->user()->passkeys()->count() }} device(s) registered for biometric login.
    </div>
    <a href="{{ route('profile.fingerprint') }}" class="btn btn-outline-primary">
        Manage Devices
    </a>
@else
   
@endif
 <div class="alert alert-info">
        <span class="material-icons">info</span>
        Enable quick and secure login with your fingerprint or face recognition.
    </div>
    <a href="{{ route('profile.fingerprint') }}" class="btn btn-primary">
        <span class="material-icons">fingerprint</span>
        Set Up Biometric Login
    </a>
                <form id="changepassf"
      method="post"
      data-changepass-url="{{ route('change.pass', ['id' => Auth::id()]) }}">
                    @csrf
                    <input type="hidden" id="userid" name="userid" value="{{ $user->id }}">

                    <div class="pw-grid">

                        {{-- Current password --}}
                        <div class="field gridcolumn">
                            <label>Current Password <span class="req">*</span></label>
                            <div class="pw-wrap">
                                <input id="current_password" name="current_password" type="password"
                                       autocomplete="current-password" placeholder="Enter current password">
                                <button type="button" class="pw-btn" id="pw-btn">
                                    <span class="material-icons" id="eyeCurrent">visibility</span>
                                </button>
                            </div>
                            <span class="field-error" id="current_password-error"></span>
                            @error('current_password')
                                <span class="field-error">{{ $message }}</span>
                            @enderror
                        </div>

                        {{-- New password --}}
                        <div class="field">
                            <label>New Password <span class="req">*</span></label>
                            <div class="pw-wrap">
                                <input type="password" id="newpass" name="newpass"
                                       minlength="8" autocomplete="new-password"
                                       placeholder="Min. 8 characters"
                                       >
                                <button type="button" class="pw-btn" id="pw-btn2">
                                    <span class="material-icons" id="eyeNew">visibility</span>
                                </button>
                                <button type="button" class="pw-gen-btn" id="generate-password"
                                        >
                                    <span class="material-icons">auto_fix_high</span> Generate
                                </button>
                            </div>
                            <div class="pw-strength-bar">
                                <div id="strength-fill"></div>
                            </div>
                            <span class="pw-strength-label" id="strength-label"></span>
                            <div class="pw-rules" id="pw-rules"></div>
                            <span class="field-error" id="newpass-error"></span>
                        </div>

                        {{-- Confirm password --}}
                        <div class="field">
                            <label>Confirm Password <span class="req">*</span></label>
                            <div class="pw-wrap">
                                <input type="password" id="newpass_confirmation" name="newpass_confirmation"
                                       autocomplete="new-password" placeholder="Re-enter new password"
                                      >
                                <button type="button" class="pw-btn" class="pw-btn3">
                                    <span class="material-icons" id="eyeConfirm">visibility</span>
                                </button>
                            </div>
                            <div id="password-match-message"></div>
                            <span class="field-error" id="newpass_confirmation-error"></span>
                        </div>

                    </div>

                    <div class="btn-row margintop">
                        <button type="submit" class="btn btn-change-pw" id="changepass">
                            <span class="material-icons">shield</span> Change Password
                        </button>
                    </div>
                </form>
            </div>
        </div>

    </div>
</div>

{{-- Photo update form (submits normally) --}}
<form method="POST" action="{{ route('profile.photo.update') }}" enctype="multipart/form-data" id="photoForm">
    @csrf
    @method('POST')

    <div class="photo-modal-backdrop" id="photoModal">
        <div class="photo-modal-card">
            <div class="photo-modal-head">
                <div class="p-card-icon"><span class="material-icons">photo_camera</span></div>
                <span class="photo-modal-title">Update Profile Photo</span>
                <button type="button" class="btn-icon" id="btn-icon"
                        >
                    <span class="material-icons font17">close</span>
                </button>
            </div>
            <div class="photo-modal-body">
                <div class="modal-file-wrap">
                    <label class="modal-file-label" for="profile_photo_input">
                        <span class="material-icons">upload</span> Choose Photo
                    </label>
                    <input name="profile_photo" id="profile_photo_input" type="file"
                           accept="image/*"
                           onchange="">
                    <span class="modal-file-name" id="photoFileName">No file chosen</span>
                </div>
                @error('profile_photo')
                    <span class="field-error marblock">{{ $message }}</span>
                @enderror
                <p class="pstyle" >
                    JPG, PNG, GIF · Max 1 MB
                </p>
            </div>
            <div class="photo-modal-foot">
                <button type="button" class="btn btn-ghost" id="btn-ghost" >Cancel</button>
                <button type="submit" class="btn btn-save">
                    <span class="material-icons">save</span> Update
                </button>
            </div>
        </div>
    </div>
</form>

<form id="send-verification" method="post" action="{{ route('verification.send') }}">
    @csrf
</form>


@vite(['resources/js/edit.js'])

</x-custom-admin-layout>