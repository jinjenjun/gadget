<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 保留 Vite 的 prefetch
        Vite::prefetch(concurrency: 3);

        // 如果在 Electron 環境，動態設定 SQLite 資料庫路徑
        if (defined('ELECTRON_USER_DATA')) {
            // 確保資料夾存在
            if (!file_exists(ELECTRON_USER_DATA)) {
                mkdir(ELECTRON_USER_DATA, 0755, true);
            }

            // 設定 Laravel SQLite 連線
            Config::set('database.connections.sqlite.database', ELECTRON_USER_DATA . '/database.sqlite');

            // 如果資料庫檔案不存在，建立一個空檔案
            $dbFile = ELECTRON_USER_DATA . '/database.sqlite';
            if (!file_exists($dbFile)) {
                file_put_contents($dbFile, '');
            }
        }
    }
}
