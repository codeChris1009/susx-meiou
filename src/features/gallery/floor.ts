/**
 * The floor: a polished stone disc that reflects the hang. Built on three's Reflector (a mirrored camera renders the
 * scene into a texture) with a custom fragment shader that makes it read as stone, not glass:
 *
 * - the reflection is blurred (9 taps), partly desaturated and dimmed, so it is a sheen and never a second gallery
 * - the stone is the palette's ink with a whisper of fbm veining
 * - it fades out toward the rim and with distance, so the disc has no visible edge against the room
 *
 * The mirror renders at half the canvas resolution (blur hides it), which halves the cost of the second pass.
 */
import { CircleGeometry, Color, type ShaderMaterial, Vector2 } from "three"
import { Reflector } from "three/addons/objects/Reflector.js"

const RADIUS = 12
const SCALE = 0.5

const shader = {
  name: "StoneReflectorShader",
  uniforms: {
    color: { value: new Color() },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    resolution: { value: new Vector2(1, 1) },
    tint: { value: new Color() },
    strength: { value: 0.4 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vMirror;
    varying vec2 vUv;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    void main() {
      vMirror = textureMatrix * vec4(position, 1.0);
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform vec3 tint;
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float strength;
    varying vec4 vMirror;
    varying vec2 vUv;
    #include <logdepthbuf_pars_fragment>

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
      return v;
    }

    void main() {
      #include <logdepthbuf_fragment>
      vec2 uv = clamp(vMirror.xy / vMirror.w, vec2(0.001), vec2(0.999));
      vec2 t = 1.6 / resolution;
      vec3 r = texture2D(tDiffuse, uv).rgb * 0.24;
      r += texture2D(tDiffuse, uv + t * vec2( 1.5, 0.0)).rgb * 0.12;
      r += texture2D(tDiffuse, uv + t * vec2(-1.5, 0.0)).rgb * 0.12;
      r += texture2D(tDiffuse, uv + t * vec2( 0.0, 1.5)).rgb * 0.10;
      r += texture2D(tDiffuse, uv + t * vec2( 0.0,-1.5)).rgb * 0.10;
      r += texture2D(tDiffuse, uv + t * vec2( 2.5, 2.5)).rgb * 0.08;
      r += texture2D(tDiffuse, uv + t * vec2(-2.5, 2.5)).rgb * 0.08;
      r += texture2D(tDiffuse, uv + t * vec2( 2.5,-2.5)).rgb * 0.08;
      r += texture2D(tDiffuse, uv + t * vec2(-2.5,-2.5)).rgb * 0.08;
      float l = dot(r, vec3(0.299, 0.587, 0.114));
      r = mix(r, vec3(l) * tint, 0.45);

      vec2 m = vUv * vec2(7.0, 10.0);
      float stone = fbm(m);
      float vein = smoothstep(0.86, 0.99, abs(sin(m.x * 1.3 + stone * 3.4))) * 0.012;
      vec3 base = color * (0.92 + stone * 0.16) + vein;

      float d = distance(vUv, vec2(0.5));
      float rim = 1.0 - smoothstep(0.32, 0.5, d);
      vec3 col = base + r * strength * (1.0 - smoothstep(0.08, 0.42, d));
      gl_FragColor = vec4(col, rim);

      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
}

export function createFloor(stone: string, tint: string) {
  const size = targetSize()
  const floor = new Reflector(new CircleGeometry(RADIUS, 96), {
    textureWidth: size.x,
    textureHeight: size.y,
    clipBias: 0.003,
    multisample: 0,
    shader,
  })
  floor.rotateX(-Math.PI / 2)
  const material = floor.material as ShaderMaterial
  material.transparent = true
  material.uniforms.color!.value = new Color(stone)
  material.uniforms.tint!.value = new Color(tint)
  material.uniforms.resolution!.value = size
  return floor
}

function targetSize(width = window.innerWidth, height = window.innerHeight) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  return new Vector2(
    Math.max(1, Math.round(width * dpr * SCALE)),
    Math.max(1, Math.round(height * dpr * SCALE))
  )
}

/** Keep the mirror at half the canvas: call on every resize */
export function resizeFloor(floor: Reflector, width: number, height: number) {
  const size = targetSize(width, height)
  floor.getRenderTarget().setSize(size.x, size.y)
  const material = floor.material as ShaderMaterial
  ;(material.uniforms.resolution!.value as Vector2).copy(size)
}
