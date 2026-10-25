/**
 * Default public contact details, as published in the supplied reference
 * template (Reservia.html). Shared by env.ts (the app) and vite.config.ts
 * (static HTML generation). Whether these may appear in structured data
 * is client decision 9 -- see VITE_PUBLISH_ORG_CONTACTS.
 */
export const CONTACT_DEFAULTS = {
  whatsappNumber: '201211892995',
  businessEmail: 'Business_info@reservia-energy.com',
  // Sales email and mobile as supplied by the client (October 2026), verbatim. NOTE: the sales
  // email's spelling ('Resrevia', 'reservia-energu.com') differs from the company domain
  // (reservia-energy.com, used for the business email and in the company profile) -- flagged
  // for confirmation; deliberately not corrected here.
  salesEmail: 'Resrevia_sales@reservia-energu.com',
  mobilePhone: '+201211892995',
  officePhone: '+20 2 2522 2814',
  website: 'reservia-energy.com',
} as const;
