import { useRef, useMemo, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CelestialBody } from '../types';
import { bodyRadii, bodySpin, bodyWorldPositions } from './positions';
import { useBodyTexture, useOptionalTexture, useDerivedNormal, type TextureKind } from '../lib/textures';
import { useSimStore, QUALITY_SETTINGS } from '../state/useSimStore';
import { useUIStore } from '../state/useUIStore';
import { Rings } from './Rings';
import { Atmosphere } from './Atmosphere';

const GAS_GIANTS = new Set(['jupiter', 'saturn', 'uranus', 'neptune']);
const ICY = new Set([
  'europa',
  'ganymede',
  'callisto',
  'enceladus',
  'triton',
  'pluto',
  'eris',
  'haumea',
  'makemake',
  'ceres',
]);

// Bodies where night-lights (emissive) map may exist.
const HAS_NIGHT_MAP = new Set(['earth']);

// Bodies where specular/roughness map may exist.
const HAS_SPECULAR_MAP = new Set<string>([
  // earth_specular not yet available (no verified free grayscale mask found).
]);

// Bodies for which we synthesise a normal map via Sobel.
// Gas giants are EXCLUDED: their albedo variation is cloud banding, not
// topography — Sobel-ing it produces bogus ridged normals that look wrong.
// Stars are also excluded. Venus's radar-derived surface map IS valid.
const DERIVES_NORMAL = new Set([
  'moon', 'mercury', 'mars', 'venus',
  'earth',
  'europa', 'ganymede', 'callisto', 'enceladus',
  'triton', 'pluto', 'ceres',
  'phobos', 'deimos',
  'io', 'titan',
  'eris', 'haumea', 'makemake',
]);

// Sobel strength per body.  Airless, heavily cratered bodies benefit from
// stronger gradients; bodies with atmosphere or smooth relief need gentler.
const NORMAL_STRENGTH: Record<string, number> = {
  moon:     2.5,  mercury: 2.5,
  mars:     2.0,  io:      2.0,
  europa:   2.0,  ganymede:2.0,  callisto: 2.0,
  enceladus:2.0,  triton:  2.0,  pluto:    2.0,
  ceres:    2.0,  phobos:  2.5,  deimos:   2.5,
  titan:    1.5,  eris:    2.0,  haumea:   2.0,  makemake: 2.0,
  // Earth and Venus: albedo ≠ topography so keep subtle
  earth:    1.0,  venus:   1.5,
};

// Memoised normalScale vectors — one per body category, never reallocated.
// Stronger values for airless/cratered bodies (Moon, Mercury); gentler for
// bodies with atmosphere or smooth surfaces.
const NORMAL_SCALE_CRATERED = new THREE.Vector2(1.4, 1.4); // Moon, Mercury, Phobos, Deimos
const NORMAL_SCALE_DEFAULT  = new THREE.Vector2(0.8, 0.8); // Earth, Mars, Venus, icy moons

export function textureKindFor(body: CelestialBody): TextureKind {
  if (body.kind === 'star') return 'star';
  if (GAS_GIANTS.has(body.id)) return 'gas';
  if (ICY.has(body.id)) return 'icy';
  return 'rocky';
}

interface BodyProps {
  body: CelestialBody;
  children?: ReactNode;
}

/**
 * Renders one planet, moon or dwarf planet.
 *
 * The outer group is scaled to the body's display radius, so every child works
 * in units of "body radii". That keeps rings, atmosphere shells and surface
 * markers correct without any of them needing to know the active scale mode.
 */
