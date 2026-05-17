import * as PIXI from 'pixi.js'

type PetState = 'idle' | 'sleeping' | 'talking' | 'thinking' | 'working'

interface FaceParts {
  body: PIXI.Graphics
  bodyShadow: PIXI.Graphics
  earInnerL: PIXI.Graphics
  earInnerR: PIXI.Graphics
  leftEye: PIXI.Graphics
  rightEye: PIXI.Graphics
  leftPupil: PIXI.Graphics
  rightPupil: PIXI.Graphics
  leftEyeShine: PIXI.Graphics
  rightEyeShine: PIXI.Graphics
  leftEyeShine2: PIXI.Graphics
  rightEyeShine2: PIXI.Graphics
  nose: PIXI.Graphics
  mouth: PIXI.Graphics
  whiskerL: PIXI.Graphics
  whiskerR: PIXI.Graphics
  blushL: PIXI.Graphics
  blushR: PIXI.Graphics
  tail: PIXI.Graphics
  pawL: PIXI.Graphics
  pawR: PIXI.Graphics
  belly: PIXI.Graphics
}

// Soft, friendly palette — cream cat with warm accents
const STATE_PALETTES: Record<PetState, { body: number; bodyLight: number; accent: number }> = {
  idle:     { body: 0xf5e6d3, bodyLight: 0xfff5eb, accent: 0xffb088 },
  sleeping: { body: 0xe8d8c8, bodyLight: 0xf0e6da, accent: 0xdda888 },
  talking:  { body: 0xffecd6, bodyLight: 0xfff8f0, accent: 0xffb888 },
  thinking: { body: 0xe0d8f0, bodyLight: 0xf0ebff, accent: 0xb8a0e0 },
  working:  { body: 0xd8e8f0, bodyLight: 0xebf4ff, accent: 0x88b8e0 },
}

export class PetEngine {
  private app: PIXI.Application | null = null
  private canvas: HTMLCanvasElement
  private container: PIXI.Container = new PIXI.Container()
  private parts: FaceParts | null = null
  private state: PetState = 'idle'
  private destroyed = false
  private initialized = false
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
  private tailPhase = 0
  private cx = 0
  private cy = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async init(): Promise<boolean> {
    const width = this.canvas.clientWidth || 400
    const height = this.canvas.clientHeight || 500
    console.log('[PetEngine] init start, canvas:', width, 'x', height, 'destroyed:', this.destroyed)

    this.app = new PIXI.Application()
    await this.app.init({
      canvas: this.canvas, width, height,
      backgroundAlpha: 0, antialias: true,
      resolution: 1, autoDensity: true
    })

    // destroyed during async init (React strict mode double-mount)
    if (this.destroyed) {
      console.log('[PetEngine] init aborted — destroyed during await')
      try { this.app.destroy(false) } catch (_) { /* noop */ }
      this.app = null
      return false
    }

    this.initialized = true
    this.cx = width / 2
    this.cy = height / 2 + 20

    this.parts = this.createCat(this.cx, this.cy)
    this.app.stage.addChild(this.container)
    this.container.eventMode = 'none'

    this.app.ticker.add(() => this.tick())
    this.scheduleIdle()

    console.log('[PetEngine] initialized OK, children:', this.container.children.length,
      'stage children:', this.app.stage.children.length,
      'canvas size:', this.canvas.width, 'x', this.canvas.height)

    return true
  }

