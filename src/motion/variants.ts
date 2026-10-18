import type { Variants } from 'framer-motion';

/**
 * Shared Framer Motion variants. Reduced-motion handling is centralized
 * via <MotionConfig reducedMotion="user"> in App.tsx, so individual
 * components do not need to branch on prefers-reduced-motion themselves.
 */

export const EASE_STANDARD = [0.22, 1, 0.36, 1] as const;

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_STANDARD } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: EASE_STANDARD } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

export const viewportOnce = { once: true, margin: '-80px 0px' } as const;
