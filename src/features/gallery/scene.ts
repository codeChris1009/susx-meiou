/**
 * The 3D gallery: nine framed pieces on a ring around the camera, a polished stone floor that reflects them, one warm
 * spotlight on the piece in front and dust turning slowly in its beam. After the three.js art gallery this site grew
 * from, rebuilt for a page that has other things to do:
 *
 * - Loaded on demand. This module (and three.js with it) is a separate chunk the section imports only when it nears
 *   the viewport, so the first paint never pays for WebGL.
 * - Renders only while seen. The loop stops when the section scrolls away or the tab hides; nothing burns a GPU for a
 *   canvas no one is looking at.
 * - Faithful artwork. Pieces are screenshots of real sites, so they are drawn self-lit (MeshBasicMaterial, no tone
 *   mapping): the colours on the wall are the colours of the site. Light and tone mapping are for the room — frames,
 *   floor, dust.
 * - No jank on first turn. Textures decode off the main thread (ImageBitmapLoader), upload before the first frame
 *   (initTexture) and shaders compile in parallel where the driver allows (compileAsync).
 * - Interruptible motion. The ring eases toward a target angle on an exponential spring instead of a fixed-length
 *   tween, so a drag or a second click mid-turn simply retargets it.
 */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Fog,
  Group,
  HemisphereLight,
  ImageBitmapLoader,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Raycaster,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  SpotLight,
  Texture,
  Vector2,
  WebGLRenderer,
  type Material,
  type Object3D,
} from "three"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"
import type { Reflector } from "three/addons/objects/Reflector.js"

import { METAL, NEUTRAL } from "@/theme/palette"

import { createFloor, resizeFloor } from "./floor"
import { fitFov, focusOf, indexAt, nearestAngle, offFront } from "./ring"

export interface GalleryCallbacks {
  /** The piece in front changed (also fires mid-drag, as pieces pass) */
  onFocus: (index: number) => void
  /** The piece already in front was clicked */
  onOpen: (index: number) => void
  /** The piece under the mouse changed (null: none), so the page can say what a click will do */
  onHover?: (index: number | null) => void
}

// ---- The room, in metres ----
const RADIUS = 7
/** How far the front piece steps out of the ring toward the viewer */
const PUSH = 1.8
const ART_W = 3.6
const ART_H = 2.4
const FRAME = 0.075
const FRAME_DEPTH = 0.1
const CENTER_Y = 1.6
const EYE_Y = 1.4
const SIDE_SCALE = 0.8
/** Side pieces are dimmed to this brightness: the room is lit for the piece in front */
const SIDE_LIGHT = 0.34
const DUST = 260
/**
 * Shift lens, as a fraction of the view height: the room rises in the frame (verticals stay vertical, unlike tilting
 * the camera). Small: the piece sits a little above centre, the script title above it and the plaque below
 */
const LENS_SHIFT = 0.035

// ---- Motion ----
/** Spring rate (1/s): the ring covers ~63% of the remaining turn every 1/SPRING seconds */
const SPRING = 6.5
/** Ring radians per dragged pixel */
const DRAG = 0.0042
/** A drag shorter than this (px) is a click */
const TAP_SLOP = 6
/** A drag longer than this (px) moves at least one piece, even if released short of the halfway point */
const FLICK = 36
/**
 * On first appearance the ring is this far (radians) short of its place and settles into it, a slow swing as the
 * vitrine lights. Under half a step, so the plaque never flickers through a neighbour's name.
 */
const ENTRANCE_SWING = 0.3

const room = {
  ink: NEUTRAL[950],
  stone: NEUTRAL[900],
  photon: METAL.dark.photon,
  /** Between the metal's mid and low steps: antique champagne, darker than the type, so the frame recedes */
  frame: new Color(METAL.dark.mid).lerp(new Color(METAL.dark.lo), 0.55),
  tint: METAL.dark.hi,
}

export interface GallerySceneOptions {
  canvas: HTMLCanvasElement
  /** Image URLs, in ring order */
  images: readonly string[]
  callbacks: GalleryCallbacks
  reducedMotion: boolean
}

interface Hung {
  /** Turns the piece round the ring */
  pivot: Group
  /** Moves and scales the piece within its place on the ring */
  holder: Group
  art: MeshBasicMaterial
  hover: number
}

