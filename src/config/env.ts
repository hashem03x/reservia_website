/**
 * Single read point for all public, build-time configuration.
 *
 * Nothing here is a secret -- Vite inlines `VITE_*` variables into the
 * client bundle. Defaults below for business contact details (WhatsApp
 * number, emails, office phone, address) are the real values published
 * in the supplied reference template (Reservia.html) -- they are public
 * contact information already shown on the site (tel:/mailto: links),
 * not invented. Every value remains overridable via environment
 * variables; see .env.example.
 */

import { CONTACT_DEFAULTS } from './contactDefaults';

const rawEnv = import.meta.env;

function readOr(value: string | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value : fallback;
}

export const env = {
  leadsApiUrl: rawEnv.VITE_LEADS_API_URL as string | undefined,
  // Reservia CRM - the real public lead-capture API base URL (e.g.
  // https://reserviabackend.vercel.app/api/v1), NOT the CRM's UI route
  // (reserviafrontend.vercel.app/crm). src/services/leadService.ts appends the actual intake
  // path to this. Separate from VITE_LEADS_API_URL on purpose: that one has always been "the
  // full URL to POST to" (potentially a future proxy in front of the CRM, per its own comment in
  // .env.example); this one is specifically the CRM's own base URL, as the integration brief
  // requires.
  crmUrl: (rawEnv.VITE_CRM_URL as string | undefined)?.replace(/\/$/, ''),
  // Amplitude Browser SDK 2.x (src/analytics/amplitude.ts) - a public, client-safe project API
  // key (never a secret - Amplitude's own browser keys are designed to be shipped in client code).
  amplitudeApiKey: rawEnv.VITE_AMPLITUDE_API_KEY as string | undefined,
  whatsappNumber: readOr(rawEnv.VITE_WHATSAPP_NUMBER as string | undefined, CONTACT_DEFAULTS.whatsappNumber),
  businessEmail: readOr(rawEnv.VITE_BUSINESS_EMAIL as string | undefined, CONTACT_DEFAULTS.businessEmail),
  salesEmail: readOr(rawEnv.VITE_SALES_EMAIL as string | undefined, CONTACT_DEFAULTS.salesEmail),
  mobilePhone: readOr(rawEnv.VITE_MOBILE_PHONE as string | undefined, CONTACT_DEFAULTS.mobilePhone),
  officePhone: readOr(rawEnv.VITE_OFFICE_PHONE as string | undefined, CONTACT_DEFAULTS.officePhone),
  website: readOr(rawEnv.VITE_WEBSITE_HOST as string | undefined, CONTACT_DEFAULTS.website),
  siteUrl: (rawEnv.VITE_SITE_URL as string | undefined) ?? '',
  ga4MeasurementId: rawEnv.VITE_GA4_MEASUREMENT_ID as string | undefined,
  gtmContainerId: rawEnv.VITE_GTM_CONTAINER_ID as string | undefined,
  metaPixelId: rawEnv.VITE_META_PIXEL_ID as string | undefined,
  googleAdsConversionId: rawEnv.VITE_GOOGLE_ADS_CONVERSION_ID as string | undefined,
};

function readFlag(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

/**
 * Client-decision switches (docs/CLIENT_DECISIONS.md). Both default to
 * off until Reservia confirms:
 *  - decision 8: whether displayed emails become clickable mailto: links;
 *  - decision 9: whether the legal name / phones / emails are published in
 *    Organization structured data.
 */
export const flags = {
  mailtoLinks: readFlag(rawEnv.VITE_ENABLE_MAILTO_LINKS as string | undefined),
  publishOrgContacts: readFlag(rawEnv.VITE_PUBLISH_ORG_CONTACTS as string | undefined),
};

/** E.164 without '+': country code + subscriber number, 8-15 digits in total. */
export function normalizeWhatsappNumber(value: string): string | null {
  const digits = value.replace(/[^\d]/g, '');
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

/** Validated wa.me destination, or null when the configured number is malformed (WhatsApp links are then hidden). */
export const whatsappDestination = normalizeWhatsappNumber(env.whatsappNumber);
export const isWhatsappConfigured = whatsappDestination !== null;

/**
 * True on Vercel preview deployments (VERCEL_ENV=preview, injected at build
 * time by vite.config.ts). Preview builds are noindex and their robots.txt
 * disallows crawling, so they can never compete with production.
 */
export const isPreviewDeployment = rawEnv.VITE_DEPLOY_ENV === 'preview';

export const isLeadsApiConfigured = Boolean(env.leadsApiUrl && env.leadsApiUrl.trim().length > 0);
export const isCrmConfigured = Boolean(env.crmUrl && env.crmUrl.trim().length > 0);
export const isAmplitudeConfigured = Boolean(env.amplitudeApiKey && env.amplitudeApiKey.trim().length > 0);
export const isGa4Configured = Boolean(env.ga4MeasurementId);
export const isGtmConfigured = Boolean(env.gtmContainerId);
export const isMetaPixelConfigured = Boolean(env.metaPixelId);
