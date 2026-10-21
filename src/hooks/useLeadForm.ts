import { useRef, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useUtmParams } from './useUtmParams';
import { submitLead, type LeadFormInput } from '../services/leadService';
import { newEventId, trackLeadGenerated } from '../services/analytics';
import type { FieldError } from '../services/validation';

export type LeadFormStatus = 'idle' | 'submitting' | 'sent' | 'mock' | 'error';

/**
 * Shared submit flow for the contact form and the campaign form:
 *
 * 1. validate; on failure, focus the first invalid field (errors are
 *    rendered per field by the caller);
 * 2. reuse ONE event id per lead until it is delivered, so a retry after
 *    a network error cannot create a second CRM record or conversion
 *    (the id is also sent as an Idempotency-Key);
 * 3. submit to the lead endpoint;
 * 4. only on confirmed delivery ('sent') record the analytics lead,
 *    with non-identifying fields only. Preview ('mock') and errors never
 *    fire a lead event.
 */
export function useLeadForm<F extends string>({
  validate,
  build,
  fieldIds,
}: {
  validate: () => Partial<Record<F, FieldError>>;
  build: () => LeadFormInput;
  /** DOM id of each field, in visual order, for focusing the first error. */
  fieldIds: Record<F, string>;
}) {
  const { language } = useLanguage();
  const utm = useUtmParams();
  const location = useLocation();
  const [errors, setErrors] = useState<Partial<Record<F, FieldError>>>({});
  const [status, setStatus] = useState<LeadFormStatus>('idle');
  const inFlight = useRef(false);
  const eventId = useRef<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current || status === 'sent' || status === 'mock') return;

    const found = validate();
    const invalid = (Object.keys(fieldIds) as F[]).filter((k) => found[k]);
    setErrors(found);
    if (invalid.length > 0) {
      document.getElementById(fieldIds[invalid[0]])?.focus();
      return;
    }

    inFlight.current = true;
    setStatus('submitting');
    const input = build();
    eventId.current ??= newEventId();
    const id = eventId.current;
    const result = await submitLead(input, { eventId: id, lang: language, utm });
    inFlight.current = false;

    if (result.status === 'sent') {
      trackLeadGenerated(id, {
        segment: input.segment,
        source: input.source,
        page: location.pathname,
        lang: language,
        siteInput: input.siteInput,
      });
    }
    setStatus(result.status);
  }

  /** Clears one field's error as soon as the user edits it. */
  function clearError(field: F) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
  }

  const done = status === 'sent' || status === 'mock';
  return { errors, status, done, onSubmit, clearError };
}
