/**
 * The gallery, rebuilt from its own source (demo-3js-Gallery0: main.js, img-border.js, spotlight.js,
 * reflector-mirror.js) so the trailer can move a camera the product never does. Same ring, frames, focus easing,
 * spotlight and black marble floor; the trailer adds what a film set adds: a visible beam, dust in it, and candles low
 * around the ring for the dark.
 *
 * Stateless per frame: render(state) draws exactly what the state says, whatever was drawn before (Remotion renders
 * frames out of order, in several tabs at once).
 */
import * as THREE from "three"
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"
import { Reflector } from "three/addons/objects/Reflector.js"

import { generator } from "../kit/random"
import { SCENE } from "./style"

export interface StageState {
  camera: {
    position: readonly [number, number, number]
    target: readonly [number, number, number]
    fov: number
  }
  /** Rotation of the ring, radians */
  ring: number
  /** Spotlight, 0..1 of the gallery's intensity */
  spot: number
  /** Where the spotlight points; the gallery's own target when omitted */
  spotTarget?: readonly [number, number, number]
  /** Cone half-angle, radians; the gallery's own 0.68 when omitted. Narrow it to make the light a pool that moves */
  spotAngle?: number
  /** The visible beam and its dust, 0..1 */
  beam: number
  /** Candles around the ring, 0..1 */
  candles: number
  /** Seconds, for flicker and drift */
  time: number
  exposure: number
}

const TAU = Math.PI * 2
const CANDLES = 6
const DUST = 900

