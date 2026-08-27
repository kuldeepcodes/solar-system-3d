import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimStore, QUALITY_SETTINGS } from '../state/useSimStore';

/**
 * Deep-space backdrop: a star sphere plus a few nebula billboards.
 *
 * All of it is drawn with `depthTest: false` and a large negative `renderOrder`
 * so it paints first and everything else paints over it. That is what lets the
 * star sphere sit at a modest radius while still reading as infinitely distant -
 * without it, planets further from the camera than the sphere radius would be
 * incorrectly occluded by stars in realistic scale mode.
 *
 * The sphere is re-centred on the camera every frame, so no amount of travel
 * ever brings a star closer.
 */

const starVertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;

  void main() {
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize;
  }
`;

const starFragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv) * 2.0;
    if (d > 1.0) discard;
    // Soft core with a faint halo reads far better than a hard disc.
    float alpha = pow(1.0 - d, 1.8);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

/** Approximate blackbody tint for a star, from hot blue to cool red. */
function starColor(t: number, target: THREE.Color): THREE.Color {
  if (t < 0.02) return target.setRGB(0.62, 0.72, 1.0); // O/B
  if (t < 0.08) return target.setRGB(0.78, 0.85, 1.0); // A
  if (t < 0.2) return target.setRGB(1.0, 0.97, 0.9); // F
  if (t < 0.5) return target.setRGB(1.0, 0.93, 0.76); // G
  if (t < 0.78) return target.setRGB(1.0, 0.82, 0.62); // K
  return target.setRGB(1.0, 0.7, 0.55); // M
}

const RADIUS = 6000;
// Galactic plane is inclined roughly 60 degrees to the ecliptic.
const GALACTIC_TILT = (60.2 * Math.PI) / 180;

export function Starfield() {
  const quality = useSimStore((s) => s.quality);
  const count = QUALITY_SETTINGS[quality].starCount;
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const color = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      // 30% of stars are concentrated into a Milky Way band; the rest are
      // uniform over the sphere.
      const inBand = i % 10 < 3;

      let x: number;
      let y: number;
      let z: number;

      if (inBand) {
        const lon = Math.random() * Math.PI * 2;
        // Gaussian-ish latitude spread keeps the band soft-edged.
        const lat = (Math.random() + Math.random() + Math.random() - 1.5) * 0.19;
        const cl = Math.cos(lat);
        x = Math.cos(lon) * cl;
        y = Math.sin(lat);
        z = Math.sin(lon) * cl;

        // Rotate the band out of the ecliptic plane.
        const cy = y * Math.cos(GALACTIC_TILT) - z * Math.sin(GALACTIC_TILT);
        const cz = y * Math.sin(GALACTIC_TILT) + z * Math.cos(GALACTIC_TILT);
        y = cy;
        z = cz;
      } else {
        // Uniform sampling on a sphere via the inverse-cosine method.
        const u = Math.random() * 2 - 1;
        const theta = Math.random() * Math.PI * 2;
        const r = Math.sqrt(1 - u * u);
        x = r * Math.cos(theta);
        y = u;
        z = r * Math.sin(theta);
      }

      positions[i * 3] = x * RADIUS;
      positions[i * 3 + 1] = y * RADIUS;
      positions[i * 3 + 2] = z * RADIUS;

      starColor(Math.random(), color);
      const brightness = inBand ? 0.5 + Math.random() * 0.4 : 0.55 + Math.random() * 0.45;
      colors[i * 3] = color.r * brightness;
      colors[i * 3 + 1] = color.g * brightness;
      colors[i * 3 + 2] = color.b * brightness;

      // Heavily skewed so a handful of stars are noticeably bright.
      const roll = Math.random();
      sizes[i] = roll > 0.997 ? 4.2 : roll > 0.97 ? 2.4 : 0.6 + Math.random() * 1.1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), RADIUS * 1.1);
    return geo;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: starVertexShader,
        fragmentShader: starFragmentShader,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame(() => {
    if (pointsRef.current) pointsRef.current.position.copy(camera.position);
  });

  return (
    <>
      <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} renderOrder={-1000} />
      <Nebulae />
    </>
  );
}

const NEBULA_DEFS = [
  { color: '#5b3fa8', pos: [-0.62, 0.35, -0.7], scale: 3400, opacity: 0.3 },
  { color: '#1d5c8f', pos: [0.75, -0.22, 0.6], scale: 2900, opacity: 0.26 },
  { color: '#8f2f5e', pos: [0.15, 0.72, 0.65], scale: 2400, opacity: 0.2 },
  { color: '#2f7f74', pos: [-0.5, -0.6, 0.55], scale: 2600, opacity: 0.18 },
] as const;

function Nebulae() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const texture = useMemo(() => createNebulaTexture(), []);

  useFrame(() => {
    if (groupRef.current) groupRef.current.position.copy(camera.position);
  });

  return (
    <group ref={groupRef} renderOrder={-999}>
      {NEBULA_DEFS.map((n, i) => {
        const p = new THREE.Vector3(...n.pos).normalize().multiplyScalar(RADIUS * 0.94);
        return (
          <sprite key={i} position={p} scale={[n.scale, n.scale, 1]} renderOrder={-999}>
            <spriteMaterial
              map={texture}
              color={n.color}
              transparent
              opacity={n.opacity}
              depthTest={false}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        );
      })}
    </group>
  );
}

/** Soft irregular blob used for the nebula billboards. */
function createNebulaTexture(): THREE.Texture {
  if (typeof document === 'undefined') return new THREE.Texture();

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Several offset radial gradients give a cloudier silhouette than one circle.
  for (let i = 0; i < 14; i += 1) {
    const cx = size / 2 + (Math.random() - 0.5) * size * 0.42;
    const cy = size / 2 + (Math.random() - 0.5) * size * 0.42;
    const r = size * (0.12 + Math.random() * 0.26);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.10)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.04)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // Fade the border so the square sprite edge never shows.
  const mask = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.5);
  mask.addColorStop(0, 'rgba(0,0,0,0)');
  mask.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
