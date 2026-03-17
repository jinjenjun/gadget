const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')
const fs = require('fs')

let mainWindow
let phpServer

// ------------------ 單一實例 ------------------
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    console.log('[DEBUG] Another instance detected. Quitting.')
    app.quit()
}

app.on('second-instance', () => {
    console.log('[DEBUG] Second instance attempted.')
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
    }
})

// 判斷 dev / build
const isDev = !app.isPackaged

// ------------------ 建立視窗 ------------------
function createWindow() {
    console.log('[DEBUG] Creating BrowserWindow...')
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, '../resources/img/logo.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    mainWindow.loadURL('http://127.0.0.1:8085')

    mainWindow.on('closed', () => {
        console.log('[DEBUG] BrowserWindow closed.')
        mainWindow = null

        if (phpServer) {
            console.log('[DEBUG] Killing PHP server...')
            phpServer.kill()
            phpServer = null
        }
    })
}

// ------------------ 啟動 PHP ------------------
function startPhpServer() {
    const userDataPath = app.getPath('userData')
    process.env.ELECTRON_USER_DATA = userDataPath
    console.log('[DEBUG] ELECTRON_USER_DATA:', userDataPath)

    let basePath, phpPath, iniPath, publicPath

    if (isDev) {
        // DEV 模式
        basePath = path.resolve(__dirname, '..')
        phpPath = path.join(basePath, 'resources', 'php', 'php.exe')
        iniPath = path.join(basePath, 'resources', 'php', 'php.ini')
        publicPath = path.join(basePath, 'public')

        console.log('[DEBUG] DEV MODE')
    } else {
        // BUILD 模式（🔥 重點修正）
        basePath = path.join(process.resourcesPath, 'app.asar.unpacked')

        // ✅ php 在 resources/php（不是 unpacked）
        phpPath = path.join(process.resourcesPath, 'php', 'php.exe')
        iniPath = path.join(process.resourcesPath, 'php', 'php.ini')

        publicPath = path.join(basePath, 'public')

        console.log('[DEBUG] BUILD MODE')
    }

    console.log('[DEBUG] Laravel root:', basePath)
    console.log('[DEBUG] PHP Path:', phpPath)
    console.log('[DEBUG] PHP INI path:', iniPath)
    console.log('[DEBUG] Public path:', publicPath)

    // 🔥 防呆：檢查檔案存在
    console.log('[CHECK] php.exe exists:', fs.existsSync(phpPath))
    console.log('[CHECK] php.ini exists:', fs.existsSync(iniPath))
    console.log('[CHECK] public exists:', fs.existsSync(publicPath))

    if (!fs.existsSync(phpPath)) {
        console.error('❌ php.exe NOT FOUND')
        return
    }

    phpServer = spawn(
        phpPath,
        ['-c', iniPath, '-S', '127.0.0.1:8085', '-t', publicPath],
        {
            cwd: path.dirname(phpPath),
            windowsHide: true,
            env: process.env
        }
    )

    attachPhpLogs()
    waitForServer()
}

// ------------------ 監控 PHP stdout/stderr ------------------
function attachPhpLogs() {
    if (!phpServer) return

    phpServer.stdout.on('data', (data) => {
        console.log('[PHP]', data.toString())
    })

    phpServer.stderr.on('data', (data) => {
        console.error('[PHP ERROR]', data.toString())
    })

    phpServer.on('close', (code) => {
        console.log('[DEBUG] PHP server closed with code', code)
    })
}

// ------------------ 等 Laravel 啟動 ------------------
function waitForServer() {
    console.log('[DEBUG] Waiting for Laravel server...')

    const check = () => {
        http.get('http://127.0.0.1:8085', () => {
            console.log('[DEBUG] Server responded, creating window...')
            createWindow()
        }).on('error', () => {
            setTimeout(check, 300)
        })
    }

    check()
}

// ------------------ APP 啟動 ------------------
app.whenReady().then(() => {
    console.log('[DEBUG] App is ready, starting PHP server...')
    startPhpServer()
})

// ------------------ 關閉處理 ------------------
app.on('window-all-closed', () => {
    console.log('[DEBUG] All windows closed.')

    if (phpServer) {
        console.log('[DEBUG] Killing PHP server...')
        phpServer.kill()
    }

    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
    if (!mainWindow) createWindow()
})

// ------------------ crash 保護 ------------------
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT ERROR:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('PROMISE ERROR:', err)
})
