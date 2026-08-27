import * as THREE from 'three';
import { BODIES, getBody } from '../data/bodies';
import { orbitalPosition } from '../lib/orbital';
import { blendedOrbitFactor, blendedRadius } from '../lib/scale';
import type { CelestialBody, Vec3 } from '../types';

/**
 * World-space positions and display radii for every body, in scene units.
 *
 * These live in plain mutable maps rather than React state on purpose: they are
 * rewritten every frame, and routing them through React would trigger a full
 * reconciliation pass 60 times a second. Scene components read from here inside
 * `useFrame` and write straight to object3D transforms.
 *
 * `updateBodyTransforms` must run before any consumer each frame, which is why
 * the driver component registers its `useFrame` with a negative priority.
 */
export const bodyWorldPositions = new Map<string, THREE.Vector3>();
export const bodyRadii = new Map<string, number>();
export const bodySpin = new Map<string, number>();

for (const body of BODIES) {
  bodyWorldPositions.set(body.id, new THREE.Vector3());
  bodyRadii.set(body.id, 1);
  bodySpin.set(body.id, 0);
}

const DEG = Math.PI / 180;
const scratch = new THREE.Vector3();
const X_AXIS = new THREE.Vector3(1, 0, 0);

/**
 * Convert the ecliptic frame (z towards ecliptic north) into three.js's
 * y-up convention while preserving handedness: (x, y, z) -> (x, z, -y).
 */
export function eclipticToScene(v: Vec3, target: THREE.Vector3): THREE.Vector3 {
  return target.set(v.x, v.z, -v.y);
}

/**
 * Rotate a moon's orbital offset into its parent's equatorial plane.
 * Without this, Saturn's moons would orbit in the ecliptic while the rings sit
 * at Saturn's 26.7 degree obliquity - a visibly wrong result.
 */
function applyObliquity(vec: THREE.Vector3, tiltDeg: number): void {
  if (!tiltDeg) return;
  vec.applyAxisAngle(X_AXIS, tiltDeg * DEG);
}

/** Recompute every body's world transform for the given simulation time. */
export function updateBodyTransforms(daysSinceEpoch: number, blend: number): void {
  for (const body of BODIES) {
    const radius = blendedRadius(body, blend);
    bodyRadii.set(body.id, radius);

    const target = bodyWorldPositions.get(body.id)!;

    if (!body.orbit || !body.parentId) {
      target.set(0, 0, 0);
      bodySpin.set(body.id, spinFor(body, daysSinceEpoch));
      continue;
    }

    const parent = getBody(body.parentId);
    const factor = blendedOrbitFactor(body, parent, blend);
    const local = orbitalPosition(body.orbit, daysSinceEpoch);

    eclipticToScene(local, scratch).multiplyScalar(factor);

    if (body.orbit.frame === 'equatorial' && parent) {
      applyObliquity(scratch, parent.stats.axialTiltDeg);
    }

    const parentPos = parent ? bodyWorldPositions.get(parent.id) : undefined;
    if (parentPos) target.copy(parentPos).add(scratch);
    else target.copy(scratch);

    bodySpin.set(body.id, spinFor(body, daysSinceEpoch));
  }
}

function spinFor(body: CelestialBody, daysSinceEpoch: number): number {
  const hours = body.stats.rotationPeriodHours;
  if (!hours) return 0;
  const periodDays = hours / 24;
  return ((daysSinceEpoch / periodDays) * Math.PI * 2) % (Math.PI * 2);
}

export function positionOf(id: string): THREE.Vector3 {
  return bodyWorldPositions.get(id) ?? new THREE.Vector3();
}

export function radiusOf(id: string): number {
  return bodyRadii.get(id) ?? 1;
}

/**
 * Straight-line distance between two bodies in kilometres, derived from the
 * *unscaled* Kepler solution so the measurement tool reports real values rather
 * than compressed scene distances.
 */
export function realDistanceKm(aId: string, bId: string, daysSinceEpoch: number): number {
  const a = heliocentricKm(aId, daysSinceEpoch);
  const b = heliocentricKm(bId, daysSinceEpoch);
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** True heliocentric position in kilometres, accumulating the parent chain. */
export function heliocentricKm(id: string, daysSinceEpoch: number): Vec3 {
  let body = getBody(id);
  const total: Vec3 = { x: 0, y: 0, z: 0 };
  let guard = 0;
  while (body?.orbit && body.parentId && guard < 8) {
    const p = orbitalPosition(body.orbit, daysSinceEpoch);
    total.x += p.x;
    total.y += p.y;
    total.z += p.z;
    body = getBody(body.parentId);
    guard += 1;
  }
  return total;
}