  private createCat(cx: number, cy: number): FaceParts {
    const p = STATE_PALETTES.idle

    // --- Tail (behind body) ---
    const tail = new PIXI.Graphics()
    this.drawTail(tail, cx, cy, p.body, 0)
    this.container.addChild(tail)

    // --- Body shadow ---
    const bodyShadow = new PIXI.Graphics()
    bodyShadow.ellipse(cx, cy + 80, 65, 12)
    bodyShadow.fill({ color: 0x000000, alpha: 0.06 })
    this.container.addChild(bodyShadow)

    // --- Main body ---
    const body = new PIXI.Graphics()
    this.drawBodyShape(body, cx, cy, p.body)
    this.container.addChild(body)

    // --- Ear inners ---
    const earInnerL = new PIXI.Graphics()
    earInnerL.poly([cx - 46, cy - 68, cx - 26, cy - 80, cx - 16, cy - 58])
    earInnerL.fill({ color: p.accent, alpha: 0.5 })
    this.container.addChild(earInnerL)

    const earInnerR = new PIXI.Graphics()
    earInnerR.poly([cx + 46, cy - 68, cx + 26, cy - 80, cx + 16, cy - 58])
    earInnerR.fill({ color: p.accent, alpha: 0.5 })
    this.container.addChild(earInnerR)

    // --- Belly patch ---
    const belly = new PIXI.Graphics()
    belly.ellipse(cx, cy + 20, 45, 40)
    belly.fill({ color: p.bodyLight, alpha: 0.7 })
    this.container.addChild(belly)

    // --- Paws ---
    const pawL = new PIXI.Graphics()
    pawL.ellipse(cx - 30, cy + 65, 18, 12)
    pawL.fill({ color: p.bodyLight, alpha: 0.9 })
    // Toe beans
    pawL.circle(cx - 35, cy + 63, 4)
    pawL.circle(cx - 28, cy + 61, 4)
    pawL.circle(cx - 25, cy + 67, 4)
    pawL.fill({ color: p.accent, alpha: 0.3 })
    this.container.addChild(pawL)

    const pawR = new PIXI.Graphics()
    pawR.ellipse(cx + 30, cy + 65, 18, 12)
    pawR.fill({ color: p.bodyLight, alpha: 0.9 })
    pawR.circle(cx + 35, cy + 63, 4)
    pawR.circle(cx + 28, cy + 61, 4)
    pawR.circle(cx + 25, cy + 67, 4)
    pawR.fill({ color: p.accent, alpha: 0.3 })
    this.container.addChild(pawR)

    // --- Eye whites ---
    const leftEye = new PIXI.Graphics()
    leftEye.ellipse(0, 0, 20, 24)
    leftEye.fill({ color: 0xffffff, alpha: 1 })
    leftEye.x = cx - 28
    leftEye.y = cy - 18
    this.container.addChild(leftEye)

    const rightEye = new PIXI.Graphics()
    rightEye.ellipse(0, 0, 20, 24)
    rightEye.fill({ color: 0xffffff, alpha: 1 })
    rightEye.x = cx + 28
    rightEye.y = cy - 18
    this.container.addChild(rightEye)

    // --- Pupils (large, cute anime-style) ---
    const leftPupil = new PIXI.Graphics()
    leftPupil.ellipse(0, 0, 12, 16)
    leftPupil.fill({ color: 0x2d1b4e, alpha: 1 })
    leftPupil.x = cx - 28
    leftPupil.y = cy - 16
    this.container.addChild(leftPupil)

    const rightPupil = new PIXI.Graphics()
    rightPupil.ellipse(0, 0, 12, 16)
    rightPupil.fill({ color: 0x2d1b4e, alpha: 1 })
    rightPupil.x = cx + 28
    rightPupil.y = cy - 16
    this.container.addChild(rightPupil)

    // --- Eye shines (primary — large) ---
    const leftEyeShine = new PIXI.Graphics()
    leftEyeShine.ellipse(0, 0, 6, 7)
    leftEyeShine.fill({ color: 0xffffff, alpha: 0.95 })
    leftEyeShine.x = cx - 33
    leftEyeShine.y = cy - 23
    this.container.addChild(leftEyeShine)

    const rightEyeShine = new PIXI.Graphics()
    rightEyeShine.ellipse(0, 0, 6, 7)
    rightEyeShine.fill({ color: 0xffffff, alpha: 0.95 })
    rightEyeShine.x = cx + 23
    rightEyeShine.y = cy - 23
    this.container.addChild(rightEyeShine)

    // --- Eye shines (secondary — small) ---
    const leftEyeShine2 = new PIXI.Graphics()
    leftEyeShine2.ellipse(0, 0, 3, 3)
    leftEyeShine2.fill({ color: 0xffffff, alpha: 0.7 })
    leftEyeShine2.x = cx - 23
    leftEyeShine2.y = cy - 10
    this.container.addChild(leftEyeShine2)

    const rightEyeShine2 = new PIXI.Graphics()
    rightEyeShine2.ellipse(0, 0, 3, 3)
    rightEyeShine2.fill({ color: 0xffffff, alpha: 0.7 })
    rightEyeShine2.x = cx + 33
    rightEyeShine2.y = cy - 10
    this.container.addChild(rightEyeShine2)

    // --- Nose ---
    const nose = new PIXI.Graphics()
    nose.poly([cx - 5, cy + 4, cx + 5, cy + 4, cx, cy + 10])
    nose.fill({ color: p.accent, alpha: 0.8 })
    this.container.addChild(nose)

    // --- Mouth ---
    const mouth = new PIXI.Graphics()
    this.drawMouthShape(mouth, cx, cy, false)
    this.container.addChild(mouth)

    // --- Whiskers ---
    const whiskerL = new PIXI.Graphics()
    this.drawWhiskers(whiskerL, cx, cy, -1)
    this.container.addChild(whiskerL)

    const whiskerR = new PIXI.Graphics()
    this.drawWhiskers(whiskerR, cx, cy, 1)
    this.container.addChild(whiskerR)

    // --- Blushes ---
    const blushL = new PIXI.Graphics()
    blushL.ellipse(0, 0, 16, 9)
    blushL.fill({ color: 0xf472b6, alpha: 0.2 })
    blushL.x = cx - 48
    blushL.y = cy + 2
    this.container.addChild(blushL)

    const blushR = new PIXI.Graphics()
    blushR.ellipse(0, 0, 16, 9)
    blushR.fill({ color: 0xf472b6, alpha: 0.2 })
    blushR.x = cx + 48
    blushR.y = cy + 2
    this.container.addChild(blushR)

    return {
      body, bodyShadow, earInnerL, earInnerR,
      leftEye, rightEye, leftPupil, rightPupil,
      leftEyeShine, rightEyeShine, leftEyeShine2, rightEyeShine2,
      nose, mouth, whiskerL, whiskerR, blushL, blushR,
      tail, pawL, pawR, belly
    }
  }

