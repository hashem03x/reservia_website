/**
 * Photos for the eight "How we work" step cards.
 *
 * Files: src/assets/steps/step-<n>-480.webp and step-<n>-960.webp (16:10,
 * cropped from the originals below). They are picked up automatically by
 * filename; a step whose files are missing renders as a text-only card.
 *
 * Sourced from Wikimedia Commons under licences that allow commercial
 * use. CC BY / CC BY-SA photos require the attribution shown on the page
 * (see HowWeWork.tsx); public-domain photos are credited too. Crops avoid
 * third-party logos and military insignia. The client's two reference
 * images were not available in the project -- replace these files with
 * Reservia's own or licensed photography whenever available (same names,
 * 16:10), then update the credits here.
 */
const files = import.meta.glob<string>('../assets/steps/*.webp', { eager: true, import: 'default' });
const file = (n: number, w: 480 | 960) => files[`../assets/steps/step-${n}-${w}.webp`];

export interface StepCredit {
  author: string;
  title: string;
  /** Wikimedia Commons file page. */
  source: string;
  license: string;
  licenseUrl?: string;
}

interface StepImageDef {
  /** CSS object-position focal point within the 16:10 frame. */
  position: string;
  credit: StepCredit;
}

const DEFS: StepImageDef[] = [
  {
    // 1 Share your data -- smart electricity meter showing a kWh reading
    position: 'center',
    credit: {
      author: 'USAID Pakistan',
      title: 'USAID Installs Automatic Meter Reading (AMR) for MEPCO’s Domestic Consumers',
      source: 'https://commons.wikimedia.org/wiki/File:USAID_Installs_Automatic_Meter_Reading_(AMR)_for_MEPCO%27s_Domestic_Consumers_(15971859981).jpg',
      license: 'Public domain',
    },
  },
  {
    // 2 Site survey -- technician in hard hat and hi-vis working on rooftop panels (close to reference 2)
    position: 'center',
    credit: {
      author: 'Kristian Buus / 1010 Climate Action',
      title: 'Solar panel installation at Grange farm',
      source: 'https://commons.wikimedia.org/wiki/File:Solar_panel_installation_at_Grange_farm.jpg',
      license: 'CC BY 2.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
    },
  },
  {
    // 3 Design and proposal -- engineers reviewing technical drawings
    position: 'center',
    credit: {
      author: 'NAVFAC',
      title: 'Engineers Review Drawings for Underground Utilities Project',
      source: 'https://commons.wikimedia.org/wiki/File:Engineers_Review_Drawings_for_Underground_Utilities_Project_(14621486432).jpg',
      license: 'Public domain',
    },
  },
  {
    // 4 Contract and down payment ("we order your equipment") -- equipment delivery by truck and crane
    position: 'center',
    credit: {
      author: 'U.S. Department of Energy Solar Decathlon',
      title: 'MG 4231',
      source: 'https://commons.wikimedia.org/wiki/File:MG_4231_(36702632843).jpg',
      license: 'Public domain',
    },
  },
  {
    // 5 Permits -- distribution company grid connection (distribution transformer)
    position: 'center',
    credit: {
      author: 'Chu86happychu',
      title: 'Three phase distribution transformer Bhoodha Ka Bas',
      source: 'https://commons.wikimedia.org/wiki/File:Three_phase_distribution_transformer_Bhoodha_Ka_Bas.JPG',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
  },
  {
    // 6 Installation -- crew in hard hats mounting a rooftop array
    position: 'center',
    credit: {
      author: 'U.S. Navy photo by MC1 Richard Doolin',
      title: 'Contractors install solar panels on the Public Works building roof, Sasebo, Japan',
      source: 'https://commons.wikimedia.org/wiki/File:US_Navy_100614-N-8335D-090_Japanese_contractors_install_solar_panels_on_the_Public_Works_building_roof_at_Fleet_Activities_Sasebo,_Japan.jpg',
      license: 'Public domain',
    },
  },
  {
    // 7 Commissioning and handover -- installed inverter, meter and disconnect
    position: 'center',
    credit: {
      author: 'SayCheeeeeese',
      title: 'Vermont Law School Solar Panel Array-4',
      source: 'https://commons.wikimedia.org/wiki/File:Vermont_Law_School_Solar_Panel_Array-4.JPG',
      license: 'CC0 1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
  },
  {
    // 8 Operation and maintenance -- technician cleaning panels (close to reference 1)
    position: 'center',
    credit: {
      author: 'Deo photographer',
      title: 'Cleaning solar panel',
      source: 'https://commons.wikimedia.org/wiki/File:Cleaning_solar_panel.jpg',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
  },
];

export interface StepImage extends StepImageDef {
  src480: string;
  src960: string;
}

/** One entry per step, in order; null when that step's photo files are not present. */
export const STEP_IMAGES: Array<StepImage | null> = DEFS.map((d, i) => {
  const src480 = file(i + 1, 480);
  const src960 = file(i + 1, 960);
  return src480 && src960 ? { ...d, src480, src960 } : null;
});

/** Card widths: 1 column on phones, 2 on tablets, 4 (about 280 px) on desktop. */
export const STEP_IMAGE_SIZES = '(max-width: 520px) calc(100vw - 40px), (max-width: 900px) calc(50vw - 30px), 280px';
