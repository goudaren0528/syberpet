import * as PIXI from 'pixi.js'

export class PetEngine {
  private app: PIXI.Application | null = null
  private canvas: HTMLCanvasElement
  private body: PIXI.Graphics | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async init() {
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

    // Visible placeholder: purple circle with face
    this.body = new PIXI.Graphics()
    const cx = width / 2
    const cy = height / 2

    // Body (round)
    this.body.beginFill(0x7c3aed, 1)
    this.body.drawEllipse(cx, cy - 10, 80, 90)
    this.body.endFill()

    // Ears (triangles)
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

    // Eyes (white)
    this.body.beginFill(0xffffff, 1)
    this.body.drawEllipse(cx - 25, cy - 15, 18, 22)
    this.body.drawEllipse(cx + 25, cy - 15, 18, 22)
    this.body.endFill()

    // Pupils (dark)
    this.body.beginFill(0x1e1b4b, 1)
    this.body.drawEllipse(cx - 22, cy - 12, 8, 12)
    this.body.drawEllipse(cx + 22, cy - 12, 8, 12)
    this.body.endFill()

    // Eye shine
    this.body.beginFill(0xffffff, 0.8)
    this.body.drawEllipse(cx - 26, cy - 18, 5, 6)
    this.body.drawEllipse(cx + 18, cy - 18, 5, 6)
    this.body.endFill()

    // Mouth (smile)
    this.body.lineStyle(3, 0x1e1b4b, 0.8)
    this.body.arc(cx, cy + 10, 15, 0.2, Math.PI - 0.2)
    this.body.lineStyle(0)

    this.body.x = 0
    this.body.y = 0
    this.app.stage.addChild(this.body)

    // Breathing animation
    this.app.ticker.add(() => {
      if (this.body) {
        const s = 1 + Math.sin(Date.now() * 0.003) * 0.03
        this.body.scale.set(s, s)
        this.body.alpha = 0.85 + Math.sin(Date.now() * 0.002) * 0.1
      }
    })
  }

  setAnimation(_state: string) {
    // Phase 2: Live2D animation state switching
  }

  resize(width: number, height: number) {
    this.app?.renderer.resize(width, height)
  }

  destroy() {
    this.app?.destroy(true)
  }
}
