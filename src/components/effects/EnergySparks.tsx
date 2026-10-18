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

function makeSparks(count: number): Spark[] {
  const sparks: Spark[] = [];
  for (let i = 0; i < count; i++) {
    sparks.push({
      top: `${8 + Math.random() * 74}%`,
      left: `${4 + Math.random() * 58}%`,
      size: 3 + Math.round(Math.random() * 3),
      delay: Math.random() * 6,
      duration: 4.5 + Math.random() * 3,
      color: COLORS[i % COLORS.length],
    });
  }
  return sparks;
}

/**
 * Decorative, occasional "electric spark" flashes for the hero background.
 * Pure CSS keyframes drive the actual animation (no per-frame JS); this
 * component only picks fixed random positions once at mount. Hidden
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
