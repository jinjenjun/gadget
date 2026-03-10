const { app, BrowserWindow } = require('electron')
const { exec } = require('child_process')

let mainWindow
let phpServer
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
}

app.on("second-instance", () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

// ⚠️ 在 Linux / WSL 上避免 GPU / GLX 問題
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('use-gl', 'swiftshader') // 軟體渲染

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: 'resources/img/logo.ico',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    mainWindow.loadURL('http://127.0.0.1:8085')

    mainWindow.on('closed', () => {
        mainWindow = null
        if (phpServer) phpServer.kill()
    })
}

app.whenReady().then(() => {
    // 啟動 PHP server
    phpServer = exec('php artisan serve --host=127.0.0.1 --port=8085', (err, stdout, stderr) => {
        if (err) console.error(err)
    })

    // 等 3 秒再開 Electron 視窗（確保 PHP server 起來）
    setTimeout(() => createWindow(), 3000)
})

// 關閉所有視窗時退出
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (mainWindow === null) createWindow()
})
