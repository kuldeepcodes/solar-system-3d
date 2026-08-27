import { describe, it, expect } from 'vitest';
import {
  solveKepler,
  trueAnomaly,
  orbitalPosition,
  orbitPathPoints,
  apsides,
  wrapAngle,
  meanAnomalyAt,
} from './orbital';
import { PLANETS, SUN } from '../data/planets';
import { MOONS } from '../data/moons';
import { AU_KM } from './scale';
import type { OrbitalElements } from '../types';

const TAU = Math.PI * 2;

function circular(overrides: Partial<OrbitalElements> = {}): OrbitalElements {
  return {
    aKm: 1000,
    e: 0,
    iDeg: 0,
    nodeDeg: 0,
    periapsisDeg: 0,
    meanAnomalyDeg: 0,
    periodDays: 100,
    ...overrides,
  };
}

describe('wrapAngle', () => {
  it('maps angles into [0, 2*PI)', () => {
    expect(wrapAngle(0)).toBeCloseTo(0, 12);
    expect(wrapAngle(TAU + 0.5)).toBeCloseTo(0.5, 12);
    expect(wrapAngle(-0.5)).toBeCloseTo(TAU - 0.5, 12);
    expect(wrapAngle(-3 * TAU)).toBeCloseTo(0, 12);
  });
});

describe('solveKepler', () => {
  it('is exact for a circular orbit', () => {
    for (const M of [0, 0.5, 1.5, 3, 5]) {
      expect(solveKepler(M, 0)).toBeCloseTo(M, 10);
    }
  });

  it('satisfies M = E - e*sin(E) across a wide eccentricity range', () => {
    for (const e of [0, 0.05, 0.2, 0.5, 0.85, 0.95, 0.99]) {
      for (let i = 0; i < 24; i += 1) {
        const M = (i / 24) * TAU;
        const E = solveKepler(M, e);
        expect(E - e * Math.sin(E)).toBeCloseTo(wrapAngle(M), 8);
      }
    }
  });

  it('converges for the extreme case M = 0 with high eccentricity', () => {
    const E = solveKepler(0, 0.97);
    expect(Number.isFinite(E)).toBe(true);
    expect(E - 0.97 * Math.sin(E)).toBeCloseTo(0, 8);
  });
});

describe('trueAnomaly', () => {
  it('equals the eccentric anomaly for a circular orbit', () => {
    expect(trueAnomaly(1.2, 0)).toBeCloseTo(1.2, 10);
  });

  it('is zero at periapsis and PI at apoapsis', () => {
    expect(trueAnomaly(0, 0.4)).toBeCloseTo(0, 10);
    expect(Math.abs(trueAnomaly(Math.PI, 0.4))).toBeCloseTo(Math.PI, 10);
  });

  it('runs ahead of the eccentric anomaly on the outbound leg', () => {
    // Between periapsis and apoapsis a body sweeps true anomaly faster.
    expect(trueAnomaly(1.0, 0.6)).toBeGreaterThan(1.0);
  });
});

describe('orbitalPosition', () => {
  it('keeps a circular orbit at a constant radius', () => {
    const el = circular();
    for (let i = 0; i < 12; i += 1) {
      const p = orbitalPosition(el, (i / 12) * el.periodDays);
      expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(el.aKm, 6);
    }
  });

  it('returns to the same point after exactly one period', () => {
    const el = circular({ e: 0.3, iDeg: 12, nodeDeg: 40, periapsisDeg: 70 });
    const a = orbitalPosition(el, 13.7);
    const b = orbitalPosition(el, 13.7 + el.periodDays);
    expect(a.x).toBeCloseTo(b.x, 5);
    expect(a.y).toBeCloseTo(b.y, 5);
    expect(a.z).toBeCloseTo(b.z, 5);
  });

  it('starts at periapsis when the mean anomaly is zero', () => {
    const el = circular({ e: 0.5 });
    const p = orbitalPosition(el, 0);
    expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(el.aKm * (1 - el.e), 6);
  });

  it('reaches apoapsis at half a period', () => {
    const el = circular({ e: 0.5 });
    const p = orbitalPosition(el, el.periodDays / 2);
    expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(el.aKm * (1 + el.e), 5);
  });

  it('stays in the reference plane at zero inclination', () => {
    const el = circular({ e: 0.4, nodeDeg: 33, periapsisDeg: 88 });
    for (let i = 0; i < 8; i += 1) {
      expect(orbitalPosition(el, i * 9).z).toBeCloseTo(0, 8);
    }
  });

  it('bounds out-of-plane excursion by a*sin(i)', () => {
    const el = circular({ iDeg: 30 });
    const limit = el.aKm * Math.sin((30 * Math.PI) / 180);
    for (let i = 0; i < 40; i += 1) {
      expect(Math.abs(orbitalPosition(el, i * 2.5).z)).toBeLessThanOrEqual(limit + 1e-6);
    }
  });

  it('honours secular node regression', () => {
    const base = circular({ iDeg: 20, nodeRateDegPerDay: 1 });
    const still = circular({ iDeg: 20 });
    // After 90 days the drifting orbit's plane should differ noticeably.
    const a = orbitalPosition(base, 90);
    const b = orbitalPosition(still, 90);
    expect(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)).toBeGreaterThan(1);
  });
});

