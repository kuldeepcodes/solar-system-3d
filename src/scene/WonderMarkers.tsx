import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { WONDERS } from '../data/wonders';
import { labelTexture, labelAspect } from '../lib/labelTexture';
import { bodyRadii } from './positions';
import { useUIStore } from '../state/useUIStore';
import { siteWorldTransform, focusOnSite } from './siteFocus';
import type { SurfaceSite } from '../types';

/**
 * 7 Wonders markers pinned to Earth's surface.
 *
 * Markers are computed in world space rather than parented to Earth's mesh. The
 * planet group is scaled by its display radius, and sprites with
 * `sizeAttenuation: false` are sized in screen space - nesting the two produces
 * markers whose size depends on the active scale mode. Computing the world
 * transform here keeps the pins a constant on-screen size in both modes.
 */
export function WonderMarkers() {
  const visible = useUIStore((s) => s.wondersVisible);
  if (!visible) return null;
  return (
    <group>
      {WONDERS.map((site) => (
        <WonderMarker key={site.id} site={site} />
      ))}
    </group>
  );
}

/** World position and outward normal of a surface site at the current instant. */

function WonderMarker({ site }: { site: SurfaceSite }) {
  const groupRef = useRef<THREE.Group>(null);
  const pinRef = useRef<THREE.Sprite>(null);
  const labelRef = useRef<THREE.Sprite>(null);

  const { camera } = useThree();
  const activeWonderId = useUIStore((s) => s.activeWonderId);
  const isActive = activeWonderId === site.id;

  const accent = site.honorary ? '#ffd27a' : '#7fe3ff';
  const pinTexture = useMemo(() => createPinTexture(accent), [accent]);
  const label = useMemo(() => labelTexture(site.name, accent), [site.name, accent]);
  const aspect = useMemo(() => labelAspect(site.name), [site.name]);

  const position = useMemo(() => new THREE.Vector3(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    if (!siteWorldTransform(site, position, normal)) return;
    group.position.copy(position);

    // Hide markers on the far side of the globe.
    const toCamera = camera.position.clone().sub(position).normalize();
    const facing = toCamera.dot(normal);
    const visible = facing > -0.05;
    group.visible = visible;
    if (!visible) return;

    const fade = THREE.MathUtils.clamp((facing + 0.05) / 0.35, 0, 1);
    const scale = isActive ? 1.35 : 1;

    if (pinRef.current) {
      const mat = pinRef.current.material as THREE.SpriteMaterial;
      mat.opacity = fade;
      pinRef.current.scale.set(0.026 * scale, 0.026 * scale, 1);
    }
    if (labelRef.current) {
      const mat = labelRef.current.material as THREE.SpriteMaterial;
      // Labels only appear once you are reasonably close to Earth.
      const parentRadius = bodyRadii.get(site.parentId) ?? 1;
      const distance = camera.position.distanceTo(position);
      const near = THREE.MathUtils.clamp(1 - (distance / (parentRadius * 14) - 0.4), 0, 1);
      mat.opacity = fade * near;
      labelRef.current.visible = mat.opacity > 0.02;
      const h = 0.03;
      labelRef.current.scale.set(h * aspect, h, 1);
      labelRef.current.position.set(0, 0.035, 0);
    }
  });

  const handleSelect = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    focusOnSite(site);
  };

  return (
    <group ref={groupRef}>
      <sprite
        ref={pinRef}
        onClick={handleSelect}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <spriteMaterial
          map={pinTexture}
          transparent
          sizeAttenuation={false}
          depthTest={false}
          depthWrite={false}
        />
      </sprite>
      <sprite ref={labelRef} raycast={() => null}>
        <spriteMaterial
          map={label}
          transparent
          sizeAttenuation={false}
          depthTest={false}
          depthWrite={false}
        />
      </sprite>
    </group>
  );
}

/** Concentric ring marker - reads clearly against both land and ocean. */
function createPinTexture(color: string): THREE.Texture {
  if (typeof document === 'undefined') return new THREE.Texture();

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(c, c, size * 0.34, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(c, c, size * 0.46, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(c, c, size * 0.13, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
