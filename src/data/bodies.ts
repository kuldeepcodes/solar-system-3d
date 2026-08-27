import type { CelestialBody } from '../types';
import { SUN, PLANETS } from './planets';
import { MOONS } from './moons';
import { DWARF_PLANETS } from './dwarfs';

export { SUN, PLANETS } from './planets';
export { MOONS } from './moons';
export { DWARF_PLANETS } from './dwarfs';

/** Every body in the simulation, sorted Sun-first then outward. */
export const BODIES: CelestialBody[] = [SUN, ...PLANETS, ...MOONS, ...DWARF_PLANETS];

export const BODIES_BY_ID: Record<string, CelestialBody> = Object.fromEntries(
  BODIES.map((body) => [body.id, body]),
);

export function getBody(id: string | null | undefined): CelestialBody | undefined {
  return id ? BODIES_BY_ID[id] : undefined;
}

/** Direct satellites of a body. */
export function childrenOf(id: string): CelestialBody[] {
  return BODIES.filter((body) => body.parentId === id);
}

/**
 * Chain of parents from the given body up to the Sun, nearest first.
 * Used to accumulate world positions and to render breadcrumbs in the HUD.
 */
export function ancestorsOf(body: CelestialBody): CelestialBody[] {
  const chain: CelestialBody[] = [];
  let current = getBody(body.parentId);
  while (current) {
    chain.push(current);
    current = getBody(current.parentId);
  }
  return chain;
}

/** Standard gravitational parameter (km^3/s^2) for vis-viva speed readouts. */
export const GRAVITATIONAL_CONSTANT = 6.6743e-20; // km^3 kg^-1 s^-2

export function muOf(body: CelestialBody): number {
  return GRAVITATIONAL_CONSTANT * body.stats.massKg;
}

export const PLANET_IDS = PLANETS.map((p) => p.id);

/** Bodies that orbit the Sun directly, used for the top-level orbit rings. */
export const HELIOCENTRIC_BODIES = BODIES.filter((b) => b.parentId === 'sun');
