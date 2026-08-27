import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useUIStore } from '../state/useUIStore';
import { positionOf, radiusOf } from './positions';
import { cameraLimits, framingDistance } from '../lib/scale';
import { consumeCameraHint } from './cameraHints';

const TRANSITION_SECONDS = 1.35;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Camera rig.
 *
 * Two behaviours are layered:
 *
 * 1. **Rigid follow.** Once settled on a body, the controls target is snapped to
 *    that body's live position each frame and the camera is translated by the
 *    same delta. Moving the target alone would make the view appear to swing
 *    around as the planet travels along its orbit.
 *
 * 2. **Eased fly-to.** On a focus change the target is interpolated from where
 *    it was towards the new body's *live* position (which keeps moving), while
 *    the orbital distance eases to a comfortable framing distance.
 */
export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const focusId = useUIStore((s) => s.focusId);
  const focusNonce = useUIStore((s) => s.focusNonce);
  const mode = useUIStore((s) => s.mode);

  const transition = useRef({
    t: 1,
    startTarget: new THREE.Vector3(),
    startDistance: 1,
    endDistance: 1,
    startDir: new THREE.Vector3(0, 0.35, 1).normalize(),
  });

  const scratch = new THREE.Vector3();

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const tr = transition.current;
    tr.startTarget.copy(controls.target);
    tr.startDistance = camera.position.distanceTo(controls.target);

    const radius = radiusOf(focusId);
    const hint = consumeCameraHint();

    tr.endDistance =
      mode === 'surface'
        ? radius * 1.035
        : framingDistance(radius) * (hint.distanceScale ?? 1);

    if (hint.direction) {
      // A specific approach vector was requested (e.g. framing a landmark).
      tr.startDir.copy(hint.direction);
    } else {
      scratch.copy(camera.position).sub(controls.target);
      if (scratch.lengthSq() > 1e-12) tr.startDir.copy(scratch).normalize();
    }

    tr.t = 0;
    // `scratch` is intentionally excluded: it is a reusable scratch vector.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, focusNonce, mode, camera]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const desired = positionOf(focusId);
    const radius = radiusOf(focusId);
    const limits = cameraLimits(radius);

    controls.minDistance = mode === 'surface' ? radius * 1.004 : limits.min;
    controls.maxDistance = limits.max;

    const tr = transition.current;

    if (tr.t < 1) {
      tr.t = Math.min(1, tr.t + delta / TRANSITION_SECONDS);
      const k = easeInOutCubic(tr.t);

      controls.target.lerpVectors(tr.startTarget, desired, k);

      const distance = THREE.MathUtils.lerp(tr.startDistance, tr.endDistance, k);
      camera.position.copy(controls.target).addScaledVector(tr.startDir, distance);
    } else {
      // Rigid follow: translate the camera by the same amount the body moved.
      scratch.copy(desired).sub(controls.target);
      controls.target.add(scratch);
      camera.position.add(scratch);
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.55}
      zoomSpeed={0.9}
      panSpeed={0.7}
      zoomToCursor
      enablePan
      screenSpacePanning
      minPolarAngle={0.0001}
      maxPolarAngle={Math.PI - 0.0001}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
    />
  );
}
