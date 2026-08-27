import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AU_KM, blendedOrbitFactor } from '../lib/scale';
import { daysSinceJ2000 } from '../lib/time';
import { simClock, useSimStore, QUALITY_SETTINGS } from '../state/useSimStore';
import type { CelestialBody } from '../types';

/**
 * Main asteroid belt and Kuiper belt, drawn as point clouds.
 *
 * Each particle gets its own semi-major axis, phase, inclination and mean
 * motion, but is advanced with a plain circular approximation rather than a
 * Kepler solve. At tens of thousands of particles the Newton-Raphson iteration
 * would dominate the frame budget, and at this visual scale the difference is
 * imperceptible - the belt reads as a dusty torus either way.
 */

interface BeltSpec {
  innerAU: number;
  outerAU: number;
  thickness: number;
  color: THREE.Color;
  size: number;
  countScale: number;
}

const MAIN_BELT: BeltSpec = {
  innerAU: 2.06,
  outerAU: 3.28,
  thickness: 0.14,
  color: new THREE.Color('#b7a893'),
  size: 1.6,
  countScale: 1,
};

const KUIPER_BELT: BeltSpec = {
  innerAU: 30,
  outerAU: 50,
  thickness: 0.16,
  color: new THREE.Color('#8fa8c4'),
  size: 1.4,
  countScale: 0.55,
};

/**
 * A stand-in body used only to reuse the scale system's orbit compression, so
 * belt particles land between Mars and Jupiter in educational mode exactly as
 * the planets do.
 */
function makeScaleProxy(aKm: number): CelestialBody {
  return {
    id: '__belt',
    name: 'belt',
    kind: 'dwarf',
    parentId: 'sun',
    radiusKm: 1,
    orbit: {
      aKm,
      e: 0,
      iDeg: 0,
      nodeDeg: 0,
      periapsisDeg: 0,
      meanAnomalyDeg: 0,
      periodDays: 1,
    },
    color: '#ffffff',
    textureKey: '',
    description: '',
    learn: [],
    facts: [],
    stats: {
      diameterKm: 1,
      distanceFromSunKm: aKm,
      meanTempC: 0,
      gravityMs2: 0,
      orbitalPeriodDays: 1,
      rotationPeriodHours: 1,
      moonCount: 0,
      massKg: 1,
      meanDensityGcm3: 1,
      escapeVelocityKms: 0,
      axialTiltDeg: 0,
      composition: '',
      atmosphere: '',
    },
  };
}

export function AsteroidBelt() {
  const show = useSimStore((s) => s.showAsteroidBelt);
  if (!show) return null;
  return (
    <>
      <Belt spec={MAIN_BELT} />
      <Belt spec={KUIPER_BELT} />
    </>
  );
}

function Belt({ spec }: { spec: BeltSpec }) {
  const quality = useSimStore((s) => s.quality);
  const count = Math.round(QUALITY_SETTINGS[quality].asteroidCount * spec.countScale);
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, material, particles, positions } = useMemo(() => {
    const positionArray = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);
    const sizeArray = new Float32Array(count);

    const data = {
      aKm: new Float64Array(count),
      phase: new Float64Array(count),
      rate: new Float64Array(count),
      incl: new Float64Array(count),
      node: new Float64Array(count),
    };

    const tint = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const au = spec.innerAU + Math.random() * (spec.outerAU - spec.innerAU);
      data.aKm[i] = au * AU_KM;
      data.phase[i] = Math.random() * Math.PI * 2;
      // Kepler's third law: n proportional to a^-1.5.
      data.rate[i] = (Math.PI * 2) / (365.25 * Math.pow(au, 1.5));
      data.incl[i] = (Math.random() - 0.5) * spec.thickness;
      data.node[i] = Math.random() * Math.PI * 2;

      const shade = 0.55 + Math.random() * 0.5;
      tint.copy(spec.color).multiplyScalar(shade);
      colorArray[i * 3] = tint.r;
      colorArray[i * 3 + 1] = tint.g;
      colorArray[i * 3 + 2] = tint.b;
      sizeArray[i] = spec.size * (0.6 + Math.random() * 0.9);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colorArray, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizeArray, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute vec3 aColor;
        varying vec3 vColor;
        void main() {
          vColor = aColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          if (length(uv) > 0.5) discard;
          gl_FragColor = vec4(vColor, 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    return { geometry: geo, material: mat, particles: data, positions: positionArray };
  }, [count, spec]);

  const proxy = useMemo(() => makeScaleProxy(((spec.innerAU + spec.outerAU) / 2) * AU_KM), [spec]);

  useFrame(() => {
    const days = daysSinceJ2000(simClock.julianDate);
    // One shared compression factor for the whole belt keeps it coherent.
    const factor = blendedOrbitFactor(proxy, undefined, simClock.scaleBlend);

    for (let i = 0; i < count; i += 1) {
      const angle = particles.phase[i] + particles.rate[i] * days;
      const r = particles.aKm[i] * factor;
      const incl = particles.incl[i];
      const node = particles.node[i];

      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      // Tilt the particle's orbit plane about its own ascending node.
      const y = Math.sin(angle - node) * r * incl;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingSphere();
    if (pointsRef.current) pointsRef.current.frustumCulled = false;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
