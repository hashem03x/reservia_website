/**
 * "Our partners" carousel data (homepage).
 *
 * EMPTY ON PURPOSE: no approved partner names or logos exist in the
 * project yet, and partnerships must not be invented. With an empty list
 * the section is not rendered in production, so the homepage shows no gap
 * and no fake logos. See docs/CLIENT_DECISIONS.md (partner assets).
 *
 * To add a partner: put the approved logo in src/assets/partners/ (SVG or
 * WebP, transparent background), import it, and append an entry:
 *
 *   import acme from '../assets/partners/acme.svg';
 *   { name: 'Acme Solar', logo: acme, shape: 'rounded', href: 'https://acme.example' }
 *
 * `shape`: 'circle' for square marks, 'rounded' (default) for wide wordmarks.
 * Logos keep their aspect ratio (object-fit: contain) and are never stretched.
 */
export interface Partner {
  /** Shown as the logo's alt text, in both languages (company names are not translated). */
  name: string;
  logo: string;
  shape?: 'circle' | 'rounded';
  /** Optional link to the partner's site (opens in a new tab). */
  href?: string;
}

export const PARTNERS: Partner[] = [];

/**
 * Show labelled placeholder tiles instead of hiding the section, so the
 * layout can be reviewed and tested before real logos arrive. On in dev;
 * in a build only with VITE_PARTNERS_PREVIEW=true. Never set it for production.
 */
export const PARTNERS_PREVIEW = import.meta.env.DEV || import.meta.env.VITE_PARTNERS_PREVIEW === 'true';
export const PREVIEW_TILE_COUNT = 8;
