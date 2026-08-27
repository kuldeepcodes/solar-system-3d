import { useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { WonderScene } from '../wonders3d/WonderScene';
import { WONDER_SCENES } from '../wonders3d/models';
import { getWonder } from '../data/wonders';
import { photosFor } from '../data/wonderPhotos';
import type { WonderPhoto } from '../data/wonderPhotos';
import { useUIStore } from '../state/useUIStore';
import { useSimStore, QUALITY_SETTINGS } from '../state/useSimStore';

/**
 * Full-screen walkable experience for a single wonder.
 *
 * Rendered in its own `<Canvas>` rather than inside the Solar System scene.
 * The two worlds use wildly different unit scales - metres here versus
 * hundreds of thousands of kilometres there - and sharing one camera and depth
 * range between them would mean constant precision fights. A separate canvas
 * also lets this scene unmount completely and reclaim its memory on exit.
 */
export function WonderExplorer() {
  const siteId = useUIStore((s) => s.exploringWonderId);
  const exitExplore = useUIStore((s) => s.exitWonderExplore);
  const quality = useSimStore((s) => s.quality);

  const [selectedPhoto, setSelectedPhoto] = useState<WonderPhoto | null>(null);
  const [locked, setLocked] = useState(false);
  const [showHelp, setShowHelp] = useState(true);

  const site = getWonder(siteId ?? '');
  const hasScene = Boolean(siteId && WONDER_SCENES[siteId]);
  const photoCount = siteId ? photosFor(siteId).length : 0;

  const handlePhoto = useCallback((photo: WonderPhoto | null) => setSelectedPhoto(photo), []);
  const handleLock = useCallback((value: boolean) => {
    setLocked(value);
    if (value) setShowHelp(false);
  }, []);

  useEffect(() => {
    if (!siteId) return;
    setSelectedPhoto(null);
    setShowHelp(true);
  }, [siteId]);

  useEffect(() => {
    if (!siteId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Escape first releases pointer lock (browser default), then closes the
      // lightbox, and only then leaves the experience.
      if (selectedPhoto) {
        setSelectedPhoto(null);
        return;
      }
      if (!document.pointerLockElement) exitExplore();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [siteId, selectedPhoto, exitExplore]);

  if (!siteId || !site) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="absolute inset-0 z-40 bg-space-950"
    >
      {hasScene ? (
        <Canvas
          shadows={QUALITY_SETTINGS[quality].shadows}
          camera={{ fov: 70, near: 0.1, far: 12_000, position: [0, 1.7, 120] }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
          }}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = 1.05;
          }}
          onPointerDown={(e) => {
            // Clicking the world (not a panel) grabs pointer lock for mouse look.
            if (!selectedPhoto && e.target instanceof HTMLCanvasElement) {
              (e.target as HTMLCanvasElement).requestPointerLock?.();
            }
          }}
        >
          <WonderScene siteId={siteId} onPhotoSelect={handlePhoto} onLockChange={handleLock} />
        </Canvas>
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center">
          <p className="text-sm text-slate-400">A walkable scene for this site is not available yet.</p>
        </div>
      )}

      {/* Crosshair */}
      {locked && !selectedPhoto && (
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="size-1.5 rounded-full bg-white/70 shadow-[0_0_6px_rgba(0,0,0,0.9)]" />
        </div>
      )}

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
        <div className="glass pointer-events-auto rounded-xl px-3.5 py-2">
          <h2 className="text-sm font-semibold tracking-wide text-accent-100">{site.name}</h2>
          <p className="text-[0.65rem] text-slate-400">
            {site.country} · {site.category} · {photoCount} photographs
          </p>
        </div>

        <div className="pointer-events-auto flex gap-2">
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="hud-button px-2.5 py-1.5 text-[0.68rem]"
            aria-label="Toggle controls help"
          >
            Controls
          </button>
          <button
            type="button"
            onClick={exitExplore}
            className="hud-button px-2.5 py-1.5 text-[0.68rem]"
            aria-label="Leave the walkable experience and return to orbit"
          >
            ← Back to orbit
          </button>
        </div>
      </div>

      {/* Controls help / click-to-start prompt */}
      <AnimatePresence>
        {showHelp && !selectedPhoto && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-6"
          >
            <div className="glass max-w-lg rounded-2xl px-5 py-4 text-center">
              <p className="text-xs font-medium text-accent-100">
                {locked ? 'Explore freely' : 'Click anywhere to look around'}
              </p>
              <p className="mt-2 text-[0.68rem] leading-relaxed text-slate-300">
                <kbd className="rounded bg-white/10 px-1.5 py-0.5">W A S D</kbd> walk ·{' '}
                <kbd className="rounded bg-white/10 px-1.5 py-0.5">Shift</kbd> run ·{' '}
                <kbd className="rounded bg-white/10 px-1.5 py-0.5">Mouse</kbd> look ·{' '}
                <kbd className="rounded bg-white/10 px-1.5 py-0.5">Esc</kbd> release cursor
              </p>
              <p className="mt-1.5 text-[0.62rem] text-slate-500">
                Walk up to the framed photographs around the site and click one to view it full size.
                On touch devices, drag to look and use the pad below to move.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.figure
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass max-h-full max-w-4xl overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-full object-contain"
              />
              <figcaption className="px-4 py-3">
                <p className="text-xs text-slate-200">{selectedPhoto.caption}</p>
                <p className="mt-1 text-[0.6rem] text-slate-500">{selectedPhoto.credit}</p>
              </figcaption>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="hud-button absolute top-3 right-3 size-7 text-base leading-none"
                aria-label="Close photograph"
              >
                ×
              </button>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
