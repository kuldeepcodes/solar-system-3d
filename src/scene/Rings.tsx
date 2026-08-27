import { useMemo } from 'react';
import * as THREE from 'three';
import type { CelestialBody } from '../types';
import { useRingTexture } from '../lib/textures';
import { useSimStore, QUALITY_SETTINGS } from '../state/useSimStore';

/**
 * Planetary ring system, rendered in the body's equatorial plane.
 *
 * `THREE.RingGeometry` maps UVs across a bounding square, which smears a radial
 * ring texture into a mess. The UVs are therefore rewritten so that `u` tracks
 * radial position between the inner and outer edge - that is the axis a ring
 * texture actually varies along.
 */
export function Rings({ body }: { body: CelestialBody }) {
  const ring = body.ring!;
  const quality = useSimStore((s) => s.quality);
  const settings = QUALITY_SETTINGS[quality];

  const inner = ring.innerKm / body.radiusKm;
  const outer = ring.outerKm / body.radiusKm;

  const map = useRingTexture(ring.textureKey, ring.color, inner, outer);

  const geometry = useMemo(() => {
    const segments = Math.max(96, settings.sphereSegments * 2);
    const geo = new THREE.RingGeometry(inner, outer, segments, 4);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i += 1) {
      v.fromBufferAttribute(pos, i);
      const radial = (v.length() - inner) / (outer - inner);
      uv.setXY(i, radial, 0.5);
    }
    uv.needsUpdate = true;
    return geo;
  }, [inner, outer, settings.sphereSegments]);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow={settings.shadows}
      castShadow={settings.shadows}
      raycast={() => null}
    >
      <meshStandardMaterial
        map={map}
        color={ring.color}
        side={THREE.DoubleSide}
        transparent
        opacity={ring.opacity}
        alphaTest={0.02}
        roughness={0.95}
        metalness={0}
        depthWrite={false}
      />
    </mesh>
  );
}
