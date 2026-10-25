/**
 * Default public contact details, as published in the supplied reference
 * template (Reservia.html). Shared by env.ts (the app) and vite.config.ts
 * (static HTML generation). Whether these may appear in structured data
 * is client decision 9 -- see VITE_PUBLISH_ORG_CONTACTS.
 */
export const CONTACT_DEFAULTS = {
  whatsappNumber: '201211892995',
  businessEmail: 'Business_info@reservia-energy.com',
  // Sales email and mobile as supplied and confirmed by the client (October 2026), verbatim
  // (the mailbox name is spelled 'Resrevia' as confirmed).
  salesEmail: 'Resrevia_sales@reservia-energy.com',
  mobilePhone: '+201211892995',
  officePhone: '+20 2 2522 2814',
  website: 'reservia-energy.com',
} as const;