export class GalleryScene {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(45, 1, 0.1, 40)
  private readonly ring = new Group()
  private readonly hung: Hung[] = []
  private readonly artMeshes: Mesh[] = []
  private readonly floor: Reflector
  private readonly dust: Points<BufferGeometry, ShaderMaterial>
  private readonly raycaster = new Raycaster()
  /** Pointer in normalised device coordinates, for parallax and picking */
  private readonly pointer = new Vector2(0, 0)
  /** Canvas size in CSS px, kept by resize(): input never reads layout */
  private size = { width: 1, height: 1 }
  /** Hover is resolved once per frame, however many pointer events arrive */
  private hoverDirty = false
  private readonly look = new Vector2(0, 0)
  private readonly canvas: HTMLCanvasElement
  private readonly images: readonly string[]
  private readonly callbacks: GalleryCallbacks
  private readonly reducedMotion: boolean
  private envTexture: Texture | null = null

  private angle = 0
  private target = 0
  private focused = 0
  private hovered: number | null = null
  private drag: { x: number; target: number; moved: boolean } | null = null
  private active = false
  private running = false
  private last = 0
  private clock = 0
  private disposed = false

  constructor({
    canvas,
    images,
    callbacks,
    reducedMotion,
  }: GallerySceneOptions) {
    this.canvas = canvas
    this.images = images
    this.callbacks = callbacks
    this.reducedMotion = reducedMotion

    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.outputColorSpace = SRGBColorSpace

    this.scene.fog = new Fog(room.ink, RADIUS - 1, RADIUS + 8)
    this.scene.add(this.ring)
    this.camera.position.set(0, EYE_Y, 0)

    this.light()
    this.floor = createFloor(room.stone, room.tint)
    this.scene.add(this.floor)
    this.scene.add(this.pool())
    this.dust = this.motes()
    this.scene.add(this.dust)

    canvas.addEventListener("pointerdown", this.onDown)
    canvas.addEventListener("pointermove", this.onMove)
    canvas.addEventListener("pointerup", this.onUp)
    canvas.addEventListener("pointercancel", this.onCancel)
    canvas.addEventListener("pointerleave", this.onLeave)
    document.addEventListener("visibilitychange", this.onVisibility)
  }

  /** Decode and upload every piece, compile shaders, draw the first frame */
  async load() {
    const loader = new ImageBitmapLoader().setOptions({
      imageOrientation: "flipY",
    })
    const settled = await Promise.allSettled(
      this.images.map((url) => loader.loadAsync(url))
    )
    const bitmaps = settled.flatMap((r) =>
      r.status === "fulfilled" ? [r.value] : []
    )
    // One missing piece fails the whole hang (the section falls back to the flat view); free what did decode
    if (this.disposed || bitmaps.length < settled.length) {
      for (const b of bitmaps) b.close()
      if (this.disposed) return
      throw new Error("A gallery image failed to load")
    }
    const anisotropy = Math.min(
      8,
      this.renderer.capabilities.getMaxAnisotropy()
    )
    const frameGeometry = new RoundedBoxGeometry(
      ART_W + FRAME * 2,
      ART_H + FRAME * 2,
      FRAME_DEPTH,
      4,
      0.035
    )
    const artGeometry = new PlaneGeometry(ART_W, ART_H)
    const lipGeometry = new PlaneGeometry(ART_W + 0.03, ART_H + 0.03)
    const lipMaterial = new MeshBasicMaterial({ color: room.ink })
    const frameMaterial = new MeshStandardMaterial({
      color: room.frame,
      metalness: 1,
      roughness: 0.26,
    })

    bitmaps.forEach((bitmap, i) => {
      const texture = new Texture(bitmap)
      texture.colorSpace = SRGBColorSpace
      texture.flipY = false
      texture.anisotropy = anisotropy
      texture.needsUpdate = true
      this.renderer.initTexture(texture)

      const pivot = new Group()
      const holder = new Group()
      holder.position.set(0, CENTER_Y, -RADIUS)

      const frame = new Mesh(frameGeometry, frameMaterial)
      const lip = new Mesh(lipGeometry, lipMaterial)
      lip.position.z = FRAME_DEPTH / 2 + 0.001
      const art = new MeshBasicMaterial({ map: texture, toneMapped: false })
      const artMesh = new Mesh(artGeometry, art)
      artMesh.position.z = FRAME_DEPTH / 2 + 0.002
      artMesh.userData.index = i

      holder.add(frame, lip, artMesh)
      pivot.add(holder)
      this.ring.add(pivot)
      this.hung.push({ pivot, holder, art, hover: 0 })
      this.artMeshes.push(artMesh)
    })

    if (!this.reducedMotion) this.angle = this.target + ENTRANCE_SWING
    this.layout(0)
    await this.renderer.compileAsync(this.scene, this.camera)
    if (this.disposed) return
    this.renderer.render(this.scene, this.camera)
  }

  get count() {
    return this.hung.length
  }

  goTo(index: number) {
    const n = this.count
    if (!n) return
    const i = ((index % n) + n) % n
    this.target = nearestAngle(this.target, i, n)
    this.wake()
  }

  step(delta: number) {
    this.goTo(indexAt(this.target, this.count) + delta)
  }

