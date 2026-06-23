<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'OPP') }}</title>
        
   


       
        
    </head>
    <body class="font-sans antialiased">
        <div class="min-h-screen bg-gray-100">
            @include('layouts.navigation')

            <!-- Page Heading -->
            @isset($header)
                <header class="bg-white shadow">
                    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {{ $header }}
                    </div>
                </header>
            @endisset

           

            <!-- Page Content -->
            <main>
                {{ $slot }}
            </main>
        </div>
        


    <div id="sessionWarning"
     class="hidden fixed bottom-0 inset-x-0 z-50 bg-amber-50 border-t-2 border-amber-400
            flex items-center justify-between px-6 py-3 shadow-lg"
     role="alert"
     aria-live="assertive">
    <span id="sessionWarningText" class="text-sm text-amber-800 font-medium"></span>
    <button id="sessionExtendBtn"
            type="button"
            class="ml-6 shrink-0 rounded-md bg-amber-500 px-4 py-1.5 text-sm font-semibold
                   text-white hover:bg-amber-600 focus:outline-none focus:ring-2
                   focus:ring-amber-400 focus:ring-offset-1 transition">
        Stay signed in
    </button>
</div>
   

@vite(['resources/css/app.scss', 'resources/js/app.js'])
    </body>
 


</html>
