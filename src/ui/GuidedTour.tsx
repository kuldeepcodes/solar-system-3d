import { useEffect } from 'react';
import { useUIStore } from '../state/useUIStore';
import { useSimStore } from '../state/useSimStore';
import { TOUR_STOPS } from '../data/tour';
import { dateToJulian } from '../lib/time';
import { Panel, SectionTitle } from './Glass';

export function GuidedTour() {
  const tourIndex = useUIStore((s) => s.tourIndex);
  const tourPlaying = useUIStore((s) => s.tourPlaying);
  const { setTourIndex, setTourPlaying, focus, closePanel } = useUIStore.getState();

  const total = TOUR_STOPS.length;
  const stop = TOUR_STOPS[tourIndex]!;

  // Jump camera + date whenever the stop changes
  useEffect(() => {
    focus(stop.targetId);
    if (stop.jumpToDate) {
      useSimStore.getState().setJulian(dateToJulian(new Date(stop.jumpToDate)));
    }
  }, [tourIndex, stop.targetId, stop.jumpToDate, focus]);

  // Auto-advance timer
  useEffect(() => {
    if (!tourPlaying) return;
    const id = setTimeout(() => {
      const next = tourIndex + 1;
      if (next < total) {
        setTourIndex(next);
      } else {
        setTourPlaying(false);
      }
    }, stop.dwellSeconds * 1000);
    return () => clearTimeout(id);
  }, [tourIndex, tourPlaying, stop.dwellSeconds, total, setTourIndex, setTourPlaying]);

  function handleClose() {
    setTourPlaying(false);
    closePanel('tour');
  }

  const pct = Math.round(((tourIndex + 1) / total) * 100);

  return (
    <Panel
      title="Guided Tour"
      subtitle={`Stop ${tourIndex + 1} of ${total}`}
      side="right"
      onClose={handleClose}
      className="h-full w-full"
    >
      {/* Progress bar */}
      <div className="mb-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Tour progress"
        />
      </div>

      {/* Current stop */}
      <h3 className="text-sm font-semibold text-accent-100 mb-2">{stop.title}</h3>
      <p className="text-xs text-slate-300 leading-relaxed">{stop.narration}</p>

      {/* Controls */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => { setTourPlaying(false); setTourIndex(0); }}
          aria-label="Restart tour"
          className="hud-button px-3 py-1.5 text-xs"
        >
          ↺
        </button>
        <button
          type="button"
          onClick={() => { setTourPlaying(false); if (tourIndex > 0) setTourIndex(tourIndex - 1); }}
          disabled={tourIndex === 0}
          aria-label="Previous stop"
          className="hud-button flex-1 py-1.5 text-xs disabled:opacity-30"
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={() => setTourPlaying(!tourPlaying)}
          aria-label={tourPlaying ? 'Pause tour' : 'Play tour'}
          className="hud-button flex-1 py-1.5 text-xs font-semibold"
        >
          {tourPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          type="button"
          onClick={() => { setTourPlaying(false); if (tourIndex < total - 1) setTourIndex(tourIndex + 1); }}
          disabled={tourIndex === total - 1}
          aria-label="Next stop"
          className="hud-button flex-1 py-1.5 text-xs disabled:opacity-30"
        >
          Next →
        </button>
      </div>

      {/* Stop timeline */}
      <SectionTitle>All Stops</SectionTitle>
      <ol className="space-y-1">
        {TOUR_STOPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => { setTourPlaying(false); setTourIndex(i); }}
              aria-label={`Jump to stop ${i + 1}: ${s.title}`}
              aria-current={i === tourIndex ? 'step' : undefined}
              className={`w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                i === tourIndex
                  ? 'bg-accent-500/25 text-accent-100 font-semibold'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <span className="mr-2 tabular-nums text-[0.6rem] text-slate-500">{i + 1}.</span>
              {s.title}
            </button>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
