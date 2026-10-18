import { motion } from 'framer-motion';
import { Container } from '../ui/Container';
import { fadeInUp, viewportOnce } from '../../motion/variants';
import styles from './IntroSection.module.css';

export function IntroSection({ title, body }: { title: string; body: string }) {
  return (
    <section className={styles.section}>
      <Container narrow>
        <motion.div initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeInUp}>
          <h2>{title}</h2>
          <p className={styles.body}>{body}</p>
        </motion.div>
      </Container>
    </section>
  );
}
