import { ipcMain, Tray, Menu, nativeImage } from 'electron';
import {app, BrowserWindow} from 'electron/main';
import path from 'node:path';
import fs from 'fs';
import fsPromises from 'fs/promises';

let mainWindow: BrowserWindow | null = null;
let formWindow: BrowserWindow | null = null;
let summaryWindow: BrowserWindow | null = null;
let trackingActive = false;
let nextTickTimeout: NodeJS.Timeout | null = null;
let tray: Tray | null = null;

export function enableAutoLaunch() {
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe'),
  });
}

export function disableAutoLaunch() {
  app.setLoginItemSettings({
    openAtLogin: false,
  });
}

export function isAutoLaunchEnabled(): boolean {
  const settings = app.getLoginItemSettings();
  return settings.openAtLogin;
}

function createTray() {
	const iconPath = path.join(__dirname, 'icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Display',
      click: () => {
        if (!mainWindow) createMainWindow();
        else mainWindow.show();
      }
    },
    {
			label: 'Quit',
			click: () => {
				trackingActive = false;

				if (nextTickTimeout) {
					clearTimeout(nextTickTimeout);
					nextTickTimeout = null;
				}

				if (tray) {
					tray.destroy();
				}

				app.quit();
			}
    }
  ]);

  tray.setToolTip('MuraMood');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (!mainWindow) createMainWindow();
    else mainWindow.show();
  });
}


function createMainWindow() {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: false,
      contextIsolation: true
		}
	})
	mainWindow.loadFile('public/index.html')

	mainWindow.on('close', (event) => {
		event.preventDefault();
		mainWindow?.hide();
	});
}

function createFormWindow(){
	if (formWindow){
		formWindow.focus();
		return;
	}
	
	formWindow = new BrowserWindow({
    width: 400,
    height: 350,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
  		nodeIntegration: false,
    }
  });

	formWindow.loadFile('public/form.html');

	formWindow.on('closed', () => {
    formWindow = null;
  });
}

function createSummaryWindow() {
  if (summaryWindow) {
    summaryWindow.focus();
    return;
  }

  summaryWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  summaryWindow.loadFile('public/summary.html');

  summaryWindow.on('closed', () => {
    summaryWindow = null;
  });
}

function scheduleNextTick() {
  if (!trackingActive) return;

  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0);
  next.setSeconds(0);
  next.setMilliseconds(0);
  next.setHours(now.getHours() + 1);

  const delay = next.getTime() - now.getTime();

  nextTickTimeout = setTimeout(() => {
    if (trackingActive) {
      createFormWindow();
      scheduleNextTick();
    }
  }, delay);
}

function broadcastStatus() {
  const status = trackingActive ? "Running. You can close this window now." : "Stopped. To quit this app, use tray icon (arrow next to system clock).";
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('status-changed', status);
  });
}


app.whenReady().then(() => {
	createMainWindow();
	createTray();
	setTimeout(broadcastStatus, 500);

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0){
			createMainWindow();
		}	
	})
});

app.on('window-all-closed', () => {

});

ipcMain.on('open-summary-window', () => {
  createSummaryWindow();
});


ipcMain.on('save-mood-entry', async (_event, entry) => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const dataDir = path.join(app.getPath('userData'), 'data');

  try {
    await fsPromises.mkdir(dataDir, { recursive: true });
    const filePath = path.join(dataDir, `${dateStr}.json`);
    let existing = [];

    if (fs.existsSync(filePath)) {
      const content = await fsPromises.readFile(filePath, 'utf-8');
      existing = JSON.parse(content);
    }
    existing.push(entry);
    await fsPromises.writeFile(filePath, JSON.stringify(existing, null, 2), 'utf-8');
		
  } catch (err) {
    console.error('Failed to save mood:', err);
  }
});

ipcMain.on('form-submitted', () => {
  if (formWindow) {
    formWindow.close();
    formWindow = null;
  }
});

ipcMain.on("start-tracking", () => {
  if (!trackingActive) {
    trackingActive = true;
    scheduleNextTick();
  }
	broadcastStatus();
});

ipcMain.on("stop-tracking", () => {
  trackingActive = false;
  if (nextTickTimeout) {
    clearTimeout(nextTickTimeout);
    nextTickTimeout = null;
  }
	broadcastStatus();
});

ipcMain.handle('get-mood-summary', async () => {
  const dataDir = path.join(app.getPath('userData'), 'data');
  const summary: Record<string, any[]> = {};

  try {
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      summary[file.replace('.json', '')] = JSON.parse(content);
    }

    return summary;
  } catch (err) {
    console.error("Failed to read summary:", err);
    return {};
  }
});

ipcMain.handle('enable-auto-launch', () => enableAutoLaunch());
ipcMain.handle('disable-auto-launch', () => disableAutoLaunch());
ipcMain.handle('check-auto-launch', () => isAutoLaunchEnabled());
