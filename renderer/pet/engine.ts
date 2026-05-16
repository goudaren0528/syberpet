import * as PIXI from 'pixi.js'

export class PetEngine {
  private app: PIXI.Application | null = null
  private canvas: HTMLCanvasElement
  private body: PIXI.Graphics | null = null
  private fallbackEl: HTMLDivElement | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async init() {
    try {
      const width = this.canvas.clientWidth || 400
      const height = this.canvas.clientHeight || 500

      this.app = new PIXI.Application({
        view: this.canvas,
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      })

      this.drawPet(width, height)

      this.app.ticker.add(() => {
        if (this.body && !this.body.destroyed) {
          const s = 1 + Math.sin(Date.now() * 0.003) * 0.03
          this.body.scale.set(s, s)
          this.body.alpha = 0.85 + Math.sin(Date.now() * 0.002) * 0.1
        }
      })
    } catch (e) {
      console.error('[PetEngine] init failed, using DOM fallback:', e)
      this.createFallback()
    }
  }

  private drawPet(w: number, h: number) {
    const cx = w / 2
    const cy = h / 2

    this.body = new PIXI.Graphics()

    this.body.beginFill(0x7c3aed, 1)
    this.body.drawEllipse(cx, cy - 10, 80, 90)
    this.body.endFill()

    this.body.beginFill(0x7c3aed, 1)
    this.body.moveTo(cx - 55, cy - 70)
    this.body.lineTo(cx - 25, cy - 90)
    this.body.lineTo(cx - 10, cy - 55)
    this.body.closePath()
    this.body.endFill()
    this.body.beginFill(0x7c3aed, 1)
    this.body.moveTo(cx + 55, cy - 70)
    this.body.lineTo(cx + 25, cy - 90)
    this.body.lineTo(cx + 10, cy - 55)
    this.body.closePath()
    this.body.endFill()

    this.body.beginFill(0xffffff, 1)
    this.body.drawEllipse(cx - 25, cy - 15, 18, 22)
    this.body.drawEllipse(cx + 25, cy - 15, 18, 22)
    this.body.endFill()

    this.body.beginFill(0x1e1b4b, 1)
    this.body.drawEllipse(cx - 22, cy - 12, 8, 12)
    this.body.drawEllipse(cx + 22, cy - 12, 8, 12)
    this.body.endFill()

    this.body.beginFill(0xffffff, 0.8)
    this.body.drawEllipse(cx - 26, cy - 18, 5, 6)
    this.body.drawEllipse(cx + 18, cy - 18, 5, 6)
    this.body.endFill()

    this.body.lineStyle(3, 0x1e1b4b, 0.8)
    this.body.arc(cx, cy + 10, 15, 0.2, Math.PI - 0.2)
    this.body.lineStyle(0)

    this.app!.stage.addChild(this.body)
  }

  private createFallback() {
    this.fallbackEl = document.createElement('div')
    this.fallbackEl.style.cssText = `
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      pointer-events: none; flex-direction: column; gap: 8px;
    `
    this.fallbackEl.innerHTML = `
      <div style="
        width: 160px; height: 160px; border-radius: 50%;
        background: linear-gradient(135deg, #7c3aed, #a78bfa);
        box-shadow: 0 0 40px rgba(124,58,237,0.5);
        display: flex; align-items: center; justify-content: center;
        animation: pet-breathe 3s ease-in-out infinite;
      ">
        <span style="font-size: 72px;">🐱</span>
      </div>
      <style>
        @keyframes pet-breathe {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }
      </style>
    `
    this.canvas.parentElement?.appendChild(this.fallbackEl)
  }

  setAnimation(_state: string) {
    // Phase 2: Live2D animation state switching
  }

  resize(_w: number, _h: number) {}

  destroy() {
    this.body?.destroy()
    this.app?.destroy(true)
    this.fallbackEl?.remove()
  }
}
