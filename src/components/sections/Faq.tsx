import type { Dictionary } from '../../i18n/translations/en';

/** Ported from the template's `<details><summary>...<p>...` FAQ pattern. */
export function Faq({ t, items }: { t: Dictionary; items: Array<[string, string]> }) {
  return (
    <>
      <h2>{t.faq_t}</h2>
      {items.map(([q, a]) => (
        <details key={q}>
          <summary>{t[q]}</summary>
          <p>{t[a]}</p>
        </details>
      ))}
    </>
  );
}

/** Resolves [question, answer] text pairs for FAQPage structured data, mirroring the template's DOM-derived JSON-LD. */
export function faqPairs(t: Dictionary, keys: Array<[string, string]>): Array<[string, string]> {
  return keys.map(([q, a]) => [t[q], t[a]]);
}
