import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '../state/useUIStore';
import { useSimStore } from '../state/useSimStore';
import { BODIES } from '../data/bodies';
import { MISSION_ROUTES } from '../data/missions';
import { realDistanceKm } from '../scene/positions';
import { formatDistance, lightTravelTime, AU_KM } from '../lib/scale';
import { formatDuration, daysSinceJ2000 } from '../lib/time';
import { Panel, Stat, SectionTitle, BodySelect } from './Glass';

const BODY_OPTIONS = BODIES.map((b) => ({ id: b.id, name: b.name }));

export function TravelPanel() {
  const travelFrom = useUIStore((s) => s.travelFrom);
  const travelTo = useUIStore((s) => s.travelTo);
  const travelProgress = useUIStore((s) => s.travelProgress);
  const travelPlaying = useUIStore((s) => s.travelPlaying);
  const mode = useUIStore((s) => s.mode);
  const { setTravel, setTravelProgress, setTravelPlaying, setMode, closePanel } = useUIStore.getState();

  const [distKm, setDistKm] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startProgressRef = useRef(0);

  // Live telemetry
  useEffect(() => {
    function compute() {
      const jd = useSimStore.getState().displayJulian;
      const d = realDistanceKm(travelFrom, travelTo, daysSinceJ2000(jd));
      setDistKm(d);
    }
    compute();
    const id = setInterval(compute, 200);
    return () => clearInterval(id);
  }, [travelFrom, travelTo]);

  // RAF animation
  useEffect(() => {
    if (!travelPlaying) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      startTimeRef.current = null;
      return;
    }
    const DURATION_MS = 12_000;
    startProgressRef.current = useUIStore.getState().travelProgress;
    startTimeRef.current = null;

    function tick(now: number) {
      if (startTimeRef.current === null) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const remaining = 1 - startProgressRef.current;
      const t = Math.min(elapsed / (DURATION_MS * remaining), 1);
      const progress = startProgressRef.current + t * remaining;
      setTravelProgress(progress);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setTravelPlaying(false);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [travelPlaying, setTravelProgress, setTravelPlaying]);

  const matchedRoute = MISSION_ROUTES.find(
    (r) => r.fromId === travelFrom && r.toId === travelTo,
  );

  function handlePreset(fromId: string, toId: string) {
    setTravel('from', fromId);
    setTravel('to', toId);
    setTravelProgress(0);
  }

  function handleLaunch() {
    setTravelProgress(0);
    setMode('spacecraft');
    setTravelPlaying(true);
  }

  function handleExit() {
    setTravelPlaying(false);
    setMode('orbit');
    closePanel('travel');
  }

  const pct = Math.round(travelProgress * 100);

  return (
    <Panel
      title="Travel"
      subtitle="Spacecraft transit simulator"
      side="right"
      onClose={handleExit}
      className="h-full w-full"
    >
      <SectionTitle>Origin</SectionTitle>
      <BodySelect
        ariaLabel="Travel from"
        value={travelFrom}
        onChange={(id) => { setTravel('from', id); setTravelProgress(0); }}
        options={BODY_OPTIONS}
      />

      <SectionTitle>Destination</SectionTitle>
      <BodySelect
        ariaLabel="Travel to"
        value={travelTo}
        onChange={(id) => { setTravel('to', id); setTravelProgress(0); }}
        options={BODY_OPTIONS}
      />

      <SectionTitle>Mission Presets</SectionTitle>
      <div className="space-y-1.5">
        {MISSION_ROUTES.map((route) => {
          const active = route.fromId === travelFrom && route.toId === travelTo;
          return (
            <button
              key={route.id}
              type="button"
              aria-pressed={active}
              aria-label={`Select mission ${route.name}`}
              onClick={() => handlePreset(route.fromId, route.toId)}
              className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-accent-400/60 bg-accent-500/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <p className="text-xs font-semibold text-slate-100">{route.name}</p>
              <p className="text-[0.65rem] text-accent-300">{route.spacecraft}</p>
            </button>
          );
        })}
      </div>

      {matchedRoute && (
        <>
          <SectionTitle>Mission Brief</SectionTitle>
          <p className="text-xs text-slate-300 leading-relaxed">{matchedRoute.description}</p>
        </>
      )}

      <SectionTitle>Telemetry</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Separation" value={formatDistance(distKm)} />
        <Stat label="In AU" value={`${(distKm / AU_KM).toFixed(4)} AU`} />
        <Stat label="Light delay" value={lightTravelTime(distKm)} />
        <Stat
          label="At 100 000 km/h"
          value={formatDuration(distKm / 100_000 / 24)}
          hint="Hypothetical constant-thrust speed"
        />
        {matchedRoute && (
          <Stat
            label="Real cruise time"
            value={formatDuration(matchedRoute.realCruiseDays)}
            hint="Actual mission duration"
          />
        )}
      </div>

      <SectionTitle>Progress</SectionTitle>
      <div className="mb-2 flex items-center gap-2">
        <div className="relative flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-accent-400 transition-all"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Transit progress"
          />
        </div>
        <span className="text-xs tabular-nums text-slate-300 w-8 text-right">{pct}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={travelProgress}
        onChange={(e) => { setTravelPlaying(false); setTravelProgress(parseFloat(e.target.value)); }}
        aria-label="Scrub transit progress"
        className="w-full accent-accent-400"
      />

      <div className="mt-4 flex gap-2">
        {mode !== 'spacecraft' || !travelPlaying ? (
          <button
            type="button"
            onClick={handleLaunch}
            aria-label="Launch transit"
            className="hud-button flex-1 py-1.5 text-xs font-semibold"
          >
            {travelProgress > 0 && travelProgress < 1 ? 'Resume' : 'Launch'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setTravelPlaying(false)}
            aria-label="Pause transit"
            className="hud-button flex-1 py-1.5 text-xs"
          >
            Pause
          </button>
        )}
        <button
          type="button"
          onClick={handleExit}
          aria-label="Exit spacecraft mode"
          className="hud-button flex-1 py-1.5 text-xs"
        >
          Exit
        </button>
      </div>
    </Panel>
  );
}
