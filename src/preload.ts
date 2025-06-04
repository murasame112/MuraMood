import { contextBridge, ipcRenderer } from 'electron';


contextBridge.exposeInMainWorld('electronAPI', {
  openFormWindow: () => ipcRenderer.send('open-form-window'),
  openSummaryWindow: () => ipcRenderer.send('open-summary-window'),
  formSubmitted: () => ipcRenderer.send('form-submitted'),
  startTracking: () => ipcRenderer.send("start-tracking"),
  stopTracking: () => ipcRenderer.send("stop-tracking"),
  onStatusChange: (callback: (status: string) => void) => {
    ipcRenderer.on('status-changed', (event, status) => callback(status));
  },
	getMoodSummary: () => ipcRenderer.invoke('get-mood-summary'),
  saveMood: (entry) => ipcRenderer.send('save-mood-entry', entry),
});
