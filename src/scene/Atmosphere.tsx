import { useMemo } from 'react';
import * as THREE from 'three';
import type { CelestialBody } from '../types';
import { atmosphereVertexShader, atmosphereFragmentShader } from '../shaders';
import { useSimStore, QUALITY_SETTINGS } from '../state/useSimStore';

/**
 * Fresnel atmosphere shell.
 *
 * Rendered back-face-only with additive blending so it reads as light scattering
 * around the limb rather than as a solid shell in front of the planet. The Sun
 * sits at the world origin, so the shader's sun position is simply (0,0,0).
 */
export function Atmosphere({ body }: { body: CelestialBody }) {
  const spec = body.atmosphere!;
  const quality = useSimStore((s) => s.quality);
  const settings = QUALITY_SETTINGS[quality];

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(spec.color) },
      uSunPosition: { value: new THREE.Vector3(0, 0, 0) },
      uIntensity: { value: spec.intensity },
      uPower: { value: spec.power },
    }),
    [spec.color, spec.intensity, spec.power],
  );

  return (
    <mesh scale={1 + spec.thickness} raycast={() => null} renderOrder={2}>
      <sphereGeometry args={[1, settings.sphereSegments, settings.sphereSegments / 2]} />
      <shaderMaterial
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}
