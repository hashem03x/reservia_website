import { useEffect, useMemo, useRef } from 'react';

interface Spark {
  top: string;
  left: string;
  size: number;
  delay: number;
  duration: number;
  color: 'sun' | 'teal' | 'navy';
}

const COLORS = ['sun', 'teal', 'navy'] as const;

/**
 * Deterministic pseudo-random sequence (mulberry32). Positions must be the
 * same in the prerendered HTML and in the browser, or hydration would
 * mismatch -- Math.random() during render cannot guarantee that.
 */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSparks(count: number): Spark[] {
  const random = seeded(20261022);
  const sparks: Spark[] = [];
  for (let i = 0; i < count; i++) {
    sparks.push({
      top: `${8 + random() * 74}%`,
      left: `${4 + random() * 58}%`,
      size: 3 + Math.round(random() * 3),
      delay: random() * 6,
      duration: 4.5 + random() * 3,
      color: COLORS[i % COLORS.length],
    });
  }
  return sparks;
}

/**
 * Decorative, occasional "electric spark" flashes for the hero background.
 * Pure CSS keyframes drive the actual animation (no per-frame JS); this
 * component only picks fixed (seeded) positions once. Hidden
 * entirely on small screens and under prefers-reduced-motion via CSS
 * (see the "energy effects" block in reservia.css), and paused while the
 * browser tab isn't visible so it never costs anything off-screen.
 */
export function EnergySparks({ count = 6 }: { count?: number }) {
  const sparks = useMemo(() => makeSparks(count), [count]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onVisibilityChange() {
      const state = document.hidden ? 'paused' : 'running';
      el!.querySelectorAll<HTMLElement>('.spark').forEach((s) => {
        s.style.animationPlayState = state;
      });
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  return (
    <div className="energySparks" ref={ref} aria-hidden="true">
      {sparks.map((s, i) => (
        <span
          key={i}
          className={`spark spark-${s.color}`}
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
