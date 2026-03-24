// main.cjs
const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { spawn } = require("child_process");

let mainWindow = null;
let phpServer = null;

// ------------------ 建立視窗 ------------------
function createWindow() {
    console.log("[DEBUG] Creating BrowserWindow...");
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, "../resources/img/logo.ico"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    const url = "http://127.0.0.1:8085";
    console.log(
        `[DEBUG] ${!app.isPackaged ? "DEV" : "BUILD"} mode: loading URL`,
        url,
    );

    mainWindow.loadURL(url);

    mainWindow.webContents.on("did-finish-load", () => {
        console.log("[DEBUG] BrowserWindow finished loading URL");
    });

    mainWindow.webContents.on(
        "did-fail-load",
        (event, errorCode, errorDescription, validatedURL) => {
            console.error(
                "[DEBUG] BrowserWindow failed to load:",
                validatedURL,
                errorCode,
                errorDescription,
            );
        },
    );

    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on("closed", () => {
        console.log("[DEBUG] BrowserWindow closed.");
        mainWindow = null;

        if (phpServer) {
            console.log("[DEBUG] Killing PHP server...");
            phpServer.kill();
            phpServer = null;
        }
    });
}

// ------------------ 等 Laravel PHP Server 啟動 ------------------
function waitForServer() {
    console.log("[DEBUG] Waiting for PHP server...");
    const check = () => {
        http.get("http://127.0.0.1:8085", (res) => {
            console.log(
                "[DEBUG] Server responded with status:",
                res.statusCode,
            );
            console.log("[DEBUG] Server headers:", res.headers);

            let body = "";
            res.on("data", (chunk) => {
                body += chunk.toString();
                if (body.length > 500) res.destroy();
            });
            res.on("end", () => {
                console.log(
                    "[DEBUG] First 500 bytes of response:\n",
                    body.slice(0, 500),
                );
            });

            console.log("[DEBUG] Server ready, creating window...");
            createWindow();
        }).on("error", (err) => {
            console.error("[DEBUG] Server not ready, retrying...", err.message);
            setTimeout(check, 300);
        });
    };

    check();
}

// ------------------ 啟動 PHP Server ------------------
function startPhpServer() {
    const userDataPath = app.getPath("userData");
    process.env.ELECTRON_USER_DATA = userDataPath;
    console.log("[DEBUG] ELECTRON_USER_DATA:", userDataPath);

    let basePath, phpPath, iniPath, publicPath;

    if (!app.isPackaged) {
        basePath = path.resolve(__dirname, "..");
        phpPath = "C:\\Developer\\gadget\\php\\php.exe";
        iniPath = path.join(path.dirname(phpPath), "php.ini");
        publicPath = path.join(basePath, "public");
        console.log("[DEBUG] DEV MODE");
    } else {
        basePath = path.join(process.resourcesPath, "app.asar.unpacked");
        phpPath = path.join(process.resourcesPath, "php", "php.exe");
        iniPath = path.join(process.resourcesPath, "php", "php.ini");
        publicPath = path.join(basePath, "public");
        console.log("[DEBUG] BUILD MODE");
    }

    // 檢查 PHP 與 public 目錄
    if (!fs.existsSync(phpPath)) {
        console.error(`[FATAL] PHP executable not found! Path: ${phpPath}`);
        app.quit();
        return;
    }

    if (!fs.existsSync(publicPath)) {
        console.error(
            `[FATAL] Public directory not found! Path: ${publicPath}`,
        );
        app.quit();
        return;
    }

    // spawn args
    const phpArgs = [];
    if (iniPath && fs.existsSync(iniPath)) phpArgs.push("-c", iniPath);
    phpArgs.push("-S", "127.0.0.1:8085", "-t", publicPath);

    phpServer = spawn(phpPath, phpArgs, {
        cwd: basePath,
        windowsHide: true,
        env: process.env,
    });

    phpServer.stdout.on("data", (data) =>
        console.log("[PHP]", data.toString()),
    );
    phpServer.stderr.on("data", (data) =>
        console.error("[PHP ERROR]", data.toString()),
    );
    phpServer.on("close", (code) =>
        console.log("[DEBUG] PHP server closed with code", code),
    );

    waitForServer();
}

// ------------------ App Ready ------------------
app.whenReady().then(() => {
    console.log("[DEBUG] App ready. isDev=", !app.isPackaged);
    startPhpServer();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) createWindow();
});
