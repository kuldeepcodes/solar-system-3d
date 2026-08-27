import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BODIES, getBody } from '../data/bodies';
import { orbitPathPoints } from '../lib/orbital';
import { blendedOrbitFactor } from '../lib/scale';
import { daysSinceJ2000 } from '../lib/time';
import { bodyWorldPositions, eclipticToScene } from './positions';
import { simClock, useSimStore, QUALITY_SETTINGS } from '../state/useSimStore';
import { useUIStore } from '../state/useUIStore';
import type { CelestialBody } from '../types';

const DEG = Math.PI / 180;

/**
 * Orbit trails.
 *
 * The path is built once in kilometre space and then simply *scaled* each frame
 * by the current blend factor. Because the whole ellipse is scaled uniformly,
 * its shape, eccentricity and inclination are preserved - so one static
 * geometry serves both scale modes and every point in between, with no
 * per-frame geometry rebuild.
 *
 * The exception is bodies with secular node/periapsis drift (the Moon), whose
 * orbital plane genuinely rotates over time. Those are refreshed periodically.
 */
export function OrbitPaths() {
  const showOrbits = useSimStore((s) => s.showOrbits);
  const showMoons = useSimStore((s) => s.showMoons);
  const showDwarfPlanets = useSimStore((s) => s.showDwarfPlanets);

  if (!showOrbits) return null;

  return (
    <group>
      {BODIES.filter((b) => b.orbit).map((body) => {
        if (body.kind === 'moon' && !showMoons) return null;
        if (body.kind === 'dwarf' && !showDwarfPlanets) return null;
        return <OrbitPath key={body.id} body={body} />;
      })}
    </group>
  );
}

function OrbitPath({ body }: { body: CelestialBody }) {
  const groupRef = useRef<THREE.Group>(null);
  const quality = useSimStore((s) => s.quality);
  const segments = QUALITY_SETTINGS[quality].orbitSegments;

  const parent = getBody(body.parentId);
  const drifts = Boolean(body.orbit?.nodeRateDegPerDay || body.orbit?.periapsisRateDegPerDay);

  const { line, positions } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const array = new Float32Array((segments + 1) * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(array, 3));

    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(body.color),
      transparent: true,
      opacity: body.kind === 'moon' ? 0.24 : 0.38,
      depthWrite: false,
    });

    const obj = new THREE.LineLoop(geometry, material);
    obj.frustumCulled = false;
    obj.renderOrder = -5;
    return { line: obj, positions: array };
  }, [segments, body.color, body.kind]);

  const builtAt = useRef(Number.NaN);
  const frame = useRef(0);

  useFrame(() => {
    const group = groupRef.current;
    if (!group || !body.orbit) return;

    const days = daysSinceJ2000(simClock.julianDate);
    frame.current += 1;

    // Rebuild only when the plane actually moves, and then only every 20 frames.
    const needsRebuild =
      Number.isNaN(builtAt.current) || (drifts && frame.current % 20 === 0 && Math.abs(days - builtAt.current) > 20);

    if (needsRebuild) {
      const pts = orbitPathPoints(body.orbit, segments, drifts ? days : 0);
      const v = new THREE.Vector3();
      for (let i = 0; i <= segments; i += 1) {
        eclipticToScene(pts[i], v);
        positions[i * 3] = v.x;
        positions[i * 3 + 1] = v.y;
        positions[i * 3 + 2] = v.z;
      }
      line.geometry.attributes.position.needsUpdate = true;
      builtAt.current = days;
    }

    const factor = blendedOrbitFactor(body, parent, simClock.scaleBlend);
    group.scale.setScalar(factor);

    const parentPos = parent ? bodyWorldPositions.get(parent.id) : undefined;
    if (parentPos) group.position.copy(parentPos);

    if (body.orbit.frame === 'equatorial' && parent) {
      group.rotation.set(parent.stats.axialTiltDeg * DEG, 0, 0);
    }

    const highlighted = useUIStore.getState().focusId === body.id;
    const material = line.material as THREE.LineBasicMaterial;
    material.opacity = highlighted ? 0.85 : body.kind === 'moon' ? 0.24 : 0.38;
  });

  return (
    <group ref={groupRef}>
      <primitive object={line} />
    </group>
  );
}
