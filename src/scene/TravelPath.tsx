import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUIStore } from '../state/useUIStore';
import { bodyRadii, bodyWorldPositions } from './positions';

const SEGMENTS = 128;

/**
 * Spacecraft travel arc.
 *
 * A real transfer orbit would be a Hohmann ellipse around the Sun, but the two
 * endpoints move while the animation plays, which makes a precomputed ellipse
 * drift away from its own targets. A quadratic Bezier re-evaluated each frame
 * stays anchored to both bodies and still reads as a curved interplanetary
 * trajectory rather than a straight line.
 */
export function TravelPath() {
  const mode = useUIStore((s) => s.mode);
  const from = useUIStore((s) => s.travelFrom);
  const to = useUIStore((s) => s.travelTo);
  const progress = useUIStore((s) => s.travelProgress);

  const lineRef = useRef<THREE.Line>(null);
  const craftRef = useRef<THREE.Group>(null);

  const { line, positions } = useMemo(() => {
    const array = new Float32Array((SEGMENTS + 1) * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(array, 3));
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color('#66e0ff'),
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const obj = new THREE.Line(geometry, material);
    obj.frustumCulled = false;
    return { line: obj, positions: array };
  }, []);

  const control = useMemo(() => new THREE.Vector3(), []);
  const point = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (mode !== 'spacecraft') return;

    const a = bodyWorldPositions.get(from);
    const b = bodyWorldPositions.get(to);
    if (!a || !b) return;

    // Bulge the control point away from the Sun so the arc curves outward
    // rather than cutting straight through the inner system.
    control.copy(a).add(b).multiplyScalar(0.5);
    const outward = control.clone().normalize();
    const chord = a.distanceTo(b);
    control.addScaledVector(outward, chord * 0.22);

    for (let i = 0; i <= SEGMENTS; i += 1) {
      const t = i / SEGMENTS;
      quadraticBezier(a, control, b, t, point);
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }
    line.geometry.attributes.position.needsUpdate = true;

    if (craftRef.current) {
      quadraticBezier(a, control, b, THREE.MathUtils.clamp(progress, 0, 1), point);
      craftRef.current.position.copy(point);
      const scale = Math.max((bodyRadii.get(from) ?? 1) * 0.22, 0.05);
      craftRef.current.scale.setScalar(scale);
      craftRef.current.rotation.y += 0.02;
    }
  });

  if (mode !== 'spacecraft') return null;

  return (
    <group>
      <primitive object={line} ref={lineRef} />
      <group ref={craftRef}>
        <mesh raycast={() => null}>
          <coneGeometry args={[0.5, 1.6, 12]} />
          <meshStandardMaterial
            color="#dbeeff"
            emissive="#4fc3ff"
            emissiveIntensity={1.4}
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
        <pointLight intensity={0.6} distance={6} color="#7fd4ff" />
      </group>
    </group>
  );
}

function quadraticBezier(
  a: THREE.Vector3,
  c: THREE.Vector3,
  b: THREE.Vector3,
  t: number,
  out: THREE.Vector3,
): THREE.Vector3 {
  const inv = 1 - t;
  out.set(
    inv * inv * a.x + 2 * inv * t * c.x + t * t * b.x,
    inv * inv * a.y + 2 * inv * t * c.y + t * t * b.y,
    inv * inv * a.z + 2 * inv * t * c.z + t * t * b.z,
  );
  return out;
}
