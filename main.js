const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Global schedule state
let currentSchedule = {
    starts: [],
    names: [],
    times: []
};

// Function to load schedule from file
function loadScheduleFromFile() {
    const schedulePath = path.join(app.getPath('userData'), 'schedule.json');
    try {
        if (fs.existsSync(schedulePath)) {
            const data = fs.readFileSync(schedulePath, 'utf8');
            currentSchedule = JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading schedule:', err);
    }
}

// Function to save schedule to file
function saveScheduleToFile(schedule) {
    const schedulePath = path.join(app.getPath('userData'), 'schedule.json');
    try {
        fs.writeFileSync(schedulePath, JSON.stringify(schedule));
        currentSchedule = schedule;
        // Notify all windows of the schedule update
        BrowserWindow.getAllWindows().forEach(window => {
            window.webContents.send('schedule-updated', schedule);
        });
    } catch (err) {
        console.error('Error saving schedule:', err);
        throw err;
    }
}



class WindowManager {
    constructor() {
        this.mainWindow = null;
        this.settingsWindow = null;
    }

    createMainWindow() {
        if (this.mainWindow) return;

        this.mainWindow = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        this.mainWindow.loadFile('src/index.html');

        if (process.env.NODE_ENV === 'development') {
            this.mainWindow.webContents.openDevTools();
        }

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
    }

    createSettingsWindow() {
        if (this.settingsWindow) {
            this.settingsWindow.focus();
            return;
        }

        if (!this.mainWindow) {
            console.error('Main window does not exist');
            return;
        }

        this.settingsWindow = new BrowserWindow({
            width: 600,
            height: 800,
            parent: this.mainWindow,
            modal: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        this.settingsWindow.loadFile('src/settings.html');

        this.settingsWindow.on('closed', () => {
            this.settingsWindow = null;
        });
    }
}

const windowManager = new WindowManager();

app.whenReady().then(() => {
    loadScheduleFromFile();
    windowManager.createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            windowManager.createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handlers
ipcMain.on('open-settings', () => {
    windowManager.createSettingsWindow();
});

ipcMain.handle('save-schedule', (event, schedule) => {
    saveScheduleToFile(schedule);
    return { success: true };
});

ipcMain.handle('load-schedule', () => {
    return currentSchedule;
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion(); // This reads from package.json
});