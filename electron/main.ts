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

dotenv.config()

function loadAgentConfig(): LLMClientConfig {
  const configPath = path.resolve(__dirname, '..', 'agent-config.json')
  try {
    const raw = fs.readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(raw)
    // 如果 apiKey 是占位符，尝试从环境变量读取
    let apiKey = parsed.llm.apiKey
    if (!apiKey || apiKey === 'sk-your-key-here' || apiKey.startsWith('sk-your')) {
      const envKey = `${parsed.llm.provider.toUpperCase()}_API_KEY`
      apiKey = process.env[envKey] || apiKey
    }
    return {
      provider: parsed.llm.provider || 'deepseek',
      apiKey,
      model: parsed.llm.model,
      maxTokens: parsed.llm.maxTokens,
      temperature: parsed.llm.temperature
    }
  } catch {
    return { provider: 'deepseek' }
  }
}

const conversation = new ConversationManager(loadAgentConfig())

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

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
