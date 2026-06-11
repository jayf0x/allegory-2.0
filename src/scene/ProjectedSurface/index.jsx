import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { folder, useControls } from 'leva';
import {
  AdditiveBlending,
  Color,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
} from 'three';
import { useDisposableItems } from '@/hooks/useDisposableItems';
import { SCENE_CONFIG as C } from '@/scene/config';
import { useVideo } from './Video';

const VERT_FSQ = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

// Cover-fit crop of the (landscape) video onto the portrait face + grade.
// Blacks are crushed so dark video melts into the obsidian instead of
// reading as a grey rectangle.
const GRADE_FRAG = `
uniform sampler2D uVideo;
uniform float uVideoAspect;
uniform float uFaceAspect;
uniform float uContrast;
uniform float uSaturation;
varying vec2 vUv;
void main() {
  vec2 uv = vUv - 0.5;
  float r = uFaceAspect / uVideoAspect;
  if (r < 1.0) uv.x *= r; else uv.y /= r;
  uv += 0.5;

  vec3 col = texture2D(uVideo, uv).rgb;
  col = clamp((col - 0.5) * uContrast + 0.5, 0.0, 1.0);
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, uSaturation);
  col = pow(col, vec3(1.25));
  gl_FragColor = vec4(col, 1.0);
}`;

const H_BLUR_FRAG = `
uniform sampler2D uTex;
uniform float uRadius;
uniform float uTexelW;
varying vec2 vUv;
void main() {
  float w[5];
  w[0]=0.2270270270; w[1]=0.1945945946; w[2]=0.1216216216; w[3]=0.0540540541; w[4]=0.0162162162;
  vec4 col = texture2D(uTex, vUv) * w[0];
  for (int i=1;i<5;i++) {
    float off = float(i) * uRadius * uTexelW;
    col += texture2D(uTex, vUv + vec2(off, 0.0)) * w[i];
    col += texture2D(uTex, vUv - vec2(off, 0.0)) * w[i];
  }
  gl_FragColor = col;
}`;

const V_BLUR_FRAG = `
uniform sampler2D uTex;
uniform float uRadius;
uniform float uTexelH;
varying vec2 vUv;
void main() {
  float w[5];
  w[0]=0.2270270270; w[1]=0.1945945946; w[2]=0.1216216216; w[3]=0.0540540541; w[4]=0.0162162162;
  vec4 col = texture2D(uTex, vUv) * w[0];
  for (int i=1;i<5;i++) {
    float off = float(i) * uRadius * uTexelH;
    col += texture2D(uTex, vUv + vec2(0.0, off)) * w[i];
    col += texture2D(uTex, vUv - vec2(0.0, off)) * w[i];
  }
  gl_FragColor = col;
}`;

// Temporal accumulation — decay=0 no trail, 0.95 long phosphor ghosting.
const ACCUM_FRAG = `
uniform sampler2D uCurrent;
uniform sampler2D uPrev;
uniform float uDecay;
varying vec2 vUv;
void main() {
  gl_FragColor = mix(texture2D(uCurrent, vUv), texture2D(uPrev, vUv), uDecay);
}`;

// Sparse 5×5 average → 1×1 RT, read back on the CPU to drive the room light.
const LUMA_FRAG = `
uniform sampler2D uTex;
void main() {
  vec3 sum = vec3(0.0);
  for (int x=0;x<5;x++) for (int y=0;y<5;y++) {
    sum += texture2D(uTex, vec2(0.1 + float(x) * 0.2, 0.1 + float(y) * 0.2)).rgb;
  }
  gl_FragColor = vec4(sum / 25.0, 1.0);
}`;

// The screen itself — emissive surface rendered additively over the obsidian
// box so the clearcoat highlights of the slab stay visible "above" the image.
const SCREEN_VERT = `
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vT;
varying vec3 vB;
varying vec3 vN;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vT = normalize(modelMatrix[0].xyz);
  vB = normalize(modelMatrix[1].xyz);
  vN = normalize(modelMatrix[2].xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const SCREEN_FRAG = `
