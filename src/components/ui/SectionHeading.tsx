import type { ElementType, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, viewportOnce } from '../../motion/variants';
import styles from './SectionHeading.module.css';

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
  as: Tag = 'h2',
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  center?: boolean;
  as?: ElementType;
}) {
  return (
    <motion.div
      className={[styles.wrap, center ? styles.center : ''].filter(Boolean).join(' ')}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeInUp}
    >
      {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
      <Tag>{title}</Tag>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </motion.div>
  );
}
