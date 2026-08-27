import { Panel, SectionTitle, BodySelect } from './Glass';
import { useUIStore } from '../state/useUIStore';
import { BODIES, getBody } from '../data/bodies';
import { formatDistance } from '../lib/scale';
import { formatDuration } from '../lib/time';

const EARTH_G = 9.807;

function formatMassShort(kg: number): string {
  const exp = Math.floor(Math.log10(Math.abs(kg)));
  const coeff = kg / Math.pow(10, exp);
  const sup = String(exp).split('').map((c) => ({ '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻' }[c] ?? c)).join('');
  return `${coeff.toFixed(2)}×10${sup}`;
}

interface Metric {
  label: string;
  a: number | null;
  b: number | null;
  format: (v: number) => string;
  useLog?: boolean;
}

function ratio(a: number | null, b: number | null): number | null {
  if (a === null || b === null || b === 0) return null;
  return a / b;
}

function CompareBar({ valA, valB, useLog }: { valA: number | null; valB: number | null; useLog?: boolean }) {
  if (valA === null || valB === null) return null;
  const r = Math.abs(valA) / Math.abs(valB);
  let fracA: number;
  let fracB: number;
  if (useLog && (r > 100 || 1 / r > 100)) {
    const la = Math.log10(Math.max(Math.abs(valA), 1));
    const lb = Math.log10(Math.max(Math.abs(valB), 1));
    const mx = Math.max(la, lb);
    fracA = mx > 0 ? la / mx : 0.5;
    fracB = mx > 0 ? lb / mx : 0.5;
  } else {
    const mx = Math.max(Math.abs(valA), Math.abs(valB));
    fracA = mx > 0 ? Math.abs(valA) / mx : 0.5;
    fracB = mx > 0 ? Math.abs(valB) / mx : 0.5;
  }
  const minPct = 4;
  const pctA = Math.max(fracA * 100, minPct);
  const pctB = Math.max(fracB * 100, minPct);
  const logNote = useLog && (r > 100 || 1 / r > 100);

  return (
    <div className="flex flex-col gap-0.5">
      {logNote && (
        <span className="text-[0.58rem] text-slate-500 italic">log scale</span>
      )}
      <div className="flex h-1.5 gap-0.5">
        <div className="h-full rounded-full bg-accent-400/60" style={{ width: `${pctA}%` }} />
      </div>
      <div className="flex h-1.5 gap-0.5">
        <div className="h-full rounded-full bg-solar-400/60" style={{ width: `${pctB}%` }} />
      </div>
    </div>
  );
}

