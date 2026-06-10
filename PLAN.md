# The Matrix Cave — Build Plan

This file is editable. If you find things to resolve in a later stage or find better ways, edit this file. Not a changelog — a multi-session TODO.

## Current state

R3F scene inherited from "Allegory of the Cave" build. Full atmosphere and projection pipeline still present. Stripping begins at Stage 1.

Stack: Vite + React + R3F + jotai + tailwindcss. Run with `bun`.

---

## Stage 1 — Strip & Scaffold

Remove everything that isn't the monolith scene. Replace with minimal white-void setup.

- [ ] Delete projection pipeline (ProjectedSurface, Sun spotlight, blur passes)
- [ ] Delete Wall GLB and all wall-related components
- [ ] Delete GrassShrubs GLB instancing; replace with small procedural rock + grass primitives near monolith base
- [ ] Delete WebCam / MediaPipe segmentation
- [ ] Delete Oracle UI (widget, sidebar, project picker, LiveTextTile)
- [ ] Delete backend API integration (FastAPI calls, react-query hooks)
- [ ] Add Monolith component: tall black BoxGeometry, matte stone-grain MeshStandardMaterial
- [ ] Set scene background to pure white (#ffffff), remove stars HDR
- [ ] Reposition Fire point light behind camera; tune to ~1800K warm orange flicker

**Done when:** scene renders as white void + black monolith + fire light, no old UI present.

---

## Stage 2 — Ground & Anchoring

Make the monolith feel planted in reality.

- [ ] White ground plane (large, seamless, slightly rough)
- [ ] 3–5 scattered rocks around monolith base (primitive geometries + displaced normals or small GLBs)
- [ ] Sparse dead grass tufts (shader-based or simple billboard quads)
- [ ] Ensure monolith casts a hard shadow on white ground

**Done when:** monolith base reads as grounded, not floating.

---

## Stage 3 — Atmosphere

Subtle life to prevent sterility.

- [ ] Fire flicker drives light color temperature variation (warm orange → deep amber)
- [ ] Subtle camera micro-drift (breath-like, not orbit)
- [ ] Optional: heat-haze post-process near monolith base

**Done when:** scene feels alive without breaking the void aesthetic.

---

## Stage 4 — Release

- [ ] Assets load correctly in production build
- [ ] `BASE_PATH=/allegory-2.0/` confirmed in deploy
- [ ] Deploy to GitHub Pages via `bun run publish:gh`

---

## Notes for agents

- User does visual QA; no automated tests
- Always use `bun` for installs and scripts
- Default leva values must always be extracted to scene config — leva is additive, not the source of truth
- Fire component (`src/scene/Lighting/Fire.jsx`) is retained — reuse, don't rebuild
