import { useUIStore } from '../state/useUIStore';
import { useSimStore } from '../state/useSimStore';
import { ECLIPSE_PRESETS } from '../data/eclipses';
import { dateToJulian } from '../lib/time';
import { Panel, SectionTitle, FactList } from './Glass';

export function EclipsePanel() {
  const activeEclipseId = useUIStore((s) => s.activeEclipseId);
  const { setActiveEclipse, focus, closePanel } = useUIStore.getState();

  function activate(id: string, vantageId: string, dateStr: string) {
    setActiveEclipse(id);
    useSimStore.getState().setJulian(dateToJulian(new Date(dateStr)));
    useSimStore.getState().setPaused(true);
    focus(vantageId);
  }

  return (
    <Panel
      title="Eclipses"
      subtitle="Solar & lunar events"
      side="right"
      onClose={() => closePanel('eclipse')}
      className="h-full w-full"
    >
      <div className="space-y-2">
        {ECLIPSE_PRESETS.map((preset) => {
          const isActive = activeEclipseId === preset.id;
          const isSolar = preset.kind === 'solar';
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={isActive}
              aria-label={`View ${preset.name}`}
              onClick={() => activate(preset.id, preset.vantageId, preset.date)}
              className={`w-full rounded-xl border text-left px-3 py-2.5 transition-colors ${
                isActive
                  ? 'border-accent-400/60 bg-accent-500/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`rounded px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ${
                    isSolar
                      ? 'bg-solar-400/20 text-solar-300'
                      : 'bg-accent-300/20 text-accent-300'
                  }`}
                >
                  {isSolar ? 'Solar' : 'Lunar'}
                </span>
                <span className="text-xs font-semibold text-slate-100 truncate">{preset.name}</span>
              </div>
              <p className="text-[0.65rem] text-slate-400 tabular-nums">
                {new Date(preset.date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'UTC',
                })}
              </p>
              <p className="mt-1 text-[0.68rem] text-slate-300 leading-relaxed">{preset.description}</p>
            </button>
          );
        })}
      </div>

      {activeEclipseId && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setActiveEclipse(null)}
            className="hud-button w-full py-1.5 text-xs"
            aria-label="Clear shadow overlay"
          >
            Clear shadow overlay
          </button>
        </div>
      )}

      <SectionTitle>Why Not Every Month?</SectionTitle>
      <p className="text-xs text-slate-300 leading-relaxed">
        The Moon's orbit is tilted ~5.1° relative to the ecliptic. Eclipses only occur near the two
        nodes where the Moon's path crosses the ecliptic. These node-crossings happen only twice per
        orbit, creating narrow{' '}
        <em className="text-accent-300">eclipse seasons</em> about 173 days apart. Between seasons
        the Moon passes above or below Earth's shadow entirely.
      </p>
      <p className="mt-2 text-xs text-slate-300 leading-relaxed">
        The nodes themselves slowly precess westward, completing one full revolution every{' '}
        <strong className="text-slate-100">18.6 years</strong> — the nodal regression cycle. This
        simulation models that regression, so eclipse seasons stay in step with the real calendar.
      </p>

      <SectionTitle>Tip</SectionTitle>
      <FactList
        facts={[
          "Step time at 1\u00d7 speed after pressing play to watch the shadow track creep across Earth\u2019s surface in real time.",
          'Pause, set an eclipse date, then use the scrubber to advance slowly for best shadow detail.',
        ]}
      />
    </Panel>
  );
}