uniform sampler2D uTex;
uniform sampler2D uBloom;
uniform float uBloomStrength;
uniform float uVignette;
uniform float uGlassDepth;
uniform float uTime;
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vT;
varying vec3 vB;
varying vec3 vN;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec3 V = normalize(cameraPosition - vWorldPos);

  // Parallax: the image floats a few mm *inside* the glass
  vec2 par = vec2(dot(V, vT), dot(V, vB)) * uGlassDepth;
  vec2 uv = vUv - par;

  vec3 sharp = texture2D(uTex, uv).rgb;
  vec3 bloom = texture2D(uBloom, uv).rgb;

  // Light dies out before reaching the slab edges
  vec2 e = min(vUv, 1.0 - vUv);
  float vign = smoothstep(0.0, uVignette, min(e.x, e.y));

  // Grazing angles dim like a screen seen through dark glass
  float facing = clamp(dot(V, vN), 0.0, 1.0);
  float angleFade = mix(0.22, 1.0, pow(facing, 1.4));

  vec3 col = (sharp + bloom * uBloomStrength) * vign * angleFade;

  // Dither hides banding in the bloom falloff
  col += (rand(vUv * 1000.0 + uTime) - 0.5) * 0.004;

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}`;

// Fog-like halo planes hovering in front of the face, fed by the bloom RT.
const GLOW_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const GLOW_FRAG = `
uniform sampler2D uBloom;
uniform float uStrength;
varying vec2 vUv;
void main() {
  vec2 c = vUv - 0.5;
  // squash samples toward the centre so the haze smears the screen colours
  vec3 col = texture2D(uBloom, 0.5 + c * 0.45).rgb;
  float falloff = smoothstep(0.5, 0.05, length(c));
  falloff *= falloff;
  gl_FragColor = vec4(col * uStrength * falloff, 1.0);
}`;

function makeRT(w, h) {
  return new WebGLRenderTarget(w, h, {
    minFilter: LinearFilter,
    magFilter: LinearFilter,
  });
}

const SRC_W = 512,
  SRC_H = 1024;
const BLUR_W = 256,
  BLUR_H = 512;

/**
 * ProjectedSurface — the monolith's emissive face.
 *
 * Pipeline (offscreen, priority 0): video → cover-fit grade → H+V Gaussian
 * blur (bloom) → temporal accumulation (phosphor trail). The accumulated
 * sharp image + bloom feed the screen shader; the bloom alone feeds two
 * additive halo planes and (via a 1×1 readback) a point light, so the video
 * genuinely lights the room — light from within, not projected on.
 *
 * Render inside the Monolith group; `width`/`height` are the face dims,
 * `depth` the slab thickness.
 */
export function ProjectedSurface({ width, height, depth }) {
  const {
    screenContrast,
    screenSaturation,
    screenBlurRadius,
    screenAccumDecay,
    bloomStrength,
    vignette,
    glassDepth,
    glowStrength,
    lightIntensity,
  } = useControls({
    Screen: folder({
      screenContrast: { value: C.screenContrast, min: 0.5, max: 2.0, step: 0.01 },
      screenSaturation: { value: C.screenSaturation, min: 0, max: 2, step: 0.01 },
      screenBlurRadius: { value: C.screenBlurRadius, min: 0, max: 8, step: 0.1 },
      screenAccumDecay: { value: C.screenAccumDecay, min: 0, max: 0.97, step: 0.01 },
      bloomStrength: { value: C.bloomStrength, min: 0, max: 3, step: 0.05 },
      vignette: { value: C.vignette, min: 0.01, max: 0.5, step: 0.01 },
      glassDepth: { value: C.glassDepth, min: 0, max: 0.2, step: 0.005 },
      glowStrength: { value: C.glowStrength, min: 0, max: 2, step: 0.05 },
      lightIntensity: { value: C.lightIntensity, min: 0, max: 60, step: 0.5 },
    }),
  });

  const video = useVideo();
  const faceAspect = width / height;

  // ── Render targets ──
  const rts = useDisposableItems(() => ({
    graded: makeRT(SRC_W, SRC_H),
    blurA: makeRT(BLUR_W, BLUR_H),
    blurB: makeRT(BLUR_W, BLUR_H),
    accumA: makeRT(SRC_W, SRC_H),
    accumB: makeRT(SRC_W, SRC_H),
    luma: makeRT(1, 1),
  }));

  // ── Fullscreen-quad pass scene + materials ──
  const pass = useDisposableItems(() => {
    const scene = new Scene();
    const cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geo = new PlaneGeometry(2, 2);
    const mesh = new Mesh(geo);
    scene.add(mesh);

    return {
      scene,
      cam,
      mesh,
      geo,
      grade: new ShaderMaterial({
        uniforms: {
          uVideo: { value: null },
          uVideoAspect: { value: 16 / 9 },
          uFaceAspect: { value: faceAspect },
          uContrast: { value: C.screenContrast },
          uSaturation: { value: C.screenSaturation },
        },
        vertexShader: VERT_FSQ,
        fragmentShader: GRADE_FRAG,
      }),
      hBlur: new ShaderMaterial({
        uniforms: {
          uTex: { value: null },
          uRadius: { value: C.screenBlurRadius },
          uTexelW: { value: 1 / BLUR_W },
        },
        vertexShader: VERT_FSQ,
        fragmentShader: H_BLUR_FRAG,
      }),
      vBlur: new ShaderMaterial({
        uniforms: {
          uTex: { value: null },
          uRadius: { value: C.screenBlurRadius },
          uTexelH: { value: 1 / BLUR_H },
        },
        vertexShader: VERT_FSQ,
        fragmentShader: V_BLUR_FRAG,
      }),
      accum: new ShaderMaterial({
        uniforms: {
          uCurrent: { value: null },
          uPrev: { value: null },
          uDecay: { value: C.screenAccumDecay },
        },
        vertexShader: VERT_FSQ,
        fragmentShader: ACCUM_FRAG,
      }),
      luma: new ShaderMaterial({
        uniforms: { uTex: { value: null } },
        vertexShader: VERT_FSQ,
        fragmentShader: LUMA_FRAG,
      }),
    };
  });

  // ── Display materials ──
  const screenMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTex: { value: null },
          uBloom: { value: null },
          uBloomStrength: { value: C.bloomStrength },
          uVignette: { value: C.vignette },
          uGlassDepth: { value: C.glassDepth },
          uTime: { value: 0 },
        },
        vertexShader: SCREEN_VERT,
        fragmentShader: SCREEN_FRAG,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  const makeGlowMat = () =>
    new ShaderMaterial({
      uniforms: {
        uBloom: { value: null },
        uStrength: { value: C.glowStrength },
      },
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
  const glowNearMat = useMemo(makeGlowMat, []);
  const glowFarMat = useMemo(makeGlowMat, []);

  useEffect(
    () => () => {
      screenMat.dispose();
      glowNearMat.dispose();
      glowFarMat.dispose();
    },
    [screenMat, glowNearMat, glowFarMat],
  );

  // ── Sync leva → uniforms ──
  useEffect(() => {
    const p = pass.current;
    if (!p) return;
    p.grade.uniforms.uContrast.value = screenContrast;
    p.grade.uniforms.uSaturation.value = screenSaturation;
    p.hBlur.uniforms.uRadius.value = screenBlurRadius;
    p.vBlur.uniforms.uRadius.value = screenBlurRadius;
    p.accum.uniforms.uDecay.value = screenAccumDecay;
  }, [pass, screenContrast, screenSaturation, screenBlurRadius, screenAccumDecay]);

  useEffect(() => {
    screenMat.uniforms.uBloomStrength.value = bloomStrength;
    screenMat.uniforms.uVignette.value = vignette;
    screenMat.uniforms.uGlassDepth.value = glassDepth;
    glowNearMat.uniforms.uStrength.value = glowStrength;
    glowFarMat.uniforms.uStrength.value = glowStrength * 0.45;
  }, [screenMat, glowNearMat, glowFarMat, bloomStrength, vignette, glassDepth, glowStrength]);

  // ── Video-driven room light state ──
  const lightRef = useRef(null);
  const accumPrev = useRef(null);
  const frame = useRef(0);
  const lumaBuf = useRef(new Uint8Array(4));
  const lumaTarget = useRef({ l: 0, color: new Color('#ffffff') });
  const lumaSmooth = useRef({ l: 0, color: new Color('#ffffff') });

  // ── Offscreen pipeline (priority 0 — before main render) ──
  useFrame(({ gl, clock }) => {
    const r = rts.current;
    const p = pass.current;
    if (!r || !p || !video.texture) return;

    const prevAutoClear = gl.autoClear;
    gl.autoClear = true;

    // 1. Grade + cover-fit crop → graded
    p.mesh.material = p.grade;
    p.grade.uniforms.uVideo.value = video.texture;
    p.grade.uniforms.uVideoAspect.value = video.aspect;
    p.grade.uniforms.uFaceAspect.value = faceAspect;
    gl.setRenderTarget(r.graded);
    gl.render(p.scene, p.cam);

    // 2. H+V blur → blurB (bloom)
    p.mesh.material = p.hBlur;
    p.hBlur.uniforms.uTex.value = r.graded.texture;
    gl.setRenderTarget(r.blurA);
    gl.render(p.scene, p.cam);

    p.mesh.material = p.vBlur;
    p.vBlur.uniforms.uTex.value = r.blurA.texture;
    gl.setRenderTarget(r.blurB);
    gl.render(p.scene, p.cam);

    // 3. Temporal accumulation (ping-pong) → phosphor trail on the sharp image
    const prev = accumPrev.current ?? r.accumA;
    const next = prev === r.accumA ? r.accumB : r.accumA;
    p.mesh.material = p.accum;
    p.accum.uniforms.uCurrent.value = r.graded.texture;
    p.accum.uniforms.uPrev.value = prev.texture;
    gl.setRenderTarget(next);
    gl.render(p.scene, p.cam);
    accumPrev.current = next;

    // 4. Every 6th frame: average the bloom → 1×1 → CPU, drives the point light
    if (frame.current++ % 6 === 0) {
      p.mesh.material = p.luma;
      p.luma.uniforms.uTex.value = r.blurB.texture;
      gl.setRenderTarget(r.luma);
      gl.render(p.scene, p.cam);
      gl.readRenderTargetPixels(r.luma, 0, 0, 1, 1, lumaBuf.current);
      const [cr, cg, cb] = lumaBuf.current;
      lumaTarget.current.l = (0.299 * cr + 0.587 * cg + 0.114 * cb) / 255;
      lumaTarget.current.color
        .setRGB(cr / 255, cg / 255, cb / 255)
        .lerp(new Color('#ffffff'), 0.4);
    }

    gl.setRenderTarget(null);
    gl.autoClear = prevAutoClear;

    // Feed display materials
    screenMat.uniforms.uTex.value = next.texture;
    screenMat.uniforms.uBloom.value = r.blurB.texture;
    screenMat.uniforms.uTime.value = clock.getElapsedTime();
    glowNearMat.uniforms.uBloom.value = r.blurB.texture;
    glowFarMat.uniforms.uBloom.value = r.blurB.texture;

    // Smooth the light toward the video's current brightness/colour
    const s = lumaSmooth.current;
    const t = lumaTarget.current;
    s.l += (t.l - s.l) * 0.08;
    s.color.lerp(t.color, 0.08);
    if (lightRef.current) {
      lightRef.current.intensity = lightIntensity * (0.15 + s.l * 1.6);
      lightRef.current.color.copy(s.color);
    }
  }, 0);

  return (
    <>
      {/* Emissive face, a hair proud of the slab */}
      <mesh position={[0, 0, depth / 2 + 0.002]} material={screenMat}>
        <planeGeometry args={[width, height]} />
      </mesh>

      {/* Fog-like halo layers in front of the face */}
      <mesh position={[0, 0, depth / 2 + 0.3]} material={glowNearMat}>
        <planeGeometry args={[width * 2.2, height * 1.2]} />
      </mesh>
      <mesh position={[0, 0, depth / 2 + 0.95]} material={glowFarMat}>
        <planeGeometry args={[width * 3.2, height * 1.55]} />
      </mesh>

      {/* The screen actually lighting the room */}
      <pointLight
        ref={lightRef}
        position={[0, 0, depth / 2 + 1.4]}
        intensity={0}
        distance={14}
        decay={2}
      />
    </>
  );
}
