import type { ReactNode } from 'react';
import styles from './Form.module.css';

export function Field({
  id,
  label,
  error,
  required,
  optionalHint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  optionalHint?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {optionalHint && <span className={styles.optional}>{optionalHint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
