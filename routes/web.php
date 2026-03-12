<?php
use App\Http\Controllers\TransformationController;
use App\Http\Controllers\FixController;
use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home.index');

Route::get('/transformation', [TransformationController::class, 'index'])->name('transformation.index');

Route::post('/transformation/epub', [TransformationController::class, 'epubTransformation'])
    ->name('transformation.epub');

Route::post('/transformation/cleanup', [TransformationController::class, 'clearEpubTempFiles'])
    ->name('transformation.cleanup');

Route::get('/fix', [FixController::class, 'index'])->name('fix.index');

Route::post('/fix/epub', [FixController::class, 'epubFix'])
    ->name('fix.epub');

Route::post('/fix/cleanup', [FixController::class, 'clearEpubTempFiles'])
    ->name('fix.cleanup');

require __DIR__.'/auth.php';
