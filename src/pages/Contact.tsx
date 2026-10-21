import { useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { WaLink } from '../components/ui/WaLink';
import { FieldErrorText } from '../components/forms/FieldErrorText';
import { env, flags, isLeadsApiConfigured } from '../config/env';
import { useLeadForm } from '../hooks/useLeadForm';
import { trackCallClick, trackEmailClick } from '../services/analytics';
import { validateName, validatePhone } from '../services/validation';
import type { Segment } from '../config/navigation';
import type { CalculatorContext } from '../services/leadService';

/** Estimate handed over by the calculator's "Get an exact quote" link (router state, never the URL). */
function readCalcState(state: unknown): { context: CalculatorContext; summary: string } | null {
  const calc = (state as { calc?: { context?: CalculatorContext; summary?: string } } | null)?.calc;
  return calc && calc.context && typeof calc.summary === 'string' ? { context: calc.context, summary: calc.summary } : null;
}

/**
 * Site-type options, matching the template's qform o1..o7. `id` is the
 * value accepted by `?type=` so segment pages can preselect the right
 * option (e.g. the service page links to /contact?type=service).
 */
const SITE_TYPES: Array<{ id: string; labelKey: string; segment: Segment }> = [
  { id: 'home', labelKey: 'o1', segment: 'villas' },
  { id: 'compound', labelKey: 'o2', segment: 'compounds' },
  { id: 'farm', labelKey: 'o3', segment: 'agriculture' },
  { id: 'oilgas', labelKey: 'o4', segment: 'industrial' },
  { id: 'factory', labelKey: 'o5', segment: 'industrial' },
  { id: 'service', labelKey: 'o6', segment: 'service' },
  { id: 'other', labelKey: 'o7', segment: 'general' },
];

function ContactRow({ id, label, value, href, onActivate, dir }: { id: string; label: string; value: string; href?: string; onActivate?: () => void; dir?: 'ltr' }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const valueRef = useRef<HTMLSpanElement>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = valueRef.current;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div>
      <small id={`${id}-l`}>{label}</small>
      <span className="v" id={id} ref={valueRef} dir={dir}>
        {href ? (
          <a href={href} onClick={onActivate} aria-describedby={`${id}-l`}>
            {value}
          </a>
        ) : (
          value
        )}
      </span>
      <button className="copy" type="button" onClick={handleCopy} aria-describedby={id}>
        {copied ? t.copied : t.copy}
      </button>
      <span className="sr-only" role="status">{copied ? t.copied : ''}</span>
    </div>
  );
}

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export default function Contact() {
  const { t } = useLanguage();
  const location = useLocation();
  const [calc, setCalc] = useState(() => readCalcState(location.state));
  const [searchParams] = useSearchParams();
  const preselected = Math.max(0, SITE_TYPES.findIndex((o) => o.id === searchParams.get('type')));

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [siteTypeIndex, setSiteTypeIndex] = useState(preselected);
  const [gov, setGov] = useState('');
  const [note, setNote] = useState('');
  const siteType = SITE_TYPES[siteTypeIndex] ?? SITE_TYPES[SITE_TYPES.length - 1];

  const { errors, status, done, onSubmit, clearError } = useLeadForm({
    fieldIds: { name: 'q_name', phone: 'q_phone' },
    validate: () => ({ name: validateName(name), phone: validatePhone(phone) }),
    build: () => ({
      name: name.trim(),
      phone: phone.trim(),
      segment: siteType.segment,
      governorate: gov.trim() || undefined,
      message: note.trim() || undefined,
      source: 'contact_form',
      calculator: calc?.context,
    }),
  });

  const hasErrors = Boolean(errors.name || errors.phone);
  const submitting = status === 'submitting';
  // User-initiated continuation only: what they typed goes to WhatsApp if *they* click.
  const waDetails = '\n\n' + [t[siteType.labelKey], gov.trim(), note.trim()].filter(Boolean).join(', ');

  return (
    <>
      <Seo page="contact" path="/contact" />

      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">{t.ct_eyebrow}</span>
          <h1>{t.ct_title}</h1>
          <p className="lead">{t.ct_lead}</p>
        </div>
      </section>

      <section className="band">
        <div className="wrap two">
          <div className="contact-list">
            <ContactRow
              id="c1"
              label={t.ct_biz}
              value={env.businessEmail}
              href={flags.mailtoLinks ? `mailto:${env.businessEmail}` : undefined}
              onActivate={() => trackEmailClick(location.pathname)}
            />
            <ContactRow
              id="c2"
              label={t.ct_sales}
              value={env.salesEmail}
              href={flags.mailtoLinks ? `mailto:${env.salesEmail}` : undefined}
              onActivate={() => trackEmailClick(location.pathname)}
            />
            <ContactRow id="c3" label={t.ct_phone} value={env.mobilePhone} href={telHref(env.mobilePhone)} onActivate={() => trackCallClick(location.pathname)} dir="ltr" />
            <ContactRow id="c4" label={t.ct_land} value={env.officePhone} href={telHref(env.officePhone)} onActivate={() => trackCallClick(location.pathname)} dir="ltr" />
            <div>
              <small>{t.ct_addr_l}</small>
              <span className="v" style={{ fontFamily: 'var(--body)', userSelect: 'text' }}>{t.ct_addr}</span>
            </div>
            <div>
              <small>{t.ct_web}</small>
              <span className="v">{env.website}</span>
            </div>
            <div style={{ borderBottom: 0 }}>
              {/* General chat, not the bill CTA (that one is homepage + Residential & Commercial only). */}
              <WaLink segment="general">{t.wa_chat}</WaLink>
            </div>
          </div>

          <form className="panel" noValidate onSubmit={onSubmit} aria-labelledby="qform-t" aria-busy={submitting}>
            <h2 className="fh" id="qform-t" style={{ marginBottom: 14 }}>{t.lp_form_t}</h2>
            {calc && (
              <div className="calc-attached">
                <p><b>{t.ct_calc_attached}</b> {calc.summary}</p>
                {!done && !submitting && (
                  <button type="button" className="copy" onClick={() => setCalc(null)}>{t.ct_calc_remove}</button>
                )}
              </div>
            )}
            <div className="field">
              <label htmlFor="q_name">{t.q_name}</label>
              <input
                id="q_name"
                type="text"
                required
                aria-required="true"
                autoComplete="name"
                value={name}
                disabled={submitting || done}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError('name');
                }}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'q_name_e' : undefined}
              />
              <FieldErrorText id="q_name_e" field="name" error={errors.name} />
            </div>
            <div className="field">
              <label htmlFor="q_phone">{t.q_phone}</label>
              <input
                id="q_phone"
                type="tel"
                required
                aria-required="true"
                autoComplete="tel"
                inputMode="tel"
                dir="ltr"
                value={phone}
                disabled={submitting || done}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearError('phone');
                }}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'q_phone_e q_phone_h' : 'q_phone_h'}
              />
              <span className="hint" id="q_phone_h">{t.q_phone_h}</span>
              <FieldErrorText id="q_phone_e" field="phone" error={errors.phone} />
            </div>
            <div className="field">
              <label htmlFor="q_type">{t.q_type}</label>
              <select id="q_type" value={siteTypeIndex} disabled={submitting || done} onChange={(e) => setSiteTypeIndex(Number(e.target.value))}>
                {SITE_TYPES.map((o, i) => (
                  <option key={o.id} value={i}>{t[o.labelKey]}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="q_gov"><span>{t.q_gov}</span> <span className="opt">{t.q_opt}</span></label>
              <input id="q_gov" type="text" autoComplete="address-level2" value={gov} disabled={submitting || done} onChange={(e) => setGov(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="q_note"><span>{t.q_msg}</span> <span className="opt">{t.q_opt}</span></label>
              <textarea id="q_note" rows={3} value={note} disabled={submitting || done} onChange={(e) => setNote(e.target.value)} />
            </div>
            {!done && (
              <button className="btn sun" type="submit" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? t.q_sending : t.q_send}
              </button>
            )}

            <div role="status" aria-live="polite" className="formstatus">
              {hasErrors && <p className="formmsg err">{t.q_err_summary}</p>}
              {status === 'sent' && <p className="formmsg ok">{t.q_sent}</p>}
              {status === 'mock' && <p className="formmsg warn">{t.q_done}</p>}
            </div>
            {status === 'error' && (
              <p className="formmsg err" role="alert">{t.q_fail}</p>
            )}
            {(done || status === 'error') && (
              <WaLink segment={siteType.segment} extra={waDetails} className="btn wa qwa">
                {t.lp_wa}
              </WaLink>
            )}
            <p className="lp-priv">{isLeadsApiConfigured ? t.q_priv_live : t.q_priv}</p>
          </form>
        </div>
      </section>
    </>
  );
}
