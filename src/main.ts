import {app, BrowserWindow} from 'electron/main';
import path from 'node:path';

function createWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.ts')
		}
	})
	win.loadFile('public/index.html')
}

app.whenReady().then(() => {
	createWindow();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0){
			createWindow();
		}	
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin'){
		app.quit();
	}
})