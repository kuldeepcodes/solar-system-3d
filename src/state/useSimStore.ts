import { create } from 'zustand';
import type { QualityTier, ScaleMode } from '../types';
import { nowJulian } from '../lib/time';

/**
 * Authoritative simulation clock.
 *
 * This deliberately lives OUTSIDE React state. The clock advances every frame,
 * and pushing that through zustand would re-render every subscribed component
 * 60 times a second. Instead the scene reads `simClock.julianDate` directly
 * inside `useFrame`, and only a throttled copy is published to the store for
 * the HUD to display.
 */
export const simClock = {
  julianDate: nowJulian(),
  /** Eased 0..1 blend between educational (0) and realistic (1) scale. */
  scaleBlend: 0,
};

export const SPEED_PRESETS = [1, 10, 100, 1000] as const;

interface SimState {
  paused: boolean;
  /** Signed multiplier: negative runs the simulation backwards. */
  speed: number;
  scaleMode: ScaleMode;
  quality: QualityTier;
  showOrbits: boolean;
  showLabels: boolean;
  showAsteroidBelt: boolean;
  showDwarfPlanets: boolean;
  showMoons: boolean;
  /** Throttled mirror of `simClock.julianDate`, refreshed ~6x per second. */
  displayJulian: number;

  setPaused: (paused: boolean) => void;
  togglePaused: () => void;
  setSpeed: (speed: number) => void;
  cycleSpeed: () => void;
  reverse: () => void;
  setScaleMode: (mode: ScaleMode) => void;
  toggleScaleMode: () => void;
  setQuality: (quality: QualityTier) => void;
  toggle: (key: 'showOrbits' | 'showLabels' | 'showAsteroidBelt' | 'showDwarfPlanets' | 'showMoons') => void;
  setJulian: (jd: number) => void;
  publishJulian: (jd: number) => void;
  resetToNow: () => void;
}

export const useSimStore = create<SimState>((set, get) => ({
  paused: false,
  speed: 10,
  scaleMode: 'educational',
  quality: 'high',
  showOrbits: true,
  showLabels: true,
  showAsteroidBelt: true,
  showDwarfPlanets: true,
  showMoons: true,
  displayJulian: simClock.julianDate,

  setPaused: (paused) => set({ paused }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setSpeed: (speed) => set({ speed }),
  cycleSpeed: () => {
    const { speed } = get();
    const sign = Math.sign(speed) || 1;
    const magnitude = Math.abs(speed);
    const index = SPEED_PRESETS.indexOf(magnitude as (typeof SPEED_PRESETS)[number]);
    const next = SPEED_PRESETS[(index + 1) % SPEED_PRESETS.length];
    set({ speed: next * sign });
  },
  reverse: () => set((s) => ({ speed: -s.speed })),
  setScaleMode: (scaleMode) => set({ scaleMode }),
  toggleScaleMode: () =>
    set((s) => ({ scaleMode: s.scaleMode === 'educational' ? 'realistic' : 'educational' })),
  setQuality: (quality) => set({ quality }),
  toggle: (key) => set((s) => ({ [key]: !s[key] }) as Pick<SimState, typeof key>),

  setJulian: (jd) => {
    simClock.julianDate = jd;
    set({ displayJulian: jd });
  },
  publishJulian: (jd) => set({ displayJulian: jd }),
  resetToNow: () => {
    const jd = nowJulian();
    simClock.julianDate = jd;
    set({ displayJulian: jd });
  },
}));

/** Geometry/effect budgets per quality tier, read by the scene components. */
export const QUALITY_SETTINGS: Record<
  QualityTier,
  {
    starCount: number;
    sphereSegments: number;
    asteroidCount: number;
    bloom: boolean;
    shadows: boolean;
    maxDpr: number;
    orbitSegments: number;
  }
> = {
  low: {
    starCount: 60_000,
    sphereSegments: 32,
    asteroidCount: 1200,
    bloom: false,
    shadows: false,
    maxDpr: 1,
    orbitSegments: 128,
  },
  medium: {
    starCount: 250_000,
    sphereSegments: 48,
    asteroidCount: 4000,
    bloom: true,
    shadows: false,
    maxDpr: 1.25,
    orbitSegments: 256,
  },
  high: {
    starCount: 600_000,
    sphereSegments: 64,
    asteroidCount: 9000,
    bloom: true,
    shadows: true,
    maxDpr: 1.75,
    orbitSegments: 384,
  },
  ultra: {
    starCount: 1_000_000,
    sphereSegments: 96,
    asteroidCount: 16_000,
    bloom: true,
    shadows: true,
    maxDpr: 2,
    orbitSegments: 512,
  },
};
