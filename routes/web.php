<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TransformationController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/transformation', [TransformationController::class, 'index'])->name('transformation.index');

Route::post('/transformation', [TransformationController::class, 'transform'])->name('transformation.transform');

// EPUB 轉檔
Route::post('/transformation/epub', [TransformationController::class, 'epubTransformation'])
    ->name('transformation.epub');

// 清除暫存
Route::post('/transformation/cleanup', [TransformationController::class, 'clearEpubTempFiles'])
    ->name('transformation.cleanup');

require __DIR__.'/auth.php';
