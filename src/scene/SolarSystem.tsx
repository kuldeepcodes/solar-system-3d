import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BODIES } from '../data/bodies';
import { daysSinceJ2000 } from '../lib/time';
import { simClock, useSimStore } from '../state/useSimStore';
import { useUIStore } from '../state/useUIStore';
import { updateBodyTransforms } from './positions';
import { Sun } from './Sun';
import { Body } from './Body';
import { OrbitPaths } from './OrbitPaths';
import { Starfield } from './Starfield';
import { AsteroidBelt } from './AsteroidBelt';
import { Labels } from './SceneLabels';
import { CameraRig } from './CameraRig';
import { WonderMarkers } from './WonderMarkers';
import { EclipseAid } from './EclipseAid';
import { TravelPath } from './TravelPath';
import { MeasureLine } from './MeasureLine';

/**
 * Advances the simulation clock and recomputes every body transform.
 *
 * Registered with priority -100 so it runs before any consumer's `useFrame`.
 * The clock deliberately bypasses React state (see `simClock`); only a
 * throttled copy is published for the HUD.
 */
function SimulationDriver() {
  const publishJulian = useSimStore((s) => s.publishJulian);
  const lastPublish = useRef(0);

  useFrame((_, delta) => {
    const { paused, speed, scaleMode } = useSimStore.getState();

    // Guard against huge deltas after a tab has been backgrounded, which would
    // otherwise teleport the planets.
    const dt = Math.min(delta, 0.1);

    if (!paused) simClock.julianDate += dt * speed;

    const target = scaleMode === 'realistic' ? 1 : 0;
    simClock.scaleBlend += (target - simClock.scaleBlend) * Math.min(1, dt * 2.6);
    if (Math.abs(target - simClock.scaleBlend) < 0.0005) simClock.scaleBlend = target;

    updateBodyTransforms(daysSinceJ2000(simClock.julianDate), simClock.scaleBlend);

    lastPublish.current += dt;
    if (lastPublish.current > 0.16) {
      lastPublish.current = 0;
      publishJulian(simClock.julianDate);
    }
  }, -100);

  return null;
}

/** Clears the selection when the user clicks empty space. */
function BackgroundCatcher() {
  const { camera } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ref.current) ref.current.position.copy(camera.position);
  });

  return (
    <mesh
      ref={ref}
      renderOrder={-2000}
      onClick={() => useUIStore.getState().setHovered(null)}
      onDoubleClick={() => useUIStore.getState().focus('sun')}
    >
      <sphereGeometry args={[5500, 8, 6]} />
      <meshBasicMaterial side={THREE.BackSide} transparent opacity={0} depthWrite={false} depthTest={false} />
    </mesh>
  );
}

export function SolarSystem() {
  const showMoons = useSimStore((s) => s.showMoons);
  const showDwarfPlanets = useSimStore((s) => s.showDwarfPlanets);

  return (
    <>
      <SimulationDriver />
      <CameraRig />

      <ambientLight intensity={0.055} />
      <Starfield />
      <BackgroundCatcher />

      <Sun />

      {BODIES.filter((b) => b.kind !== 'star').map((body) => {
        if (body.kind === 'moon' && !showMoons) return null;
        if (body.kind === 'dwarf' && !showDwarfPlanets) return null;
        return <Body key={body.id} body={body} />;
      })}

      <OrbitPaths />
      <AsteroidBelt />
      <Labels />
      <WonderMarkers />
      <EclipseAid />
      <TravelPath />
      <MeasureLine />
    </>
  );
}
