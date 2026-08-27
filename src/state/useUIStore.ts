import { create } from 'zustand';

export type ViewMode = 'orbit' | 'surface' | 'spacecraft';

export type PanelId = 'detail' | 'learn' | 'compare' | 'settings' | 'wonders' | 'tour' | 'measure' | 'travel' | 'eclipse';

interface UIState {
  /** Currently selected body id, or a surface-site id when a wonder is active. */
  selectedId: string | null;
  /** Body the camera is orbiting. Always a body id, never a surface site. */
  focusId: string;
  /** Incremented to re-trigger a camera fly-to even when focusId is unchanged. */
  focusNonce: number;
  hoveredId: string | null;

  mode: ViewMode;
  openPanels: Set<PanelId>;
  searchOpen: boolean;

  /** Earth 7 Wonders layer. */
  wondersVisible: boolean;
  activeWonderId: string | null;

  compareA: string | null;
  compareB: string | null;

  measureFrom: string | null;
  measureTo: string | null;

  travelFrom: string;
  travelTo: string;
  travelProgress: number;
  travelPlaying: boolean;

  tourIndex: number;
  tourPlaying: boolean;

  activeEclipseId: string | null;
  surfaceBodyId: string | null;

  select: (id: string | null) => void;
  /**
   * Point the camera at a body. By default this also selects it, but the
   * 7 Wonders flow needs to focus Earth while keeping the *site* selected, so
   * selection can be preserved explicitly.
   */
  focus: (id: string, options?: { keepSelection?: boolean }) => void;
  setHovered: (id: string | null) => void;
  setMode: (mode: ViewMode) => void;
  openPanel: (panel: PanelId) => void;
  closePanel: (panel: PanelId) => void;
  togglePanel: (panel: PanelId) => void;
  closeAllPanels: () => void;
  setSearchOpen: (open: boolean) => void;

  setWondersVisible: (visible: boolean) => void;
  setActiveWonder: (id: string | null) => void;

  setCompare: (slot: 'A' | 'B', id: string | null) => void;
  setMeasure: (slot: 'from' | 'to', id: string | null) => void;
  clearMeasure: () => void;

  setTravel: (slot: 'from' | 'to', id: string) => void;
  setTravelProgress: (progress: number) => void;
  setTravelPlaying: (playing: boolean) => void;

  setTourIndex: (index: number) => void;
  setTourPlaying: (playing: boolean) => void;

  setActiveEclipse: (id: string | null) => void;
  enterSurface: (bodyId: string) => void;
  exitSurface: () => void;
  escape: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  selectedId: 'earth',
  focusId: 'sun',
  focusNonce: 0,
  hoveredId: null,

  mode: 'orbit',
  openPanels: new Set<PanelId>(),
  searchOpen: false,

  wondersVisible: false,
  activeWonderId: null,

  compareA: 'earth',
  compareB: 'mars',

  measureFrom: null,
  measureTo: null,

  travelFrom: 'earth',
  travelTo: 'mars',
  travelProgress: 0,
  travelPlaying: false,

  tourIndex: 0,
  tourPlaying: false,

  activeEclipseId: null,
  surfaceBodyId: null,

  select: (selectedId) => set({ selectedId }),
  focus: (id, options) =>
    set((s) => ({
      focusId: id,
      selectedId: options?.keepSelection ? s.selectedId : id,
      focusNonce: s.focusNonce + 1,
    })),
  setHovered: (hoveredId) => set({ hoveredId }),
  setMode: (mode) => set({ mode }),

  openPanel: (panel) => set((s) => ({ openPanels: new Set(s.openPanels).add(panel) })),
  closePanel: (panel) =>
    set((s) => {
      const next = new Set(s.openPanels);
      next.delete(panel);
      return { openPanels: next };
    }),
  togglePanel: (panel) =>
    set((s) => {
      const next = new Set(s.openPanels);
      if (next.has(panel)) next.delete(panel);
      else next.add(panel);
      return { openPanels: next };
    }),
  closeAllPanels: () => set({ openPanels: new Set<PanelId>() }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),

  setWondersVisible: (wondersVisible) =>
    set({ wondersVisible, activeWonderId: wondersVisible ? get().activeWonderId : null }),
  setActiveWonder: (activeWonderId) => set({ activeWonderId }),

  setCompare: (slot, id) => set(slot === 'A' ? { compareA: id } : { compareB: id }),
  setMeasure: (slot, id) => set(slot === 'from' ? { measureFrom: id } : { measureTo: id }),
  clearMeasure: () => set({ measureFrom: null, measureTo: null }),

  setTravel: (slot, id) => set(slot === 'from' ? { travelFrom: id } : { travelTo: id }),
  setTravelProgress: (travelProgress) => set({ travelProgress }),
  setTravelPlaying: (travelPlaying) => set({ travelPlaying }),

  setTourIndex: (tourIndex) => set({ tourIndex }),
  setTourPlaying: (tourPlaying) => set({ tourPlaying }),

  setActiveEclipse: (activeEclipseId) => set({ activeEclipseId }),

  enterSurface: (bodyId) => set({ mode: 'surface', surfaceBodyId: bodyId, focusId: bodyId }),
  exitSurface: () => set({ mode: 'orbit', surfaceBodyId: null }),

  /** Escape backs out one layer at a time rather than dumping all state at once. */
  escape: () => {
    const state = get();
    if (state.searchOpen) return set({ searchOpen: false });
    if (state.mode !== 'orbit') return set({ mode: 'orbit', surfaceBodyId: null, travelPlaying: false });
    if (state.activeWonderId) return set({ activeWonderId: null });
    if (state.openPanels.size > 0) return set({ openPanels: new Set<PanelId>() });
    return undefined;
  },
}));
