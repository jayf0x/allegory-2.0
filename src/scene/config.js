export const SCENE_CONFIG = {
  // Fire point light — positioned behind camera (dim warm rim against the screen glow)
  fireX: 0,
  fireY: 1.5,
  fireZ: 4,
  fireIntensity: 4.0,
  flameIntensity: 40.0,
  flameAngle: 1.2,
  flamePenumbra: 0.0,

  // Ambient fill
  ambientIntensity: 0.02,

  // Monolith — 2001 ratio 1:4:9 (depth:width:height), scaled up a touch
  monolithWidth: 2.4,
  monolithHeight: 5.4,
  monolithDepth: 0.6,

  // Screen pipeline (video → grade → blur → temporal accumulation)
  screenContrast: 1.12,
  screenSaturation: 1.05,
  screenBlurRadius: 2.0,
  screenAccumDecay: 0.3,

  // Screen surface look
  bloomStrength: 1.1,
  vignette: 0.14,
  glassDepth: 0.05,

  // Outward light
  glowStrength: 0.55,
  lightIntensity: 14,
};
