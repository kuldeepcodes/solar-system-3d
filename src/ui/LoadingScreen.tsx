import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useProgress } from '@react-three/drei';

const TIPS = [
  'Double-click any object to fly to it.',
  'Press / to search for any planet, moon or wonder.',
  'Focus Earth and open the Wonders panel to explore all eight sites.',
  'Switch to realistic scale to see the true emptiness of space.',
  'Open the Eclipses panel to watch a real solar eclipse unfold.',
  'Drag to orbit, scroll to zoom, right-drag to pan.',
];

/**
 * Intro overlay.
 *
 * Detects WebGL2 support up front - without it the Canvas renders a blank black
 * screen with only a console error, which is a confusing failure mode.
 */
export function LoadingScreen() {
  const { progress, active } = useProgress();
  const [dismissed, setDismissed] = useState(false);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      setWebglOk(Boolean(canvas.getContext('webgl2')));
    } catch {
      setWebglOk(false);
    }
  }, []);

  useEffect(() => {
    // The scene is usable well before every texture has decoded, so the overlay
    // clears on a short timer rather than waiting for 100%.
    const timer = setTimeout(() => setDismissed(true), 1600);
    return () => clearTimeout(timer);
  }, []);

  if (!webglOk) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-space-950 px-6 text-center">
        <div className="glass max-w-md rounded-2xl px-6 py-8">
          <h1 className="text-lg font-semibold text-accent-100">WebGL2 is required</h1>
          <p className="mt-3 text-xs leading-relaxed text-slate-300">
            This browser could not create a WebGL2 context, so the 3D Solar System cannot start. Try a recent
            version of Chrome, Edge, Firefox or Safari, and make sure hardware acceleration is enabled in your
            browser settings.
          </p>
        </div>
      </div>
    );
  }

  const visible = !dismissed || (active && progress < 100);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-space-950"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-5 px-6 text-center"
          >
            <div className="relative size-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-accent-400/30"
              >
                <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-accent-300" />
              </motion.div>
              <div className="absolute inset-[30%] rounded-full bg-solar-400 shadow-[0_0_28px_8px_rgba(255,180,84,0.45)]" />
            </div>

            <div>
              <h1 className="text-sm font-semibold tracking-[0.28em] text-accent-100 uppercase">Solar System</h1>
              <p className="mt-1.5 text-[0.7rem] text-slate-500">{tip}</p>
            </div>

            <div className="h-0.5 w-40 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-accent-400"
                initial={{ width: '10%' }}
                animate={{ width: `${Math.max(progress, 12)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
