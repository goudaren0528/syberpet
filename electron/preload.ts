import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  moveWindow: (dx: number, dy: number) => ipcRenderer.invoke('window:move', dx, dy),
  setWindowSize: (w: number, h: number) => ipcRenderer.invoke('window:set-size', w, h),

  sendToAgent: (msg: any) => ipcRenderer.invoke('agent:send', msg),
  onAgentMessage: (callback: (msg: any) => void) => {
    ipcRenderer.on('agent:message', (_event, msg) => callback(msg))
  },
  onAgentStream: (callback: (chunk: string) => void) => {
    ipcRenderer.on('agent:stream', (_event, chunk: string) => callback(chunk))
  },
  onAgentStreamEnd: (callback: () => void) => {
    ipcRenderer.on('agent:stream-end', () => callback())
  },

  onContextMenu: (callback: (items: any[]) => void) => {
    ipcRenderer.on('context-menu', (_event, items) => callback(items))
  }
})
