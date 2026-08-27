import { useCallback, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { Photosphere, PanoramaControls } from '../wonders3d/Photosphere';
import { PhotoRing } from '../wonders3d/PhotoRing';
import { WonderScene } from '../wonders3d/WonderScene';
import { WONDER_SCENES } from '../wonders3d/models';
import { getWonder } from '../data/wonders';
import { photosFor } from '../data/wonderPhotos';
import type { WonderPhoto } from '../data/wonderPhotos';
import { panoramasFor } from '../data/wonderPanoramas';
import { toursFor } from '../data/virtualTours';
import { useUIStore } from '../state/useUIStore';
import { useSimStore, QUALITY_SETTINGS } from '../state/useSimStore';

type ViewTab = 'panorama' | 'gallery' | 'model';

/**
 * Immersive experience for a single wonder.
 *
 * Real photography leads: a genuine 360 panorama where one exists under a free
 * licence, otherwise an immersive ring of real photographs. The procedural 3D
 * model comes last, offered as a diagram rather than as a substitute for the
 * place itself.
 *
 * Rendered in its own `<Canvas>` because this scene works in metres while the
 * Solar System works in hundreds of thousands of kilometres; sharing a camera
 * and depth range between them would be a constant precision fight.
 */
export function WonderExplorer() {
  const siteId = useUIStore((s) => s.exploringWonderId);
  const exitExplore = useUIStore((s) => s.exitWonderExplore);
  const quality = useSimStore((s) => s.quality);

  const site = getWonder(siteId ?? '');
  const panoramas = useMemo(() => (siteId ? panoramasFor(siteId) : []), [siteId]);
  const photos = useMemo(() => (siteId ? photosFor(siteId) : []), [siteId]);
  const tours = useMemo(() => (siteId ? toursFor(siteId) : []), [siteId]);
  const hasModel = Boolean(siteId && WONDER_SCENES[siteId]);

  const [tab, setTab] = useState<ViewTab>('panorama');
  const [panoIndex, setPanoIndex] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<WonderPhoto | null>(null);
  const [panoReady, setPanoReady] = useState(false);
  const [panoFailed, setPanoFailed] = useState(false);
  const [showTours, setShowTours] = useState(false);

  // Pick the richest available view whenever the site changes.
  useEffect(() => {
    if (!siteId) return;
    setPanoIndex(0);
    setSelectedPhoto(null);
    setPanoReady(false);
    setPanoFailed(false);
    setShowTours(false);
    setTab(panoramas.length > 0 ? 'panorama' : photos.length > 0 ? 'gallery' : 'model');
  }, [siteId, panoramas.length, photos.length]);

  useEffect(() => {
    setPanoReady(false);
    setPanoFailed(false);
  }, [panoIndex]);

  useEffect(() => {
    if (!siteId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selectedPhoto) return setSelectedPhoto(null);
      if (showTours) return setShowTours(false);
      if (!document.pointerLockElement) exitExplore();
      return undefined;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [siteId, selectedPhoto, showTours, exitExplore]);

  const handleLoaded = useCallback(() => setPanoReady(true), []);
  const handleFailed = useCallback(() => setPanoFailed(true), []);
  const noop = useCallback(() => {}, []);

  if (!siteId || !site) return null;

  const pano = panoramas[panoIndex];
  const tabs: { id: ViewTab; label: string; available: boolean }[] = [
    { id: 'panorama', label: '360° view', available: panoramas.length > 0 },
    { id: 'gallery', label: 'Photo gallery', available: photos.length > 0 },
    { id: 'model', label: '3D model', available: hasModel },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-40 bg-space-950"
    >
      {/* Remounting per tab is intentional: each view wants a different camera
          setup, and a clean remount avoids leaking one mode's state into another. */}
      <Canvas
        key={tab}
        shadows={tab === 'model' && QUALITY_SETTINGS[quality].shadows}
        camera={{
          fov: 72,
          near: 0.1,
          far: 12_000,
          position: tab === 'model' ? [0, 1.7, 120] : [0, 0, 0.01],
        }}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.05;
        }}
      >
        {tab === 'panorama' && pano && !panoFailed && (
          <>
            <Photosphere url={pano.url} onLoaded={handleLoaded} onError={handleFailed} />
            <PanoramaControls />
          </>
        )}

        {tab === 'gallery' && (
          <>
            <color attach="background" args={['#070c18']} />
            <PhotoRing photos={photos} onSelect={setSelectedPhoto} />
            <PanoramaControls />
          </>
        )}

        {tab === 'model' && hasModel && (
          <WonderScene siteId={siteId} onPhotoSelect={setSelectedPhoto} onLockChange={noop} />
        )}
      </Canvas>

      {tab === 'panorama' && pano && !panoReady && !panoFailed && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="glass rounded-2xl px-5 py-4 text-center">
            <p className="text-xs text-accent-100">Loading 360° panorama…</p>
            <p className="mt-1 text-[0.62rem] text-slate-500">
              {(pano.bytes / 1_048_576).toFixed(1)} MB · {pano.width}×{pano.height}
            </p>
          </div>
        </div>
      )}

      {tab === 'panorama' && panoFailed && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <div className="glass max-w-sm rounded-2xl px-5 py-4 text-center">
            <p className="text-xs text-slate-200">That panorama could not be loaded.</p>
            <p className="mt-1 text-[0.62rem] text-slate-500">Try the photo gallery instead.</p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
        <div className="glass pointer-events-auto max-w-sm rounded-xl px-3.5 py-2">
          <h2 className="text-sm font-semibold tracking-wide text-accent-100">{site.name}</h2>
          <p className="text-[0.65rem] text-slate-400">
            {site.country} · {site.category}
          </p>
          {tab === 'panorama' && pano && (
            <p className="mt-1 text-[0.6rem] leading-snug text-slate-500">
              {pano.title} — {pano.credit}
            </p>
          )}
          {tab === 'gallery' && (
            <p className="mt-1 text-[0.6rem] text-slate-500">
              {photos.length} photographs · click one to enlarge
            </p>
          )}
        </div>

        <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          {tours.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTours((v) => !v)}
              data-active={showTours}
              className="hud-button px-2.5 py-1.5 text-[0.68rem]"
              aria-label="Show external virtual tours"
            >
              Virtual tours
            </button>
          )}
          <button
            type="button"
            onClick={exitExplore}
            className="hud-button px-2.5 py-1.5 text-[0.68rem]"
            aria-label="Leave this site and return to orbit"
          >
            ← Back to orbit
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-4">
        {tab === 'panorama' && panoramas.length > 1 && (
          <div className="glass pointer-events-auto flex gap-1 rounded-xl px-2 py-1.5">
            {panoramas.map((p, i) => (
              <button
                key={p.url}
                type="button"
                data-active={i === panoIndex}
                onClick={() => setPanoIndex(i)}
                className="hud-button px-2.5 py-1 text-[0.66rem] capitalize"
                aria-label={`Show panorama: ${p.title}`}
              >
                {p.vantage}
              </button>
            ))}
          </div>
        )}

        <div className="glass pointer-events-auto flex gap-1 rounded-xl px-2 py-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={!t.available}
              data-active={tab === t.id}
              onClick={() => setTab(t.id)}
              className="hud-button px-3 py-1.5 text-[0.68rem] disabled:cursor-not-allowed disabled:opacity-35"
              aria-label={t.available ? `Switch to ${t.label}` : `${t.label} unavailable for this site`}
              title={t.available ? undefined : 'Not available for this site'}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="text-[0.62rem] text-slate-500">
          {tab === 'model'
            ? 'Click to look · W A S D to walk · Shift to run'
            : tab === 'gallery'
              ? 'Drag to turn · click a photograph to enlarge'
              : 'Drag to look around · scroll to zoom'}
        </p>
      </div>

      {/* External tours */}
      <AnimatePresence>
        {showTours && (
          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            className="glass absolute top-24 right-4 z-50 w-72 rounded-2xl p-4"
          >
            <h3 className="text-[0.7rem] font-semibold tracking-wider text-accent-300 uppercase">
              Virtual tours elsewhere
            </h3>
            <p className="mt-1.5 text-[0.62rem] leading-relaxed text-slate-400">
              These operators shoot their own panoramas and hold the copyright, so they open in a new
              tab rather than being reproduced here.
            </p>
            <ul className="mt-3 space-y-2">
              {tours.map((t) => (
                <li key={t.url}>
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:border-accent-400/40 hover:bg-accent-500/10"
                  >
                    <p className="text-xs font-medium text-slate-100">{t.label}</p>
                    <p className="text-[0.6rem] text-accent-300">{t.provider}</p>
                    <p className="mt-0.5 text-[0.6rem] text-slate-400">{t.description}</p>
                  </a>
                </li>
              ))}
            </ul>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.figure
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass relative max-h-full max-w-4xl overflow-hidden rounded-2xl"
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
