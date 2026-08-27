import { describe, it, expect } from 'vitest';
import { latLonToVector, greatCircleKm, formatLatLon } from './geo';
import { WONDERS } from '../data/wonders';

describe('latLonToVector', () => {
  it('places the north pole at +Y and the south pole at -Y', () => {
    const north = latLonToVector(90, 0, 1);
    expect(north[1]).toBeCloseTo(1, 10);
    const south = latLonToVector(-90, 0, 1);
    expect(south[1]).toBeCloseTo(-1, 10);
  });

  it('keeps equator points in the XZ plane', () => {
    for (const lon of [-180, -90, 0, 90, 179]) {
      expect(latLonToVector(0, lon, 1)[1]).toBeCloseTo(0, 10);
    }
  });

  it('always returns a vector of the requested radius', () => {
    for (const [lat, lon] of [
      [0, 0],
      [45, 90],
      [-33.9, 151.2],
      [27.17, 78.04],
    ]) {
      const [x, y, z] = latLonToVector(lat, lon, 7);
      expect(Math.hypot(x, y, z)).toBeCloseTo(7, 10);
    }
  });

  it('maps antipodal points to opposite vectors', () => {
    const a = latLonToVector(30, 40, 1);
    const b = latLonToVector(-30, 40 - 180, 1);
    expect(a[0]).toBeCloseTo(-b[0], 10);
    expect(a[1]).toBeCloseTo(-b[1], 10);
    expect(a[2]).toBeCloseTo(-b[2], 10);
  });

  it('is consistent with three.js SphereGeometry UV winding', () => {
    // Longitude 0 must sit at +X after the +180 phase shift used in geo.ts.
    const [x, , z] = latLonToVector(0, 0, 1);
    expect(x).toBeCloseTo(1, 10);
    expect(z).toBeCloseTo(0, 10);
  });
});

describe('greatCircleKm', () => {
  const EARTH_R = 6371;

  it('returns zero for identical points', () => {
    expect(greatCircleKm(51.5, -0.12, 51.5, -0.12, EARTH_R)).toBeCloseTo(0, 8);
  });

  it('measures a quarter circumference from pole to equator', () => {
    const expected = (Math.PI / 2) * EARTH_R;
    expect(greatCircleKm(90, 0, 0, 0, EARTH_R)).toBeCloseTo(expected, 5);
  });

  it('matches the known London to New York distance', () => {
    const d = greatCircleKm(51.5074, -0.1278, 40.7128, -74.006, EARTH_R);
    expect(d).toBeGreaterThan(5500);
    expect(d).toBeLessThan(5620);
  });
});

describe('formatLatLon', () => {
  it('uses the correct hemisphere letters', () => {
    expect(formatLatLon(27.1751, 78.0421)).toContain('N');
    expect(formatLatLon(27.1751, 78.0421)).toContain('E');
    expect(formatLatLon(-22.9519, -43.2105)).toContain('S');
    expect(formatLatLon(-22.9519, -43.2105)).toContain('W');
  });
});

describe('wonders dataset', () => {
  it('has eight sites, all on Earth', () => {
    expect(WONDERS).toHaveLength(8);
    for (const site of WONDERS) expect(site.parentId).toBe('earth');
  });

  it('has exactly one honorary member', () => {
    expect(WONDERS.filter((w) => w.honorary)).toHaveLength(1);
  });

  it('has valid coordinates and unique ids', () => {
    const ids = new Set<string>();
    for (const site of WONDERS) {
      expect(site.latitude).toBeGreaterThanOrEqual(-90);
      expect(site.latitude).toBeLessThanOrEqual(90);
      expect(site.longitude).toBeGreaterThanOrEqual(-180);
      expect(site.longitude).toBeLessThanOrEqual(180);
      expect(ids.has(site.id)).toBe(false);
      ids.add(site.id);
      expect(site.learn.length).toBeGreaterThan(0);
      expect(site.facts.length).toBeGreaterThan(0);
    }
  });
});
