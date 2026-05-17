import { app, BrowserWindow, Tray, screen, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'
import { createTray } from './tray'
import { ConversationManager } from '../agent/conversation/manager'
import { LLMClient } from '../agent/llm/client'
import type { LLMClientConfig } from '../agent/llm/client'
import type { LLMMessage } from '../agent/llm/types'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
const WIN_W = 400
const WIN_H = 500

function ensureWindowContentSize(win: BrowserWindow) {
  const [contentWidth, contentHeight] = win.getContentSize()
  if (contentWidth === WIN_W && contentHeight === WIN_H) return
  win.setContentSize(WIN_W, WIN_H)
}

function createWindow() {
  const display = screen.getPrimaryDisplay()
  const { width, height } = display.workAreaSize

  const winX = Math.round((width - WIN_W) / 2)
  const winY = Math.round((height - WIN_H) / 2)

  console.log(`[main] screen: ${width}x${height}, window: ${WIN_W}x${WIN_H} at (${winX}, ${winY})`)

  mainWindow = new BrowserWindow({
    width: WIN_W,
    height: WIN_H,
    minWidth: WIN_W,
    maxWidth: WIN_W,
    minHeight: WIN_H,
    maxHeight: WIN_H,
    x: winX,
    y: winY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    thickFrame: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  const loadURL = process.env.VITE_DEV_SERVER_URL
  console.log(`[main] loading: ${loadURL || 'file'}`)

  if (loadURL) {
    mainWindow.loadURL(loadURL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[main] window loaded')
    ensureWindowContentSize(mainWindow!)
  })

  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error(`[main] load failed: ${code} - ${desc}`)
  })

  mainWindow.on('resize', () => {
    ensureWindowContentSize(mainWindow!)
  })

  mainWindow.on('move', () => {
    ensureWindowContentSize(mainWindow!)
  })

  mainWindow.setContentSize(WIN_W, WIN_H)

  mainWindow.webContents.openDevTools({ mode: 'detach' })
  mainWindow.setAlwaysOnTop(true, 'screen-saver')

  tray = createTray(mainWindow)
}

// ---- Config management ----

dotenv.config()

const configPath = path.resolve(__dirname, '..', 'agent-config.json')
const petStatePath = path.join(app.getPath('userData'), 'pet-data.json')

interface PetStateData {
  hunger: number
  mood: number
  energy: number
  lastUpdatedAt: number
}

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

function readPetState(): PetStateData | null {
  try {
    if (!fs.existsSync(petStatePath)) return null
    return JSON.parse(fs.readFileSync(petStatePath, 'utf-8')) as PetStateData
  } catch (error) {
    console.error('[main] readPetState failed:', error)
    return null
  }
}

function writePetState(state: PetStateData) {
  fs.writeFileSync(petStatePath, JSON.stringify(state, null, 2), 'utf-8')
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

function hasConfiguredApiKey() {
  const cfg = buildLLMConfig()
  return !!(cfg.apiKey && cfg.apiKey !== 'sk-your-key-here' && cfg.apiKey.length > 10)
}

async function generatePetBubbleText() {
  const cfg = buildLLMConfig()
  const llm = new LLMClient({
    ...cfg,
    maxTokens: Math.min(cfg.maxTokens ?? 80, 80),
    temperature: 0.9
  })

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: '你是桌宠 SyberPet。请只生成一句 12 到 28 个中文字符左右的简短自言自语，不要使用引号，不要分点，不要解释，不要提到你是AI。语气可爱、轻松、像在陪伴主人。'
    },
    {
      role: 'user',
      content: '请给我一句适合桌宠随机冒泡的短句。'
    }
  ]

  let fullText = ''
  for await (const chunk of llm.chat(messages)) {
    fullText += chunk
  }

  return fullText.trim().replace(/[\r\n]+/g, ' ').slice(0, 80)
}

let conversation = new ConversationManager(buildLLMConfig())

// ---- IPC handlers ----

ipcMain.handle('window:move', (_event, deltaX: number, deltaY: number) => {
  if (mainWindow) {
    const [x, y] = mainWindow.getPosition()
    mainWindow.setPosition(x + deltaX, y + deltaY)
    ensureWindowContentSize(mainWindow)
  }
})

ipcMain.handle('window:set-size', (_event, w: number, h: number) => {
  if (mainWindow) {
    mainWindow.setContentSize(w, h)
  }
})

ipcMain.handle('agent:send', async (_event, msg: { type: string; content: string }) => {
  const messageId = randomUUID()

  if (msg.type === 'user-chat') {
    const generator = conversation.chat(msg.content)

    for await (const chunk of generator) {
      mainWindow?.webContents.send('agent:stream', chunk)
    }

    mainWindow?.webContents.send('agent:stream-end')
  }

  return { id: messageId, handled: true }
})

ipcMain.handle('config:save', async (_event, data: { apiKey: string; provider?: string; model?: string }) => {
  const cfg = readConfig()
  cfg.llm = cfg.llm || {}
  cfg.llm.apiKey = data.apiKey
  if (data.provider) cfg.llm.provider = data.provider
  if (data.model) cfg.llm.model = data.model
  writeConfig(cfg)
  conversation = new ConversationManager(buildLLMConfig())
  return { success: true }
})

ipcMain.handle('config:status', async () => {
  const cfg = buildLLMConfig()
  const isValid = !!(cfg.apiKey && cfg.apiKey !== 'sk-your-key-here' && cfg.apiKey.length > 10)
  return { configured: isValid, provider: cfg.provider, model: cfg.model }
})

ipcMain.handle('pet:generate-bubble', async () => {
  if (!hasConfiguredApiKey()) return { text: '' }
  try {
    const text = await generatePetBubbleText()
    return { text }
  } catch (error) {
    console.error('[main] generatePetBubble failed:', error)
    return { text: '' }
  }
})

ipcMain.handle('pet:load-state', async () => {
  return readPetState()
})

ipcMain.handle('pet:save-state', async (_event, state: PetStateData) => {
  writePetState(state)
  return { success: true }
})

ipcMain.handle('app:quit', async () => {
  app.quit()
  return { success: true }
})

// ---- App lifecycle ----

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