  /** Run the loop only while the section is on screen */
  setActive(active: boolean) {
    this.active = active
    this.wake()
  }

  resize(width: number, height: number) {
    if (!width || !height) return
    this.size = { width, height }
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.fov = fitFov(this.camera.aspect, ART_W, RADIUS - PUSH)
    this.camera.setViewOffset(
      width,
      height,
      0,
      height * LENS_SHIFT,
      width,
      height
    )
    this.camera.updateProjectionMatrix()
    resizeFloor(this.floor, width, height)
    this.dust.material.uniforms.uScale!.value =
      height * this.renderer.getPixelRatio()
    if (!this.running) this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    this.running = false
    this.renderer.setAnimationLoop(null)
    const c = this.canvas
    c.removeEventListener("pointerdown", this.onDown)
    c.removeEventListener("pointermove", this.onMove)
    c.removeEventListener("pointerup", this.onUp)
    c.removeEventListener("pointercancel", this.onCancel)
    c.removeEventListener("pointerleave", this.onLeave)
    document.removeEventListener("visibilitychange", this.onVisibility)

    const materials = new Set<Material>()
    this.scene.traverse((o: Object3D) => {
      if (o instanceof Mesh || o instanceof Points) {
        o.geometry.dispose()
        for (const m of [o.material].flat() as Material[]) materials.add(m)
      }
    })
    for (const m of materials) {
      if (m instanceof MeshBasicMaterial) m.map?.dispose()
      m.dispose()
    }
    this.floor.dispose()
    this.envTexture?.dispose()
    this.renderer.dispose()
  }

  // ---- Loop ----

  private wake() {
    const run =
      this.active && !document.hidden && !this.disposed && this.count > 0
    if (run === this.running) return
    this.running = run
    this.last = performance.now()
    this.renderer.setAnimationLoop(run ? this.tick : null)
  }

  private readonly tick = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    if (!this.reducedMotion) this.clock += dt

    if (this.hoverDirty) {
      this.hoverDirty = false
      const hovered = this.pick()
      if (hovered !== this.hovered) {
        this.hovered = hovered
        this.callbacks.onHover?.(hovered)
      }
    }

    const k = this.reducedMotion ? 1 : 1 - Math.exp(-SPRING * dt)
    this.angle += (this.target - this.angle) * k
    this.layout(dt)

    // The eye drifts a little toward the pointer: enough to feel the depth of the room
    if (!this.reducedMotion) {
      const ease = 1 - Math.exp(-3 * dt)
      this.look.lerp(this.pointer, ease)
      this.camera.position.x = this.look.x * 0.28
      this.camera.position.y = EYE_Y + this.look.y * 0.12
    }
    this.camera.lookAt(0, CENTER_Y - 0.25, -(RADIUS - PUSH))
    this.dust.material.uniforms.uTime!.value = this.clock

