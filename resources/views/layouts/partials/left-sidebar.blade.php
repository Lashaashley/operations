{{-- resources/views/layouts/partials/left-sidebar.blade.php --}}
@vite(['resources/css/pages/leftsidebar.css'])

<div class="left-side-bar">

    <div class="brand-logo">
        <a href="{{ route('dashboard') }}">
            <img src="{{ asset('images/schaxist.png') }}" alt="Core Pay" class="dark-logo">
            <img src="{{ asset('images/schaxist.png') }}" alt="Core Pay" class="light-logo">
        </a>
        {{-- Close button with reliable JS handler --}}
        <div class="close-sidebar" id="sidebarCloseBtn" data-toggle="left-sidebar-close">
            <span class="material-icons">close</span>
        </div>
    </div>

    <div class="menu-block customscroll">
        <div class="sidebar-menu">
            <ul id="accordion-menu">

                {{-- Dashboard --}}
                <li class="brand-logo">
                    <a href="{{ route('dashboard') }}" class="dropdown-toggle no-arrow">
                        <span class="material-icons">dashboard</span>
                        <span class="mtext">Dashboard</span>
                    </a>
                </li>

                {{-- Dynamic items --}}
                @if(isset($menuItems) && !empty($menuItems))
                    @foreach($menuItems as $item)
                        <li class="{{ !empty($item['children']) ? 'dropdown' : '' }}">
                           <a href="{{ $item['href'] }}"
   class="dropdown-toggle {{ empty($item['children']) ? 'no-arrow' : '' }}"
   data-parent="{{ !empty($item['children']) ? 'true' : 'false' }}">

                                @if(!empty($item['icon']))
                                    @if(Str::contains($item['icon'], ['.png','.jpg','.jpeg','.svg']))
                                        <img src="{{ asset($item['icon']) }}"
                                             alt="{{ $item['name'] }}"
                                             class="micon">
                                    @else
                                        <span class="micon {{ $item['icon'] }}"></span>
                                    @endif
                                @else
                                    <span class="micon dw dw-library"></span>
                                @endif

                                <span class="mtext">{{ $item['name'] }}</span>
                            </a>

                            @if(!empty($item['children']))
                                <ul class="submenu">
                                    @foreach($item['children'] as $child)
                                        <li>
                                            <a href="{{ $child['href'] }}">{{ $child['name'] }}</a>
                                        </li>
                                    @endforeach
                                </ul>
                            @endif
                        </li>
                    @endforeach
                @else
                    <li>
                        <span class="nomenuitems">
                            No menu items available
                        </span>
                    </li>
                @endif

            </ul>
        </div>
    </div>

    <div class="sidebar-footer">
        <div class="sidebar-footer-avatar">
            <span class="material-icons">payments</span>
        </div>
        <div class="sidebar-footer-text">
            <strong>Core Pay</strong>
            Payroll Management
        </div>
    </div>
    @vite(['resources/js/leftbar.js'])
</div>