export function Body({ body, children }: BodyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  const quality = useSimStore((s) => s.quality);
  const settings = QUALITY_SETTINGS[quality];

  const focus = useUIStore((s) => s.focus);
  const select = useUIStore((s) => s.select);
  const setHovered = useUIStore((s) => s.setHovered);

  const kind = useMemo(() => textureKindFor(body), [body]);
  const map = useBodyTexture(body.textureKey, body.color, kind);
  // Passing an empty key means "no cloud layer" and skips the network request
  // entirely. A sentinel like `<id>_clouds_none` would be fetched and 404 for
  // every cloudless body, which is 20-odd pointless requests per page load.
  const cloudMap = useBodyTexture(body.cloudsTextureKey ?? '', '#ffffff', 'cloud');

  // Secondary maps — only attempted for bodies where they plausibly exist.
  // Normal maps: prefer a real downloaded file; synthesise from colour map if absent.
  // Gas giants and stars are excluded — see DERIVES_NORMAL note above.
  // useOptionalTexture / useDerivedNormal never fall back to procedural; return null if absent.
  // Normal / specular maps MUST use NoColorSpace (linear) — colour-managing
  // a normal map corrupts the XYZ vectors and produces visibly wrong lighting.
  const derivesNormal = DERIVES_NORMAL.has(body.textureKey);
  const normalStrength = NORMAL_STRENGTH[body.textureKey] ?? 2.0;

  const specularKey = HAS_SPECULAR_MAP.has(body.textureKey)
    ? `${body.textureKey}_specular` : undefined;
  // Night map is an emissive colour map — use sRGB colour space.
  const nightKey = HAS_NIGHT_MAP.has(body.textureKey)
    ? `${body.textureKey}_night`    : undefined;

  // useDerivedNormal must always be called (Rules of Hooks).
  // It returns null quickly when derivesNormal is false.
  const derivedNormal = useDerivedNormal(
    derivesNormal ? body.textureKey : '',
    map,
    normalStrength,
  );
  const normalMap   = derivesNormal ? derivedNormal : null;
  const specularMap = useOptionalTexture(specularKey,  'linear');
  const nightMap    = useOptionalTexture(nightKey,     'srgb');

  // Pick normalScale based on body surface type.
  const normalScale = useMemo(() => {
    if (body.textureKey === 'moon' || body.textureKey === 'mercury' ||
        body.textureKey === 'phobos' || body.textureKey === 'deimos') {
      return NORMAL_SCALE_CRATERED;
    }
    return NORMAL_SCALE_DEFAULT;
  }, [body.textureKey]);

  // roughnessMap: when earth_specular is present, the Solar System Scope
  // specular map encodes specularity as brightness (bright = glossy ocean).
  // THREE.js roughnessMap samples the G channel: bright G → high roughness,
  // so feeding the specular map directly would be inverted (oceans look rough).
  // We therefore feed it to metalnessMap instead, keeping metalness very low
  // (0.06 cap) so oceans pick up specular highlights while land stays matte.
  // This is a practical approximation: true PBR would need a dedicated roughness
  // map, but the visual result — oceans catching light, land staying dull —
  // matches reality closely enough without an onBeforeCompile shader injection.
  const roughness = body.kind === 'star' ? 1 : body.textureKey === 'earth' ? 0.52 : 0.86;
  const metalness = body.kind === 'star' ? 0 : 0.02;

  // Earth night lights (emissive map).
  // Trade-off: meshStandardMaterial emissive is NOT automatically masked by
  // whether a pixel is in shadow — city lights would glow on the day side too.
  // Mitigation: keep emissiveIntensity very low (0.35) so the effect is barely
  // visible in full sunlight but clearly visible on the night side. A proper
  // solution would inject a dot(normal, lightDir) mask via onBeforeCompile, but
  // that ties us to Three.js internals and breaks with renderer updates.
  const emissiveColor  = body.emissive ?? (nightMap ? '#ffffff' : '#000000');
  const emissiveIntensity = body.emissive ? 0.6 : nightMap ? 0.35 : 0;

  const tilt = (body.stats.axialTiltDeg * Math.PI) / 180;

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const pos = bodyWorldPositions.get(body.id);
    if (pos) group.position.copy(pos);

    const radius = bodyRadii.get(body.id) ?? 1;
    group.scale.setScalar(radius);

    if (spinRef.current) spinRef.current.rotation.y = bodySpin.get(body.id) ?? 0;
    // Clouds drift slowly relative to the surface beneath them.
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.006;
  });

  const segments = body.kind === 'moon' ? Math.max(24, settings.sphereSegments / 2) : settings.sphereSegments;

  return (
    <group ref={groupRef}>
      <group rotation={[tilt, 0, 0]}>
        <group ref={spinRef}>
          <mesh
            castShadow={settings.shadows}
            receiveShadow={settings.shadows}
            onDoubleClick={(e) => {
              e.stopPropagation();
              focus(body.id);
            }}
            onClick={(e) => {
              e.stopPropagation();
              select(body.id);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(body.id);
            }}
            onPointerOut={() => setHovered(null)}
          >
            <sphereGeometry args={[1, segments, segments / 2]} />
            <meshStandardMaterial
              map={map}
              color="#ffffff"
              roughness={roughness}
              metalness={metalness}
              metalnessMap={specularMap ?? undefined}
              normalMap={normalMap ?? undefined}
              normalScale={normalMap ? normalScale : undefined}
              emissiveMap={nightMap ?? undefined}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>

          {body.cloudsTextureKey && (
            <mesh ref={cloudRef} scale={1.012} raycast={() => null}>
              <sphereGeometry args={[1, segments, segments / 2]} />
              <meshStandardMaterial
                map={cloudMap}
                transparent
                opacity={0.62}
                depthWrite={false}
                roughness={1}
              />
            </mesh>
          )}

          {children}
        </group>

        {body.ring && <Rings body={body} />}
      </group>

      {body.atmosphere && <Atmosphere body={body} />}
    </group>
  );
}
