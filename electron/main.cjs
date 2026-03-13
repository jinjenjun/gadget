const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')

let mainWindow
let phpServer

// 單一實例鎖
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) app.quit()

app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
    }
})

// GPU / 渲染安全設定
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('use-gl', 'swiftshader')

// 判斷開發 / 打包
const isDev = !app.isPackaged

// 建立視窗
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, '../resources/img/logo.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    mainWindow.loadURL('http://127.0.0.1:8085')

    mainWindow.on('closed', () => {
        mainWindow = null

        if (phpServer) {
            phpServer.kill()
            phpServer = null
        }
    })
}

// 啟動 PHP server（打包版用）
function startPhpServer() {
    if (isDev) {
        // 開發模式 → 直接用 Docker 提供的 server
        console.log('開發模式: 使用 Docker Laravel Sail')
        createWindow()
        return
    }

    // 打包模式 → 用專案內 php.exe
    const phpPath = path.join(process.resourcesPath, 'php/php.exe')
    const artisanPath = path.join(process.resourcesPath, 'artisan')

    phpServer = spawn(
        phpPath,
        [artisanPath, 'serve', '--host=127.0.0.1', '--port=8085'],
        {
            cwd: process.resourcesPath,
            windowsHide: true
        }
    )

    phpServer.stdout.on('data', data => console.log(data.toString()))
    phpServer.stderr.on('data', data => console.error(data.toString()))
    phpServer.on('close', code => console.log('PHP server closed:', code))

    waitForServer()
}

// 等待 Laravel server ready
function waitForServer() {
    const checkServer = () => {
        http.get('http://127.0.0.1:8085', () => createWindow())
            .on('error', () => setTimeout(checkServer, 300))
    }
    checkServer()
}

// 啟動流程
app.whenReady().then(() => startPhpServer())

// 所有視窗關閉時退出
app.on('window-all-closed', () => {
    if (phpServer) {
        phpServer.kill()
        phpServer = null
    }
    if (process.platform !== 'darwin') app.quit()
})

// macOS 特殊處理
app.on('activate', () => {
    if (!mainWindow) createWindow()
})
