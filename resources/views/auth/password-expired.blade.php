<!DOCTYPE html>
<html data-session-lifetime="{{ config('session.lifetime') }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Core Pay — Password Expired</title>

    <!-- Site favicon -->
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('images/apple-touch-icon.png') }}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('images/favicon-32x32.png') }}">
    <link rel="icon" type="image/png" sizes="16x16" href="{{ asset('images/favicon-16x16.png') }}">

   

    @vite('resources/css/app.scss')
    @vite(['resources/css/pages/login.css'])
    @vite(['resources/css/pages/passexp.css'])
</head>
<body>

<div class="page-shell">

    <!-- Top bar — identical to login -->
    <header class="topbar">
        <div class="brand">
            <img src="{{ asset('images/schaxist.png') }}" alt="Core Pay">
        </div>
        <span class="tagline">Core Pay</span>
    </header>

    <!-- Center stage -->
    <main class="stage">
        <div class="card">
            <div class="card-accent"></div>

            <div class="card-body">

                <h1 class="card-title">Password Expired</h1>
                <p class="card-subtitle">Choose a new password to continue</p>

                {{-- ── Session / validation alerts ─────────────────────────── --}}
                @if(session('error'))
                    <div class="alert alert-error">
                        <span class="material-icons alert-icon">error_outline</span>
                        {{ session('error') }}
                    </div>
                @endif

                @if ($errors->any())
                    <div class="alert alert-error">
                        <span class="material-icons alert-icon">error_outline</span>
                        <ul class="alert-list">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                {{-- ── Warning banner ──────────────────────────────────────── --}}
                <div class="alert alert-warning">
                    <span class="material-icons alert-icon">warning_amber</span>
                    Your password has expired. Please set a new one to access your account.
                </div>

                {{-- ── Password change form ────────────────────────────────── --}}
                <form method="POST" action="{{ route('password.expired.update') }}" id="passwordExpiredForm">
                    @csrf

                    {{-- Password strength bar --}}
                    <div class="strength-wrap">
                        <div class="strength-bar">
                            <div id="passwordStrengthBar" class="strength-fill"></div>
                        </div>
                        <span id="strengthLabel" class="strength-label"></span>
                    </div>

                    {{-- New password --}}
                    <div class="field">
                        <label for="newpass">New password</label>
                        <div class="input-wrap has-right-icon">
                            <input type="password"
                                   id="newpass"
                                   name="newpass"
                                   placeholder="••••••••"
                                   required
                                   autocomplete="new-password"
                                   autofocus>
                            <span class="icon material-icons">lock_outline</span>
                            <span class="icon icon-right material-icons" id="toggle-new-pw">visibility</span>
                        </div>
                        @error('newpass')
                            <p class="field-error">{{ $message }}</p>
                        @enderror
                    </div>

                    {{-- Password requirements checklist --}}
                    <div class="requirements-box" id="passwordRequirements">
                        <p class="req-title">Password must contain:</p>
                        <ul class="req-list">
                            <li id="lengthCheck">
                                <span class="material-icons req-icon">radio_button_unchecked</span>
                                At least 8 characters
                            </li>
                            <li id="uppercaseCheck">
                                <span class="material-icons req-icon">radio_button_unchecked</span>
                                At least one uppercase letter
                            </li>
                            <li id="lowercaseCheck">
                                <span class="material-icons req-icon">radio_button_unchecked</span>
                                At least one lowercase letter
                            </li>
                            <li id="numberCheck">
                                <span class="material-icons req-icon">radio_button_unchecked</span>
                                At least one number
                            </li>
                            <li id="specialCheck">
                                <span class="material-icons req-icon">radio_button_unchecked</span>
                                At least one special character
                            </li>
                        </ul>
                    </div>

                    {{-- Confirm password --}}
                    <div class="field">
                        <label for="newpass_confirmation">Confirm new password</label>
                        <div class="input-wrap has-right-icon">
                            <input type="password"
                                   id="newpass_confirmation"
                                   name="newpass_confirmation"
                                   placeholder="••••••••"
                                   required
                                   autocomplete="new-password">
                            <span class="icon material-icons">lock_outline</span>
                            <span class="icon icon-right material-icons" id="toggle-confirm-pw">visibility</span>
                        </div>
                        <p id="passwordMatchMessage" class="field-hint"></p>
                    </div>

                    <button type="submit" class="btn-login" id="submitBtn">
                        <span class="material-icons">sync_lock</span>
                        Update password
                    </button>

                </form>

                {{-- ── Logout fallback ─────────────────────────────────────── --}}
                <div class="logout-row">
                    <form id="logout-form" action="{{ route('logout') }}" method="POST">
                        @csrf
                        <button type="submit" class="logout-link">
                            <span class="material-icons">logout</span>
                            Logout and try again later
                        </button>
                    </form>
                </div>

            </div>{{-- /card-body --}}
        </div>{{-- /card --}}
    </main>

</div>{{-- /page-shell --}}

@vite(['resources/js/passexp.js'])
</body>
</html>