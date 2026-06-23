
@vite(['resources/css/pages/navbar.css'])
<div class="header"
     data-session-lifetime="{{ config('session.lifetime') }}"
     data-logout-url="{{ route('logout') }}"
     data-login-url="{{ route('login') }}"
     data-session-ping="{{ route('session.ping') }}">
    <div class="header-left">
        <div class="menu-icon material-icons">menu</div>
        <div class="search-toggle-icon material-icons" data-toggle="header_search">search</div>
    </div>
    <div class="payroll-types d-flex align-items-center justify-content-center flex-grow-1">
        
    </div>
    <!-- Session timeout warning banner -->
<div id="sessionWarning" class="session-warning-banner hidden">
    <span class="material-icons">timer</span>
    <span id="sessionWarningText">Your session expires in 15 seconds. </span>
    <button id="sessionExtendBtn" data-action="extend-session">Stay Logged In</button>
</div>

    <div class="header-right">
 
        @if(Auth::check())
 
        @php
            $photoPath = Auth::user()->profile_photo;
            $photoUrl  = $photoPath && file_exists(public_path('storage/' . $photoPath))
                       ? asset('storage/' . $photoPath)
                       : asset('images/NO-IMAGE-AVAILABLE.jpg');
        @endphp
 
        <div class="user-info-dropdown">
            <div class="dropdown">
                <a class="dropdown-toggle" href="#" role="button" data-toggle="dropdown">
                    <span class="user-icon">
                        <img src="{{ $photoUrl }}" alt="{{ Auth::user()->name }}">
                    </span>
                    <span class="user-name">{{ Auth::user()->name }}</span>
                </a>
 
                <div class="dropdown-menu dropdown-menu-right">
 
                    {{-- User info header --}}
                    <div class="dropdown-user-info">
                        <div class="dui-name">{{ Auth::user()->name }}</div>
                        <div class="dui-role">{{ Auth::user()->email }}</div>
                    </div>
 
                    <a class="dropdown-item" href="{{ route('profile.edit') }}">
                        <span class="material-icons">account_circle</span>
                        Profile
                    </a>
 
                    <div class="dropdown-divider"></div>
 
                    <form method="POST" action="{{ route('logout') }}" class="m-0 p-0">
                        @csrf
                        <button type="submit" class="dropdown-item logout-item">
                            <span class="material-icons">logout</span> Log Out
                        </button>
                    </form>
 
                </div>
            </div>
        </div>
 
        @else
    <meta http-equiv="refresh" content="0;url={{ route('login') }}">
@endif
 
    </div>
    @vite(['resources/js/navbar.js'])
</div>
