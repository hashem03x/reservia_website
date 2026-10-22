/**
 * Organization structured data -- one definition shared by the React app
 * and the build-time static HTML (vite.config.ts), so they cannot drift.
 *
 * Only details already established on the site are included: the brand
 * name, its "Integrated Energy Solutions" descriptor and the Maadi, Cairo
 * location. Phone numbers and emails are added only when
 * VITE_PUBLISH_ORG_CONTACTS=true, because client decision 9 (legal
 * name, mobile number, both emails) is still open. No `legalName` and no
 * certification claims are published.
 */
export interface OrgContacts {
  businessEmail: string;
  salesEmail: string;
  officePhone: string;
  mobilePhone: string;
}

export function organizationJsonLd(options: { siteUrl?: string; contacts?: OrgContacts | null }): Record<string, unknown> {
  const base = (options.siteUrl ?? '').replace(/\/$/, '');
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Reservia Integrated Energy Solutions',
    alternateName: ['Reservia', 'ريزيرفيا'],
    description: 'Egyptian solar and storage EPC company based in Maadi, Cairo.',
    address: { '@type': 'PostalAddress', addressLocality: 'Maadi, Cairo', addressCountry: 'EG' },
    areaServed: 'EG',
  };
  if (base) {
    data['@id'] = `${base}/#organization`;
    data.url = `${base}/`;
    // The full Reservia logo (emblem + wordmark), generated from src/assets/brand/logo.webp.
    data.logo = { '@type': 'ImageObject', url: `${base}/icons/reservia-logo-512.png`, width: 512, height: 512 };
  }
  const c = options.contacts;
  if (c) {
    data.email = c.businessEmail;
    data.telephone = c.officePhone;
    data.contactPoint = [
      { '@type': 'ContactPoint', contactType: 'sales', email: c.salesEmail, telephone: c.mobilePhone, availableLanguage: ['en', 'ar'] },
    ];
  }
  return data;
}

/** Serializes JSON-LD safely for inline <script> use (no premature </script>). */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
