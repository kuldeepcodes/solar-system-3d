import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BODIES, getBody } from '../data/bodies';
import { WONDERS } from '../data/wonders';
import { useUIStore } from '../state/useUIStore';
import { focusOnSite } from '../scene/siteFocus';

interface Result {
  id: string;
  name: string;
  subtitle: string;
  kind: 'body' | 'wonder';
}

const INDEX: Result[] = [
  ...BODIES.map((body) => ({
    id: body.id,
    name: body.name,
    subtitle:
      body.kind === 'moon'
        ? `Moon of ${getBody(body.parentId)?.name ?? '—'}`
        : body.kind === 'dwarf'
          ? 'Dwarf planet'
          : body.kind === 'star'
            ? 'Star'
            : 'Planet',
    kind: 'body' as const,
  })),
  ...WONDERS.map((site) => ({
    id: site.id,
    name: site.name,
    subtitle: `${site.country} · Wonder of the World`,
    kind: 'wonder' as const,
  })),
];

/**
 * Lightweight fuzzy matcher.
 *
 * Scores a prefix match highest, then a substring match, then a subsequence
 * match (so "gnmd" finds Ganymede). Returns `null` when there is no match at
 * all so the caller can filter cheaply.
 */
function score(query: string, target: string): number | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (t.startsWith(q)) return 1000 - t.length;
  const index = t.indexOf(q);
  if (index >= 0) return 700 - index * 5 - t.length;

  let qi = 0;
  let gaps = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti += 1) {
    if (t[ti] === q[qi]) qi += 1;
    else if (qi > 0) gaps += 1;
  }
  if (qi < q.length) return null;
  return 400 - gaps * 3 - t.length;
}

export function SearchBox() {
  const open = useUIStore((s) => s.searchOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return INDEX.slice(0, 8);
    return INDEX.map((entry) => {
      const best = Math.max(score(query, entry.name) ?? -Infinity, (score(query, entry.subtitle) ?? -Infinity) - 250);
      return { entry, best };
    })
      .filter((r) => Number.isFinite(r.best))
      .sort((a, b) => b.best - a.best)
      .slice(0, 8)
      .map((r) => r.entry);
  }, [query]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery('');
  }, [open]);

  const commit = (result: Result) => {
    const store = useUIStore.getState();
    if (result.kind === 'wonder') {
      const site = WONDERS.find((w) => w.id === result.id);
      if (site) focusOnSite(site);
    } else {
      store.focus(result.id);
      store.openPanel('detail');
    }
    setSearchOpen(false);
  };

  return (
    <div className="pointer-events-auto relative w-full max-w-md">
      <label className="sr-only" htmlFor="search-input">
        Search celestial objects
      </label>
      <input
        id="search-input"
        ref={inputRef}
        type="search"
        value={query}
        placeholder="Search planets, moons, wonders…  ( / )"
        onFocus={() => setSearchOpen(true)}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, results.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === 'Enter' && results[highlight]) {
            e.preventDefault();
            commit(results[highlight]);
            inputRef.current?.blur();
          } else if (e.key === 'Escape') {
            setSearchOpen(false);
            inputRef.current?.blur();
          }
        }}
        className="glass w-full rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
        role="combobox"
        aria-expanded={open}
        aria-controls="search-results"
        aria-autocomplete="list"
      />

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            id="search-results"
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="glass absolute top-full left-0 z-30 mt-1.5 w-full overflow-hidden rounded-xl py-1"
          >
            {results.map((result, i) => (
              <li key={`${result.kind}-${result.id}`} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  // `onMouseDown` fires before the input's blur, so the click
                  // is not lost when the dropdown unmounts.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(result);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left transition-colors ${
                    i === highlight ? 'bg-accent-500/20' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs font-medium text-slate-100">{result.name}</span>
                  <span className="text-[0.62rem] text-slate-400">{result.subtitle}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
