/**
 * Default public contact details, as published in the supplied reference
 * template (Reservia.html). Shared by env.ts (the app) and vite.config.ts
 * (static HTML generation). Whether these may appear in structured data
 * is client decision 9 -- see VITE_PUBLISH_ORG_CONTACTS.
 */
export const CONTACT_DEFAULTS = {
  whatsappNumber: '201211892995',
  businessEmail: 'Business_info@reservia-energy.com',
  // Sales email, as corrected and reconfirmed by the client (26 October 2026 SEO re-audit):
  // 'Reservia_Sales@reservia-energy.com'. The client's 25 October confirmation used
  // 'Resrevia_sales' (a transposed-letter typo of 'Reservia'); the 26 October correction
  // supersedes it. See docs/CLIENT_DECISIONS.md §13.
  salesEmail: 'Reservia_Sales@reservia-energy.com',
  mobilePhone: '+201211892995',
  officePhone: '+20 2 2522 2814',
  website: 'reservia-energy.com',
} as const;
