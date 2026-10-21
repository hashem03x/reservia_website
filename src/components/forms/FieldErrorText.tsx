import { useLanguage } from '../../i18n/LanguageContext';
import type { FieldError } from '../../services/validation';

/** Field-specific, localized validation message, referenced from the input's aria-describedby. */
export function FieldErrorText({ id, field, error }: { id: string; field: 'name' | 'phone' | 'number'; error: FieldError | undefined }) {
  const { t } = useLanguage();
  if (!error) return null;
  const text = field === 'name' ? t.q_err_name : field === 'phone' ? t.q_err_phone : t.err_number;
  return (
    <p className="ferr" id={id}>
      {text}
    </p>
  );
}
