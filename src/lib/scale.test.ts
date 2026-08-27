import { describe, it, expect } from 'vitest';
import { displayRadius, orbitScaleFactor, formatDistance, lightTravelTime, AU_KM } from './scale';
import {
  dateToJulian,
  julianToDate,
  daysSinceJ2000,
  J2000,
  formatDuration,
  inputDateToJulian,
  julianToInputDate,
} from './time';
import { BODIES, getBody, BODIES_BY_ID } from '../data/bodies';
import { SUN, PLANETS } from '../data/planets';

describe('time conversions', () => {
  it('round-trips a Date through a Julian Date', () => {
    const date = new Date('2026-03-14T08:31:00Z');
    const back = julianToDate(dateToJulian(date));
    expect(Math.abs(back.getTime() - date.getTime())).toBeLessThan(2);
  });

  it('anchors J2000.0 to 2000-01-01T12:00:00Z', () => {
    const jd = dateToJulian(new Date('2000-01-01T12:00:00Z'));
    expect(jd).toBeCloseTo(J2000, 6);
    expect(daysSinceJ2000(jd)).toBeCloseTo(0, 6);
  });

  it('round-trips an input date string', () => {
    const jd = inputDateToJulian('2026-08-27');
    expect(jd).not.toBeNull();
    expect(julianToInputDate(jd!)).toBe('2026-08-27');
  });

  it('rejects an invalid date string', () => {
    expect(inputDateToJulian('not-a-date')).toBeNull();
  });

  it('formats durations with a sensible unit', () => {
    expect(formatDuration(0.02)).toContain('minutes');
    expect(formatDuration(0.5)).toContain('hours');
    expect(formatDuration(90)).toContain('days');
    expect(formatDuration(4000)).toContain('years');
  });
});

describe('scale system', () => {
  it('compresses radii so the Sun does not dwarf the planets', () => {
    const sun = displayRadius(SUN, 'educational');
    const earth = displayRadius(BODIES_BY_ID.earth, 'educational');
    const ratio = sun / earth;
    // True ratio is 109x; educational mode must bring it far below that.
    expect(ratio).toBeGreaterThan(1.5);
    expect(ratio).toBeLessThan(8);
  });

  it('preserves the true ratio in realistic mode', () => {
    const sun = displayRadius(SUN, 'realistic');
    const earth = displayRadius(BODIES_BY_ID.earth, 'realistic');
    expect(sun / earth).toBeCloseTo(SUN.radiusKm / BODIES_BY_ID.earth.radiusKm, 6);
  });

  it('keeps planets ordered outward in educational mode', () => {
    const distances = PLANETS.map((p) => {
      const factor = orbitScaleFactor(p, 'educational', SUN);
      return p.orbit!.aKm * factor;
    });
    for (let i = 1; i < distances.length; i += 1) {
      expect(distances[i]).toBeGreaterThan(distances[i - 1]);
    }
  });

  it('keeps every planet clear of the Sun in educational mode', () => {
    const sunRadius = displayRadius(SUN, 'educational');
    for (const planet of PLANETS) {
      const orbitRadius = planet.orbit!.aKm * orbitScaleFactor(planet, 'educational', SUN);
      expect(orbitRadius).toBeGreaterThan(sunRadius * 1.5);
    }
  });

  it('keeps each moon outside its parent in educational mode', () => {
    for (const body of BODIES.filter((b) => b.kind === 'moon')) {
      const parent = getBody(body.parentId)!;
      const factor = orbitScaleFactor(body, 'educational', parent);
      const orbitRadius = body.orbit!.aKm * factor;
      const parentRadius = displayRadius(parent, 'educational');
      expect(orbitRadius).toBeGreaterThan(parentRadius);
    }
  });

  it('returns a zero orbit factor for the Sun', () => {
    expect(orbitScaleFactor(SUN, 'educational', undefined)).toBe(0);
  });
});

describe('formatting helpers', () => {
  it('switches units by magnitude', () => {
    expect(formatDistance(420)).toContain('km');
    expect(formatDistance(5_000_000)).toContain('million km');
    expect(formatDistance(2 * AU_KM)).toContain('AU');
  });

  it('reports the ~8 minute light time from the Sun to Earth', () => {
    expect(lightTravelTime(AU_KM)).toBe('8.3 min');
  });
});

describe('body registry', () => {
  it('has unique ids', () => {
    const ids = new Set<string>();
    for (const body of BODIES) {
      expect(ids.has(body.id)).toBe(false);
      ids.add(body.id);
    }
  });

  it('resolves every parent reference', () => {
    for (const body of BODIES) {
      if (body.parentId) expect(getBody(body.parentId)).toBeDefined();
    }
  });

  it('gives every body except the Sun an orbit', () => {
    for (const body of BODIES) {
      if (body.id === 'sun') expect(body.orbit).toBeNull();
      else expect(body.orbit).not.toBeNull();
    }
  });

  it('includes the required planets and moons', () => {
    for (const id of ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']) {
      expect(BODIES_BY_ID[id]?.kind).toBe('planet');
    }
    for (const id of ['moon', 'europa', 'ganymede', 'titan', 'io', 'callisto']) {
      expect(BODIES_BY_ID[id]?.kind).toBe('moon');
    }
  });

  it('gives every body descriptive content', () => {
    for (const body of BODIES) {
      expect(body.description.length).toBeGreaterThan(20);
      expect(body.facts.length).toBeGreaterThan(2);
      expect(body.learn.length).toBeGreaterThan(0);
    }
  });
});
