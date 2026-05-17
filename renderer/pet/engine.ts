import * as PIXI from 'pixi.js'

export class PetEngine {
  private app: PIXI.Application | null = null
  private canvas: HTMLCanvasElement
  private body: PIXI.Container | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async init() {
    try {
      const width = this.canvas.clientWidth || 400
      const height = this.canvas.clientHeight || 500

      this.app = new PIXI.Application()
      await this.app.init({
        canvas: this.canvas,
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      })

      this.body = new PIXI.Container()
      this.drawPet(this.body, width, height)
      this.app.stage.addChild(this.body)

      this.app.ticker.add(() => {
        if (this.body && !this.body.destroyed) {
          const s = 1 + Math.sin(Date.now() * 0.003) * 0.03
          this.body.scale.set(s)
          this.body.alpha = 0.85 + Math.sin(Date.now() * 0.002) * 0.1
        }
      })

      console.log('[PetView] PixiJS OK')
    } catch (e) {
      console.error('[PetEngine] init failed:', e)
      throw e
    }
  }

  private drawPet(container: PIXI.Container, w: number, h: number) {
    const cx = w / 2
    const cy = h / 2
    const g = new PIXI.Graphics()

    // Body
    g.fill({ color: 0x7c3aed, alpha: 1 })
    g.ellipse(cx, cy - 10, 80, 90)

    // Left ear
    g.poly([
      cx - 55, cy - 70,
      cx - 25, cy - 90,
      cx - 10, cy - 55
    ])

    // Right ear
    g.poly([
      cx + 55, cy - 70,
      cx + 25, cy - 90,
      cx + 10, cy - 55
    ])

    // Eyes - white
    g.fill({ color: 0xffffff, alpha: 1 })
    g.ellipse(cx - 25, cy - 15, 18, 22)
    g.ellipse(cx + 25, cy - 15, 18, 22)

    // Pupils
    g.fill({ color: 0x1e1b4b, alpha: 1 })
    g.ellipse(cx - 22, cy - 12, 8, 12)
    g.ellipse(cx + 22, cy - 12, 8, 12)

    // Eye shine
    g.fill({ color: 0xffffff, alpha: 0.8 })
    g.ellipse(cx - 26, cy - 18, 5, 6)
    g.ellipse(cx + 18, cy - 18, 5, 6)

    // Mouth
    g.stroke({ color: 0x1e1b4b, alpha: 0.8, width: 3 })
    g.arc(cx, cy + 10, 15, 0.2, Math.PI - 0.2)
    g.stroke({ width: 0 })

    container.addChild(g)
  }

  setAnimation(_state: string) {}
  resize(_w: number, _h: number) {}

  destroy() {
    this.body?.destroy({ children: true })
    this.app?.destroy(true)
  }
}
