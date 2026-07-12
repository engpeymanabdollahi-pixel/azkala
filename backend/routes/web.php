<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// 🆕 Route login برای redirect middleware
Route::get('/login', function () {
    return redirect('http://localhost:5173/auth');
})->name('login');