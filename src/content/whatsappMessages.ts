import type { Language } from '../i18n/LanguageContext';
import type { Segment } from '../config/navigation';

/** Ported verbatim from the reference template's `WAMSG` object. */
export const WAMSG: Record<Language, Record<Segment, string>> = {
  en: {
    service: 'Hello Reservia, I want a site assessment for our building. Type (hospital, hotel, school or other) and monthly electricity bill (EGP): ',
    general: 'Hello Reservia, I would like a solar quote. My location is: ',
    villas: 'Hello Reservia, I want a solar quote for my home. My monthly electricity bill (EGP) is: ',
    compounds: "Hello Reservia, I want a quote for our compound's common areas. Our monthly common-area bill (EGP) is: ",
    agriculture: 'Hello Reservia, I want a quote for a solar pumping system. My pump size (hp) is: ',
    industrial: 'Hello Reservia, I want a site assessment for our facility. Site type (factory or oil and gas) and monthly bill or diesel use: ',
    calc: 'Hello Reservia, I used the savings calculator on your site. ',
  },
  ar: {
    service: 'مرحبًا ريزيرفيا، أريد معاينة لمبنانا. نوع المبنى (مستشفى أو فندق أو مدرسة أو غير ذلك) وفاتورة الكهرباء الشهرية (جنيه): ',
    general: 'مرحبًا ريزيرفيا، أريد عرض سعر للطاقة الشمسية. موقعي: ',
    villas: 'مرحبًا ريزيرفيا، أريد عرض سعر للطاقة الشمسية لمنزلي. فاتورة الكهرباء الشهرية (جنيه): ',
    compounds: 'مرحبًا ريزيرفيا، أريد عرض سعر للمناطق المشتركة في الكمبوند. الفاتورة الشهرية للمناطق المشتركة (جنيه): ',
    agriculture: 'مرحبًا ريزيرفيا، أريد عرض سعر لنظام ضخ شمسي. قدرة المضخة (حصان): ',
    industrial: 'مرحبًا ريزيرفيا، أريد تقييم موقعنا الصناعي. نوع الموقع (مصنع أو بترول وغاز) والفاتورة الشهرية أو استهلاك الديزل: ',
    calc: 'مرحبًا ريزيرفيا، استخدمت حاسبة التوفير في موقعكم. ',
  },
};
