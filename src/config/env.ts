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

const rawEnv = import.meta.env;

function readOr(value: string | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value : fallback;
}

export const env = {
  leadsApiUrl: rawEnv.VITE_LEADS_API_URL as string | undefined,
  whatsappNumber: readOr(rawEnv.VITE_WHATSAPP_NUMBER as string | undefined, '201211892995'),
  businessEmail: readOr(rawEnv.VITE_BUSINESS_EMAIL as string | undefined, 'Business_info@reservia-energy.com'),
  salesEmail: readOr(rawEnv.VITE_SALES_EMAIL as string | undefined, 'Reservia_Sales@reservia-energy.com'),
  mobilePhone: readOr(rawEnv.VITE_MOBILE_PHONE as string | undefined, '+20 121 189 2995'),
  officePhone: readOr(rawEnv.VITE_OFFICE_PHONE as string | undefined, '+20 2 2522 2814'),
  website: readOr(rawEnv.VITE_WEBSITE_HOST as string | undefined, 'reservia-energy.com'),
  siteUrl: (rawEnv.VITE_SITE_URL as string | undefined) ?? '',
  ga4MeasurementId: rawEnv.VITE_GA4_MEASUREMENT_ID as string | undefined,
  gtmContainerId: rawEnv.VITE_GTM_CONTAINER_ID as string | undefined,
  metaPixelId: rawEnv.VITE_META_PIXEL_ID as string | undefined,
  googleAdsConversionId: rawEnv.VITE_GOOGLE_ADS_CONVERSION_ID as string | undefined,
};

export const isLeadsApiConfigured = Boolean(env.leadsApiUrl && env.leadsApiUrl.trim().length > 0);
export const isGa4Configured = Boolean(env.ga4MeasurementId);
export const isGtmConfigured = Boolean(env.gtmContainerId);
export const isMetaPixelConfigured = Boolean(env.metaPixelId);
