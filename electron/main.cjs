const { app, BrowserWindow } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const http = require('http');

let mainWindow;
let phpServer;

// 單一實例鎖
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) app.quit();

app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

// GPU / 渲染安全設定
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('use-gl', 'swiftshader');

// 建立視窗
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, '../resources/img/logo.ico'), // portable safe
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    mainWindow.loadURL('http://127.0.0.1:8085');

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (phpServer) {
            phpServer.kill();
            phpServer = null;
        }
    });
}

// 啟動 PHP server，並 polling 確認啟動後再開窗
function startPhpServer() {
    phpServer = exec(
        'php artisan serve --host=127.0.0.1 --port=8085',
        { cwd: path.join(__dirname, '..') },
        (err, stdout, stderr) => {
            if (err) console.error(err);
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
        }
    );

    const checkServer = () => {
        http.get('http://127.0.0.1:8085', () => createWindow())
            .on('error', () => setTimeout(checkServer, 200));
    };
    checkServer();
}

app.whenReady().then(() => startPhpServer());

// 所有視窗關閉時退出
app.on('window-all-closed', () => {
    if (phpServer) phpServer.kill();
    if (process.platform !== 'darwin') app.quit();
});

// macOS 特殊處理
app.on('activate', () => {
    if (!mainWindow) createWindow();
});
