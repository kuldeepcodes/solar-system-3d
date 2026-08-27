import { Panel, SectionTitle, Toggle } from './Glass';
import { useUIStore } from '../state/useUIStore';
import { WONDERS } from '../data/wonders';
import { focusOnSite } from '../scene/siteFocus';

export function WondersPanel() {
  const wondersVisible = useUIStore((s) => s.wondersVisible);
  const activeWonderId = useUIStore((s) => s.activeWonderId);
  const { setWondersVisible, closePanel, enterWonderExplore } = useUIStore();

  function handleSiteClick(id: string) {
    const site = WONDERS.find((w) => w.id === id);
    if (site) focusOnSite(site);
  }

  return (
    <Panel
      title="Wonders of the World"
      onClose={() => closePanel('wonders')}
    >
      <p className="mb-3 text-xs leading-relaxed text-slate-300">
        The <span className="text-accent-300 font-medium">New7Wonders of the World</span> are a modern selection
        voted by over 100 million people worldwide, announced in 2007. The{' '}
        <span className="text-solar-300 font-medium">Great Pyramid of Giza</span> is the only surviving Wonder of
        the Ancient World and holds honorary status. Select a wonder to fly the camera to its true latitude and
        longitude on Earth's surface.
      </p>

      <p className="mb-3 rounded-lg bg-space-800 px-3 py-2 text-[0.68rem] leading-snug text-slate-400">
        💡 Tip: Pause or slow down time to keep the camera over a site while Earth is rotating.
      </p>

      <Toggle
        label="Show markers on Earth"
        checked={wondersVisible}
        onChange={setWondersVisible}
      />

      <SectionTitle>Sites</SectionTitle>

      <div className="space-y-2">
        {WONDERS.map((site) => {
          const isActive = site.id === activeWonderId;
          return (
            <div
              key={site.id}
              className={`w-full rounded-xl border transition-colors ${
                isActive
                  ? 'border-accent-400/50 bg-accent-500/15'
                  : 'border-white/8 bg-white/4 hover:border-white/15 hover:bg-white/6'
              }`}
            >
              <button
                type="button"
                aria-label={`Fly to ${site.name} on the globe`}
                aria-pressed={isActive}
                onClick={() => handleSiteClick(site.id)}
                className="w-full px-3 pt-2.5 pb-1.5 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-100">{site.name}</p>
                    <p className="text-[0.65rem] text-slate-400">
                      {site.country} · {site.built}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded-full bg-accent-500/20 px-2 py-0.5 text-[0.6rem] text-accent-300">
                      {site.category}
                    </span>
                    {site.honorary && (
                      <span className="rounded-full bg-solar-400/20 px-2 py-0.5 text-[0.6rem] text-solar-300">
                        Honorary
                      </span>
                    )}
                  </div>
                </div>
              </button>

              <div className="px-3 pb-2.5">
                <button
                  type="button"
                  aria-label={`Walk around ${site.name} in 3D`}
                  onClick={() => enterWonderExplore(site.id)}
                  className="hud-button w-full py-1.5 text-[0.68rem] font-medium"
                >
                  ⛶ Walk around in 3D
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
