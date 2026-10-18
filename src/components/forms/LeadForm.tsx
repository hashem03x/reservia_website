import { useRef, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useUtmParams } from '../../hooks/useUtmParams';
import { submitLead, segmentGroup } from '../../services/leadService';
import { trackLeadGenerated, trackWhatsappClick } from '../../services/analytics';
import { waHref } from '../../services/whatsapp';
import type { Segment } from '../../config/navigation';

/**
 * The reference template's `lpform` (used identically on all five
 * campaign landing pages) -- name, phone, optional governorate, one
 * optional numeric field whose label is segment-specific. Ported
 * behavior: client-side required-field validation via the browser's own
 * reportValidity(), a dataLayer `generate_lead` event with no PII, and a
 * WhatsApp continuation link prefilled with what was entered.
 */
export function LeadForm({ segment, extraLabel, idPrefix }: { segment: Segment; extraLabel: string; idPrefix: string }) {
  const { t, language } = useLanguage();
  const utm = useUtmParams();
  const location = useLocation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gov, setGov] = useState('');
  const [extra, setExtra] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'mock' | 'error'>('idle');
  const submittingRef = useRef(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!name.trim() || !phone.trim()) {
      form.reportValidity();
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStatus('submitting');

    const eventId = trackLeadGenerated({
      segment,
      segmentGroup: segmentGroup(segment),
      source: 'landing_form',
      page: location.pathname,
      lang: language,
      siteInput: extra ? Number(extra) : undefined,
    });

    const result = await submitLead(
      {
        name: name.trim(),
        phone: phone.trim(),
        segment,
        governorate: gov.trim() || undefined,
        siteInput: extra ? Number(extra) : undefined,
        source: 'landing_form',
      },
      { eventId, lang: language, utm },
    );
    submittingRef.current = false;
    setStatus(result.status === 'error' ? 'error' : result.status);
  }

  const waText = `${extra ? extra + ' ' : ''}- ${name.trim()}`;
  const waLink = waHref(language, segment, waText);

  return (
    <form className="panel lpform" data-seg={segment} noValidate onSubmit={handleSubmit}>
      <h2 className="fh" style={{ marginBottom: 14 }}>{t.lp_form_t}</h2>
      <div className="field">
        <label htmlFor={`${idPrefix}_name`}>{t.q_name}</label>
        <input id={`${idPrefix}_name`} name="name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} disabled={status === 'submitting'} />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}_phone`}>{t.q_phone}</label>
        <input id={`${idPrefix}_phone`} name="phone" type="tel" required autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={status === 'submitting'} />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}_gov`}>{t.q_gov}</label>
        <input id={`${idPrefix}_gov`} name="gov" type="text" autoComplete="address-level1" value={gov} onChange={(e) => setGov(e.target.value)} disabled={status === 'submitting'} />
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}_extra`}>{extraLabel}</label>
        <input id={`${idPrefix}_extra`} name="extra" type="number" min={0} inputMode="numeric" value={extra} onChange={(e) => setExtra(e.target.value)} disabled={status === 'submitting'} />
      </div>
      <button className="btn sun" type="submit" style={{ width: '100%' }} disabled={status === 'submitting'}>
        {t.q_send}
      </button>
      <a
        className="btn wa"
        href={waHref(language, segment)}
        target="_blank"
        rel="noopener noreferrer"
        style={{ width: '100%', marginTop: 10 }}
        onClick={() => trackWhatsappClick(segment, segmentGroup(segment), location.pathname)}
      >
        {t.lp_wa_direct}
      </a>
      <p className="lp-priv">{t.lp_priv}</p>

      {(status === 'sent' || status === 'mock') && (
        <div className="lp-ok show" role="status" tabIndex={-1}>
          <b>{t.lp_ok_t}</b>
          <p style={{ marginTop: 6, fontSize: '.95rem', color: 'var(--muted)' }}>{t.lp_ok_d}</p>
          <a
            className="btn wa"
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginTop: 12 }}
            onClick={() => trackWhatsappClick(segment, segmentGroup(segment), location.pathname)}
          >
            {t.lp_wa}
          </a>
        </div>
      )}

      {status === 'error' && (
        <div className="lp-ok show" role="alert" style={{ borderColor: 'var(--err)' }}>
          <b style={{ color: 'var(--err)' }}>{t.q_err}</b>
        </div>
      )}
    </form>
  );
}