  // PixiJS v8 API: shape() THEN fill()/stroke() to commit
  private drawBodyShape(g: PIXI.Graphics, cx: number, cy: number, color: number) {
    g.clear()
    // Main head/body
    g.ellipse(cx, cy, 75, 85)
    g.fill({ color, alpha: 1 })
    // Left ear
    g.poly([cx - 58, cy - 55, cx - 25, cy - 92, cx - 8, cy - 52])
    g.fill({ color, alpha: 1 })
    // Right ear
    g.poly([cx + 58, cy - 55, cx + 25, cy - 92, cx + 8, cy - 52])
    g.fill({ color, alpha: 1 })
    // Ear outline strokes
    g.poly([cx - 58, cy - 55, cx - 25, cy - 92, cx - 8, cy - 52])
    g.stroke({ color: 0x000000, alpha: 0.08, width: 1.5 })
    g.poly([cx + 58, cy - 55, cx + 25, cy - 92, cx + 8, cy - 52])
    g.stroke({ color: 0x000000, alpha: 0.08, width: 1.5 })
  }

  private drawTail(g: PIXI.Graphics, cx: number, cy: number, color: number, phase: number) {
    g.clear()
    const baseX = cx + 55
    const baseY = cy + 40
    const tipOffset = Math.sin(phase) * 20

    g.moveTo(baseX, baseY)
    g.bezierCurveTo(
      baseX + 30, baseY - 20,
      baseX + 50 + tipOffset * 0.3, baseY - 60,
      baseX + 35 + tipOffset, baseY - 90
    )
    g.stroke({ color, width: 14, cap: 'round' })
  }

  private drawWhiskers(g: PIXI.Graphics, cx: number, cy: number, side: number) {
    g.clear()
    const sx = cx + side * 30
    const sy = cy + 8

    g.moveTo(sx, sy - 4)
    g.lineTo(sx + side * 40, sy - 12)
    g.moveTo(sx, sy)
    g.lineTo(sx + side * 42, sy)
    g.moveTo(sx, sy + 4)
    g.lineTo(sx + side * 38, sy + 10)
    g.stroke({ color: 0x000000, alpha: 0.15, width: 1.5, cap: 'round' })
  }

  private drawMouthShape(g: PIXI.Graphics, cx: number, cy: number, open: boolean) {
    g.clear()
    if (this.state === 'sleeping') {
      g.moveTo(cx - 6, cy + 14)
      g.bezierCurveTo(cx - 3, cy + 17, cx + 3, cy + 17, cx + 6, cy + 14)
      g.stroke({ color: 0x8b7355, alpha: 0.4, width: 2, cap: 'round' })
      return
    }

    if (open) {
      // Open mouth
      g.ellipse(cx, cy + 16, 8, 10)
      g.fill({ color: 0x4a2020, alpha: 0.6 })
      // Tongue
      g.ellipse(cx, cy + 20, 5, 4)
      g.fill({ color: 0xf08080, alpha: 0.5 })
    } else {
      // Cat "w" mouth
      g.moveTo(cx, cy + 10)
      g.bezierCurveTo(cx - 3, cy + 16, cx - 10, cy + 18, cx - 14, cy + 13)
      g.moveTo(cx, cy + 10)
      g.bezierCurveTo(cx + 3, cy + 16, cx + 10, cy + 18, cx + 14, cy + 13)
      g.stroke({ color: 0x8b7355, alpha: 0.5, width: 2, cap: 'round' })
    }
  }

