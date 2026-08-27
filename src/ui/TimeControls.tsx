import { useSimStore, SPEED_PRESETS } from '../state/useSimStore';
import { formatJulian, julianToInputDate, inputDateToJulian } from '../lib/time';

/**
 * Simulation clock controls.
 *
 * `speed` is expressed in **simulated days per real second**, which is the
 * convention planetarium software uses. At 1x you can watch the Moon move
 * against the stars; at 1000x Neptune completes an orbit in about a minute.
 * A separate "Live" button drops to real time (1 second = 1 second) for anyone
 * who wants the literal current sky.
 */
export function TimeControls() {
  const paused = useSimStore((s) => s.paused);
  const speed = useSimStore((s) => s.speed);
  const displayJulian = useSimStore((s) => s.displayJulian);
  const togglePaused = useSimStore((s) => s.togglePaused);
  const setSpeed = useSimStore((s) => s.setSpeed);
  const reverse = useSimStore((s) => s.reverse);
  const setJulian = useSimStore((s) => s.setJulian);
  const resetToNow = useSimStore((s) => s.resetToNow);

  const magnitude = Math.abs(speed);
  const reversed = speed < 0;
  const isLive = Math.abs(magnitude - 1 / 86_400) < 1e-9;

  return (
    <div className="glass pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl px-3 py-2">
      <button
        type="button"
        onClick={togglePaused}
        aria-label={paused ? 'Play simulation' : 'Pause simulation'}
        title={paused ? 'Play (Space)' : 'Pause (Space)'}
        className="hud-button size-8 text-sm"
        data-active={!paused}
      >
        {paused ? '▶' : '❚❚'}
      </button>

      <button
        type="button"
        onClick={reverse}
        aria-label="Reverse time direction"
        title="Reverse time"
        className="hud-button size-8 text-sm"
        data-active={reversed}
      >
        ⇄
      </button>

      <div className="flex gap-1" role="group" aria-label="Simulation speed">
        {SPEED_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setSpeed(reversed ? -preset : preset)}
            data-active={!isLive && magnitude === preset}
            title={`${preset} simulated day${preset === 1 ? '' : 's'} per second`}
            aria-label={`Set speed to ${preset} times`}
            className="hud-button px-2 py-1 text-[0.7rem] font-semibold tabular-nums"
          >
            {preset}×
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSpeed(reversed ? -1 / 86_400 : 1 / 86_400)}
          data-active={isLive}
          title="Real time — 1 second of simulation per second"
          aria-label="Set speed to real time"
          className="hud-button px-2 py-1 text-[0.7rem] font-semibold"
        >
          Live
        </button>
      </div>

      <div className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />

      <div className="flex items-center gap-2">
        <time
          className="hidden min-w-[13.5rem] text-center text-[0.7rem] tabular-nums text-slate-300 sm:block"
          dateTime={julianToInputDate(displayJulian)}
        >
          {formatJulian(displayJulian)}
        </time>

        <label className="sr-only" htmlFor="date-scrubber">
          Jump to date
        </label>
        <input
          id="date-scrubber"
          type="date"
          value={julianToInputDate(displayJulian)}
          onChange={(e) => {
            const jd = inputDateToJulian(e.target.value);
            if (jd !== null) setJulian(jd);
          }}
          className="glass-subtle rounded-lg px-2 py-1 text-[0.7rem] text-slate-200 outline-none [color-scheme:dark]"
        />

        <button
          type="button"
          onClick={resetToNow}
          className="hud-button px-2 py-1 text-[0.7rem]"
          title="Jump to the current date and time"
          aria-label="Reset simulation to now"
        >
          Now
        </button>
      </div>
    </div>
  );
}
