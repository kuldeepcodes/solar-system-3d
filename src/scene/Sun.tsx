import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { SUN } from '../data/bodies';
import { bodyRadii, bodySpin } from './positions';
import { useBodyTexture } from '../lib/textures';
import { useSimStore, QUALITY_SETTINGS } from '../state/useSimStore';
import { useUIStore } from '../state/useUIStore';
import {
  sunVertexShader,
  sunFragmentShader,
  glowVertexShader,
  glowFragmentShader,
} from '../shaders';

/**
 * The Sun sits at the scene origin and is the single light source.
 *
 * `decay={0}` is deliberate: with physically correct inverse-square falloff the
 * outer planets receive so little light they render essentially black. Real
 * planetarium software makes the same compromise.
 */
export function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const quality = useSimStore((s) => s.quality);
  const settings = QUALITY_SETTINGS[quality];
  const focus = useUIStore((s) => s.focus);
  const setHovered = useUIStore((s) => s.setHovered);

  const map = useBodyTexture(SUN.textureKey, SUN.color, 'star');

  const uniforms = useMemo(
    () => ({
      uMap: { value: map },
      uColorHot: { value: new THREE.Color('#fff3c4') },
      uColorCool: { value: new THREE.Color('#ff7a1a') },
      uTime: { value: 0 },
    }),
    [map],
  );

  const glowUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color('#ffb454') },
      uIntensity: { value: 1.35 },
      uFalloff: { value: 2.6 },
    }),
    [],
  );

  useFrame((state, delta) => {
    const radius = bodyRadii.get('sun') ?? 1;
    if (groupRef.current) groupRef.current.scale.setScalar(radius);
    if (meshRef.current) meshRef.current.rotation.y = bodySpin.get('sun') ?? 0;
    if (materialRef.current) materialRef.current.uniforms.uTime.value += delta;

    // Keep the corona a constant angular size relative to the disc, but grow it
    // slightly when the camera is far away so the Sun still reads at system scale.
    if (glowRef.current) {
      const dist = state.camera.position.length() / Math.max(radius, 1e-6);
      const swell = THREE.MathUtils.clamp(1 + Math.log10(Math.max(dist, 1)) * 0.55, 1, 4.5);
      glowRef.current.scale.setScalar(3.1 * swell);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onDoubleClick={(e) => {
          e.stopPropagation();
          focus('sun');
        }}
        onClick={(e) => {
          e.stopPropagation();
          useUIStore.getState().select('sun');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered('sun');
        }}
        onPointerOut={() => setHovered(null)}
      >
        <sphereGeometry args={[1, settings.sphereSegments, settings.sphereSegments / 2]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={sunVertexShader}
          fragmentShader={sunFragmentShader}
          uniforms={uniforms}
          toneMapped={false}
        />
      </mesh>

      <Billboard>
        <mesh ref={glowRef} renderOrder={-1}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            vertexShader={glowVertexShader}
            fragmentShader={glowFragmentShader}
            uniforms={glowUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </Billboard>

      <pointLight
        intensity={4.2}
        decay={0}
        distance={0}
        color="#fff6e0"
        castShadow={settings.shadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
        shadow-camera-near={0.02}
        shadow-camera-far={400}
      />
    </group>
  );
}