export function ComparePanel() {
  const compareA = useUIStore((s) => s.compareA);
  const compareB = useUIStore((s) => s.compareB);
  const { setCompare, closePanel } = useUIStore();

  const bodyA = getBody(compareA ?? undefined);
  const bodyB = getBody(compareB ?? undefined);

  const bodyOptions = BODIES.map((b) => ({ id: b.id, name: b.name }));
  const selectedA = compareA ?? BODIES[0].id;
  const selectedB = compareB ?? BODIES[1].id;

  // Size preview
  const rA = bodyA?.radiusKm ?? 0;
  const rB = bodyB?.radiusKm ?? 0;
  const maxR = Math.max(rA, rB, 1);
  const MAX_PX = 72;
  const MIN_PX = 8;
  const szA = Math.max(Math.sqrt(rA / maxR) * MAX_PX, MIN_PX);
  const szB = Math.max(Math.sqrt(rB / maxR) * MAX_PX, MIN_PX);

  // Summary
  let summary = '';
  if (bodyA && bodyB) {
    const widerRatio = bodyA.radiusKm / bodyB.radiusKm;
    const massRatio = bodyA.stats.massKg / bodyB.stats.massKg;
    const [bigger, smaller] = widerRatio >= 1 ? [bodyA, bodyB] : [bodyB, bodyA];
    const wr = Math.max(widerRatio, 1 / widerRatio);
    const mr = massRatio >= 1 ? massRatio : 1 / massRatio;
    summary = `${bigger.name} is ${wr.toFixed(1)}× wider than ${smaller.name} and ${mr.toFixed(0)}× more massive.`;
  }

  // Metrics table
  const sA = bodyA?.stats;
  const sB = bodyB?.stats;

  const metrics: Metric[] = [
    {
      label: 'Diameter',
      a: sA ? sA.diameterKm : null,
      b: sB ? sB.diameterKm : null,
      format: (v) => `${v.toLocaleString('en-US')} km`,
      useLog: true,
    },
    {
      label: 'Mass',
      a: sA ? sA.massKg : null,
      b: sB ? sB.massKg : null,
      format: formatMassShort,
      useLog: true,
    },
    {
      label: 'Gravity',
      a: sA ? sA.gravityMs2 : null,
      b: sB ? sB.gravityMs2 : null,
      format: (v) => `${v.toFixed(2)} m/s²`,
      useLog: true,
    },
    {
      label: 'Surface temp',
      a: sA ? sA.meanTempC : null,
      b: sB ? sB.meanTempC : null,
      format: (v) => `${v} °C`,
    },
    {
      label: 'Orbital period',
      a: sA ? sA.orbitalPeriodDays : null,
      b: sB ? sB.orbitalPeriodDays : null,
      format: (v) => formatDuration(v),
      useLog: true,
    },
    {
      label: 'Rotation period',
      a: sA ? Math.abs(sA.rotationPeriodHours) / 24 : null,
      b: sB ? Math.abs(sB.rotationPeriodHours) / 24 : null,
      format: (v) => formatDuration(v),
      useLog: true,
    },
    {
      label: 'Moons',
      a: sA ? sA.moonCount : null,
      b: sB ? sB.moonCount : null,
      format: (v) => String(v),
    },
    {
      label: 'Density',
      a: sA ? sA.meanDensityGcm3 : null,
      b: sB ? sB.meanDensityGcm3 : null,
      format: (v) => `${v.toFixed(2)} g/cm³`,
    },
    {
      label: 'Escape velocity',
      a: sA ? sA.escapeVelocityKms : null,
      b: sB ? sB.escapeVelocityKms : null,
      format: (v) => `${v.toFixed(2)} km/s`,
      useLog: true,
    },
    {
      label: 'Distance from Sun',
      a: sA ? sA.distanceFromSunKm : null,
      b: sB ? sB.distanceFromSunKm : null,
      format: (v) => formatDistance(v),
      useLog: true,
    },
    {
      label: 'Axial tilt',
      a: sA ? sA.axialTiltDeg : null,
      b: sB ? sB.axialTiltDeg : null,
      format: (v) => `${v.toFixed(1)}°`,
    },
  ];

  // Gravity comparison label
  if (bodyA && bodyB) {
    void EARTH_G; // used implicitly for hint display
  }

  return (
    <Panel
      title="Compare"
      onClose={() => closePanel('compare')}
    >
      {/* Selectors */}
      <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
        <BodySelect
          ariaLabel="Body A"
          options={bodyOptions}
          value={selectedA}
          onChange={(id) => setCompare('A', id)}
        />
        <button
          type="button"
          aria-label="Swap A and B"
          onClick={() => {
            setCompare('A', selectedB);
            setCompare('B', selectedA);
          }}
          className="hud-button px-2 py-1.5 text-base leading-none"
        >
          ⇄
        </button>
        <BodySelect
          ariaLabel="Body B"
          options={bodyOptions}
          value={selectedB}
          onChange={(id) => setCompare('B', id)}
        />
      </div>

      {/* Size preview */}
      {bodyA && bodyB && (
        <div className="mb-3 flex items-end justify-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <div
              aria-label={`${bodyA.name} size preview`}
              style={{ width: szA, height: szA, borderRadius: '50%', background: bodyA.color, border: '1.5px solid rgba(255,255,255,0.15)' }}
            />
            <span className="text-[0.62rem] text-slate-400">{bodyA.name}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div
              aria-label={`${bodyB.name} size preview`}
              style={{ width: szB, height: szB, borderRadius: '50%', background: bodyB.color, border: '1.5px solid rgba(255,255,255,0.15)' }}
            />
            <span className="text-[0.62rem] text-slate-400">{bodyB.name}</span>
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <p className="mb-3 rounded-lg bg-accent-500/10 px-3 py-2 text-[0.68rem] leading-snug text-accent-300">
          {summary}
        </p>
      )}

      {/* Comparison table */}
      <SectionTitle>Side by side</SectionTitle>
      <div className="space-y-1.5">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-1 text-[0.6rem] font-medium tracking-wider text-slate-500 uppercase">
          <span>Metric</span>
          <span className="text-accent-300">{bodyA?.name ?? 'A'}</span>
          <span className="text-solar-300">{bodyB?.name ?? 'B'}</span>
        </div>

        {metrics.map((m) => {
          const r = ratio(m.a, m.b);
          const aIsLarger = m.a !== null && m.b !== null && Math.abs(m.a) >= Math.abs(m.b);

          return (
            <div key={m.label} className="glass-subtle rounded-lg px-2.5 py-2">
              <div className="mb-1 text-[0.6rem] font-medium tracking-wider text-slate-500 uppercase">
                {m.label}
                {r !== null && r !== 1 && (
                  <span className="ml-1.5 text-slate-600">
                    ({(aIsLarger ? r : 1 / r).toFixed(1)}× {aIsLarger ? (bodyA?.name ?? 'A') : (bodyB?.name ?? 'B')})
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className={`text-xs tabular-nums ${aIsLarger ? 'text-accent-300' : 'text-slate-300'}`}>
                  {m.a !== null ? m.format(m.a) : '—'}
                </span>
                <span className={`text-xs tabular-nums ${!aIsLarger ? 'text-solar-300' : 'text-slate-300'}`}>
                  {m.b !== null ? m.format(m.b) : '—'}
                </span>
              </div>
              <CompareBar valA={m.a} valB={m.b} useLog={m.useLog} />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
