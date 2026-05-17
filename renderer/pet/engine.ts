import * as PIXI from 'pixi.js'

type PetState = 'idle' | 'sleeping' | 'talking' | 'thinking' | 'working'

interface FaceParts {
  body: PIXI.Graphics
  leftPupil: PIXI.Graphics
  rightPupil: PIXI.Graphics
  leftEyeShine: PIXI.Graphics
  rightEyeShine: PIXI.Graphics
  mouth: PIXI.Graphics
  blushL: PIXI.Graphics
  blushR: PIXI.Graphics
}

const STATE_COLORS: Record<PetState, number> = {
  idle: 0x7c3aed,
  sleeping: 0x6d28d9,
  talking: 0x8b5cf6,
  thinking: 0xa78bfa,
  working: 0x6366f1
}

export class PetEngine {
  private app: PIXI.Application | null = null
  private canvas: HTMLCanvasElement
  private container: PIXI.Container = new PIXI.Container()
  private parts: FaceParts | null = null
  private state: PetState = 'idle'
  private mouseX = 0
  private mouseY = 0
  private idleTimer = 0
  private idleAction = ''
  private idleActionTimer = 0
  private blinkTimer = 0
  private talkTimer = 0
  private mouthOpen = false
  private bounceOffset = 0
  private bounceVelo = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async init() {
    const width = this.canvas.clientWidth || 400
    const height = this.canvas.clientHeight || 500

    this.app = new PIXI.Application()
    await this.app.init({
      canvas: this.canvas, width, height,
      backgroundAlpha: 0, antialias: true,
      resolution: window.devicePixelRatio || 1, autoDensity: true
    })

    const cx = width / 2
    const cy = height / 2

    this.parts = this.createFace(cx, cy)
    this.container.addChild(this.parts.body)
    this.app.stage.addChild(this.container)
    this.container.eventMode = 'none'

    this.app.ticker.add(() => this.tick())

    this.scheduleIdle()

    console.log('[PetEngine] initialized, state:', this.state)
  }

  private createFace(cx: number, cy: number): FaceParts {
    const bodyColor = STATE_COLORS.idle

    // --- Body & ears ---
    const body = new PIXI.Graphics()
    body.fill({ color: bodyColor, alpha: 1 })
    body.ellipse(cx, cy - 10, 80, 90)
    body.fill({ color: bodyColor, alpha: 1 })
    body.poly([cx - 55, cy - 70, cx - 25, cy - 90, cx - 10, cy - 55])
    body.fill({ color: bodyColor, alpha: 1 })
    body.poly([cx + 55, cy - 70, cx + 25, cy - 90, cx + 10, cy - 55])

    // --- Eye whites ---
    const leftEyeG = new PIXI.Graphics()
    leftEyeG.fill({ color: 0xffffff, alpha: 1 })
    leftEyeG.ellipse(0, 0, 18, 22)
    leftEyeG.x = cx - 25
    leftEyeG.y = cy - 15

    const rightEyeG = new PIXI.Graphics()
    rightEyeG.fill({ color: 0xffffff, alpha: 1 })
    rightEyeG.ellipse(0, 0, 18, 22)
    rightEyeG.x = cx + 25
    rightEyeG.y = cy - 15

    // --- Pupils ---
    const leftPupil = new PIXI.Graphics()
    leftPupil.fill({ color: 0x1e1b4b, alpha: 1 })
    leftPupil.ellipse(0, 0, 8, 12)
    leftPupil.x = cx - 25
    leftPupil.y = cy - 15

    const rightPupil = new PIXI.Graphics()
    rightPupil.fill({ color: 0x1e1b4b, alpha: 1 })
    rightPupil.ellipse(0, 0, 8, 12)
    rightPupil.x = cx + 25
    rightPupil.y = cy - 15

    // --- Eye shines ---
    const leftEyeShine = new PIXI.Graphics()
    leftEyeShine.fill({ color: 0xffffff, alpha: 0.9 })
    leftEyeShine.ellipse(0, 0, 5, 6)
    leftEyeShine.x = cx - 29
    leftEyeShine.y = cy - 19

    const rightEyeShine = new PIXI.Graphics()
    rightEyeShine.fill({ color: 0xffffff, alpha: 0.9 })
    rightEyeShine.ellipse(0, 0, 5, 6)
    rightEyeShine.x = cx + 21
    rightEyeShine.y = cy - 19

    // --- Mouth ---
    const mouth = new PIXI.Graphics()
    mouth.stroke({ color: 0x1e1b4b, alpha: 0.8, width: 3 })
    mouth.arc(0, 0, 15, 0.2, Math.PI - 0.2)
    mouth.x = cx
    mouth.y = cy + 10

    // --- Blushes ---
    const blushL = new PIXI.Graphics()
    blushL.fill({ color: 0xf472b6, alpha: 0.3 })
    blushL.ellipse(0, 0, 14, 8)
    blushL.x = cx - 42
    blushL.y = cy + 5

    const blushR = new PIXI.Graphics()
    blushR.fill({ color: 0xf472b6, alpha: 0.3 })
    blushR.ellipse(0, 0, 14, 8)
    blushR.x = cx + 42
    blushR.y = cy + 5

    body.addChild(leftEyeG, rightEyeG, leftPupil, rightPupil, leftEyeShine, rightEyeShine, mouth, blushL, blushR)

    return { body, leftPupil, rightPupil, leftEyeShine, rightEyeShine, mouth, blushL, blushR }
  }

