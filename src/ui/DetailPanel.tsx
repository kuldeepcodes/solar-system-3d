import { useState } from 'react';
import type { GalleryImage } from '../types';
import { Panel, Stat, SectionTitle, FactList } from './Glass';
import { useUIStore } from '../state/useUIStore';
import { getBody, PLANETS } from '../data/bodies';
import { getWonder } from '../data/wonders';
import { formatDistance } from '../lib/scale';
import { formatDuration } from '../lib/time';
import { formatLatLon } from '../lib/geo';

// ---------------------------------------------------------------------------
// Gallery – also exported so LearnPanel can import it
// ---------------------------------------------------------------------------

function GalleryTile({ img }: { img: GalleryImage }) {
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-label={`View image: ${img.caption}`}
        onClick={() => setExpanded((p) => !p)}
        className="w-full overflow-hidden rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-400"
      >
        {failed ? (
          <div
            className="flex items-center justify-center rounded-lg bg-gradient-to-br from-space-800 to-space-700 p-2 text-center text-[0.62rem] leading-snug text-slate-400"
            style={{ minHeight: expanded ? '120px' : '64px' }}
          >
            {img.caption}
          </div>
        ) : (
          <img
            src={img.url}
            alt={img.caption}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className={`w-full rounded-lg object-cover transition-all ${expanded ? 'max-h-48' : 'h-16 object-cover'}`}
          />
        )}
      </button>
      <p className="text-[0.62rem] leading-snug text-slate-400">{img.caption}</p>
      <p className="text-[0.6rem] text-slate-500">{img.credit}</p>
    </div>
  );
}

