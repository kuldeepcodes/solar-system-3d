import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getBody } from '../data/bodies';
import { useUIStore } from '../state/useUIStore';
import { bodyRadii, bodyWorldPositions } from './positions';

/**
 * Planetary surface landing mode.
 *
 * Rather than modelling terrain, this drops the camera to just above the
 * surface and wraps it in a sky shell whose colour is driven by the body's own
 * atmosphere and the *real* Sun direction for the current simulation time. On
 * an airless world such as the Moon the sky stays black and the stars remain
 * visible, which is exactly the point of the mode: it makes the difference
 * between an atmosphere and no atmosphere immediately obvious.
 */

const skyVertexShader = /* glsl */ `
  varying vec3 vWorldDirection;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldDirection = normalize(worldPosition.xyz - cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const skyFragmentShader = /* glsl */ `
  uniform vec3 uHorizon;
  uniform vec3 uZenith;
  uniform vec3 uSunDirection;
  uniform vec3 uUp;
  uniform float uDensity;

  varying vec3 vWorldDirection;

  void main() {
    vec3 dir = normalize(vWorldDirection);
    float height = clamp(dot(dir, normalize(uUp)) * 0.5 + 0.5, 0.0, 1.0);

    // Gradient from horizon to zenith.
    vec3 sky = mix(uHorizon, uZenith, pow(height, 0.65));

    // Forward-scattering glow around the Sun, and an overall day/night factor
    // driven by how high the Sun sits above the local horizon.
    float sunAngle = max(dot(dir, normalize(uSunDirection)), 0.0);
    float glow = pow(sunAngle, 96.0) * 1.6 + pow(sunAngle, 8.0) * 0.28;
    float daylight = clamp(dot(normalize(uUp), normalize(uSunDirection)) * 1.6 + 0.35, 0.0, 1.0);

    vec3 color = (sky + glow) * daylight * uDensity;

    // Alpha fades to zero on an airless world so the starfield shows through.
    float alpha = clamp(uDensity * daylight, 0.0, 1.0);
    gl_FragColor = vec4(color, alpha);
  }
`;

/** Rough atmospheric opacity per body: 0 = airless, 1 = Earth-like or thicker. */
const ATMOSPHERE_DENSITY: Record<string, number> = {
  venus: 1,
  earth: 0.92,
  mars: 0.22,
  titan: 1,
  pluto: 0.08,
  triton: 0.04,
};

const SKY_COLORS: Record<string, { horizon: string; zenith: string }> = {
  earth: { horizon: '#bcd9ff', zenith: '#2a6cd8' },
  mars: { horizon: '#e0b48c', zenith: '#c08155' },
  venus: { horizon: '#f0c983', zenith: '#c98b3d' },
  titan: { horizon: '#f2c473', zenith: '#c98a3a' },
  pluto: { horizon: '#8fa8c4', zenith: '#2a3550' },
  triton: { horizon: '#9fb4c4', zenith: '#2c3a4e' },
};

export function SurfaceMode() {
  const bodyId = useUIStore((s) => s.surfaceBodyId);
  const body = getBody(bodyId ?? undefined);

  const skyRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const density = body ? (ATMOSPHERE_DENSITY[body.id] ?? 0) : 0;
  const colors = body ? (SKY_COLORS[body.id] ?? { horizon: '#7f8ea3', zenith: '#141c2b' }) : null;

  const uniforms = useMemo(
    () => ({
      uHorizon: { value: new THREE.Color(colors?.horizon ?? '#7f8ea3') },
      uZenith: { value: new THREE.Color(colors?.zenith ?? '#141c2b') },
      uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
      uUp: { value: new THREE.Vector3(0, 1, 0) },
      uDensity: { value: density },
    }),
    [colors?.horizon, colors?.zenith, density],
  );

  useFrame(() => {
    if (!body || !skyRef.current) return;

    const center = bodyWorldPositions.get(body.id);
    const radius = bodyRadii.get(body.id);
    if (!center || radius === undefined) return;

    // "Up" is the outward radial direction at the camera's current location.
    const up = camera.position.clone().sub(center).normalize();
    uniforms.uUp.value.copy(up);
    // The Sun sits at the world origin.
    uniforms.uSunDirection.value.copy(camera.position).multiplyScalar(-1).normalize();

    skyRef.current.position.copy(camera.position);
    skyRef.current.scale.setScalar(Math.max(radius * 0.35, 0.5));
  });

  if (!body || density <= 0) return null;

  return (
    <mesh ref={skyRef} raycast={() => null} renderOrder={-900}>
      <sphereGeometry args={[1, 32, 24]} />
      <shaderMaterial
        vertexShader={skyVertexShader}
        fragmentShader={skyFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  );
}
