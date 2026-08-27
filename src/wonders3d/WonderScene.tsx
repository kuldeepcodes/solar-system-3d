import { useMemo, useState, useCallback } from 'react';
import * as THREE from 'three';
import { WONDER_MODELS, WONDER_SCENES } from './models';
import { Ground, SkyDome, PhotoPanel } from './SceneParts';
import { useWalkControls } from './useWalkControls';
import { photosFor } from '../data/wonderPhotos';
import type { WonderPhoto } from '../data/wonderPhotos';

const EYE_HEIGHT = 1.7;

/**
 * Walkable scene for a single wonder.
 *
 * Everything is authored at real-world metre scale so the monument towers over
 * you the way it should. Photographs are arranged on a ring outside the model's
 * footprint, angled to face the centre, so you discover them by walking rather
 * than by opening a menu.
 */
export function WonderScene({
  siteId,
  onPhotoSelect,
  onLockChange,
}: {
  siteId: string;
  onPhotoSelect: (photo: WonderPhoto | null) => void;
  onLockChange: (locked: boolean) => void;
}) {
  const config = WONDER_SCENES[siteId];
  const Model = WONDER_MODELS[siteId];
  const photos = useMemo(() => photosFor(siteId), [siteId]);

  const handleLock = useCallback((locked: boolean) => onLockChange(locked), [onLockChange]);

  useWalkControls({
    enabled: Boolean(config),
    eyeHeight: EYE_HEIGHT,
    roamRadius: config?.roamRadius ?? 200,
    spawn: config?.spawn ?? [0, EYE_HEIGHT, 120],
    onLockChange: handleLock,
  });

  /**
   * Sun placement.
   *
   * The per-site azimuth alone can leave the monument fully backlit from where
   * the visitor spawns, which reduces it to a black silhouette. The sun is
   * therefore anchored to the spawn side - offset by 38 degrees so shadows
   * still fall across the facade rather than straight back - while the site's
   * configured elevation continues to set the mood.
   */
  const sunPosition = useMemo(() => {
    if (!config) return new THREE.Vector3(300, 600, 300);

    const spawn = config.spawn;
    let bearing = Math.atan2(spawn[0], spawn[2]);
    if (!Number.isFinite(bearing)) bearing = 0;
    bearing += (38 * Math.PI) / 180;

    const el = Math.max(22, config.sunElevation) * (Math.PI / 180);
    const d = Math.max(config.roamRadius * 2.2, 900);

    return new THREE.Vector3(
      Math.cos(el) * Math.sin(bearing) * d,
      Math.sin(el) * d,
      Math.cos(el) * Math.cos(bearing) * d,
    );
  }, [config]);

  // Photo panels ring the monument just outside its footprint.
  const panels = useMemo(() => {
    if (!config || photos.length === 0) return [];
    const ringRadius = Math.min(config.footprint * 1.35 + 14, config.roamRadius * 0.82);
    return photos.map((photo, i) => {
      // Start behind the spawn point so the first panels are immediately visible.
      const angle = (i / photos.length) * Math.PI * 2 + Math.PI * 0.15;
      return {
        photo,
        position: [Math.sin(angle) * ringRadius, EYE_HEIGHT + 0.6, Math.cos(angle) * ringRadius] as [
          number,
          number,
          number,
        ],
      };
    });
  }, [config, photos]);

  if (!config || !Model) return null;

  const shadowExtent = Math.max(config.footprint * 1.6, 120);

  return (
    <>
      <SkyDome horizon={config.skyHorizon} zenith={config.skyZenith} radius={config.roamRadius * 6} />

      <hemisphereLight args={[config.skyZenith, config.groundColor, 1.15]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={sunPosition}
        intensity={2.6}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={sunPosition.length() * 2.2}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-bias={-0.0008}
      />
      {/* Cool bounce from the opposite side so shadowed faces keep some form. */}
      <directionalLight
        position={[-sunPosition.x, sunPosition.y * 0.45, -sunPosition.z]}
        intensity={0.5}
        color="#b9d2ff"
      />

      <Ground color={config.groundColor} terrain={config.terrain} radius={config.roamRadius} />

      <Model detail="high" />

      {panels.map(({ photo, position }, i) => (
        <PhotoPanel
          key={`${photo.url}-${i}`}
          photo={photo}
          position={position}
          lookAt={[0, EYE_HEIGHT, 0]}
          onSelect={onPhotoSelect}
        />
      ))}

      <fog attach="fog" args={[config.skyHorizon, config.roamRadius * 1.4, config.roamRadius * 5]} />
    </>
  );
}

/** Convenience wrapper managing the selected-photo lightbox state. */
export function useWonderPhotoSelection() {
  const [selected, setSelected] = useState<WonderPhoto | null>(null);
  return { selected, setSelected };
}
