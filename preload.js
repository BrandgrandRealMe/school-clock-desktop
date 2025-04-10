console.log('Preload script loaded');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveSchedule: (schedule) => ipcRenderer.invoke('save-schedule', schedule),
  loadSchedule: () => ipcRenderer.invoke('load-schedule'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openSettings: () => {
    try {
      ipcRenderer.send('open-settings');
    } catch (error) {
      console.error('IPC communication error:', error);
    }
  },
  onScheduleUpdate: (callback) => {
    ipcRenderer.on('schedule-updated', (event, schedule) => callback(schedule));
  },
  removeScheduleListener: () => {
    ipcRenderer.removeAllListeners('schedule-updated');
  }
});