  private tick() {
    if (!this.parts) return
    const dt = this.app!.ticker.deltaMS / 1000

    // Bounce
    if (Math.abs(this.bounceVelo) > 0.001 || Math.abs(this.bounceOffset) > 0.01) {
      this.bounceVelo += -this.bounceOffset * 20 * dt - this.bounceVelo * 8 * dt
      this.bounceOffset += this.bounceVelo * dt
      this.container.y = this.bounceOffset
    }

    // Breathing (base)
    const breathe = 1 + Math.sin(Date.now() * 0.003) * 0.02
    if (this.state === 'sleeping') {
      this.container.scale.set(breathe * 0.95)
      this.container.alpha = 0.82 + Math.sin(Date.now() * 0.001) * 0.08
    } else if (this.state !== 'talking') {
      this.container.scale.set(breathe)
      this.container.alpha = 0.92 + Math.sin(Date.now() * 0.002) * 0.06
    }

    // Blink
    this.blinkTimer += dt
    const blinkInterval = this.state === 'sleeping' ? 2.5 : this.state === 'thinking' ? 1.5 : 4.0
    if (this.blinkTimer > blinkInterval + Math.random() * 3) {
      this.blinkTimer = 0
      this.triggerBlink()
    }
    this.updateBlink()

    // Eye tracking
    this.updateEyeTracking()

    // Idle action timer
    this.idleTimer -= dt
    if (this.idleTimer <= 0 && this.state === 'idle') {
      this.doIdleAction()
      this.scheduleIdle()
    }

    // Idle action progress
    if (this.idleActionTimer > 0) {
      this.idleActionTimer -= dt
      this.updateIdleAction()
      if (this.idleActionTimer <= 0) {
        this.idleAction = ''
        this.resetPose()
      }
    }

    // Talking
    if (this.state === 'talking') {
      this.talkTimer += dt
      if (this.talkTimer > 0.15 + Math.random() * 0.1) {
        this.talkTimer = 0
        this.mouthOpen = !this.mouthOpen
        this.drawMouth()
      }
    }

    // Working shake
    if (this.state === 'working') {
      const shake = Math.sin(Date.now() * 0.015) * 2
      this.container.x = shake
    }

    // Thinking spin
    if (this.state === 'thinking') {
      const spin = Math.sin(Date.now() * 0.004) * 0.04
      this.container.rotation = spin
    }
  }

