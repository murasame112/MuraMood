import { ipcMain } from 'electron';
import {app, BrowserWindow} from 'electron/main';
import path from 'node:path';
import fs from 'fs';
import fsPromises from 'fs/promises';

let mainWindow: BrowserWindow | null = null;
let formWindow: BrowserWindow | null = null;
let summaryWindow: BrowserWindow | null = null;


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

	mainWindow.on('closed', () => {
    mainWindow = null;
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


app.whenReady().then(() => {
	createMainWindow();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0){
			createMainWindow();
		}	
	})
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin'){
		app.quit();
	}
});

ipcMain.on('open-form-window', () => {
  createFormWindow();
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