  private tick() {
    if (this.destroyed || !this.parts || !this.app) return
    const dt = this.app.ticker.deltaMS / 1000
    const cx = this.cx
    const cy = this.cy

    // Bounce physics
    if (Math.abs(this.bounceVelo) > 0.001 || Math.abs(this.bounceOffset) > 0.01) {
      this.bounceVelo += -this.bounceOffset * 20 * dt - this.bounceVelo * 8 * dt
      this.bounceOffset += this.bounceVelo * dt
      this.container.y = this.bounceOffset
    }

    // Tail wag
    this.tailPhase += dt * (this.state === 'talking' ? 5 : this.state === 'idle' ? 2 : 1.5)
    this.drawTail(this.parts.tail, cx, cy, STATE_PALETTES[this.state].body, this.tailPhase)

    // Breathing
    const breathe = 1 + Math.sin(Date.now() * 0.003) * 0.015
    if (this.state === 'sleeping') {
      const sleepBreathe = 1 + Math.sin(Date.now() * 0.0015) * 0.03
      this.container.scale.set(sleepBreathe * 0.97)
      this.container.alpha = 0.85 + Math.sin(Date.now() * 0.001) * 0.05
    } else if (this.state === 'talking') {
      const talkBreathe = 1 + Math.sin(Date.now() * 0.006) * 0.02
      this.container.scale.set(talkBreathe)
      this.container.alpha = 1
    } else {
      this.container.scale.set(breathe)
      this.container.alpha = 0.95 + Math.sin(Date.now() * 0.002) * 0.05
    }

    // Blush pulsing
    const blushAlpha = 0.15 + Math.sin(Date.now() * 0.002) * 0.05
    this.parts.blushL.alpha = this.state === 'talking' ? blushAlpha + 0.15 : blushAlpha
    this.parts.blushR.alpha = this.state === 'talking' ? blushAlpha + 0.15 : blushAlpha

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

    // Idle actions
    this.idleTimer -= dt
    if (this.idleTimer <= 0 && this.state === 'idle') {
      this.doIdleAction()
      this.scheduleIdle()
    }
    if (this.idleActionTimer > 0) {
      this.idleActionTimer -= dt
      this.updateIdleAction()
      if (this.idleActionTimer <= 0) {
        this.idleAction = ''
        this.resetPose()
      }
    }

    // Talking mouth
    if (this.state === 'talking') {
      this.talkTimer += dt
      if (this.talkTimer > 0.15 + Math.random() * 0.1) {
        this.talkTimer = 0
        this.mouthOpen = !this.mouthOpen
        this.drawMouthShape(this.parts.mouth, cx, cy, this.mouthOpen)
      }
    }

    // Working shake
    if (this.state === 'working') {
      this.container.x = Math.sin(Date.now() * 0.015) * 2
    }

    // Thinking sway
    if (this.state === 'thinking') {
      this.container.rotation = Math.sin(Date.now() * 0.004) * 0.04
    }
  }

