import { useEffect, useState } from 'react';
import { useUIStore } from '../state/useUIStore';
import { useSimStore } from '../state/useSimStore';
import { BODIES } from '../data/bodies';
import { realDistanceKm } from '../scene/positions';
import { formatDistance, lightTravelTime, AU_KM } from '../lib/scale';
import { formatDuration, daysSinceJ2000 } from '../lib/time';
import { Panel, Stat, SectionTitle, BodySelect } from './Glass';

const BODY_OPTIONS = BODIES.map((b) => ({ id: b.id, name: b.name }));
const ALL_OPTIONS = [{ id: '', name: '— select —' }, ...BODY_OPTIONS];

export function MeasureTool() {
  const measureFrom = useUIStore((s) => s.measureFrom);
  const measureTo = useUIStore((s) => s.measureTo);
  const { setMeasure, clearMeasure, closePanel } = useUIStore.getState();

  const [distKm, setDistKm] = useState<number | null>(null);

  useEffect(() => {
    function compute() {
      const from = useUIStore.getState().measureFrom;
      const to = useUIStore.getState().measureTo;
      if (!from || !to) { setDistKm(null); return; }
      const jd = useSimStore.getState().displayJulian;
      setDistKm(realDistanceKm(from, to, daysSinceJ2000(jd)));
    }
    compute();
    const id = setInterval(compute, 200);
    return () => clearInterval(id);
  }, []);

  const ready = measureFrom && measureTo && distKm !== null;

  return (
    <Panel
      title="Measure"
      subtitle="True orbital separation"
      side="right"
      onClose={() => closePanel('measure')}
      className="h-full w-full"
    >
      <SectionTitle>Object A</SectionTitle>
      <BodySelect
        ariaLabel="Measure from"
        value={measureFrom ?? ''}
        onChange={(id) => setMeasure('from', id || null)}
        options={ALL_OPTIONS}
      />

      <SectionTitle>Object B</SectionTitle>
      <BodySelect
        ariaLabel="Measure to"
        value={measureTo ?? ''}
        onChange={(id) => setMeasure('to', id || null)}
        options={ALL_OPTIONS}
      />

      {!ready && (
        <p className="mt-4 text-xs text-slate-400 leading-relaxed">
          Select two objects above to see their current separation.
        </p>
      )}

      {ready && distKm !== null && (
        <>
          <SectionTitle>Distance</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Distance" value={formatDistance(distKm)} />
            <Stat label="In AU" value={`${(distKm / AU_KM).toFixed(4)} AU`} />
            <Stat label="Light delay" value={lightTravelTime(distKm)} />
          </div>

          <SectionTitle>Travel time</SectionTitle>
          <div className="grid grid-cols-1 gap-2">
            <Stat
              label="Commercial airliner (900 km/h)"
              value={formatDuration(distKm / 900 / 24)}
              hint="Boeing 737 cruising speed"
            />
            <Stat
              label="Parker Solar Probe (692 000 km/h)"
              value={formatDuration(distKm / 692_000 / 24)}
              hint="Peak speed at perihelion"
            />
            <Stat
              label="Light (299 792 km/s)"
              value={lightTravelTime(distKm)}
              hint="Speed of light in vacuum"
            />
          </div>
        </>
      )}

      <p className="mt-4 text-[0.65rem] text-slate-500 leading-relaxed">
        Distances are computed from true Keplerian orbital positions — not the compressed on-screen scale.
      </p>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => clearMeasure()}
          className="hud-button w-full py-1.5 text-xs"
          aria-label="Clear measurement"
        >
          Clear
        </button>
      </div>
    </Panel>
  );
}
