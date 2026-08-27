import * as THREE from 'three';
import { getBody } from '../data/bodies';
import { latLonToVector } from '../lib/geo';
import { daysSinceJ2000 } from '../lib/time';
import { useUIStore } from '../state/useUIStore';
import { simClock, useSimStore } from '../state/useSimStore';
import {
  bodyRadii,
  bodySpin,
  bodyWorldPositions,
  heliocentricKm,
  updateBodyTransforms,
} from './positions';
import { requestCameraApproach } from './cameraHints';
import type { SurfaceSite } from '../types';

const DEG = Math.PI / 180;
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/**
 * World position and outward normal of a surface site at the current instant.
 *
 * The rotation order here must mirror `Body.tsx`, which applies the axial tilt
 * on an outer group and the spin on an inner one. Applying them in the wrong
 * order puts markers in visibly wrong places as the planet turns.
 */
export function siteWorldTransform(
  site: SurfaceSite,
  outPosition: THREE.Vector3,
  outNormal: THREE.Vector3,
): boolean {
  const parent = getBody(site.parentId);
  if (!parent) return false;

  const center = bodyWorldPositions.get(parent.id);
  const radius = bodyRadii.get(parent.id);
  if (!center || radius === undefined) return false;

  const local = latLonToVector(site.latitude, site.longitude, 1);
  outNormal.set(local[0], local[1], local[2]);
  outNormal.applyAxisAngle(Y_AXIS, bodySpin.get(parent.id) ?? 0);
  outNormal.applyAxisAngle(X_AXIS, parent.stats.axialTiltDeg * DEG);
  outNormal.normalize();

  outPosition.copy(center).addScaledVector(outNormal, radius);
  return true;
}

const scratchPosition = new THREE.Vector3();
const scratchNormal = new THREE.Vector3();

const TAU = Math.PI * 2;

/**
 * Find the simulation time, within one rotation of the parent body, at which a
 * site is most directly facing the Sun - its local noon.
 *
 * Flying to a landmark that happens to be on the night side gives you an
 * unlit black sphere, which looks broken even though it is physically correct.
 * Rather than faking the lighting, the clock is nudged forward to local noon,
 * which keeps the simulation honest and doubles as a nice demonstration of
 * planetary rotation.
 *
 * Solved numerically (coarse sweep, then refine) because the site normal passes
 * through two rotations before the dot product with the Sun direction can be
 * evaluated - inverting that analytically is easy to get subtly wrong.
 */
export function solveLocalNoon(site: SurfaceSite, fromJulian: number): number {
  const parent = getBody(site.parentId);
  if (!parent) return fromJulian;

  const periodDays = Math.abs(parent.stats.rotationPeriodHours) / 24;
  if (!periodDays) return fromJulian;

  const local = latLonToVector(site.latitude, site.longitude, 1);
  const tilt = parent.stats.axialTiltDeg * DEG;

  const normal = new THREE.Vector3();
  const sunDir = new THREE.Vector3();

  const score = (jd: number): number => {
    const days = daysSinceJ2000(jd);

    normal.set(local[0], local[1], local[2]);
    normal.applyAxisAngle(Y_AXIS, ((days / periodDays) * TAU) % TAU);
    normal.applyAxisAngle(X_AXIS, tilt);

    // The Sun sits at the origin, so the direction to it is simply -position.
    const p = heliocentricKm(parent.id, days);
    sunDir.set(p.x, p.z, -p.y).normalize().multiplyScalar(-1);

    return normal.dot(sunDir);
  };

  let bestJd = fromJulian;
  let bestScore = -Infinity;

  const coarse = 96;
  const step = periodDays / coarse;

  for (let i = 0; i < coarse; i += 1) {
    const jd = fromJulian + i * step;
    const s = score(jd);
    if (s > bestScore) {
      bestScore = s;
      bestJd = jd;
    }
  }

  // The score is unimodal within one step of the coarse maximum, so a ternary
  // search converges reliably. A naive hill-climb that mutates its own centre
  // point mid-iteration does not - it can walk straight off the peak.
  let lo = bestJd - step;
  let hi = bestJd + step;
  for (let i = 0; i < 40; i += 1) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    if (score(m1) < score(m2)) lo = m1;
    else hi = m2;
  }

  const refined = (lo + hi) / 2;
  return score(refined) > bestScore ? refined : bestJd;
}

/**
 * Single entry point for "take me to this landmark", shared by the 3D markers,
 * the Wonders panel and search. It selects the site, opens its detail panel,
 * rolls the clock to local noon so the site is lit, and asks the camera rig to
 * approach from directly overhead so the landmark is centred.
 */
export function focusOnSite(site: SurfaceSite): void {
  const store = useUIStore.getState();
  const sim = useSimStore.getState();

  store.setWondersVisible(true);
  store.setActiveWonder(site.id);
  store.select(site.id);
  store.openPanel('detail');

  sim.setJulian(solveLocalNoon(site, simClock.julianDate));
  // Earth turns ~15 degrees per hour; at high time-acceleration the site would
  // rotate out from under the camera during the 1.35s fly-to. Pausing keeps the
  // arrival framed exactly on the landmark - the user can resume at any time.
  sim.setPaused(true);
  // Recompute transforms immediately so the approach vector below reflects the
  // new time rather than the pre-jump orientation.
  updateBodyTransforms(daysSinceJ2000(simClock.julianDate), simClock.scaleBlend);

  if (siteWorldTransform(site, scratchPosition, scratchNormal)) {
    requestCameraApproach(scratchNormal, 0.34);
  }

  // Keep the site selected - focusing the parent planet must not clobber it.
  store.focus(site.parentId, { keepSelection: true });
}
