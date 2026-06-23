<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Corepay</title>

    <!-- Site favicon -->
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('images/apple-touch-icon.png') }}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('images/favicon-32x32.png') }}">
    <link rel="icon" type="image/png" sizes="16x16" href="{{ asset('images/favicon-16x16.png') }}">

    <!-- Mobile Specific Metas -->
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">

    
    <meta name="csrf-token" content="{{ csrf_token() }}">



    @vite(['resources/css/app.scss'])
</head>
<body>
