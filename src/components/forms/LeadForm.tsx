import { useState } from 'react';
import { usePublishWaPrefill } from '../../services/waPrefill';
import { useLanguage } from '../../i18n/LanguageContext';
import { isLeadsApiConfigured } from '../../config/env';
import { useLeadForm } from '../../hooks/useLeadForm';
import { parseOptionalNumber, validateName, validateOptionalNumber, validatePhone } from '../../services/validation';
import { BillWaLink, WaLink } from '../ui/WaLink';
import { FieldErrorText } from './FieldErrorText';
import { monthlyValue } from '../../content/whatsappMessages';
import type { Segment } from '../../config/navigation';

/**
 * The reference template's `lpform`, shared by every campaign landing
 * page: name, phone, optional area, one optional numeric field whose
 * label is segment-specific. Field-specific localized validation, a
 * clear sending / sent / preview / failed state, and a lead event only
 * after confirmed delivery (see useLeadForm).
 */
export function LeadForm({
  segment,
  extraLabel,
  extraKind,
  idPrefix,
}: {
  segment: Segment;
  extraLabel: string;
  /** What the optional numeric field holds, so the WhatsApp message labels it correctly. */
  extraKind: 'billEgp' | 'dieselLitres' | 'pumpHp';
  idPrefix: string;
}) {
  const { t, language } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gov, setGov] = useState('');
  const [extra, setExtra] = useState('');
  const id = (f: string) => `${idPrefix}_${f}`;

  const { errors, status, done, onSubmit, clearError } = useLeadForm({
    fieldIds: { name: id('name'), phone: id('phone'), extra: id('extra') },
    validate: () => ({ name: validateName(name), phone: validatePhone(phone), extra: validateOptionalNumber(extra) }),
    build: () => ({
      name: name.trim(),
      phone: phone.trim(),
      segment,
      governorate: gov.trim() || undefined,
      siteInput: parseOptionalNumber(extra),
      source: 'landing_form',
    }),
  });

  const submitting = status === 'submitting';
  const locked = submitting || done;
  const hasErrors = Boolean(errors.name || errors.phone || errors.extra);
  const parsedExtra = parseOptionalNumber(extra);
  // Bill or diesel use fills "Monthly bill or consumption" with its real unit; pump size is
  // not a consumption figure, so it goes on an extra line instead.
  const waFields = {
    location: gov.trim(),
    monthly: extraKind === 'pumpHp' ? '' : monthlyValue(language, parsedExtra, extraKind),
    extra: extraKind === 'pumpHp' && parsedExtra !== undefined ? `${extraLabel}: ${parsedExtra}` : '',
  };
  usePublishWaPrefill(waFields.location, waFields.monthly);

  return (
    <form className="panel lpform" data-seg={segment} noValidate onSubmit={onSubmit} aria-labelledby={id('t')} aria-busy={submitting}>
      <h2 className="fh" id={id('t')} style={{ marginBottom: 14 }}>{t.lp_form_t}</h2>
      <div className="field">
        <label htmlFor={id('name')}>{t.q_name}</label>
        <input
          id={id('name')}
          name="name"
          type="text"
          required
          aria-required="true"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError('name');
          }}
          disabled={locked}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? id('name_e') : undefined}
        />
        <FieldErrorText id={id('name_e')} field="name" error={errors.name} />
      </div>
      <div className="field">
        <label htmlFor={id('phone')}>{t.q_phone}</label>
        <input
          id={id('phone')}
          name="phone"
          type="tel"
          required
          aria-required="true"
          autoComplete="tel"
          inputMode="tel"
          dir="ltr"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            clearError('phone');
          }}
          disabled={locked}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? `${id('phone_e')} ${id('phone_h')}` : id('phone_h')}
        />
        <span className="hint" id={id('phone_h')}>{t.q_phone_h}</span>
        <FieldErrorText id={id('phone_e')} field="phone" error={errors.phone} />
      </div>
      <div className="field">
        <label htmlFor={id('gov')}><span>{t.q_gov}</span> <span className="opt">{t.q_opt}</span></label>
        <input id={id('gov')} name="gov" type="text" autoComplete="address-level2" value={gov} onChange={(e) => setGov(e.target.value)} disabled={locked} />
      </div>
      <div className="field">
        <label htmlFor={id('extra')}><span>{extraLabel}</span> <span className="opt">{t.q_opt}</span></label>
        <input
          id={id('extra')}
          name="extra"
          type="number"
          min={0}
          inputMode="decimal"
          value={extra}
          onChange={(e) => {
            setExtra(e.target.value);
            clearError('extra');
          }}
          disabled={locked}
          aria-invalid={Boolean(errors.extra)}
          aria-describedby={errors.extra ? id('extra_e') : undefined}
        />
        <FieldErrorText id={id('extra_e')} field="number" error={errors.extra} />
      </div>
      {!done && (
        <button className="btn sun" type="submit" style={{ width: '100%' }} disabled={submitting}>
          {submitting ? t.q_sending : t.q_send}
        </button>
      )}
      {!done && (
        // Residential & Commercial campaign pages only (BillWaLink enforces the rule).
        <BillWaLink segment={segment} style={{ width: '100%', marginTop: 10 }}>
          {t.lp_wa_direct}
        </BillWaLink>
      )}

      <div role="status" aria-live="polite">
        {hasErrors && <p className="formmsg err">{t.q_err_summary}</p>}
        {status === 'sent' && (
          <div className="lp-ok show">
            <b>{t.lp_ok_t}</b>
            <p style={{ marginTop: 6, fontSize: '.95rem', color: 'var(--muted)' }}>{t.lp_ok_d}</p>
          </div>
        )}
        {status === 'mock' && (
          <div className="lp-ok show warn">
            <b>{t.lp_mock_t}</b>
            <p style={{ marginTop: 6, fontSize: '.95rem', color: 'var(--muted)' }}>{t.lp_mock_d}</p>
          </div>
        )}
      </div>
      {status === 'error' && (
        <div className="lp-ok show err" role="alert">
          <b>{t.q_fail}</b>
        </div>
      )}
      {(done || status === 'error') && (
        <WaLink segment={segment} fields={waFields} style={{ width: '100%', marginTop: 12 }}>
          {t.lp_wa}
        </WaLink>
      )}
      <p className="lp-priv">{isLeadsApiConfigured ? t.q_priv_live : t.lp_priv}</p>
    </form>
  );
}
