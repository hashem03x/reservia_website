import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, viewportOnce } from '../../motion/variants';
import styles from './CardGrid.module.css';

export function CardGrid({ columns = 3, children }: { columns?: 2 | 3 | 4; children: ReactNode }) {
  return (
    <motion.div
      className={`${styles.grid} ${styles[`cols${columns}`]}`}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}
