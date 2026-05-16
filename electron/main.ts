import { app, BrowserWindow, Tray, screen, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { createTray } from './tray'
import { ConversationManager } from '../agent/conversation/manager'
import type { LLMClientConfig } from '../agent/llm/client'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    x: width - 420,
    y: height - 520,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.setVisibleOnAllWorkspaces(true)
  mainWindow.setAlwaysOnTop(true, 'screen-saver')

  tray = createTray(mainWindow)
}

// ---- Config management ----

dotenv.config()

const configPath = path.resolve(__dirname, '..', 'agent-config.json')

function readConfig(): any {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } catch {
    return { llm: { provider: 'deepseek', model: 'deepseek-chat', apiKey: '' } }
  }
}

function writeConfig(cfg: any) {
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8')
}

function buildLLMConfig(): LLMClientConfig {
  const cfg = readConfig()
  let apiKey = cfg.llm?.apiKey || ''
  if (!apiKey || apiKey === 'sk-your-key-here' || apiKey.startsWith('sk-your')) {
    apiKey = process.env[`${cfg.llm?.provider?.toUpperCase()}_API_KEY`] || apiKey
  }
  return {
    provider: cfg.llm?.provider || 'deepseek',
    apiKey,
    model: cfg.llm?.model,
    maxTokens: cfg.llm?.maxTokens,
    temperature: cfg.llm?.temperature
  }
}

let conversation = new ConversationManager(buildLLMConfig())

// ---- IPC handlers ----

ipcMain.handle('window:move', (_event, deltaX: number, deltaY: number) => {
  if (mainWindow) {
    const [x, y] = mainWindow.getPosition()
    mainWindow.setPosition(x + deltaX, y + deltaY)
  }
})

ipcMain.handle('window:set-size', (_event, w: number, h: number) => {
  if (mainWindow) {
    mainWindow.setSize(w, h)
  }
})

ipcMain.handle('agent:send', async (_event, msg: { type: string; content: string }) => {
  const messageId = crypto.randomUUID()

  if (msg.type === 'user-chat') {
    const generator = conversation.chat(msg.content)

    for await (const chunk of generator) {
      mainWindow?.webContents.send('agent:stream', chunk)
    }

    mainWindow?.webContents.send('agent:stream-end')
  }

  return { id: messageId, handled: true }
})

ipcMain.handle('config:save', async (_event, data: { apiKey: string; provider?: string }) => {
  const cfg = readConfig()
  cfg.llm = cfg.llm || {}
  cfg.llm.apiKey = data.apiKey
  if (data.provider) cfg.llm.provider = data.provider
  writeConfig(cfg)
  conversation = new ConversationManager(buildLLMConfig())
  return { success: true }
})

ipcMain.handle('config:status', async () => {
  const cfg = buildLLMConfig()
  const isValid = !!(cfg.apiKey && cfg.apiKey !== 'sk-your-key-here' && cfg.apiKey.length > 10)
  return { configured: isValid, provider: cfg.provider }
})

// ---- App lifecycle ----

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
