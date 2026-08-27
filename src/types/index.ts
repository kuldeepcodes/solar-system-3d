/** Broad classification used for filtering, styling and label priority. */
export type BodyKind = 'star' | 'planet' | 'dwarf' | 'moon';

/** Distances are compressed differently depending on the active scale mode. */
export type ScaleMode = 'educational' | 'realistic';

export type QualityTier = 'low' | 'medium' | 'high' | 'ultra';

/**
 * Classical Keplerian orbital elements referenced to the J2000.0 epoch.
 * Angles are stored in degrees for readability and converted at solve time.
 */
export interface OrbitalElements {
  /** Semi-major axis in kilometres. */
  aKm: number;
  /** Eccentricity (0 = circular). */
  e: number;
  /** Inclination to the reference plane, degrees. */
  iDeg: number;
  /** Longitude of the ascending node (Omega), degrees. */
  nodeDeg: number;
  /** Argument of periapsis (omega), degrees. */
  periapsisDeg: number;
  /** Mean anomaly at J2000.0, degrees. */
  meanAnomalyDeg: number;
  /** Sidereal orbital period in days. */
  periodDays: number;
  /**
   * Secular drift of the ascending node, degrees/day. The Moon's node regresses
   * a full turn every 18.6 years; without this the eclipse seasons drift out of
   * step within a few years and the eclipse demos stop lining up.
   */
  nodeRateDegPerDay?: number;
  /** Secular drift of the argument of periapsis, degrees/day. */
  periapsisRateDegPerDay?: number;
  /**
   * Reference plane the inclination is measured against. Most moons orbit in
   * their parent's equatorial plane (so Saturn's moons share the ring plane),
   * whereas Earth's Moon is conventionally quoted against the ecliptic.
   * Defaults to `'ecliptic'`.
   */
  frame?: 'ecliptic' | 'equatorial';
}

export interface RingSystem {
  innerKm: number;
  outerKm: number;
  /** Base tint used when no ring texture is available. */
  color: string;
  opacity: number;
  textureKey?: string;
}

export interface AtmosphereSpec {
  /** Rim colour of the fresnel shell. */
  color: string;
  /** Overall strength multiplier, 0..2. */
  intensity: number;
  /** Shell thickness as a fraction of body radius. */
  thickness: number;
  /** Fresnel falloff exponent - higher means a tighter rim. */
  power: number;
}

export interface BodyStats {
  diameterKm: number;
  /** Mean distance from the Sun in km. `null` for the Sun itself. */
  distanceFromSunKm: number | null;
  meanTempC: number;
  minTempC?: number;
  maxTempC?: number;
  gravityMs2: number;
  /** Sidereal orbital period in days. `null` for the Sun. */
  orbitalPeriodDays: number | null;
  /** Sidereal rotation period in hours. Negative values are retrograde. */
  rotationPeriodHours: number;
  moonCount: number;
  massKg: number;
  meanDensityGcm3: number;
  escapeVelocityKms: number;
  axialTiltDeg: number;
  composition: string;
  atmosphere: string;
}

export interface GalleryImage {
  /** Remote URL; the gallery degrades to a gradient tile when unreachable. */
  url: string;
  caption: string;
  credit: string;
}

export interface CelestialBody {
  id: string;
  name: string;
  kind: BodyKind;
  /** `null` for the Sun; otherwise the id of the body this one orbits. */
  parentId: string | null;
  radiusKm: number;
  orbit: OrbitalElements | null;
  /** Base albedo colour, also used to synthesise a procedural texture. */
  color: string;
  /** Emissive colour for self-luminous bodies. */
  emissive?: string;
  /** Filename stem looked up under `public/textures/`. */
  textureKey: string;
  cloudsTextureKey?: string;
  ring?: RingSystem;
  atmosphere?: AtmosphereSpec;
  /** One-paragraph summary shown at the top of the detail panel. */
  description: string;
  /** Longer-form copy for the Learn panel. */
  learn: string[];
  facts: string[];
  stats: BodyStats;
  gallery?: GalleryImage[];
}

/** A landmark pinned to a parent body's surface (used for the 7 Wonders layer). */
export interface SurfaceSite {
  id: string;
  name: string;
  parentId: string;
  latitude: number;
  longitude: number;
  country: string;
  built: string;
  category: string;
  description: string;
  learn: string[];
  facts: string[];
  gallery?: GalleryImage[];
  /** Honorary members (e.g. Giza) are rendered with a distinct marker. */
  honorary?: boolean;
}

export interface TourStop {
  id: string;
  targetId: string;
  title: string;
  narration: string;
  /** Seconds to linger before auto-advancing. */
  dwellSeconds: number;
  /** Optional simulation date to jump to, ISO 8601. */
  jumpToDate?: string;
}

export interface EclipsePreset {
  id: string;
  name: string;
  kind: 'solar' | 'lunar';
  /** ISO 8601 instant of greatest eclipse. */
  date: string;
  description: string;
  /** Body the camera should frame. */
  vantageId: string;
}

export interface MissionRoute {
  id: string;
  name: string;
  fromId: string;
  toId: string;
  /** Real mission cruise duration in days, used for the telemetry readout. */
  realCruiseDays: number;
  spacecraft: string;
  description: string;
}

/** Cartesian position in kilometres, ecliptic frame (z = ecliptic north). */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}
