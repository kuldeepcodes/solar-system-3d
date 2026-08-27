import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Shared glassmorphism primitives.
 *
 * Everything the panels need for consistent chrome lives here so individual
 * feature panels only deal with their own content.
 */

interface PanelProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  children: ReactNode;
  /** Which edge the panel docks to; controls the slide-in direction. */
  side?: 'left' | 'right';
  className?: string;
  footer?: ReactNode;
}

export function Panel({ title, subtitle, onClose, children, side = 'right', className = '', footer }: PanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, x: side === 'right' ? 28 : -28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: side === 'right' ? 28 : -28 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className={`glass pointer-events-auto flex flex-col overflow-hidden rounded-2xl ${className}`}
      aria-label={title}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-wide text-accent-100 uppercase">{title}</h2>
          {subtitle && <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p>}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="hud-button size-7 shrink-0 text-base leading-none"
          >
            ×
          </button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>

      {footer && <div className="shrink-0 border-t border-white/10 px-4 py-2.5">{footer}</div>}
    </motion.section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="glass-subtle rounded-lg px-2.5 py-2" title={hint}>
      <dt className="text-[0.62rem] font-medium tracking-wider text-slate-400 uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-100 tabular-nums">{value}</dd>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-4 mb-2 text-[0.68rem] font-semibold tracking-[0.14em] text-accent-300 uppercase first:mt-0">
      {children}
    </h3>
  );
}

export function FactList({ facts }: { facts: string[] }) {
  return (
    <ul className="space-y-1.5">
      {facts.map((fact) => (
        <li key={fact} className="flex gap-2 text-xs leading-relaxed text-slate-300">
          <span aria-hidden className="mt-[0.35rem] size-1 shrink-0 rounded-full bg-accent-400" />
          <span>{fact}</span>
        </li>
      ))}
    </ul>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}

export function Toggle({ label, checked, onChange, hint }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5" title={hint}>
      <span className="text-xs text-slate-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
          checked ? 'border-accent-400/60 bg-accent-500/40' : 'border-white/15 bg-white/5'
        }`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 34 }}
          className={`absolute top-0.5 size-3.5 rounded-full ${checked ? 'bg-accent-300' : 'bg-slate-400'}`}
          style={{ left: checked ? '1.15rem' : '0.15rem' }}
        />
      </button>
    </label>
  );
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string; title?: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex gap-1 rounded-lg bg-white/5 p-1">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          title={option.title}
          data-active={option.value === value}
          onClick={() => onChange(option.value)}
          className="hud-button flex-1 px-2 py-1 text-[0.7rem] font-medium"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Wrapper that animates a panel in and out of the layout. */
export function PanelHost({ open, children }: { open: boolean; children: ReactNode }) {
  return <AnimatePresence mode="wait">{open ? children : null}</AnimatePresence>;
}

export function BodySelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
  ariaLabel: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="glass-subtle w-full rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none"
    >
      {options.map((option) => (
        <option key={option.id} value={option.id} className="bg-space-800 text-slate-100">
          {option.name}
        </option>
      ))}
    </select>
  );
}