export function Gallery({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) return null;
  return (
    <div>
      <SectionTitle>Gallery</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {images.map((img, i) => (
          <GalleryTile key={i} img={img} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMass(kg: number): string {
  const exp = Math.floor(Math.log10(kg));
  const coeff = kg / Math.pow(10, exp);
  return `${coeff.toFixed(2)} × 10${superscript(exp)} kg`;
}

function superscript(n: number): string {
  const sup: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
  };
  return String(n).split('').map((c) => sup[c] ?? c).join('');
}

function formatTemp(mean: number, min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) {
    return `${min} to ${max} °C`;
  }
  return `${mean} °C`;
}

const EARTH_G = 9.807;

// ---------------------------------------------------------------------------
// DetailPanel
// ---------------------------------------------------------------------------

export function DetailPanel() {
  const selectedId = useUIStore((s) => s.selectedId);
  const { focus, openPanel, closePanel, setActiveWonder, enterWonderExplore } = useUIStore();

  const body = getBody(selectedId ?? undefined);
  const wonder = !body ? getWonder(selectedId ?? '') : undefined;

  if (!body && !wonder) return null;

  // ---- Body mode ----
  if (body) {
    const kindLabel = (() => {
      if (body.kind === 'star') return 'Star';
      if (body.kind === 'planet') return 'Planet';
      if (body.kind === 'dwarf') return 'Dwarf planet';
      if (body.kind === 'moon') {
        const parent = getBody(body.parentId ?? undefined);
        return parent ? `Moon of ${parent.name}` : 'Moon';
      }
      return body.kind;
    })();

    const s = body.stats;
    const gravityHint = `${(s.gravityMs2 / EARTH_G).toFixed(2)}× Earth's gravity`;
    const rotLabel = s.rotationPeriodHours < 0
      ? `${formatDuration(Math.abs(s.rotationPeriodHours) / 24)} (retrograde)`
      : formatDuration(Math.abs(s.rotationPeriodHours) / 24);

    const footer = (
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Learn more"
          onClick={() => openPanel('learn')}
          className="hud-button flex-1 py-1.5 text-xs"
        >
          Learn more
        </button>
        <button
          type="button"
          aria-label={`Focus camera on ${body.name}`}
          onClick={() => focus(body.id)}
          className="hud-button flex-1 py-1.5 text-xs"
        >
          Focus
        </button>
      </div>
    );

    return (
      <Panel
        title={body.name}
        subtitle={kindLabel}
        onClose={() => closePanel('detail')}
        footer={footer}
      >
        <p className="mb-3 text-xs leading-relaxed text-slate-300">{body.description}</p>

        <SectionTitle>Statistics</SectionTitle>
        <dl className="grid grid-cols-2 gap-1.5">
          <Stat label="Diameter" value={`${s.diameterKm.toLocaleString('en-US')} km`} />
          <Stat
            label="Distance from Sun"
            value={s.distanceFromSunKm !== null ? formatDistance(s.distanceFromSunKm) : '—'}
          />
          <Stat
            label="Surface temperature"
            value={formatTemp(s.meanTempC, s.minTempC, s.maxTempC)}
          />
          <Stat
            label="Gravity"
            value={`${s.gravityMs2.toFixed(2)} m/s²`}
            hint={gravityHint}
          />
          <Stat
            label="Orbital period"
            value={s.orbitalPeriodDays !== null ? formatDuration(s.orbitalPeriodDays) : '—'}
          />
          <Stat label="Rotation period" value={rotLabel} />
          <Stat label="Moons" value={s.moonCount} />
          <Stat label="Mass" value={formatMass(s.massKg)} />
          <Stat label="Density" value={`${s.meanDensityGcm3.toFixed(2)} g/cm³`} />
          <Stat label="Escape velocity" value={`${s.escapeVelocityKms.toFixed(2)} km/s`} />
          <Stat label="Axial tilt" value={`${s.axialTiltDeg.toFixed(2)}°`} />
        </dl>

        <SectionTitle>Composition</SectionTitle>
        <p className="text-xs leading-relaxed text-slate-300">{s.composition}</p>

        <SectionTitle>Atmosphere</SectionTitle>
        <p className="text-xs leading-relaxed text-slate-300">{s.atmosphere}</p>

        <SectionTitle>Did you know</SectionTitle>
        <FactList facts={body.facts} />

        {body.gallery && body.gallery.length > 0 && <Gallery images={body.gallery} />}
      </Panel>
    );
  }

  // ---- Wonder mode ----
  const site = wonder!;

  // Determine planet index for ordering context
  const planetIdx = PLANETS.findIndex((p) => p.id === 'earth');
  const ordinal = planetIdx >= 0 ? `${planetIdx + 1}th planet` : '';
  void ordinal; // unused in wonder mode

  const footer = (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-label={`Walk around ${site.name} in 3D`}
        onClick={() => enterWonderExplore(site.id)}
        className="hud-button w-full py-2 text-xs font-semibold"
        data-active
      >
        ⛶ Walk around in 3D
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Learn more about this wonder"
          onClick={() => openPanel('learn')}
          className="hud-button flex-1 py-1.5 text-xs"
        >
          Learn more
        </button>
        <button
          type="button"
          aria-label="Back to Earth"
          onClick={() => {
            setActiveWonder(null);
            focus('earth');
          }}
          className="hud-button flex-1 py-1.5 text-xs"
        >
          Back to Earth
        </button>
      </div>
    </div>
  );

  return (
    <Panel
      title={site.name}
      subtitle={site.country}
      onClose={() => closePanel('detail')}
      footer={footer}
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-accent-500/20 px-2 py-0.5 text-[0.65rem] text-accent-300">
          {site.category}
        </span>
        {site.honorary && (
          <span className="rounded-full bg-solar-400/20 px-2 py-0.5 text-[0.65rem] text-solar-300">
            Honorary
          </span>
        )}
      </div>

      <p className="mb-3 text-xs leading-relaxed text-slate-300">{site.description}</p>

      <SectionTitle>Details</SectionTitle>
      <dl className="grid grid-cols-2 gap-1.5">
        <Stat label="Country" value={site.country} />
        <Stat label="Built" value={site.built} />
        <Stat label="Category" value={site.category} />
        <Stat label="Coordinates" value={formatLatLon(site.latitude, site.longitude)} />
      </dl>

      <SectionTitle>Did you know</SectionTitle>
      <FactList facts={site.facts} />

      {site.gallery && site.gallery.length > 0 && <Gallery images={site.gallery} />}
    </Panel>
  );
}
