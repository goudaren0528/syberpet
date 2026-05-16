import * as PIXI from 'pixi.js'

export class PetEngine {
  private app: PIXI.Application | null = null
  private canvas: HTMLCanvasElement
  private placeholder: PIXI.Text | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async init() {
    this.app = new PIXI.Application({
      view: this.canvas,
      width: this.canvas.clientWidth,
      height: this.canvas.clientHeight,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    })

    this.placeholder = new PIXI.Text('🐱', {
      fontSize: 120,
      fill: 0xffffff,
      align: 'center'
    })
    this.placeholder.anchor.set(0.5)
    this.placeholder.x = this.app.screen.width / 2
    this.placeholder.y = this.app.screen.height / 2
    this.app.stage.addChild(this.placeholder)

    this.app.ticker.add(() => {
      if (this.placeholder && this.placeholder.alpha > 0) {
        this.placeholder.scale.set(1 + Math.sin(Date.now() * 0.003) * 0.03)
        this.placeholder.alpha = 0.5 + Math.sin(Date.now() * 0.002) * 0.15
      }
    })
  }

  setAnimation(_state: string) {
    // Phase 2: Live2D 动画状态切换
  }

  resize(width: number, height: number) {
    this.app?.renderer.resize(width, height)
    if (this.placeholder) {
      this.placeholder.x = width / 2
      this.placeholder.y = height / 2
    }
  }

  destroy() {
    this.app?.destroy(true)
  }
}
