/// <reference types="vite/client" />

interface ElectronAPI {
  moveWindow: (dx: number, dy: number) => Promise<void>
  setWindowSize: (w: number, h: number) => Promise<void>
  sendToAgent: (msg: any) => Promise<any>
  onAgentMessage: (callback: (msg: any) => void) => () => void
  onAgentStream: (callback: (chunk: string) => void) => () => void
  onAgentStreamEnd: (callback: () => void) => () => void
  onContextMenu: (callback: (items: any[]) => void) => () => void
  saveConfig: (config: { apiKey: string; provider: string; model: string }) => Promise<any>
  getConfigStatus: () => Promise<{ configured: boolean; provider: string; model: string }>
  generatePetBubble: () => Promise<{ text: string }>
  loadPetState: () => Promise<{ hunger: number; mood: number; energy: number; lastUpdatedAt: number } | null>
  savePetState: (state: { hunger: number; mood: number; energy: number; lastUpdatedAt: number }) => Promise<{ success: boolean }>
  quitApp: () => Promise<{ success: boolean }>
}

interface Window {
  electronAPI?: ElectronAPI
}
