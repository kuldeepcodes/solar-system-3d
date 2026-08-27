import * as THREE from 'three';

/**
 * One-shot hints handed from UI interactions to the camera rig.
 *
 * A wonder click needs to say "frame Earth, but approach from *this* direction".
 * Routing a Vector3 through the store would churn React state for something the
 * rig consumes exactly once, so it is passed through this tiny mailbox instead.
 */
export const cameraHints: {
  direction: THREE.Vector3 | null;
  distanceScale: number | null;
} = {
  direction: null,
  distanceScale: null,
};

export function requestCameraApproach(direction: THREE.Vector3, distanceScale?: number): void {
  cameraHints.direction = direction.clone().normalize();
  cameraHints.distanceScale = distanceScale ?? null;
}

export function consumeCameraHint(): { direction: THREE.Vector3 | null; distanceScale: number | null } {
  const hint = { direction: cameraHints.direction, distanceScale: cameraHints.distanceScale };
  cameraHints.direction = null;
  cameraHints.distanceScale = null;
  return hint;
}
