import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BODIES, getBody } from '../data/bodies';
import { labelTexture, labelAspect } from '../lib/labelTexture';
import { bodyRadii, bodyWorldPositions } from './positions';
import { useSimStore } from '../state/useSimStore';
import { useUIStore } from '../state/useUIStore';
import type { CelestialBody } from '../types';

const ACCENTS: Record<string, string> = {
  star: '#ffd98a',
  planet: '#9fd8ff',
  dwarf: '#c4b5ff',
  moon: '#cfd8e3',
};

export function Labels() {
  const showLabels = useSimStore((s) => s.showLabels);
  const showMoons = useSimStore((s) => s.showMoons);
  const showDwarfPlanets = useSimStore((s) => s.showDwarfPlanets);

  if (!showLabels) return null;

  return (
    <group>
      {BODIES.map((body) => {
        if (body.kind === 'moon' && !showMoons) return null;
        if (body.kind === 'dwarf' && !showDwarfPlanets) return null;
        return <Label key={body.id} body={body} />;
      })}
    </group>
  );
}

/**
 * Screen-space label sprite.
 *
 * `sizeAttenuation: false` keeps the label a constant pixel size no matter how
 * far away the body is, which is the behaviour you want for a map pin. Moon
 * labels are additionally gated on camera proximity to their parent, otherwise
 * the inner Solar System becomes an unreadable pile of text at system scale.
 */
function Label({ body }: { body: CelestialBody }) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const accent = ACCENTS[body.kind] ?? '#ffffff';
  const texture = useMemo(() => labelTexture(body.name, accent), [body.name, accent]);
  const aspect = useMemo(() => labelAspect(body.name), [body.name]);

  useFrame(() => {
    const group = groupRef.current;
    const sprite = spriteRef.current;
    if (!group || !sprite) return;

    const position = bodyWorldPositions.get(body.id);
    if (!position) return;

    const radius = bodyRadii.get(body.id) ?? 1;
    const distance = camera.position.distanceTo(position);

    let opacity = 1;

    if (body.kind === 'moon') {
      const parent = getBody(body.parentId);
      const parentPos = parent ? bodyWorldPositions.get(parent.id) : undefined;
      const parentRadius = parent ? (bodyRadii.get(parent.id) ?? 1) : 1;
      if (parentPos) {
        const parentDistance = camera.position.distanceTo(parentPos);
        opacity = THREE.MathUtils.clamp(1 - (parentDistance / (parentRadius * 90) - 0.5), 0, 1);
      }
    } else {
      // Fade out when the body fills the screen - the label is redundant then.
      const angular = radius / Math.max(distance, 1e-6);
      opacity = THREE.MathUtils.clamp(1 - (angular - 0.32) / 0.25, 0, 1);
    }

    const isSelected = useUIStore.getState().selectedId === body.id;
    const material = sprite.material as THREE.SpriteMaterial;
    material.opacity = isSelected ? Math.max(opacity, 0.85) : opacity * 0.82;
    group.visible = material.opacity > 0.02;
    if (!group.visible) return;

    group.position.copy(position);
    // Lift the label clear of the body's disc.
    group.position.y += radius * 1.25;

    const height = body.kind === 'moon' ? 0.026 : 0.034;
    sprite.scale.set(height * aspect, height, 1);
  });

  return (
    <group ref={groupRef}>
      <sprite ref={spriteRef} raycast={() => null}>
        <spriteMaterial
          map={texture}
          transparent
          sizeAttenuation={false}
          // Depth testing is enabled so a label belonging to a distant body is
          // correctly hidden behind a nearer planet. Without it, Neptune's
          // label bleeds straight through Earth when you are in close.
          depthTest
          depthWrite={false}
        />
      </sprite>
    </group>
  );
}