  private updateEyeTracking() {
    if (!this.parts || this.state === 'sleeping') return

    const bodyCenter = this.parts.body
    const bx = bodyCenter.x
    const by = bodyCenter.y

    // Map mouse to eye offset (max 6px)
    const dx = (this.mouseX - bx) / 100
    const dy = (this.mouseY - by) / 100
    const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v))

    const px = clamp(dx, 5)
    const py = clamp(dy, 4)

    this.parts.leftPupil.x = bx - 25 + px
    this.parts.leftPupil.y = by - 15 + py
    this.parts.rightPupil.x = bx + 25 + px
    this.parts.rightPupil.y = by - 15 + py
    this.parts.leftEyeShine.x = bx - 29 + px
    this.parts.leftEyeShine.y = by - 19 + py
    this.parts.rightEyeShine.x = bx + 21 + px
    this.parts.rightEyeShine.y = by - 19 + py
  }

  private triggerBlink() {
    if (!this.parts || this.state === 'sleeping') return
    this._blinkPhase = 0
    this._blinkActive = true
  }

  private _blinkPhase = 0
  private _blinkActive = false

  private updateBlink() {
    if (!this._blinkActive || !this.parts) return
    this._blinkPhase += 0.06
    const t = Math.sin(this._blinkPhase * Math.PI)
    const sy = 1 - Math.abs(t) * 0.95
    this.parts.body.children.forEach(c => {
      if (c === this.parts!.leftEyeShine || c === this.parts!.rightEyeShine) {
        c.scale.y = sy
      }
    })
    // Also scale eye white and pupil
    const eyeScale = 1 - Math.abs(t) * 0.9
    ;[this.parts.leftPupil, this.parts.rightPupil].forEach(c => { c.scale.y = eyeScale })
    if (this._blinkPhase > 1) {
      this._blinkActive = false
      this.resetEyes()
    }
  }

  private resetEyes() {
    if (!this.parts) return
    this.parts.body.children.forEach(c => { c.scale.set(1) })
  }

  private scheduleIdle() {
    this.idleTimer = 8 + Math.random() * 15
  }

  private doIdleAction() {
    const actions = ['blink', 'tilt', 'bounce', 'look']
    this.idleAction = actions[Math.floor(Math.random() * actions.length)]
    this.idleActionTimer = 1.5

    if (this.idleAction === 'bounce') {
      this.bounceVelo = -8
    }
  }

  private updateIdleAction() {
    if (!this.parts) return
    const t = this.idleActionTimer / 1.5

    if (this.idleAction === 'tilt') {
      this.container.rotation = Math.sin(t * Math.PI * 2) * 0.15
    } else if (this.idleAction === 'look') {
      this.container.rotation = Math.sin(t * Math.PI) * 0.1
    }
  }

  private resetPose() {
    if (this.state !== 'thinking') {
      this.container.rotation = 0
    }
    if (this.state !== 'working') {
      this.container.x = 0
    }
  }

  private drawMouth() {
    if (!this.parts) return
    const g = this.parts.mouth
    g.clear()

    if (this.state === 'sleeping') {
      g.stroke({ color: 0x1e1b4b, alpha: 0.6, width: 2 })
      g.ellipse(0, 0, 8, 4)
      return
    }

    if (this.state === 'talking' && this.mouthOpen) {
      g.fill({ color: 0x1e1b4b, alpha: 0.7 })
      g.ellipse(0, 0, 10, 14)
    } else {
      g.stroke({ color: 0x1e1b4b, alpha: 0.8, width: 3 })
      g.arc(0, 0, 15, 0.2, Math.PI - 0.2)
    }
  }

  setAnimation(state: string) {
    const prev = this.state
    this.state = state as PetState
    if (this.state !== prev) {
      console.log('[PetEngine] state:', prev, '→', this.state)
      this.applyState()
    }
  }

  private applyState() {
    if (!this.parts) return

    const color = STATE_COLORS[this.state] || STATE_COLORS.idle
    this.redrawBody(color)
    this.drawMouth()

    // Sleeping: close eyes
    if (this.state === 'sleeping') {
      this.container.rotation = 0
      this.container.x = 0
    }

    // Working: slight vibration
    if (this.state === 'working') {
      this.container.rotation = 0
      this.mouthOpen = false
      this.drawMouth()
    }

    // Thinking: tilt + spin
    if (this.state === 'thinking') {
      this.container.x = 0
    }

    // Talking: reset
    if (this.state === 'talking') {
      this.container.rotation = 0
      this.container.x = 0
      this.talkTimer = 0
    }

    // Idle: reset all
    if (this.state === 'idle') {
      this.container.rotation = 0
      this.container.x = 0
      this.container.y = 0
      this.bounceOffset = 0
      this.bounceVelo = 0
    }
  }

  private redrawBody(color: number) {
    if (!this.parts) return
    const g = this.parts.body
    const cx = g.x
    const cy = g.y

    // Preserve children, just redraw the body/ears shapes
    // Actually with PixiJS v8, we need to clear and redraw
    g.clear()
    g.fill({ color, alpha: 1 })
    g.ellipse(cx, cy - 10, 80, 90)
    g.fill({ color, alpha: 1 })
    g.poly([cx - 55, cy - 70, cx - 25, cy - 90, cx - 10, cy - 55])
    g.fill({ color, alpha: 1 })
    g.poly([cx + 55, cy - 70, cx + 25, cy - 90, cx + 10, cy - 55])
  }

  trackMouse(x: number, y: number) {
    this.mouseX = x
    this.mouseY = y
  }

  bounce() {
    this.bounceVelo = -10
  }

  updateStreaming(_chunk: string) {
    if (this.state !== 'talking') {
      this.setAnimation('talking')
    }
  }

  endStreaming() {
    if (this.state === 'talking') {
      this.setAnimation('idle')
    }
  }

  destroy() {
    this.container.destroy({ children: true })
    this.app?.destroy(true)
  }
}
