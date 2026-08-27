import { useState } from 'react';
import { useUIStore } from '../state/useUIStore';
import { useSimStore } from '../state/useSimStore';
import { QUALITY_SETTINGS } from '../state/useSimStore';
import { BODIES } from '../data/bodies';
import { Panel, SectionTitle, Toggle, SegmentedControl, BodySelect, FactList } from './Glass';
import type { ScaleMode, QualityTier } from '../types';

// Bodies with a solid surface (excludes gas giants: Jupiter, Saturn, Uranus, Neptune)
const GAS_GIANT_IDS = new Set(['jupiter', 'saturn', 'uranus', 'neptune']);
const SOLID_BODY_IDS = new Set([
  'mercury', 'venus', 'earth', 'mars', // rocky planets
  'moon', 'io', 'europa', 'ganymede', 'callisto', // Jovian moons
  'titan', 'enceladus', // Saturnian moons
  'triton', // Neptune moon
  'pluto', 'ceres', // dwarf planets
]);
const SURFACE_BODIES = BODIES.filter((b) => SOLID_BODY_IDS.has(b.id) && !GAS_GIANT_IDS.has(b.id));

const SCALE_OPTIONS: { value: ScaleMode; label: string; title: string }[] = [
  {
    value: 'educational',
    label: 'Educational',
    title: 'Compresses radii and distances so everything stays visible on screen',
  },
  {
    value: 'realistic',
    label: 'Realistic',
    title: 'True proportions — planets become extremely small and far apart',
  },
];

const QUALITY_OPTIONS: { value: QualityTier; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Med' },
  { value: 'high', label: 'High' },
  { value: 'ultra', label: 'Ultra' },
];

export function Settings() {
  const scaleMode = useSimStore((s) => s.scaleMode);
  const quality = useSimStore((s) => s.quality);
  const showOrbits = useSimStore((s) => s.showOrbits);
  const showLabels = useSimStore((s) => s.showLabels);
  const showMoons = useSimStore((s) => s.showMoons);
  const showDwarfPlanets = useSimStore((s) => s.showDwarfPlanets);
  const showAsteroidBelt = useSimStore((s) => s.showAsteroidBelt);
  const mode = useUIStore((s) => s.mode);

  const [surfaceBodyId, setSurfaceBodyId] = useState(SURFACE_BODIES[0]?.id ?? 'earth');

  const { setScaleMode, setQuality, toggle } = useSimStore.getState();
  const { closePanel, enterSurface, exitSurface } = useUIStore.getState();

  const qs = QUALITY_SETTINGS[quality];

  return (
    <Panel
      title="Settings"
      subtitle="Display & performance"
      side="right"
      onClose={() => closePanel('settings')}
      className="h-full w-full"
    >
      {/* Scale Mode */}
      <SectionTitle>Scale Mode</SectionTitle>
      <SegmentedControl
        options={SCALE_OPTIONS}
        value={scaleMode}
        onChange={setScaleMode}
        ariaLabel="Scale mode"
      />
      <p className="mt-1.5 text-[0.65rem] text-slate-400 leading-relaxed">
        {scaleMode === 'educational'
          ? 'Educational: radii and distances are compressed so every body stays visible and orbits stay legible. Best for exploration.'
          : 'Realistic: true proportions. Planets shrink to specks at system scale — an honest view of the Solar System\'s vast emptiness.'}
      </p>

      {/* Quality */}
      <SectionTitle>Render Quality</SectionTitle>
      <SegmentedControl
        options={QUALITY_OPTIONS}
        value={quality}
        onChange={setQuality}
        ariaLabel="Render quality"
      />
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[0.65rem] text-slate-400">
        <span>Stars: <span className="text-slate-200">{qs.starCount.toLocaleString()}</span></span>
        <span>Sphere detail: <span className="text-slate-200">{qs.sphereSegments}×{qs.sphereSegments}</span></span>
        <span>Asteroids: <span className="text-slate-200">{qs.asteroidCount.toLocaleString()}</span></span>
        <span>Bloom: <span className={qs.bloom ? 'text-accent-300' : 'text-slate-500'}>{qs.bloom ? 'On' : 'Off'}</span></span>
        <span>Shadows: <span className={qs.shadows ? 'text-accent-300' : 'text-slate-500'}>{qs.shadows ? 'On' : 'Off'}</span></span>
      </div>
      <p className="mt-1.5 text-[0.65rem] text-slate-500 leading-relaxed">
        If framerate is poor, lowering quality is the first thing to try.
      </p>

      {/* Layers */}
      <SectionTitle>Layers</SectionTitle>
      <div className="space-y-0.5">
        <Toggle label="Orbit lines" checked={showOrbits} onChange={() => toggle('showOrbits')} />
        <Toggle label="Labels" checked={showLabels} onChange={() => toggle('showLabels')} />
        <Toggle label="Moons" checked={showMoons} onChange={() => toggle('showMoons')} />
        <Toggle label="Dwarf planets" checked={showDwarfPlanets} onChange={() => toggle('showDwarfPlanets')} />
        <Toggle label="Asteroid belt" checked={showAsteroidBelt} onChange={() => toggle('showAsteroidBelt')} />
      </div>

      {/* Surface Mode */}
      <SectionTitle>Surface Mode</SectionTitle>
      <BodySelect
        ariaLabel="Select body to land on"
        value={surfaceBodyId}
        onChange={setSurfaceBodyId}
        options={SURFACE_BODIES.map((b) => ({ id: b.id, name: b.name }))}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => enterSurface(surfaceBodyId)}
          aria-label={`Land on surface of ${SURFACE_BODIES.find((b) => b.id === surfaceBodyId)?.name ?? surfaceBodyId}`}
          className="hud-button flex-1 py-1.5 text-xs"
        >
          Land on surface
        </button>
        {mode === 'surface' && (
          <button
            type="button"
            onClick={exitSurface}
            aria-label="Return to orbit"
            className="hud-button flex-1 py-1.5 text-xs"
          >
            Return to orbit
          </button>
        )}
      </div>

      {/* About */}
      <SectionTitle>About</SectionTitle>
      <FactList
        facts={[
          'Orbital elements: NASA JPL Solar System Dynamics, J2000.0 Keplerian elements.',
          'Physical data: NASA planetary fact sheets.',
          'Textures: CC BY 4.0 from Solar System Scope. Run `npm run textures` to download. A procedural fallback is used when textures are absent.',
        ]}
      />
    </Panel>
  );
}