  private updateEyeTracking() {
    if (!this.parts || this.state === 'sleeping') return

    const cx = this.cx
    const cy = this.cy

    const dx = (this.mouseX - cx) / 80
    const dy = (this.mouseY - cy) / 80
    const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v))

    const px = clamp(dx, 6)
    const py = clamp(dy, 5)

    this.parts.leftPupil.x = cx - 28 + px
    this.parts.leftPupil.y = cy - 16 + py
    this.parts.rightPupil.x = cx + 28 + px
    this.parts.rightPupil.y = cy - 16 + py

    this.parts.leftEyeShine.x = cx - 33 + px * 0.5
    this.parts.leftEyeShine.y = cy - 23 + py * 0.3
    this.parts.rightEyeShine.x = cx + 23 + px * 0.5
    this.parts.rightEyeShine.y = cy - 23 + py * 0.3

    this.parts.leftEyeShine2.x = cx - 23 + px * 0.7
    this.parts.leftEyeShine2.y = cy - 10 + py * 0.5
    this.parts.rightEyeShine2.x = cx + 33 + px * 0.7
    this.parts.rightEyeShine2.y = cy - 10 + py * 0.5
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
    const eyeScale = 1 - Math.abs(t) * 0.95

    this.parts.leftEye.scale.y = eyeScale
    this.parts.rightEye.scale.y = eyeScale
    this.parts.leftPupil.scale.y = eyeScale
    this.parts.rightPupil.scale.y = eyeScale
    this.parts.leftEyeShine.scale.y = eyeScale
    this.parts.rightEyeShine.scale.y = eyeScale
    this.parts.leftEyeShine2.alpha = eyeScale > 0.3 ? 0.7 : 0
    this.parts.rightEyeShine2.alpha = eyeScale > 0.3 ? 0.7 : 0

    if (this._blinkPhase > 1) {
      this._blinkActive = false
      this.resetEyes()
    }
  }

  private resetEyes() {
    if (!this.parts) return
    this.parts.leftEye.scale.set(1)
    this.parts.rightEye.scale.set(1)
    this.parts.leftPupil.scale.set(1)
    this.parts.rightPupil.scale.set(1)
    this.parts.leftEyeShine.scale.set(1)
    this.parts.rightEyeShine.scale.set(1)
    this.parts.leftEyeShine2.alpha = 0.7
    this.parts.rightEyeShine2.alpha = 0.7
  }

  private scheduleIdle() {
    this.idleTimer = 6 + Math.random() * 12
  }

  private doIdleAction() {
    const actions = ['blink', 'tilt', 'bounce', 'look', 'earTwitch']
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
      this.container.rotation = Math.sin(t * Math.PI * 2) * 0.12
    } else if (this.idleAction === 'look') {
      this.container.rotation = Math.sin(t * Math.PI) * 0.08
    } else if (this.idleAction === 'earTwitch') {
      const twitch = Math.sin(t * Math.PI * 4) * 0.15
      this.parts.earInnerL.scale.y = 1 + twitch
    }
  }

  private resetPose() {
    if (!this.parts) return
    if (this.state !== 'thinking') {
      this.container.rotation = 0
    }
    if (this.state !== 'working') {
      this.container.x = 0
    }
    this.parts.earInnerL.scale.set(1)
  }

  setAnimation(state: string) {
    if (this.destroyed) return
    const prev = this.state
    this.state = state as PetState
    if (this.state !== prev) {
      console.log('[PetEngine] state:', prev, '->', this.state)
      this.applyState()
    }
  }

  private applyState() {
    if (!this.parts) return
    const cx = this.cx
    const cy = this.cy
    const p = STATE_PALETTES[this.state] || STATE_PALETTES.idle

    // Redraw body with new color
    this.drawBodyShape(this.parts.body, cx, cy, p.body)

    // Update ear inners
    this.parts.earInnerL.clear()
    this.parts.earInnerL.poly([cx - 46, cy - 68, cx - 26, cy - 80, cx - 16, cy - 58])
    this.parts.earInnerL.fill({ color: p.accent, alpha: 0.5 })

    this.parts.earInnerR.clear()
    this.parts.earInnerR.poly([cx + 46, cy - 68, cx + 26, cy - 80, cx + 16, cy - 58])
    this.parts.earInnerR.fill({ color: p.accent, alpha: 0.5 })

    // Update belly
    this.parts.belly.clear()
    this.parts.belly.ellipse(cx, cy + 20, 45, 40)
    this.parts.belly.fill({ color: p.bodyLight, alpha: 0.7 })

    // Update nose
    this.parts.nose.clear()
    this.parts.nose.poly([cx - 5, cy + 4, cx + 5, cy + 4, cx, cy + 10])
    this.parts.nose.fill({ color: p.accent, alpha: 0.8 })

    // Update mouth
    this.mouthOpen = false
    this.drawMouthShape(this.parts.mouth, cx, cy, false)

    // State-specific resets
    if (this.state === 'sleeping') {
      this.container.rotation = 0
      this.container.x = 0
    } else if (this.state === 'working') {
      this.container.rotation = 0
    } else if (this.state === 'thinking') {
      this.container.x = 0
    } else if (this.state === 'talking') {
      this.container.rotation = 0
      this.container.x = 0
      this.talkTimer = 0
    } else if (this.state === 'idle') {
      this.container.rotation = 0
      this.container.x = 0
      this.container.y = 0
      this.bounceOffset = 0
      this.bounceVelo = 0
    }
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
    console.log('[PetEngine] destroy called, was initialized:', !!this.parts)
    this.destroyed = true
    this.parts = null

    if (!this.initialized) {
      this.app = null
      return
    }

    try {
      this.app?.ticker?.stop()
      this.container?.destroy({ children: true })
      this.app?.destroy(false)
    } catch (e) {
      console.warn('[PetEngine] destroy cleanup:', e)
    }
    this.app = null
    this.initialized = false
  }
}
