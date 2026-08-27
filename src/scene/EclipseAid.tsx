import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ECLIPSE_PRESETS } from '../data/eclipses';
import { useUIStore } from '../state/useUIStore';
import { bodyRadii, bodyWorldPositions } from './positions';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Umbra and penumbra visualisation for the eclipse demonstrations.
 *
 * Shadow *mapping* cannot carry this on its own: in educational scale mode the
 * Sun-Earth-Moon geometry is deliberately compressed, so a real shadow volume
 * would not converge where it does in reality. Drawing the cones explicitly is
 * both more legible and pedagogically clearer - you can see the umbra taper to
 * a point and where it lands.
 */
export function EclipseAid() {
  const activeEclipseId = useUIStore((s) => s.activeEclipseId);
  const preset = useMemo(
    () => ECLIPSE_PRESETS.find((e) => e.id === activeEclipseId) ?? null,
    [activeEclipseId],
  );

  const umbraRef = useRef<THREE.Mesh>(null);
  const penumbraRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group || !preset) return;

    // In a solar eclipse the Moon shadows Earth; in a lunar eclipse, Earth
    // shadows the Moon.
    const occluderId = preset.kind === 'solar' ? 'moon' : 'earth';
    const receiverId = preset.kind === 'solar' ? 'earth' : 'moon';

    const occluder = bodyWorldPositions.get(occluderId);
    const receiver = bodyWorldPositions.get(receiverId);
    const occluderRadius = bodyRadii.get(occluderId);
    if (!occluder || !receiver || occluderRadius === undefined) return;

    // The shadow points directly away from the Sun, which sits at the origin.
    const direction = occluder.clone().normalize();
    const span = occluder.distanceTo(receiver) * 1.6 + occluderRadius * 6;

    group.position.copy(occluder);
    group.quaternion.setFromUnitVectors(UP, direction);

    for (const [ref, widthScale] of [
      [umbraRef, 1] as const,
      [penumbraRef, 2.6] as const,
    ]) {
      const mesh = ref.current;
      if (!mesh) continue;
      mesh.scale.set(occluderRadius * widthScale, span, occluderRadius * widthScale);
      // Cylinder geometry is centred on its origin; push it so the wide end
      // sits on the occluding body.
      mesh.position.set(0, span / 2, 0);
    }
  });

  if (!preset) return null;

  return (
    <group ref={groupRef}>
      <mesh ref={umbraRef} raycast={() => null}>
        <cylinderGeometry args={[0, 1, 1, 48, 1, true]} />
        <meshBasicMaterial
          color="#05070f"
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={penumbraRef} raycast={() => null}>
        <cylinderGeometry args={[0, 1, 1, 48, 1, true]} />
        <meshBasicMaterial
          color="#1b2440"
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
