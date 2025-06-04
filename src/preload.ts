import { contextBridge, ipcRenderer } from 'electron';


contextBridge.exposeInMainWorld('electronAPI', {
  openSummaryWindow: () => ipcRenderer.send('open-summary-window'),
  formSubmitted: () => ipcRenderer.send('form-submitted'),
  startTracking: () => ipcRenderer.send("start-tracking"),
  stopTracking: () => ipcRenderer.send("stop-tracking"),
  onStatusChange: (callback: (status: string) => void) => {
    ipcRenderer.on('status-changed', (event, status) => callback(status));
  },
	getMoodSummary: () => ipcRenderer.invoke('get-mood-summary'),
	  enableAutoLaunch: () => ipcRenderer.invoke('enable-auto-launch'),
  disableAutoLaunch: () => ipcRenderer.invoke('disable-auto-launch'),
  checkAutoLaunch: () => ipcRenderer.invoke('check-auto-launch'),
  saveMood: (entry) => ipcRenderer.send('save-mood-entry', entry),
});