    const front = indexAt(this.angle, this.count)
    if (front !== this.focused) {
      this.focused = front
      this.callbacks.onFocus(front)
    }
    this.renderer.render(this.scene, this.camera)
  }

  /** Place every piece by how much it is "the" piece: forward, larger and lit in front; back, smaller, dim aside */
  private layout(dt: number) {
    const n = this.count
    const hoverEase = this.reducedMotion ? 1 : 1 - Math.exp(-10 * dt)
    this.hung.forEach((h, i) => {
      const off = offFront(this.angle, i, n)
      const f = focusOf(off, n)
      h.hover += ((this.hovered === i ? 1 : 0) - h.hover) * hoverEase
      h.pivot.rotation.y = -off
      h.holder.position.z = -RADIUS + PUSH * f
      h.holder.position.y = CENTER_Y + h.hover * 0.05
      h.holder.scale.setScalar(
        SIDE_SCALE + (1 - SIDE_SCALE) * f + h.hover * 0.015
      )
      h.art.color.setScalar(SIDE_LIGHT + (1 - SIDE_LIGHT) * f + h.hover * 0.12)
    })
  }

  // ---- Room ----

  private light() {
    const pmrem = new PMREMGenerator(this.renderer)
    const env = new RoomEnvironment()
    this.envTexture = pmrem.fromScene(env, 0.04).texture
    this.scene.environment = this.envTexture
    this.scene.environmentIntensity = 0.55
    env.dispose()
    pmrem.dispose()

    this.scene.add(new HemisphereLight(room.photon, room.ink, 0.4))
    const spot = new SpotLight(room.photon, 90, 18, 0.46, 0.85, 1.4)
    spot.position.set(0, 7, -(RADIUS - PUSH) + 2.2)
    spot.target.position.set(0, CENTER_Y, -(RADIUS - PUSH))
    this.scene.add(spot, spot.target)
  }

  /** A soft pool of light on the stone under the piece in front */
  private pool() {
    const size = 256
    const c = document.createElement("canvas")
    c.width = c.height = size
    const g = c.getContext("2d")
    if (g) {
      const grad = g.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2
      )
      const tone = new Color(room.photon)
      const rgb = `${Math.round(tone.r * 255)},${Math.round(tone.g * 255)},${Math.round(tone.b * 255)}`
      grad.addColorStop(0, `rgba(${rgb},0.34)`)
      grad.addColorStop(0.45, `rgba(${rgb},0.1)`)
      grad.addColorStop(1, `rgba(${rgb},0)`)
      g.fillStyle = grad
      g.fillRect(0, 0, size, size)
    }
    const texture = new CanvasTexture(c)
    texture.colorSpace = SRGBColorSpace
    const pool = new Mesh(
      new PlaneGeometry(7.5, 4.5),
      new MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      })
    )
    pool.rotation.x = -Math.PI / 2
    pool.position.set(0, 0.004, -(RADIUS - PUSH) + 0.6)
    return pool
  }

  /** Dust in the beam: points that rise slowly and twinkle, brightest inside the spotlight's cone */
  private motes() {
    const positions = new Float32Array(DUST * 3)
    const seeds = new Float32Array(DUST)
    for (let i = 0; i < DUST; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8
      positions[i * 3 + 1] = Math.random() * 4.2
      positions[i * 3 + 2] = -(RADIUS - PUSH) + 2.4 - Math.random() * 4.2
      seeds[i] = Math.random()
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute("position", new BufferAttribute(positions, 3))
    geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1))
    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: 800 },
        uColor: { value: new Color(room.photon) },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uScale;
        attribute float aSeed;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.y = mod(p.y + uTime * (0.03 + aSeed * 0.05), 4.2);
          p.x += sin(uTime * 0.27 + aSeed * 31.0) * 0.14;
          p.z += cos(uTime * 0.21 + aSeed * 17.0) * 0.14;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uScale * (0.006 + aSeed * 0.008) / -mv.z;
          float twinkle = 0.45 + 0.55 * sin(uTime * (0.7 + aSeed) + aSeed * 40.0);
          float cone = 1.0 - smoothstep(0.6, 3.0, abs(p.x));
          vAlpha = twinkle * (0.12 + 0.88 * cone) * smoothstep(0.1, 0.9, p.y) * (1.0 - smoothstep(3.4, 4.2, p.y));
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vAlpha * 0.6);
        }
      `,
    })
    return new Points(geometry, material)
  }

  // ---- Input: drag to turn, click a side piece to bring it round, click the front piece to open it ----

  /** Pointer position from the event, against the canvas size kept by resize() (no layout read per event) */
  private track(e: PointerEvent) {
    this.pointer.set(
      (e.offsetX / this.size.width) * 2 - 1,
      -(e.offsetY / this.size.height) * 2 + 1
    )
  }

  /** The piece under the pointer, if any */
  private pick() {
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const hit = this.raycaster.intersectObjects(this.artMeshes, false)[0]
    return hit ? (hit.object.userData.index as number) : null
  }

  private readonly onDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    this.drag = { x: e.clientX, target: this.target, moved: false }
  }

  private readonly onMove = (e: PointerEvent) => {
    this.track(e)
    if (this.drag) {
      const dx = e.clientX - this.drag.x
      if (!this.drag.moved && Math.abs(dx) > TAP_SLOP) {
        this.drag.moved = true
        this.canvas.setPointerCapture(e.pointerId)
      }
      if (this.drag.moved) this.target = this.drag.target + dx * DRAG
    } else if (e.pointerType === "mouse") {
      this.hoverDirty = true
    }
    this.wake()
  }

  private readonly onUp = (e: PointerEvent) => {
    const drag = this.drag
    this.drag = null
    if (!drag) return
    const n = this.count
    if (!drag.moved) {
      this.track(e)
      const i = this.pick()
      if (i === null) return
      if (i === indexAt(this.target, n)) this.callbacks.onOpen(i)
      else this.goTo(i)
      return
    }
    const dx = e.clientX - drag.x
    const from = indexAt(drag.target, n)
    let to = indexAt(this.target, n)
    if (to === from && Math.abs(dx) > FLICK) to = from + (dx < 0 ? 1 : -1)
    this.goTo(to)
  }

  private readonly onCancel = () => {
    if (!this.drag) return
    this.drag = null
    this.goTo(indexAt(this.target, this.count))
  }

  private readonly onLeave = () => {
    if (this.hovered !== null) this.callbacks.onHover?.(null)
    this.hovered = null
    this.pointer.set(0, 0)
  }

  private readonly onVisibility = () => this.wake()
}
