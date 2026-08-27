import { AnimatePresence, motion } from 'motion/react';
import { getBody } from '../data/bodies';
import { getWonder } from '../data/wonders';
import { useSimStore } from '../state/useSimStore';
import { useUIStore, type PanelId } from '../state/useUIStore';
import { SearchBox } from './SearchBox';
import { TimeControls } from './TimeControls';
import { DetailPanel } from './DetailPanel';
import { LearnPanel } from './LearnPanel';
import { ComparePanel } from './ComparePanel';
import { WondersPanel } from './WondersPanel';
import { MeasureTool } from './MeasureTool';
import { EclipsePanel } from './EclipsePanel';
import { TravelPanel } from './TravelPanel';
import { GuidedTour } from './GuidedTour';
import { Settings } from './Settings';

const TOOLS: { id: PanelId; label: string; glyph: string; hint: string }[] = [
  { id: 'detail', label: 'Details', glyph: 'ⓘ', hint: 'Object details' },
  { id: 'learn', label: 'Learn', glyph: '✦', hint: 'Learn more about the selection' },
  { id: 'wonders', label: 'Wonders', glyph: '⌖', hint: '7 Wonders on Earth (W)' },
  { id: 'compare', label: 'Compare', glyph: '⇹', hint: 'Compare two objects (C)' },
  { id: 'measure', label: 'Measure', glyph: '↔', hint: 'Measure distance (M)' },
  { id: 'eclipse', label: 'Eclipses', glyph: '◐', hint: 'Eclipse demonstrations (E)' },
  { id: 'travel', label: 'Travel', glyph: '➤', hint: 'Spacecraft travel mode' },
  { id: 'tour', label: 'Tour', glyph: '▷', hint: 'Guided tour (T)' },
  { id: 'settings', label: 'Settings', glyph: '⚙', hint: 'Settings (,)' },
];

const PANEL_COMPONENTS: Record<PanelId, () => React.ReactElement | null> = {
  detail: DetailPanel,
  learn: LearnPanel,
  compare: ComparePanel,
  wonders: WondersPanel,
  measure: MeasureTool,
  eclipse: EclipsePanel,
  travel: TravelPanel,
  tour: GuidedTour,
  settings: Settings,
};

/**
 * Heads-up display.
 *
 * The whole overlay is `pointer-events-none` so the 3D scene keeps receiving
 * drags everywhere except directly on a control. Individual interactive
 * elements opt back in with `pointer-events-auto`.
 */
export function Hud() {
  const openPanels = useUIStore((s) => s.openPanels);
  const togglePanel = useUIStore((s) => s.togglePanel);
  const selectedId = useUIStore((s) => s.selectedId);
  const mode = useUIStore((s) => s.mode);
  const exitSurface = useUIStore((s) => s.exitSurface);
  const setMode = useUIStore((s) => s.setMode);
  const scaleMode = useSimStore((s) => s.scaleMode);
  const toggleScaleMode = useSimStore((s) => s.toggleScaleMode);

  const selected = getBody(selectedId ?? undefined) ?? getWonder(selectedId ?? '');
  const panels = TOOLS.filter((tool) => openPanels.has(tool.id));

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col">
      {/* Top bar */}
      <div className="flex items-start gap-3 p-3 sm:p-4">
        <div className="pointer-events-auto hidden shrink-0 select-none md:block">
          <h1 className="text-sm font-semibold tracking-[0.2em] text-accent-100 uppercase">Solar System</h1>
          <p className="text-[0.62rem] tracking-wide text-slate-500">
            {selected ? selected.name : 'Interactive 3D explorer'}
          </p>
        </div>

        <div className="flex flex-1 justify-center">
          <SearchBox />
        </div>

        <div className="pointer-events-auto shrink-0">
          <button
            type="button"
            onClick={toggleScaleMode}
            className="hud-button px-2.5 py-1.5 text-[0.68rem] font-medium"
            title="Toggle between educational and true-to-life scale"
            aria-label={`Scale mode: ${scaleMode}. Click to switch.`}
          >
            {scaleMode === 'educational' ? 'Educational scale' : 'Realistic scale'}
          </button>
        </div>
      </div>

      {/* Mode banner */}
      <AnimatePresence>
        {mode !== 'orbit' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="pointer-events-auto mx-auto flex items-center gap-3 rounded-full glass px-3 py-1.5"
          >
            <span className="text-[0.68rem] tracking-wide text-accent-200 uppercase">
              {mode === 'surface' ? 'Surface mode' : 'Spacecraft transit'}
            </span>
            <button
              type="button"
              onClick={() => (mode === 'surface' ? exitSurface() : setMode('orbit'))}
              className="hud-button px-2 py-0.5 text-[0.65rem]"
              aria-label="Exit current mode"
            >
              Exit (Esc)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3 sm:px-4">
        <div className="flex-1" />

        {/* Panel column — becomes a bottom sheet on small screens */}
        <div className="pointer-events-none flex min-h-0 w-full flex-col justify-end gap-3 sm:w-[22rem] lg:w-[24rem]">
          <div className="scrollbar-none flex max-h-full min-h-0 flex-col gap-3 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {panels.map((tool) => {
                const Component = PANEL_COMPONENTS[tool.id];
                return (
                  <div key={tool.id} className="pointer-events-auto max-h-[70vh] min-h-0 shrink-0">
                    <Component />
                  </div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom dock */}
      <div className="flex flex-col items-center gap-2 p-3 sm:p-4">
        <TimeControls />

        <nav
          aria-label="Tools"
          className="glass pointer-events-auto flex max-w-full gap-1 overflow-x-auto rounded-2xl px-2 py-1.5 scrollbar-none"
        >
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              title={tool.hint}
              aria-label={tool.hint}
              aria-pressed={openPanels.has(tool.id)}
              data-active={openPanels.has(tool.id)}
              onClick={() => togglePanel(tool.id)}
              className="hud-button shrink-0 px-2.5 py-1.5 text-[0.68rem]"
            >
              <span aria-hidden className="text-sm leading-none">
                {tool.glyph}
              </span>
              <span className="hidden sm:inline">{tool.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
