import { Tray, Menu, BrowserWindow, app, nativeImage } from 'electron'
import path from 'path'

export function createTray(mainWindow: BrowserWindow): Tray | null {
  let tray: Tray

  try {
    const iconPath = path.join(__dirname, '../resources/icon.png')
    tray = new Tray(iconPath)
  } catch {
    // 如果没有图标文件，创建原生 16x16 占位图标
    const size = 16
    const buffer = Buffer.alloc(size * size * 4)
    for (let i = 0; i < buffer.length; i += 4) {
      buffer[i] = 255     // R
      buffer[i + 1] = 128 // G
      buffer[i + 2] = 255 // B
      buffer[i + 3] = 255 // A
    }
    const img = nativeImage.createFromBuffer(buffer, { width: size, height: size })
    tray = new Tray(img)
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '切换对话模式',
      click: () => mainWindow.webContents.send('context-menu', [{ action: 'toggle-chat' }])
    },
    {
      label: '切换专注模式',
      click: () => mainWindow.webContents.send('context-menu', [{ action: 'toggle-focus' }])
    },
    { type: 'separator' },
    {
      label: '设置',
      click: () => mainWindow.webContents.send('context-menu', [{ action: 'open-settings' }])
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => app.quit()
    }
  ])

  tray.setToolTip('SyberPet')
  tray.setContextMenu(contextMenu)

  return tray
}
