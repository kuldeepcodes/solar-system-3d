import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { solveLocalNoon } from './siteFocus';
import { heliocentricKm } from './positions';
import { WONDERS } from '../data/wonders';
import { getBody } from '../data/bodies';
import { latLonToVector } from '../lib/geo';
import { daysSinceJ2000, dateToJulian } from '../lib/time';

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/**
 * Independent re-implementation of the sun-facing score, so the test verifies
 * the *result* rather than just re-running the solver's own arithmetic.
 */
function sunFacing(siteLat: number, siteLon: number, jd: number): number {
  const earth = getBody('earth')!;
  const periodDays = Math.abs(earth.stats.rotationPeriodHours) / 24;
  const days = daysSinceJ2000(jd);

  const local = latLonToVector(siteLat, siteLon, 1);
  const normal = new THREE.Vector3(local[0], local[1], local[2]);
  normal.applyAxisAngle(Y_AXIS, ((days / periodDays) * TAU) % TAU);
  normal.applyAxisAngle(X_AXIS, earth.stats.axialTiltDeg * DEG);

  const p = heliocentricKm('earth', days);
  const sunDir = new THREE.Vector3(p.x, p.z, -p.y).normalize().multiplyScalar(-1);

  return normal.dot(sunDir);
}

/** Dense brute-force optimum, used as ground truth for the solver. */
function bestPossible(siteLat: number, siteLon: number, start: number): number {
  const periodDays = Math.abs(getBody('earth')!.stats.rotationPeriodHours) / 24;
  let best = -Infinity;
  const samples = 20_000;
  for (let i = 0; i < samples; i += 1) {
    const s = sunFacing(siteLat, siteLon, start + (i / samples) * periodDays);
    if (s > best) best = s;
  }
  return best;
}

describe('solveLocalNoon', () => {
  const start = dateToJulian(new Date('2026-06-15T00:00:00Z'));

  it('returns a time within one rotation of the start', () => {
    for (const site of WONDERS) {
      const noon = solveLocalNoon(site, start);
      expect(noon).toBeGreaterThanOrEqual(start - 1e-6);
      expect(noon - start).toBeLessThanOrEqual(1.05);
    }
  });

  it('finds essentially the optimal sun-facing time for every wonder', () => {
    for (const site of WONDERS) {
      const achieved = sunFacing(site.latitude, site.longitude, solveLocalNoon(site, start));
      const optimal = bestPossible(site.latitude, site.longitude, start);
      // Within 0.1% of the true maximum. Note the maximum itself is bounded by
      // season and latitude - Rio in June can never exceed about 0.69.
      expect(achieved).toBeGreaterThan(optimal - 0.001);
    }
  });

  it('always lands on the daylit hemisphere', () => {
    for (const site of WONDERS) {
      const achieved = sunFacing(site.latitude, site.longitude, solveLocalNoon(site, start));
      // Comfortably lit rather than near the terminator. The ceiling is set by
      // latitude and season, so a southern site in June legitimately peaks
      // around 0.44 - hence a modest floor here.
      expect(achieved).toBeGreaterThan(0.25);
    }
  });

  it('rescues a site that begins in darkness', () => {
    let worst = WONDERS[0];
    let worstScore = Infinity;
    for (const site of WONDERS) {
      const s = sunFacing(site.latitude, site.longitude, start);
      if (s < worstScore) {
        worstScore = s;
        worst = site;
      }
    }
    expect(worstScore).toBeLessThan(0); // genuinely on the night side
    const improved = sunFacing(worst.latitude, worst.longitude, solveLocalNoon(worst, start));
    expect(improved).toBeGreaterThan(0.25);
  });

  it('is stable when re-solved from its own result', () => {
    for (const site of WONDERS.slice(0, 4)) {
      const first = solveLocalNoon(site, start);
      const second = solveLocalNoon(site, first);
      const a = sunFacing(site.latitude, site.longitude, first);
      const b = sunFacing(site.latitude, site.longitude, second);
      // Re-solving must not degrade the result.
      expect(b).toBeGreaterThan(a - 0.02);
    }
  });
});
