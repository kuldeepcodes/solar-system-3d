import type { CelestialBody, ScaleMode } from '../types';

/** One astronomical unit in kilometres (IAU 2012 definition). */
export const AU_KM = 149_597_870.7;

/** In realistic mode one scene unit represents 100,000 km. */
export const REALISTIC_UNIT_KM = 100_000;

/**
 * The Solar System spans roughly ten orders of magnitude, which no single
 * linear scale can present usefully. Two modes are therefore supported:
 *
 * - `realistic`  - true radii and true distances. Physically honest, but the
 *                  planets become sub-pixel specks at system scale.
 * - `educational`- radii and distances are compressed through power curves so
 *                  every body stays visible and orbits stay legible. This is
 *                  the default because it is what makes the app teachable.
 *
 * Crucially, `educational` scales each body's position by a *single scalar*
 * derived from its semi-major axis. Multiplying the whole Kepler position
 * vector by one number preserves the shape of the ellipse, its eccentricity
 * and its inclination - only the size changes. Scaling the axes independently
 * would deform the orbit and quietly break the eclipse geometry.
 */

/** Compressed display radius, in scene units. */
export function displayRadius(body: CelestialBody, mode: ScaleMode): number {
  if (mode === 'realistic') return body.radiusKm / REALISTIC_UNIT_KM;
  // The Sun is 109x Earth's radius. Sharing the planets' curve would leave it
  // swallowing Mercury's orbit, so stars get a stronger compression exponent.
  if (body.kind === 'star') return Math.pow(body.radiusKm, 0.34) * 0.02;
  // Power curve keeps Mercury visible next to Jupiter: Jupiter ends up ~2.6x
  // Earth's radius on screen instead of the true 11x.
  return Math.pow(body.radiusKm, 0.4) * 0.02;
}

/**
 * Scalar applied to a body's kilometre-space orbital position to place it in
 * the scene. Returns 0 for bodies without an orbit (the Sun).
 */
export function orbitScaleFactor(
  body: CelestialBody,
  mode: ScaleMode,
  parent: CelestialBody | undefined,
): number {
  if (!body.orbit) return 0;
  if (mode === 'realistic') return 1 / REALISTIC_UNIT_KM;

  if (body.kind === 'moon' && parent) {
    // Moons are placed relative to their parent's *displayed* radius so they
    // never end up buried inside the planet after radius compression.
    const parentRadius = displayRadius(parent, mode);
    const radiiOut = body.orbit.aKm / parent.radiusKm;
    const compressed = 1.5 + 2.5 * Math.pow(radiiOut / 60, 0.6);
    return (parentRadius * compressed) / body.orbit.aKm;
  }

  const au = body.orbit.aKm / AU_KM;
  const displaySemiMajor = Math.pow(au, 0.6) * 14;
  return displaySemiMajor / body.orbit.aKm;
}

/**
 * Convert a length expressed relative to a body (ring radii, altitudes) into
 * scene units. Working from the ratio to the body's own radius keeps rings
 * correctly proportioned in both scale modes.
 */
export function relativeToBody(km: number, body: CelestialBody, blend: number): number {
  return (km / body.radiusKm) * blendedRadius(body, blend);
}

/** Linear interpolation used to animate between the two scale modes. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Blended radius/scale factor. `blend` is 0 for fully educational and 1 for
 * fully realistic, animated by the simulation store so mode switches glide
 * rather than snap.
 */
export function blendedRadius(body: CelestialBody, blend: number): number {
  return lerp(displayRadius(body, 'educational'), displayRadius(body, 'realistic'), blend);
}

export function blendedOrbitFactor(
  body: CelestialBody,
  parent: CelestialBody | undefined,
  blend: number,
): number {
  return lerp(
    orbitScaleFactor(body, 'educational', parent),
    orbitScaleFactor(body, 'realistic', parent),
    blend,
  );
}

/** Camera distance limits for orbiting a body, in scene units. */
export function cameraLimits(radius: number): { min: number; max: number } {
  return {
    // 1.02x lets the camera skim just above the surface without clipping it.
    min: radius * 1.02,
    max: Math.max(radius * 600, 40),
  };
}

/** A comfortable framing distance when focusing a body. */
export function framingDistance(radius: number): number {
  return Math.max(radius * 4.2, radius + 0.02);
}

/** Human-readable distance, switching units by magnitude. */
export function formatDistance(km: number): string {
  const abs = Math.abs(km);
  if (abs >= 0.05 * AU_KM) return `${(km / AU_KM).toFixed(3)} AU`;
  if (abs >= 1e6) return `${(km / 1e6).toFixed(2)} million km`;
  if (abs >= 1000) return `${Math.round(km).toLocaleString('en-US')} km`;
  return `${km.toFixed(1)} km`;
}

/** Light travel time across a distance, formatted for the telemetry HUD. */
export function lightTravelTime(km: number): string {
  const seconds = km / 299_792.458;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
  if (seconds < 86_400) return `${(seconds / 3600).toFixed(2)} hours`;
  return `${(seconds / 86_400).toFixed(2)} days`;
}
