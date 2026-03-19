<?php
use App\Http\Controllers\TransformationController;
use App\Http\Controllers\FixController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProtectionController;
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

Route::get('/protection', [ProtectionController::class, 'index'])->name('protection.index');

Route::post('/protection/pdf', [ProtectionController::class, 'pdfProtection'])
    ->name('protection.pdf');

Route::post('/protection/cleanup', [ProtectionController::class, 'clearPDFTempFiles'])
    ->name('protection.cleanup');

require __DIR__.'/auth.php';
