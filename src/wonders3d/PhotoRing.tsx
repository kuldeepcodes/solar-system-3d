import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WonderPhoto } from '../data/wonderPhotos';

/**
 * Immersive photo ring.
 *
 * Real photographs are arranged on a cylinder around the viewer, who stands at
 * the centre and turns to look. This is the fallback for sites with no free
 * 360 panorama, and it keeps the experience photographic rather than falling
 * back to crude geometry.
 *
 * Panels are sized by their true aspect ratio and spaced by angular width, so
 * a wide landscape shot occupies more of the ring than a square one and
 * nothing overlaps.
 */
export function PhotoRing({
  photos,
  radius = 12,
  onSelect,
}: {
  photos: WonderPhoto[];
  radius?: number;
  onSelect?: (photo: WonderPhoto) => void;
}) {
  const layout = useMemo(() => {
    if (photos.length === 0) return [];

    const height = 5.2;
    const gap = 0.16;

    const widths = photos.map((p) => {
      const aspect = p.width && p.height ? p.width / p.height : 1.5;
      return height * Math.min(Math.max(aspect, 0.7), 2.2);
    });

    const totalWidth = widths.reduce((a, b) => a + b, 0);
    const totalGap = gap * photos.length;
    // Choose a radius large enough that every panel fits around the circle.
    const needed = (totalWidth + totalGap) / (Math.PI * 2);
    const r = Math.max(radius, needed * 1.05);

    let cursor = 0;
    return photos.map((photo, i) => {
      const w = widths[i];
      const angularWidth = (w + gap) / r;
      const angle = cursor + angularWidth / 2;
      cursor += angularWidth;
      return { photo, angle, width: w, height, radius: r };
    });
  }, [photos, radius]);

  return (
    <group>
      {layout.map((item, i) => (
        <RingPanel key={`${item.photo.url}-${i}`} {...item} onSelect={onSelect} />
      ))}
      <ambientLight intensity={1} />
    </group>
  );
}

function RingPanel({
  photo,
  angle,
  width,
  height,
  radius,
  onSelect,
}: {
  photo: WonderPhoto;
  angle: number;
  width: number;
  height: number;
  radius: number;
  onSelect?: (photo: WonderPhoto) => void;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [failed, setFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    // Wikimedia serves `Access-Control-Allow-Origin: *`, but requesting
    // credentials mode can still fail on some CDN edges. `anonymous` is the
    // correct, permissive setting for these assets.
    loader.setCrossOrigin('anonymous');
    loader.load(
      photo.url,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        // Panels are lit by a plain basic material, so mipmaps are the only
        // thing keeping distant panels from shimmering.
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.needsUpdate = true;
        setTexture(tex);
      },
      undefined,
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [photo.url]);

  const position = useMemo<[number, number, number]>(
    () => [Math.sin(angle) * radius, 0, Math.cos(angle) * radius],
    [angle, radius],
  );

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    // Always square-on to the viewer at the centre.
    g.lookAt(0, 0, 0);
    const targetScale = hovered ? 1.04 : 1;
    g.scale.lerp(SCRATCH.set(targetScale, targetScale, targetScale), 0.15);
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[width + 0.18, height + 0.18]} />
        <meshBasicMaterial color={hovered ? '#7fd4ff' : '#1a2436'} toneMapped={false} />
      </mesh>

      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(photo);
        }}
      >
        <planeGeometry args={[width, height]} />
        {/*
          The `key` forces a fresh material once the texture arrives. Adding a
          map changes the shader program (the USE_MAP define), which needs
          `needsUpdate`; remounting is the simplest reliable way to get it.
          `color` is also set on both branches because an omitted prop is not
          reset to its default, and a stale dark colour would multiply the
          photograph to black.
        */}
        <meshBasicMaterial
          key={texture ? 'photo' : 'placeholder'}
          map={texture}
          color={texture ? '#ffffff' : failed ? '#3a2c3f' : '#0f1725'}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

const SCRATCH = new THREE.Vector3();
