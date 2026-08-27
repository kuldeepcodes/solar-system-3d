import { useRef, useMemo, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CelestialBody } from '../types';
import { bodyRadii, bodySpin, bodyWorldPositions } from './positions';
import { useBodyTexture, type TextureKind } from '../lib/textures';
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
  const cloudMap = useBodyTexture(
    body.cloudsTextureKey ?? `${body.id}_clouds_none`,
    '#ffffff',
    'cloud',
  );

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
              roughness={body.kind === 'star' ? 1 : 0.86}
              metalness={0.02}
              emissive={body.emissive ?? '#000000'}
              emissiveIntensity={body.emissive ? 0.6 : 0}
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
