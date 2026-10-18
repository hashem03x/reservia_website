import { useRef, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { env } from '../config/env';
import { useUtmParams } from '../hooks/useUtmParams';
import { waHref } from '../services/whatsapp';
import { submitLead, segmentGroup } from '../services/leadService';
import { trackLeadGenerated, trackWhatsappClick } from '../services/analytics';
import type { Segment } from '../config/navigation';

/** index -> segment, matching the template's qform `segs` array for o1..o7. */
const SITE_TYPE_SEGMENTS: Segment[] = ['villas', 'compounds', 'agriculture', 'industrial', 'industrial', 'service', 'general'];
const SITE_TYPE_LABEL_KEYS = ['o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7'];

function ContactRow({ id, label, value, dir }: { id: string; label: string; value: string; dir?: 'ltr' }) {
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
      <small>{label}</small>
      <span className="v" id={id} ref={valueRef} dir={dir}>{value}</span>
      <button className="copy" type="button" onClick={handleCopy} aria-describedby={id}>
        {copied ? t.copied : t.copy}
      </button>
    </div>
  );
}

export default function Contact() {
  const { t, language } = useLanguage();
  const utm = useUtmParams();
  const location = useLocation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [siteTypeIndex, setSiteTypeIndex] = useState(0);
  const [gov, setGov] = useState('');
  const [note, setNote] = useState('');
  const [nameInvalid, setNameInvalid] = useState(false);
  const [phoneInvalid, setPhoneInvalid] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'sent' | 'mock' | 'error'>('idle');
  const [waLink, setWaLink] = useState<string | null>(null);
  const submittingRef = useRef(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nameBad = !name.trim();
    const phoneBad = (phone.match(/\d/g) || []).length < 8;
    setNameInvalid(nameBad);
    setPhoneInvalid(phoneBad);
    if (nameBad || phoneBad) {
      setFormStatus('error');
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;

    const segment = SITE_TYPE_SEGMENTS[siteTypeIndex] ?? 'general';
    const eventId = trackLeadGenerated({
      segment,
      segmentGroup: segmentGroup(segment),
      source: 'contact_form',
      page: location.pathname,
      lang: language,
    });

    const result = await submitLead(
      { name: name.trim(), phone: phone.trim(), segment, governorate: gov.trim() || undefined, message: note.trim() || undefined, source: 'contact_form' },
      { eventId, lang: language, utm },
    );
    submittingRef.current = false;

    setFormStatus(result.status === 'error' ? 'error' : result.status);
    if (result.status !== 'error') {
      const bits = [t[SITE_TYPE_LABEL_KEYS[siteTypeIndex]], gov.trim(), note.trim()].filter(Boolean).join(', ');
      setWaLink(waHref(language, segment, `${bits} - ${name.trim()}`));
    }
  }

  const formMessage =
    formStatus === 'sent' || formStatus === 'mock'
      ? { text: t.q_done, color: 'var(--leaf)' }
      : formStatus === 'error' && (nameInvalid || phoneInvalid)
        ? { text: nameInvalid && phoneInvalid ? t.q_err : nameInvalid ? t.q_err_name : t.q_err_phone, color: 'var(--err)' }
        : null;

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
            <ContactRow id="c1" label={t.ct_biz} value={env.businessEmail} />
            <ContactRow id="c2" label={t.ct_sales} value={env.salesEmail} />
            <ContactRow id="c3" label={t.ct_phone} value={env.mobilePhone} dir="ltr" />
            <ContactRow id="c4" label={t.ct_land} value={env.officePhone} dir="ltr" />
            <div>
              <small>{t.ct_addr_l}</small>
              <span className="v" style={{ fontFamily: 'var(--body)', userSelect: 'text' }}>{t.ct_addr}</span>
            </div>
            <div>
              <small>{t.ct_web}</small>
              <span className="v">{env.website}</span>
            </div>
            <div style={{ borderBottom: 0 }}>
              <a
                className="btn wa"
                href={waHref(language, 'general')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsappClick('general', segmentGroup('general'), location.pathname)}
              >
                {t.h_cta_wa}
              </a>
            </div>
          </div>

          <form className="panel" noValidate onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="q_name">{t.q_name}</label>
              <input
                id="q_name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={nameInvalid}
                aria-describedby="qmsg"
              />
            </div>
            <div className="field">
              <label htmlFor="q_phone">{t.q_phone}</label>
              <input
                id="q_phone"
                type="tel"
                required
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={phoneInvalid}
                aria-describedby="q_phone_h qmsg"
              />
              <span className="hint" id="q_phone_h">{t.q_phone_h}</span>
            </div>
            <div className="field">
              <label htmlFor="q_type">{t.q_type}</label>
              <select id="q_type" value={siteTypeIndex} onChange={(e) => setSiteTypeIndex(Number(e.target.value))}>
                {SITE_TYPE_LABEL_KEYS.map((key, i) => (
                  <option key={key} value={i}>{t[key]}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="q_gov"><span>{t.q_gov}</span> <span className="opt">{t.q_opt}</span></label>
              <input id="q_gov" type="text" autoComplete="address-level1" value={gov} onChange={(e) => setGov(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="q_note"><span>{t.q_msg}</span> <span className="opt">{t.q_opt}</span></label>
              <textarea id="q_note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <button className="btn sun" type="submit" style={{ width: '100%' }}>
              {t.q_send}
            </button>
            {formMessage && (
              <p className="formmsg" id="qmsg" role="status" style={{ color: formMessage.color }}>
                {formMessage.text}
              </p>
            )}
            {waLink && (
              <a
                className="btn wa qwa"
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsappClick(SITE_TYPE_SEGMENTS[siteTypeIndex], segmentGroup(SITE_TYPE_SEGMENTS[siteTypeIndex]), location.pathname)}
              >
                {t.lp_wa}
              </a>
            )}
            <p className="lp-priv">{t.q_priv}</p>
          </form>
        </div>
      </section>
    </>
  );
}
