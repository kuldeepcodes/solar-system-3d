import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { SolarSystem } from './scene/SolarSystem';
import { SurfaceMode } from './scene/SurfaceMode';
import { Hud } from './ui/Hud';
import { LoadingScreen } from './ui/LoadingScreen';
import { useSimStore, QUALITY_SETTINGS } from './state/useSimStore';
import { useUIStore } from './state/useUIStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function Effects() {
  const quality = useSimStore((s) => s.quality);
  const settings = QUALITY_SETTINGS[quality];

  if (!settings.bloom) return null;

  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom
        intensity={0.85}
        luminanceThreshold={0.62}
        luminanceSmoothing={0.28}
        mipmapBlur
        radius={0.7}
      />
      <Vignette offset={0.28} darkness={0.6} eskil={false} />
    </EffectComposer>
  );
}

export default function App() {
  const quality = useSimStore((s) => s.quality);
  const setQuality = useSimStore((s) => s.setQuality);
  const mode = useUIStore((s) => s.mode);
  const [dpr, setDpr] = useState(1.5);

  useKeyboardShortcuts();

  const settings = QUALITY_SETTINGS[quality];

  return (
    <div className="relative h-full w-full bg-space-950">
      <Canvas
        dpr={dpr}
        shadows={settings.shadows}
        camera={{ fov: 55, near: 0.0015, far: 20_000, position: [0, 26, 68] }}
        gl={{
          // Essential: the scene spans roughly ten orders of magnitude, and a
          // conventional depth buffer z-fights catastrophically across that range.
          logarithmicDepthBuffer: true,
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        onCreated={({ gl, scene }) => {
          gl.toneMappingExposure = 1.02;
          scene.background = new THREE.Color('#04070f');
        }}
      >
        <PerformanceMonitor
          onIncline={() => setDpr(Math.min(settings.maxDpr, window.devicePixelRatio))}
          onDecline={() => setDpr(1)}
          // Sustained poor performance steps the quality tier down automatically.
          onFallback={() =>
            setQuality(quality === 'ultra' ? 'high' : quality === 'high' ? 'medium' : 'low')
          }
        >
          <Suspense fallback={null}>
            <SolarSystem />
            {mode === 'surface' && <SurfaceMode />}
            <Effects />
          </Suspense>
          <AdaptiveDpr pixelated={false} />
        </PerformanceMonitor>
      </Canvas>

      <Hud />
      <LoadingScreen />
    </div>
  );
}
