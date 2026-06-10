# The Matrix Cave — Agent Map

## Intent

A stark ThreeJS scene: pure white void, a towering black monolith, a few anchoring rocks and dead grass, lit by a single fire-temperature point light behind the camera.

No cave wall. No projection pipeline. No webcam shadow. The monolith **is** the truth — opaque, total, unexplained.

## Scene entry
`src/scene/index.jsx` — composes all scene nodes; camera limits in `CAM_LIMITS`

## Scene nodes (target state)
| Node | File | Notes |
|------|------|-------|
| Monolith | `src/scene/Monolith/index.jsx` | Black cuboid, matte stone-grain texture |
| Ground | `src/scene/Ground/index.jsx` | White void floor; scattered rocks + sparse dead grass tufts near monolith base |
| Fire light | `src/scene/Lighting/Fire.jsx` | Retained from allegory build — flickering point light, ~1800K warm orange, positioned behind camera |

## Fire (retained)
`src/scene/Lighting/Fire.jsx` — custom GLSL flame → 512×512 RT → pointLight. Flicker logic in `useFrame`. Keep as-is; just reposition the light source behind the camera.

## What is gone
- Wall GLB, projection pipeline, gobo passes, blur passes, temporal accumulation
- GrassShrubs GLB instancing (replace with procedural primitive rocks / dead grass tufts)
- Stars HDR environment map
- WebCam / MediaPipe segmentation
- Oracle widget, sidebar, project picker, LiveTextTile
- Backend (FastAPI / ollama)

## Config / tuning
`src/scene/config.js` — numeric defaults (light position, intensity, flicker range). Leva controls override at runtime.

## Camera
`OrbitControls` — pan/zoom disabled; narrow azimuth + polar range so the monolith stays centered. Adjust `CAM_LIMITS`.

## Public assets (target)
- `public/textures/` — stone-grain texture for monolith (to be added)
- Ground068 soil textures can be repurposed for rock/ground detail
