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

// TODO: 開發測試用，有需要時再開啟
// Route::get('/php-check', function () {
//     return response()->json([
//         'marker' => 'gadget-php-check-2026-03-31',
//         'app_env' => config('app.env'),
//         'app_url' => config('app.url'),
//         'php_binary' => PHP_BINARY,
//         'loaded_ini' => php_ini_loaded_file(),
//         'upload_max_filesize' => ini_get('upload_max_filesize'),
//         'post_max_size' => ini_get('post_max_size'),
//         'memory_limit' => ini_get('memory_limit'),
//         'max_execution_time' => ini_get('max_execution_time'),
//         'max_input_time' => ini_get('max_input_time'),
//     ]);
// });

require __DIR__.'/auth.php';
