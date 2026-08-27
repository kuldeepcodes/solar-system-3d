import { Panel, SectionTitle, FactList } from './Glass';
import { Gallery } from './DetailPanel';
import { useUIStore } from '../state/useUIStore';
import { getBody, PLANETS, childrenOf } from '../data/bodies';
import { getWonder, WONDERS } from '../data/wonders';
import { formatDistance } from '../lib/scale';
import { formatDuration } from '../lib/time';

// Derive planet ordering label
function planetOrderLabel(id: string): string {
  const idx = PLANETS.findIndex((p) => p.id === id);
  if (idx < 0) return '';
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  return `${ordinals[idx] ?? `${idx + 1}th`} planet from the Sun`;
}

export function LearnPanel() {
  const selectedId = useUIStore((s) => s.selectedId);
  const { select, focus, closePanel } = useUIStore();

  const body = getBody(selectedId ?? undefined);
  const wonder = !body && selectedId ? getWonder(selectedId) : undefined;

  if (!body && !wonder) return null;

  // ---- Body mode ----
  if (body) {
    const contextLabel = (() => {
      if (body.kind === 'planet') return planetOrderLabel(body.id);
      if (body.kind === 'moon') {
        const parent = getBody(body.parentId ?? undefined);
        return `Moon of ${parent?.name ?? 'unknown'}`;
      }
      if (body.kind === 'star') return 'The star at the centre of our Solar System';
      return 'Dwarf planet in the outer Solar System';
    })();

    const s = body.stats;
    const keyNumbers: { label: string; value: string }[] = [];
    if (s.diameterKm) keyNumbers.push({ label: 'Diameter', value: `${s.diameterKm.toLocaleString('en-US')} km` });
    if (s.distanceFromSunKm !== null) keyNumbers.push({ label: 'Distance from Sun', value: formatDistance(s.distanceFromSunKm) });
    if (s.orbitalPeriodDays !== null) keyNumbers.push({ label: 'Orbital period', value: formatDuration(s.orbitalPeriodDays) });
    if (s.gravityMs2) keyNumbers.push({ label: 'Surface gravity', value: `${s.gravityMs2.toFixed(2)} m/s²` });

    const moons = childrenOf(body.id);

    return (
      <Panel
        title={`About ${body.name}`}
        onClose={() => closePanel('learn')}
      >
        {/* Context strip */}
        <div className="mb-3 rounded-lg bg-accent-500/10 px-3 py-2 text-[0.68rem] text-accent-300">
          {contextLabel}
        </div>

        {/* Prose paragraphs */}
        <div className="space-y-3">
          {body.learn.map((para, i) => (
            <p
              key={i}
              className={`text-xs leading-relaxed text-slate-300 ${i === 0 ? 'first-letter:float-left first-letter:mr-1 first-letter:text-2xl first-letter:font-bold first-letter:text-accent-300 first-letter:leading-none' : ''}`}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Key numbers */}
        {keyNumbers.length > 0 && (
          <>
            <SectionTitle>Key numbers</SectionTitle>
            <dl className="grid grid-cols-2 gap-1.5">
              {keyNumbers.map(({ label, value }) => (
                <div key={label} className="glass-subtle rounded-lg px-2.5 py-2">
                  <dt className="text-[0.62rem] font-medium tracking-wider text-slate-400 uppercase">{label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-100 tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </>
        )}

        {/* Related bodies */}
        {moons.length > 0 && (
          <>
            <SectionTitle>Moons</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {moons.map((moon) => (
                <button
                  key={moon.id}
                  type="button"
                  aria-label={`Select ${moon.name}`}
                  onClick={() => { select(moon.id); focus(moon.id); }}
                  className="hud-button rounded-full px-2.5 py-0.5 text-[0.68rem]"
                >
                  {moon.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Facts */}
        <SectionTitle>Did you know</SectionTitle>
        <FactList facts={body.facts} />

        {body.gallery && body.gallery.length > 0 && <Gallery images={body.gallery} />}
      </Panel>
    );
  }

  // ---- Wonder mode ----
  const site = wonder!;
  const otherWonders = WONDERS.filter((w) => w.id !== site.id);

  return (
    <Panel
      title={`About ${site.name}`}
      onClose={() => closePanel('learn')}
    >
      {/* Context strip */}
      <div className="mb-3 rounded-lg bg-accent-500/10 px-3 py-2 text-[0.68rem] text-accent-300">
        On Earth · {site.country}
      </div>

      {/* Prose */}
      <div className="space-y-3">
        {site.learn.map((para, i) => (
          <p
            key={i}
            className={`text-xs leading-relaxed text-slate-300 ${i === 0 ? 'first-letter:float-left first-letter:mr-1 first-letter:text-2xl first-letter:font-bold first-letter:text-accent-300 first-letter:leading-none' : ''}`}
          >
            {para}
          </p>
        ))}
      </div>

      {/* Key numbers */}
      <SectionTitle>Key numbers</SectionTitle>
      <dl className="grid grid-cols-2 gap-1.5">
        <div className="glass-subtle rounded-lg px-2.5 py-2">
          <dt className="text-[0.62rem] font-medium tracking-wider text-slate-400 uppercase">Country</dt>
          <dd className="mt-0.5 text-sm font-semibold text-slate-100">{site.country}</dd>
        </div>
        <div className="glass-subtle rounded-lg px-2.5 py-2">
          <dt className="text-[0.62rem] font-medium tracking-wider text-slate-400 uppercase">Built</dt>
          <dd className="mt-0.5 text-sm font-semibold text-slate-100">{site.built}</dd>
        </div>
        <div className="glass-subtle rounded-lg px-2.5 py-2">
          <dt className="text-[0.62rem] font-medium tracking-wider text-slate-400 uppercase">Category</dt>
          <dd className="mt-0.5 text-sm font-semibold text-slate-100">{site.category}</dd>
        </div>
      </dl>

      {/* Facts */}
      <SectionTitle>Did you know</SectionTitle>
      <FactList facts={site.facts} />

      {/* Other wonders */}
      {otherWonders.length > 0 && (
        <>
          <SectionTitle>Other wonders</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {otherWonders.map((w) => (
              <button
                key={w.id}
                type="button"
                aria-label={`Select ${w.name}`}
                onClick={() => select(w.id)}
                className="hud-button rounded-full px-2.5 py-0.5 text-[0.68rem]"
              >
                {w.name}
              </button>
            ))}
          </div>
        </>
      )}

      {site.gallery && site.gallery.length > 0 && <Gallery images={site.gallery} />}
    </Panel>
  );
}