/** The gallery's marble reflector shader (reflector-mirror.js), unchanged but for its name */
const MARBLE = {
  name: "MarbleReflectorShader",
  uniforms: {
    color: { value: new THREE.Color("#000000") },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    blurStrength: { value: 1.1 },
    reflectionStrength: { value: 0.18 },
    desaturationStrength: { value: 0.62 },
    veinStrength: { value: 0.015 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec2 vMirrorUv;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vMirrorUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float blurStrength;
    uniform float reflectionStrength;
    uniform float desaturationStrength;
    uniform float veinStrength;
    varying vec4 vUv;
    varying vec2 vMirrorUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    float noise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0; float a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
      return v;
    }
    vec3 blurred(vec2 uv, vec2 t) {
      vec3 s = texture2D(tDiffuse, uv).rgb * 0.20;
      s += texture2D(tDiffuse, uv + t * vec2(1.5, 0.0)).rgb * 0.12;
      s += texture2D(tDiffuse, uv + t * vec2(-1.5, 0.0)).rgb * 0.12;
      s += texture2D(tDiffuse, uv + t * vec2(0.0, 1.5)).rgb * 0.10;
      s += texture2D(tDiffuse, uv + t * vec2(0.0, -1.5)).rgb * 0.10;
      s += texture2D(tDiffuse, uv + t * vec2(2.5, 2.0)).rgb * 0.08;
      s += texture2D(tDiffuse, uv + t * vec2(-2.5, 2.0)).rgb * 0.08;
      s += texture2D(tDiffuse, uv + t * vec2(2.5, -2.0)).rgb * 0.08;
      s += texture2D(tDiffuse, uv + t * vec2(-2.5, -2.0)).rgb * 0.08;
      s += texture2D(tDiffuse, uv + t * vec2(0.0, 3.5)).rgb * 0.02;
      s += texture2D(tDiffuse, uv + t * vec2(0.0, -3.5)).rgb * 0.02;
      return s;
    }
    void main() {
      vec2 uv = clamp(vUv.xy / vUv.w, vec2(0.001), vec2(0.999));
      vec3 reflection = blurred(uv, vec2(blurStrength) / resolution);
      float lum = dot(reflection, vec3(0.299, 0.587, 0.114));
      reflection = mix(reflection, vec3(lum), desaturationStrength);
      vec2 m = vMirrorUv * vec2(6.0, 9.0);
      float stone = fbm(m + vec2(0.0, vMirrorUv.y * 1.2));
      float veins = smoothstep(0.82, 0.98, abs(sin(m.x * 1.4 + stone * 3.2))) * veinStrength;
      vec3 base = mix(color, color + vec3(0.01), stone * 0.12 + vMirrorUv.y * 0.03) + veins;
      float edgeFade = 1.0 - smoothstep(0.55, 0.98, distance(vMirrorUv, vec2(0.5)));
      float distanceFade = smoothstep(0.14, 0.82, vMirrorUv.y);
      float alpha = edgeFade * distanceFade * reflectionStrength;
      gl_FragColor = vec4(base + reflection * 0.52 * alpha, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
}

/** A cone of light: bright at the lamp, thinning toward the floor, brightest where it is seen edge-on through */
function beamMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      strength: { value: 0 },
      tint: { value: new THREE.Color("#fff3d6") },
    },
    vertexShader: /* glsl */ `
      varying float vAlong;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vAlong = clamp(-position.y / 6.2, 0.0, 1.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float strength;
      uniform vec3 tint;
      varying float vAlong;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float facing = pow(abs(dot(vNormal, vView)), 2.4);
        float along = pow(1.0 - vAlong, 1.3) * smoothstep(0.0, 0.06, vAlong);
        gl_FragColor = vec4(tint * facing * along * strength * 0.1, 1.0);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

/** Dust in the beam: soft points, each drifting on its own slow loop */
function dustMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, strength: { value: 0 } },
    vertexShader: /* glsl */ `
      uniform float time;
      attribute vec4 seed;
      varying float vGlow;
      void main() {
        vec3 p = position + vec3(
          sin(time * 0.21 + seed.x * 6.28) * 0.12,
          sin(time * 0.13 + seed.y * 6.28) * 0.16 - time * 0.02 * seed.z,
          cos(time * 0.17 + seed.z * 6.28) * 0.12);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        // Capped, and gone near the lens: a mote a hand away from the camera would fill the frame with fog
        gl_PointSize = min(7.0, (1.2 + seed.w * 2.6) * (300.0 / -mv.z));
        vGlow = (0.35 + 0.65 * (0.5 + 0.5 * sin(time * (0.7 + seed.x) + seed.y * 30.0))) * smoothstep(1.2, 2.6, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float strength;
      varying float vGlow;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vec3(1.0, 0.93, 0.78) * a * a * vGlow * strength * 0.55, 1.0);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
}

export class GalleryStage {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera: THREE.PerspectiveCamera
  private readonly ring = new THREE.Object3D()
  private readonly pieces: { node: THREE.Object3D; meshes: THREE.Mesh[] }[] = []
  private readonly spot: THREE.SpotLight
  private readonly beam: THREE.Mesh<THREE.ConeGeometry, THREE.ShaderMaterial>
  private readonly dust: THREE.Points<
    THREE.BufferGeometry,
    THREE.ShaderMaterial
  >
  private readonly candles: THREE.PointLight[] = []
  private readonly mirror: Reflector

  constructor(
    canvas: HTMLCanvasElement,
    textures: readonly THREE.Texture[],
    width: number,
    height: number
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
    })
    this.renderer.setPixelRatio(1)
    this.renderer.setSize(width, height, false)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.scene.background = new THREE.Color("#000000")
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.05, 100)
    this.scene.add(this.ring)

    const { artwork, border } = SCENE
    const step = TAU / textures.length
    textures.forEach((texture, i) => {
      const node = new THREE.Object3D()
      node.rotation.y = i * step
      const frame = new THREE.Mesh(
        new RoundedBoxGeometry(
          border.width,
          border.height,
          border.depth,
          6,
          border.radius
        ),
        new THREE.MeshStandardMaterial({
          color: border.color,
          side: THREE.BackSide,
        })
      )
      const art = new THREE.Mesh(
        new THREE.BoxGeometry(artwork.width, artwork.height, artwork.depth),
        new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide })
      )
      node.add(frame, art)
      this.ring.add(node)
      this.pieces.push({ node, meshes: [frame, art] })
    })

    const s = SCENE.spot
    this.spot = new THREE.SpotLight(
      0xffffff,
      s.intensity,
      s.distance,
      s.angle,
      s.penumbra,
      s.decay
    )
    this.spot.position.set(...s.position)
    this.scene.add(this.spot, this.spot.target)

    // The beam: a cone hung from the lamp, its apex at the origin of its own space, opening down -y
    const cone = new THREE.ConeGeometry(1.05, 6.2, 64, 1, true)
    cone.translate(0, -3.1, 0)
    this.beam = new THREE.Mesh(cone, beamMaterial())
    this.beam.position.set(...s.position)
    this.scene.add(this.beam)

    // Dust: scattered through the beam's volume, denser toward its axis
    const rnd = generator(1642)
    const positions = new Float32Array(DUST * 3)
    const seeds = new Float32Array(DUST * 4)
    const from = new THREE.Vector3(...s.position)
    const to = new THREE.Vector3(...s.target)
    const axis = to.clone().sub(from)
    for (let i = 0; i < DUST; i++) {
      const t = 0.12 + rnd() * 0.75
      const r = Math.sqrt(rnd()) * 1.0 * t
      const a = rnd() * TAU
      const p = from.clone().addScaledVector(axis, t)
      positions.set(
        [
          p.x + Math.cos(a) * r,
          p.y + Math.sin(a) * r * 0.6,
          p.z + Math.sin(a) * r,
        ],
        i * 3
      )
      seeds.set([rnd(), rnd(), rnd(), rnd()], i * 4)
    }
    const dust = new THREE.BufferGeometry()
    dust.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    dust.setAttribute("seed", new THREE.BufferAttribute(seeds, 4))
    this.dust = new THREE.Points(dust, dustMaterial())
    this.dust.frustumCulled = false
    this.scene.add(this.dust)

    // Candles: low warm points between the frames, the only light the far side of the room gets
    for (let i = 0; i < CANDLES; i++) {
      const light = new THREE.PointLight(0xffb46b, 0, 4.2, 1.6)
      const a = (i + 0.5) * (TAU / CANDLES)
      light.position.set(Math.sin(a) * 3.1, -0.85, -Math.cos(a) * 3.1)
      this.candles.push(light)
      this.scene.add(light)
    }

    const f = SCENE.floor
    this.mirror = new Reflector(new THREE.CircleGeometry(f.radius, 96), {
      shader: MARBLE,
      textureWidth: width,
      textureHeight: height,
      color: 0x000000,
      clipBias: 0.01,
      multisample: 2,
    })
    const uniforms = (this.mirror.material as THREE.ShaderMaterial).uniforms
    uniforms.resolution?.value.set(width, height)
    this.mirror.position.y = f.y
    this.mirror.rotateX(-Math.PI / 2)
    this.scene.add(this.mirror)
  }

  render(state: StageState) {
    const { camera } = this
    camera.fov = state.camera.fov
    camera.position.set(...state.camera.position)
    camera.lookAt(...state.camera.target)
    camera.updateProjectionMatrix()
    this.renderer.toneMappingExposure = state.exposure

    this.ring.rotation.y = state.ring
    this.focus()

    const s = SCENE.spot
    this.spot.intensity = s.intensity * state.spot
    this.spot.angle = state.spotAngle ?? s.angle
    const target = state.spotTarget ?? s.target
    this.spot.target.position.set(...target)
    this.spot.target.updateMatrixWorld()
    const dir = new THREE.Vector3(...target).sub(this.spot.position).normalize()
    this.beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir)
    this.beam.material.uniforms.strength!.value = state.beam * state.spot
    this.dust.material.uniforms.strength!.value = state.beam * state.spot
    this.dust.material.uniforms.time!.value = state.time

    this.candles.forEach((light, i) => {
      // Flicker: two slow sines and a fast one, out of phase per candle
      const t = state.time
      const flicker =
        0.78 +
        0.12 * Math.sin(t * 2.3 + i * 1.7) +
        0.07 * Math.sin(t * 5.9 + i * 4.1) +
        0.03 * Math.sin(t * 17.0 + i * 2.3)
      light.intensity = 2.4 * state.candles * flicker
    })

    this.renderer.render(this.scene, camera)
  }

  /** The gallery's updateArtworkFocus: the piece facing the camera steps forward and grows */
  private focus() {
    const { artwork, focus } = SCENE
    for (const { node, meshes } of this.pieces) {
      const total = this.ring.rotation.y + node.rotation.y
      const normal = ((total % TAU) + TAU) % TAU
      const signed = normal > Math.PI ? normal - TAU : normal
      const strength = Math.max(0, Math.cos(signed)) ** 2
      const z = artwork.z + focus.zOffset * strength
      const scale =
        focus.sideScale + (focus.focusScale - focus.sideScale) * strength
      for (const mesh of meshes) {
        mesh.position.z = z
        mesh.scale.setScalar(scale)
      }
    }
  }

  dispose() {
    this.renderer.dispose()
    this.mirror.dispose()
  }
}
