import type { OrbitalElements, Vec3 } from '../types';

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;

/** Normalise an angle in radians to [0, 2*PI). */
export function wrapAngle(radians: number): number {
  const r = radians % TAU;
  return r < 0 ? r + TAU : r;
}

/**
 * Solve Kepler's equation `M = E - e*sin(E)` for the eccentric anomaly `E`.
 *
 * Uses Newton-Raphson, which converges quadratically for the eccentricities
 * found in the Solar System. The starting guess is switched for highly
 * eccentric orbits (e > 0.8, i.e. comets and Eris-like bodies) where the naive
 * `E = M` seed converges slowly or oscillates.
 *
 * @param meanAnomaly Mean anomaly in radians.
 * @param e Eccentricity, 0 <= e < 1.
 * @returns Eccentric anomaly in radians.
 */
export function solveKepler(meanAnomaly: number, e: number, tolerance = 1e-10, maxIterations = 64): number {
  const M = wrapAngle(meanAnomaly);
  let E = e < 0.8 ? M : Math.PI;

  for (let i = 0; i < maxIterations; i += 1) {
    const f = E - e * Math.sin(E) - M;
    const fPrime = 1 - e * Math.cos(E);
    const delta = f / fPrime;
    E -= delta;
    if (Math.abs(delta) < tolerance) break;
  }

  return E;
}

/**
 * True anomaly from eccentric anomaly.
 * The half-angle `atan2` form is numerically stable across the full orbit,
 * unlike the more common `acos` formulation which loses precision near
 * periapsis and apoapsis.
 */
export function trueAnomaly(E: number, e: number): number {
  return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
}

/** Mean anomaly at a given time, in radians. */
export function meanAnomalyAt(el: OrbitalElements, daysSinceEpoch: number): number {
  const n = TAU / el.periodDays;
  return wrapAngle(el.meanAnomalyDeg * DEG + n * daysSinceEpoch);
}

/**
 * Position of an orbiting body relative to its primary, in kilometres,
 * expressed in the ecliptic frame (x towards the vernal equinox, z towards
 * ecliptic north).
 */
export function orbitalPosition(el: OrbitalElements, daysSinceEpoch: number): Vec3 {
  const M = meanAnomalyAt(el, daysSinceEpoch);
  const E = solveKepler(M, el.e);
  const nu = trueAnomaly(E, el.e);
  const r = el.aKm * (1 - el.e * Math.cos(E));
  return orbitalPlaneToEcliptic(r, nu, el, daysSinceEpoch);
}

/** Rotate a (radius, true anomaly) pair from the orbital plane into the ecliptic frame. */
function orbitalPlaneToEcliptic(
  r: number,
  nu: number,
  el: OrbitalElements,
  daysSinceEpoch: number,
): Vec3 {
  const w = (el.periapsisDeg + (el.periapsisRateDegPerDay ?? 0) * daysSinceEpoch) * DEG;
  const node = (el.nodeDeg + (el.nodeRateDegPerDay ?? 0) * daysSinceEpoch) * DEG;
  const inc = el.iDeg * DEG;

  const u = nu + w; // argument of latitude
  const cosU = Math.cos(u);
  const sinU = Math.sin(u);
  const cosNode = Math.cos(node);
  const sinNode = Math.sin(node);
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);

  return {
    x: r * (cosNode * cosU - sinNode * sinU * cosI),
    y: r * (sinNode * cosU + cosNode * sinU * cosI),
    z: r * (sinU * sinI),
  };
}

/**
 * Sample the full orbit as a closed polyline, in kilometres (ecliptic frame).
 * Sampling in eccentric anomaly rather than time gives even spatial spacing
 * on eccentric orbits, which keeps the rendered path smooth near periapsis.
 */
export function orbitPathPoints(el: OrbitalElements, segments = 512, daysSinceEpoch = 0): Vec3[] {
  const points: Vec3[] = new Array(segments + 1);
  for (let i = 0; i <= segments; i += 1) {
    const E = (i / segments) * TAU;
    const nu = trueAnomaly(E, el.e);
    const r = el.aKm * (1 - el.e * Math.cos(E));
    points[i] = orbitalPlaneToEcliptic(r, nu, el, daysSinceEpoch);
  }
  return points;
}

/** Periapsis and apoapsis distances in kilometres. */
export function apsides(el: OrbitalElements): { periapsisKm: number; apoapsisKm: number } {
  return {
    periapsisKm: el.aKm * (1 - el.e),
    apoapsisKm: el.aKm * (1 + el.e),
  };
}

/**
 * Instantaneous orbital speed in km/s via the vis-viva equation.
 * `mu` is the standard gravitational parameter of the primary in km^3/s^2.
 */
export function orbitalSpeed(el: OrbitalElements, daysSinceEpoch: number, mu: number): number {
  const M = meanAnomalyAt(el, daysSinceEpoch);
  const E = solveKepler(M, el.e);
  const r = el.aKm * (1 - el.e * Math.cos(E));
  return Math.sqrt(Math.max(0, mu * (2 / r - 1 / el.aKm)));
}

/** Rotation angle of a body about its own axis at a given time, in radians. */
export function spinAngle(rotationPeriodHours: number, daysSinceEpoch: number): number {
  if (!rotationPeriodHours) return 0;
  const periodDays = rotationPeriodHours / 24;
  return wrapAngle((daysSinceEpoch / periodDays) * TAU);
}
