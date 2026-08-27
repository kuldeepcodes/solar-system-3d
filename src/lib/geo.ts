const DEG = Math.PI / 180;

/**
 * Convert geographic coordinates into a position on a sphere in the body's
 * local frame.
 *
 * The mapping is derived from three.js `SphereGeometry`, whose vertices are
 * generated as `x = -r*cos(phi)*sin(theta)`, `y = r*cos(theta)`,
 * `z = r*sin(phi)*sin(theta)` with `uv.x = phi/2PI` and `uv.y = 1 - theta/PI`.
 * Matching it exactly is what makes a marker land on the right pixel of an
 * equirectangular surface texture - lat/lon markers placed with the "obvious"
 * spherical formula end up mirrored in longitude.
 */
export function latLonToVector(
  latitude: number,
  longitude: number,
  radius: number,
): [number, number, number] {
  const phi = (longitude + 180) * DEG;
  const theta = (90 - latitude) * DEG;
  const sinTheta = Math.sin(theta);
  return [-radius * Math.cos(phi) * sinTheta, radius * Math.cos(theta), radius * Math.sin(phi) * sinTheta];
}

/** Outward surface normal at the given coordinates. */
export function latLonToNormal(latitude: number, longitude: number): [number, number, number] {
  return latLonToVector(latitude, longitude, 1);
}

/** Great-circle distance between two points on a sphere, in kilometres. */
export function greatCircleKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusKm: number,
): number {
  const dLat = (lat2 - lat1) * DEG;
  const dLon = (lon2 - lon1) * DEG;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dLon / 2) ** 2;
  return 2 * radiusKm * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Format coordinates as e.g. `27.1751° N, 78.0421° E`. */
export function formatLatLon(latitude: number, longitude: number): string {
  const ns = latitude >= 0 ? 'N' : 'S';
  const ew = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(latitude).toFixed(4)}° ${ns}, ${Math.abs(longitude).toFixed(4)}° ${ew}`;
}
