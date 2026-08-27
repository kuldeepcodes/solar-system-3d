import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * First-person walk controls.
 *
 * Pointer-lock mouse look plus WASD movement, with the camera held at a fixed
 * eye height and gently constrained to a roaming radius. Deliberately hand
 * written rather than using drei's `PointerLockControls` so that:
 *
 *  - movement stays on the horizontal plane (looking up must not fly you up),
 *  - the roam boundary can push back smoothly instead of hard-clamping,
 *  - touch devices get a virtual joystick fallback, which pointer lock cannot
 *    provide at all.
 */

export interface WalkControlsHandle {
  reset: () => void;
}

interface Options {
  enabled: boolean;
  eyeHeight: number;
  roamRadius: number;
  spawn: [number, number, number];
  speed?: number;
  /** Called when pointer-lock state changes, so the UI can show a prompt. */
  onLockChange?: (locked: boolean) => void;
}

const PI_2 = Math.PI / 2;

export function useWalkControls({
  enabled,
  eyeHeight,
  roamRadius,
  spawn,
  speed = 9,
  onLockChange,
}: Options): { locked: React.RefObject<boolean>; requestLock: () => void; reset: () => void } {
  const { camera, gl } = useThree();

  const keys = useRef<Record<string, boolean>>({});
  const locked = useRef(false);
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const velocity = useRef(new THREE.Vector3());
  const touch = useRef({ active: false, dx: 0, dy: 0 });

  const reset = useMemo(
    () => () => {
      camera.position.set(spawn[0], spawn[1], spawn[2]);
      // Face the origin, where the monument sits.
      const dir = new THREE.Vector3(-spawn[0], 0, -spawn[2]);
      if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);
      dir.normalize();
      euler.current.set(0, Math.atan2(-dir.x, -dir.z), 0, 'YXZ');
      camera.quaternion.setFromEuler(euler.current);
      velocity.current.set(0, 0, 0);
    },
    [camera, spawn],
  );

  useEffect(() => {
    if (enabled) reset();
  }, [enabled, reset]);

  const requestLock = useMemo(
    () => () => {
      if (!enabled) return;
      const el = gl.domElement;
      if (el.requestPointerLock) el.requestPointerLock();
    },
    [enabled, gl],
  );

  useEffect(() => {
    if (!enabled) return;
    const el = gl.domElement;

    const onKeyDown = (e: KeyboardEvent) => {
      // Never swallow keys while the user is typing in a panel.
      const t = e.target as HTMLElement | null;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t?.isContentEditable) return;
      keys.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!locked.current) return;
      euler.current.setFromQuaternion(camera.quaternion);
      euler.current.y -= e.movementX * 0.0022;
      euler.current.x -= e.movementY * 0.0022;
      // Stop just short of straight up/down to avoid gimbal flip.
      euler.current.x = Math.max(-PI_2 + 0.02, Math.min(PI_2 - 0.02, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };

    const onLockChangeEvent = () => {
      locked.current = document.pointerLockElement === el;
      onLockChange?.(locked.current);
    };

    // Touch: one finger drags to look around.
    let lastTouch: { x: number; y: number } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || !lastTouch) return;
      const t0 = e.touches[0];
      const dx = t0.clientX - lastTouch.x;
      const dy = t0.clientY - lastTouch.y;
      lastTouch = { x: t0.clientX, y: t0.clientY };
      euler.current.setFromQuaternion(camera.quaternion);
      euler.current.y -= dx * 0.005;
      euler.current.x -= dy * 0.005;
      euler.current.x = Math.max(-PI_2 + 0.02, Math.min(PI_2 - 0.02, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };
    const onTouchEnd = () => {
      lastTouch = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onLockChangeEvent);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onLockChangeEvent);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      keys.current = {};
      if (document.pointerLockElement === el) document.exitPointerLock();
    };
  }, [enabled, camera, gl, onLockChange]);

  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (!enabled) return;
    const dt = Math.min(delta, 0.05);
    const k = keys.current;

    const wish = new THREE.Vector3();
    if (k.KeyW || k.ArrowUp) wish.z -= 1;
    if (k.KeyS || k.ArrowDown) wish.z += 1;
    if (k.KeyA || k.ArrowLeft) wish.x -= 1;
    if (k.KeyD || k.ArrowRight) wish.x += 1;

    if (touch.current.active) {
      wish.x += touch.current.dx;
      wish.z += touch.current.dy;
    }

    const sprint = k.ShiftLeft || k.ShiftRight ? 2.6 : 1;

    if (wish.lengthSq() > 0) {
      wish.normalize();
      // Movement is projected onto the ground plane so looking up or down
      // never lifts the walker off the surface.
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.crossVectors(forward, THREE.Object3D.DEFAULT_UP).normalize();

      const target = new THREE.Vector3()
        .addScaledVector(forward, -wish.z)
        .addScaledVector(right, wish.x)
        .normalize()
        .multiplyScalar(speed * sprint);

      velocity.current.lerp(target, 1 - Math.pow(0.0008, dt));
    } else {
      velocity.current.lerp(ZERO, 1 - Math.pow(0.0001, dt));
    }

    camera.position.addScaledVector(velocity.current, dt);
    camera.position.y = eyeHeight;

    // Soft boundary: ease back rather than snapping, which feels less abrupt.
    const distance = Math.hypot(camera.position.x, camera.position.z);
    if (distance > roamRadius) {
      const pull = 1 - Math.min(1, (distance - roamRadius) / 12);
      const scale = (roamRadius + (distance - roamRadius) * pull * 0.35) / distance;
      camera.position.x *= scale;
      camera.position.z *= scale;
    }
  });

  return { locked, requestLock, reset };
}

const ZERO = new THREE.Vector3();
