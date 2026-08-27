import { useEffect } from 'react';
import { useSimStore } from '../state/useSimStore';
import { useUIStore } from '../state/useUIStore';

/**
 * Global keyboard shortcuts.
 *
 * Deliberately inert while the user is typing in a field, and ignores any event
 * carrying a modifier so browser and OS shortcuts keep working.
 */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if (event.key === 'Escape') {
        useUIStore.getState().escape();
        if (typing) (target as HTMLElement).blur();
        return;
      }

      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      const ui = useUIStore.getState();
      const sim = useSimStore.getState();

      switch (event.key) {
        case ' ':
          event.preventDefault();
          sim.togglePaused();
          break;
        case '/':
          event.preventDefault();
          ui.setSearchOpen(true);
          document.getElementById('search-input')?.focus();
          break;
        case 'f':
        case 'F':
          if (ui.selectedId) ui.focus(ui.selectedId);
          break;
        case 'r':
        case 'R':
          ui.setMode('orbit');
          ui.focus('sun');
          break;
        case 'l':
        case 'L':
          sim.toggle('showLabels');
          break;
        case 'o':
        case 'O':
          sim.toggle('showOrbits');
          break;
        case 'c':
        case 'C':
          ui.togglePanel('compare');
          break;
        case 'm':
        case 'M':
          ui.togglePanel('measure');
          break;
        case 't':
        case 'T':
          ui.togglePanel('tour');
          break;
        case 'w':
        case 'W':
          ui.togglePanel('wonders');
          break;
        case 'e':
        case 'E':
          ui.togglePanel('eclipse');
          break;
        case ',':
          ui.togglePanel('settings');
          break;
        case '+':
        case '=':
          sim.cycleSpeed();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
