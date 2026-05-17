import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  moveWindow: (dx: number, dy: number) => ipcRenderer.invoke('window:move', dx, dy),
  setWindowSize: (w: number, h: number) => ipcRenderer.invoke('window:set-size', w, h),

  sendToAgent: (msg: any) => ipcRenderer.invoke('agent:send', msg),
  onAgentMessage: (callback: (msg: any) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, msg: any) => callback(msg)
    ipcRenderer.on('agent:message', listener)
    return () => ipcRenderer.removeListener('agent:message', listener)
  },
  onAgentStream: (callback: (chunk: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, chunk: string) => callback(chunk)
    ipcRenderer.on('agent:stream', listener)
    return () => ipcRenderer.removeListener('agent:stream', listener)
  },
  onAgentStreamEnd: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('agent:stream-end', listener)
    return () => ipcRenderer.removeListener('agent:stream-end', listener)
  },

  onContextMenu: (callback: (items: any[]) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, items: any[]) => callback(items)
    ipcRenderer.on('context-menu', listener)
    return () => ipcRenderer.removeListener('context-menu', listener)
  },

  saveConfig: (config: { apiKey: string; provider: string; model: string }) =>
    ipcRenderer.invoke('config:save', config),
  getConfigStatus: () => ipcRenderer.invoke('config:status'),
  generatePetBubble: () => ipcRenderer.invoke('pet:generate-bubble'),
  loadPetState: () => ipcRenderer.invoke('pet:load-state'),
  savePetState: (state: any) => ipcRenderer.invoke('pet:save-state', state),
  quitApp: () => ipcRenderer.invoke('app:quit')
})
