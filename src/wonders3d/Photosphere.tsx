import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Equirectangular 360 photosphere.
 *
 * The panorama is mapped to the inside of a sphere with the geometry scaled by
 * -1 on X. Rendering `BackSide` would also show the interior, but it mirrors
 * the image; negative scaling flips the winding instead, which keeps text and
 * geography the right way round.
 *
 * The camera sits at the centre and only ever rotates, so the viewer is
 * genuinely standing in the location rather than looking at a picture.
 */
export function Photosphere({
  url,
  onLoaded,
  onError,
}: {
  url: string;
  onLoaded?: () => void;
  onError?: () => void;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    let cancelled = false;
    setTexture(null);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.anisotropy = 8;
        setTexture(tex);
        onLoaded?.();
      },
      undefined,
      () => {
        if (!cancelled) onError?.();
      },
    );

    return () => {
      cancelled = true;
    };
  }, [url, onLoaded, onError]);

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(500, 64, 40);
    geo.scale(-1, 1, 1);
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  if (!texture) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} raycast={() => null}>
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

/**
 * Look-around controls for a photosphere.
 *
 * Drag to pan, wheel or pinch to change the field of view (which is what
 * "zoom" means when the camera cannot translate). Deliberately not
 * OrbitControls: orbiting moves the camera off centre, which distorts the
 * projection and breaks the illusion of standing in one spot.
 */
export function PanoramaControls({
  autoRotate = true,
  onInteract,
}: {
  autoRotate?: boolean;
  onInteract?: () => void;
}) {
  const { camera, gl } = useThree();
  const state = useRef({
    lon: 0,
    lat: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
    fov: 72,
    idle: 0,
    pinchDistance: 0,
  });

  useEffect(() => {
    const el = gl.domElement;
    const s = state.current;

    const down = (x: number, y: number) => {
      s.dragging = true;
      s.lastX = x;
      s.lastY = y;
      s.idle = 0;
      onInteract?.();
    };
    const move = (x: number, y: number) => {
      if (!s.dragging) return;
      s.lon -= (x - s.lastX) * 0.12;
      s.lat += (y - s.lastY) * 0.12;
      s.lat = Math.max(-85, Math.min(85, s.lat));
      s.lastX = x;
      s.lastY = y;
      s.idle = 0;
    };
    const up = () => {
      s.dragging = false;
    };

    const onPointerDown = (e: PointerEvent) => down(e.clientX, e.clientY);
    const onPointerMove = (e: PointerEvent) => move(e.clientX, e.clientY);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      s.fov = Math.max(28, Math.min(95, s.fov + e.deltaY * 0.04));
      s.idle = 0;
      onInteract?.();
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) down(e.touches[0].clientX, e.touches[0].clientY);
      else if (e.touches.length === 2) {
        s.pinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        move(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        if (s.pinchDistance) {
          s.fov = Math.max(28, Math.min(95, s.fov - (d - s.pinchDistance) * 0.12));
        }
        s.pinchDistance = d;
        s.idle = 0;
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', up);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', up);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', up);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', up);
    };
  }, [gl, onInteract]);

  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const s = state.current;

    if (!s.dragging) {
      s.idle += delta;
      // Resume a slow drift once the user has been still for a moment, which
      // signals that the view is draggable without fighting their input.
      if (autoRotate && s.idle > 3) s.lon += delta * 1.6;
    }

    const phi = THREE.MathUtils.degToRad(90 - s.lat);
    const theta = THREE.MathUtils.degToRad(s.lon);

    target.setFromSphericalCoords(1, phi, theta);
    camera.position.set(0, 0, 0);
    camera.lookAt(target);

    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - s.fov) > 0.01) {
      cam.fov += (s.fov - cam.fov) * Math.min(1, delta * 8);
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
