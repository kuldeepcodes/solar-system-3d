import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WonderPhoto } from '../data/wonderPhotos';

/**
 * A framed photograph standing in the 3D world.
 *
 * Real photographs are what make this feel like visiting rather than looking at
 * an abstract model, so panels are placed at eye level around the monument and
 * face the visitor. The image is loaded lazily and the frame stays visible even
 * if the remote image fails, so the layout never collapses.
 */
export function PhotoPanel({
  photo,
  position,
  lookAt,
  height = 3.2,
  onSelect,
}: {
  photo: WonderPhoto;
  position: [number, number, number];
  lookAt?: [number, number, number];
  height?: number;
  onSelect?: (photo: WonderPhoto) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [failed, setFailed] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      photo.url,
      (tex) => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
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

  const aspect = photo.width && photo.height ? photo.width / photo.height : 1.5;
  const width = height * aspect;

  useFrame(() => {
    const g = groupRef.current;
    if (!g || !lookAt) return;
    g.lookAt(lookAt[0], position[1], lookAt[2]);
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Frame */}
      <mesh position={[0, 0, -0.06]} castShadow>
        <boxGeometry args={[width + 0.24, height + 0.24, 0.12]} />
        <meshStandardMaterial color={hovered ? '#7fd4ff' : '#2b3446'} roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Image, or a placeholder if the remote fetch failed */}
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
        {/* See PhotoRing: the key forces a new material so the added map
            recompiles the shader, and colour is set on both branches. */}
        <meshBasicMaterial
          key={texture ? 'photo' : 'placeholder'}
          map={texture}
          color={texture ? '#ffffff' : failed ? '#3a4457' : '#141c2b'}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Support posts */}
      <mesh position={[-width / 2 + 0.2, -height / 2 - 0.85, -0.06]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 1.7, 8]} />
        <meshStandardMaterial color="#39424f" roughness={0.7} metalness={0.4} />
      </mesh>
      <mesh position={[width / 2 - 0.2, -height / 2 - 0.85, -0.06]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 1.7, 8]} />
        <meshStandardMaterial color="#39424f" roughness={0.7} metalness={0.4} />
      </mesh>
    </group>
  );
}

/**
 * Ground plane with scattered detail appropriate to the terrain type.
 * Scatter uses a seeded PRNG so the layout is stable between visits.
 */
export function Ground({
  color,
  terrain,
  radius,
}: {
  color: string;
  terrain: 'sand' | 'grass' | 'stone' | 'jungle';
  radius: number;
}) {
  const scatter = useMemo(() => {
    let seed = 0x2f6a1b;
    const rand = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return ((seed >>> 0) % 100000) / 100000;
    };

    const count = terrain === 'jungle' ? 220 : terrain === 'grass' ? 160 : 110;
    const items: { pos: [number, number, number]; scale: number; rot: number }[] = [];
    for (let i = 0; i < count; i += 1) {
      const angle = rand() * Math.PI * 2;
      // Bias outward so clutter does not obscure the monument itself.
      const r = radius * (0.35 + 0.65 * Math.sqrt(rand()));
      items.push({
        pos: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
        scale: 0.5 + rand() * 1.5,
        rot: rand() * Math.PI,
      });
    }
    return items;
  }, [terrain, radius]);

  const detailColor =
    terrain === 'jungle' ? '#2f5a34' : terrain === 'grass' ? '#4a6b3c' : terrain === 'sand' ? '#c2a878' : '#7d7466';

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.02, 0]}>
        <circleGeometry args={[radius * 1.6, 96]} />
        <meshStandardMaterial color={color} roughness={1} metalness={0} />
      </mesh>

      {scatter.map((item, i) => (
        <mesh key={i} position={item.pos} rotation={[0, item.rot, 0]} castShadow receiveShadow>
          {terrain === 'jungle' || terrain === 'grass' ? (
            <coneGeometry args={[0.6 * item.scale, 2.4 * item.scale, 6]} />
          ) : (
            <dodecahedronGeometry args={[0.4 * item.scale, 0]} />
          )}
          <meshStandardMaterial color={detailColor} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/** Gradient sky dome enclosing the site. */
export function SkyDome({ horizon, zenith, radius }: { horizon: string; zenith: string; radius: number }) {
  const uniforms = useMemo(
    () => ({
      uHorizon: { value: new THREE.Color(horizon) },
      uZenith: { value: new THREE.Color(zenith) },
    }),
    [horizon, zenith],
  );

  return (
    <mesh scale={radius} raycast={() => null}>
      <sphereGeometry args={[1, 32, 24]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        toneMapped={false}
        vertexShader={/* glsl */ `
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uHorizon;
          uniform vec3 uZenith;
          varying vec3 vPos;
          void main() {
            float h = clamp(normalize(vPos).y * 0.5 + 0.5, 0.0, 1.0);
            gl_FragColor = vec4(mix(uHorizon, uZenith, pow(h, 0.8)), 1.0);
          }
        `}
      />
    </mesh>
  );
}
