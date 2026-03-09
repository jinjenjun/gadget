<?php
use App\Http\Controllers\TransformationController;
use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home.index');

Route::get('/transformation', [TransformationController::class, 'index'])->name('transformation.index');

Route::post('/transformation', [TransformationController::class, 'transform'])->name('transformation.transform');

Route::post('/transformation/epub', [TransformationController::class, 'epubTransformation'])
    ->name('transformation.epub');

Route::post('/transformation/cleanup', [TransformationController::class, 'clearEpubTempFiles'])
    ->name('transformation.cleanup');

require __DIR__.'/auth.php';
