import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUIStore } from '../state/useUIStore';
import { bodyWorldPositions } from './positions';

/**
 * Straight-line connector for the distance measurement tool.
 *
 * The line is purely a visual aid - the numeric readout in the HUD is computed
 * from the *unscaled* Kepler solution, so it reports true kilometres rather than
 * the compressed scene distance drawn here.
 */
export function MeasureLine() {
  const from = useUIStore((s) => s.measureFrom);
  const to = useUIStore((s) => s.measureTo);

  const { line, positions } = useMemo(() => {
    const array = new Float32Array(6);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(array, 3));
    const material = new THREE.LineDashedMaterial({
      color: new THREE.Color('#ffd166'),
      transparent: true,
      opacity: 0.9,
      dashSize: 0.6,
      gapSize: 0.35,
      depthWrite: false,
    });
    const obj = new THREE.Line(geometry, material);
    obj.frustumCulled = false;
    return { line: obj, positions: array };
  }, []);

  const endpointsRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!from || !to) return;
    const a = bodyWorldPositions.get(from);
    const b = bodyWorldPositions.get(to);
    if (!a || !b) return;

    positions[0] = a.x;
    positions[1] = a.y;
    positions[2] = a.z;
    positions[3] = b.x;
    positions[4] = b.y;
    positions[5] = b.z;
    line.geometry.attributes.position.needsUpdate = true;
    // Dashes need explicit line distances recomputed whenever the ends move.
    line.computeLineDistances();

    const group = endpointsRef.current;
    if (group) {
      group.children[0]?.position.copy(a);
      group.children[1]?.position.copy(b);
    }
  });

  if (!from || !to) return null;

  return (
    <group>
      <primitive object={line} />
      <group ref={endpointsRef}>
        <mesh raycast={() => null}>
          <sphereGeometry args={[0.06, 12, 8]} />
          <meshBasicMaterial color="#ffd166" />
        </mesh>
        <mesh raycast={() => null}>
          <sphereGeometry args={[0.06, 12, 8]} />
          <meshBasicMaterial color="#ffd166" />
        </mesh>
      </group>
    </group>
  );
}
