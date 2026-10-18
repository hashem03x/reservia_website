import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../motion/variants';
import { Container } from '../ui/Container';
import styles from './Hero.module.css';

export function Hero({
  eyebrow,
  title,
  lead,
  actions,
  variant = 'home',
}: {
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  actions?: ReactNode;
  variant?: 'home' | 'page';
}) {
  return (
    <section className={[styles.hero, variant === 'page' ? styles['hero--page'] : ''].join(' ')}>
      <Container>
        <motion.div
          className={styles.inner}
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.span className={styles.eyebrow} variants={fadeInUp}>
            {eyebrow}
          </motion.span>
          <motion.h1 className={styles.title} variants={fadeInUp}>
            {title}
          </motion.h1>
          <motion.p className={styles.lead} variants={fadeInUp}>
            {lead}
          </motion.p>
          {actions && (
            <motion.div className={styles.actions} variants={fadeInUp}>
              {actions}
            </motion.div>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