describe('orbitPathPoints', () => {
  it('produces a closed loop', () => {
    const el = circular({ e: 0.25, iDeg: 15, nodeDeg: 200 });
    const pts = orbitPathPoints(el, 64);
    expect(pts).toHaveLength(65);
    expect(pts[0].x).toBeCloseTo(pts[64].x, 6);
    expect(pts[0].y).toBeCloseTo(pts[64].y, 6);
  });

  it('spans exactly periapsis to apoapsis', () => {
    const el = circular({ e: 0.6 });
    const radii = orbitPathPoints(el, 256).map((p) => Math.hypot(p.x, p.y, p.z));
    const { periapsisKm, apoapsisKm } = apsides(el);
    expect(Math.min(...radii)).toBeCloseTo(periapsisKm, 4);
    expect(Math.max(...radii)).toBeCloseTo(apoapsisKm, 4);
  });
});

describe('meanAnomalyAt', () => {
  it('advances by a full turn over one period', () => {
    const el = circular();
    const start = meanAnomalyAt(el, 0);
    expect(meanAnomalyAt(el, el.periodDays)).toBeCloseTo(start, 8);
    expect(meanAnomalyAt(el, el.periodDays / 2)).toBeCloseTo(wrapAngle(start + Math.PI), 8);
  });
});

describe('real Solar System data', () => {
  it('places every planet within its true perihelion/aphelion band', () => {
    for (const planet of PLANETS) {
      const el = planet.orbit!;
      const { periapsisKm, apoapsisKm } = apsides(el);
      // Sample across a full orbit.
      for (let i = 0; i < 16; i += 1) {
        const p = orbitalPosition(el, (i / 16) * el.periodDays);
        const r = Math.hypot(p.x, p.y, p.z);
        expect(r).toBeGreaterThanOrEqual(periapsisKm - 1);
        expect(r).toBeLessThanOrEqual(apoapsisKm + 1);
      }
    }
  });

  it('orders the planets correctly by semi-major axis', () => {
    const auValues = PLANETS.map((p) => p.orbit!.aKm / AU_KM);
    const sorted = [...auValues].sort((a, b) => a - b);
    expect(auValues).toEqual(sorted);
    expect(auValues[0]).toBeCloseTo(0.387, 2); // Mercury
    expect(auValues[2]).toBeCloseTo(1.0, 2); // Earth
    expect(auValues[7]).toBeCloseTo(30.07, 1); // Neptune
  });

  it('keeps the Moon near its true mean distance', () => {
    const moon = MOONS.find((m) => m.id === 'moon')!;
    for (let i = 0; i < 12; i += 1) {
      const p = orbitalPosition(moon.orbit!, i * 2.2);
      const r = Math.hypot(p.x, p.y, p.z);
      // True perigee ~362,600 km, apogee ~405,400 km.
      expect(r).toBeGreaterThan(360_000);
      expect(r).toBeLessThan(407_000);
    }
  });

  it('gives every body a positive radius and period', () => {
    for (const body of [SUN, ...PLANETS, ...MOONS]) {
      expect(body.radiusKm).toBeGreaterThan(0);
      if (body.orbit) expect(body.orbit.periodDays).toBeGreaterThan(0);
    }
  });

  it("matches Kepler's third law for the planets", () => {
    // T^2 / a^3 should be ~1 when T is in years and a in AU.
    for (const planet of PLANETS) {
      const years = planet.orbit!.periodDays / 365.25;
      const au = planet.orbit!.aKm / AU_KM;
      expect(years ** 2 / au ** 3).toBeCloseTo(1, 1);
    }
  });
});
