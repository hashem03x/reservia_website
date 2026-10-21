/**
 * Crop and tree options for the Agricultural Farms calculator tab.
 *
 * Contextual inputs only: they help engineers plan irrigation and qualify
 * the lead, and travel with the calculator context to the contact form
 * and WhatsApp. They do NOT change the savings formula -- no crop-specific
 * financial assumption is made. Add options by appending entries; `id`
 * values are stable identifiers sent with the lead, so never rename one.
 */
export interface Option {
  id: string;
  en: string;
  ar: string;
}

export interface CropOption extends Option {
  /** Tree-based activity: reveals the "Type of tree" field. */
  trees?: boolean;
}

export const CROPS: CropOption[] = [
  { id: 'wheat', en: 'Wheat', ar: 'القمح' },
  { id: 'maize', en: 'Maize (corn)', ar: 'الذرة' },
  { id: 'rice', en: 'Rice', ar: 'الأرز' },
  { id: 'sugarcane', en: 'Sugarcane', ar: 'قصب السكر' },
  { id: 'sugar_beet', en: 'Sugar beet', ar: 'بنجر السكر' },
  { id: 'cotton', en: 'Cotton', ar: 'القطن' },
  { id: 'clover', en: 'Clover (berseem) and fodder', ar: 'البرسيم والأعلاف' },
  { id: 'potatoes', en: 'Potatoes', ar: 'البطاطس' },
  { id: 'tomatoes', en: 'Tomatoes', ar: 'الطماطم' },
  { id: 'onions', en: 'Onions', ar: 'البصل' },
  { id: 'vegetables', en: 'Other vegetables', ar: 'خضروات أخرى' },
  { id: 'greenhouse', en: 'Greenhouse crops', ar: 'زراعات الصوب' },
  { id: 'orchard', en: 'Fruit trees or orchard', ar: 'أشجار الفاكهة والبساتين', trees: true },
  { id: 'date_palm', en: 'Date palm plantation', ar: 'مزرعة نخيل', trees: true },
  { id: 'mixed', en: 'Mixed crops and trees', ar: 'محاصيل وأشجار مختلطة', trees: true },
  { id: 'other', en: 'Other', ar: 'أخرى' },
];

export const TREES: Option[] = [
  { id: 'mango', en: 'Mango', ar: 'المانجو' },
  { id: 'olive', en: 'Olive', ar: 'الزيتون' },
  { id: 'citrus', en: 'Citrus (orange, mandarin, lemon)', ar: 'الموالح (برتقال، يوسفي، ليمون)' },
  { id: 'date_palm', en: 'Date palm', ar: 'نخيل البلح' },
  { id: 'grape', en: 'Grape', ar: 'العنب' },
  { id: 'pomegranate', en: 'Pomegranate', ar: 'الرمان' },
  { id: 'guava', en: 'Guava', ar: 'الجوافة' },
  { id: 'fig', en: 'Fig', ar: 'التين' },
  { id: 'apricot_peach', en: 'Apricot or peach', ar: 'المشمش أو الخوخ' },
  { id: 'banana', en: 'Banana', ar: 'الموز' },
  { id: 'other', en: 'Other', ar: 'أخرى' },
];

export function cropNeedsTree(cropId: string): boolean {
  return CROPS.some((c) => c.id === cropId && c.trees);
}

/** Label in the given language, or undefined for an unknown/empty id (never echoes raw input). */
export function optionLabel(list: Option[], id: string, lang: 'en' | 'ar'): string | undefined {
  return list.find((o) => o.id === id)?.[lang];
}
