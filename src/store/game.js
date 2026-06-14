import { atom } from 'jotai';

/**
 * Game state atoms — manage player progression, monolith interaction, etc.
 */

// Player state
export const playerStateAtom = atom({
  position: [0, 0, 8], // camera equivalent
  distance: 8, // distance from monolith
  health: 100,
  energy: 100,
});

// Game progression / unlocks
export const gameProgressAtom = atom({
  level: 0,
  stage: 'observe', // observe → approach → interact → unlock
  unlockedFeatures: [],
  objectivesCompleted: 0,
});

// Monolith interaction state
export const monolithStateAtom = atom({
  isActive: false,
  screenBrightness: 0.3,
  screenContent: 'standby', // standby → hint → challenge → reward
  pulseIntensity: 0,
});

// Derived: distance-based monolith response
export const monolithResponseAtom = atom((get) => {
  const player = get(playerStateAtom);
  const distance = player.distance;

  // Closer approach → more intense response
  const brightness = Math.max(0.3, Math.min(1, 1 - distance / 10));
  const pulse = Math.max(0, 1 - distance / 5);

  return { brightness, pulse };
});
