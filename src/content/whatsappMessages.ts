import type { Language } from '../i18n/LanguageContext';
import type { Segment } from '../config/navigation';

/**
 * Prefilled WhatsApp messages per segment, extended from the reference
 * template's `WAMSG` object (October 2026 brief) so each one asks for the
 * details an engineer needs to size a system: location plus the
 * segment's consumption figure. Blank "label: " lines are for the
 * customer to complete before sending. `calc` is followed by the
 * calculator's own computed figures (see Calculator.tsx).
 *
 * Arabic wording is new copy written for this brief -- flagged for client
 * review in docs/CLIENT_DECISIONS.md.
 */
export const WAMSG: Record<Language, Record<Segment, string>> = {
  en: {
    villas:
      "Hello Reservia, I'd like a solar quote for my home.\nLocation (area and city): \nMonthly electricity bill (EGP): \nMonthly consumption (kWh, if known): \nI can also send a photo of my bill.",
    compounds:
      "Hello Reservia, I'd like a quote for our compound's common areas.\nCompound location: \nMonthly common-area bill (EGP): \nMonthly consumption (kWh, if known): ",
    agriculture:
      "Hello Reservia, I'd like a quote for a solar pumping system.\nFarm location: \nPump size (hp): \nWell depth or pumping head (m, if known): \nIrrigation type (drip, pivot or flood): \nPumping hours per day: ",
    industrial:
      "Hello Reservia, I'd like a site assessment for our facility.\nFacility location: \nSite type (factory, oil and gas, other): \nMonthly grid consumption (kWh) or bill (EGP), or monthly diesel use (litres): \nWhat we need (lower bills, less diesel, backup power): ",
    service:
      "Hello Reservia, I'd like a site assessment for our building.\nFacility type (hospital, clinic, hotel, school, university, mall, office or club): \nLocation: \nMonthly electricity consumption (kWh) or bill (EGP): ",
    general: "Hello Reservia, I'd like a solar quote.\nLocation: \nSite type: \nMonthly bill or consumption: ",
    calc: 'Hello Reservia, I used the savings calculator on your website. My estimate: ',
  },
  ar: {
    villas:
      'مرحبًا ريزيرفيا، أريد عرض سعر لنظام طاقة شمسية لمنزلي.\nالموقع (المنطقة والمدينة): \nفاتورة الكهرباء الشهرية (جنيه): \nالاستهلاك الشهري (كيلووات ساعة، إن كان معروفًا): \nيمكنني أيضًا إرسال صورة من الفاتورة.',
    compounds:
      'مرحبًا ريزيرفيا، أريد عرض سعر للمناطق المشتركة في الكمبوند.\nموقع الكمبوند: \nالفاتورة الشهرية للمناطق المشتركة (جنيه): \nالاستهلاك الشهري (كيلووات ساعة، إن كان معروفًا): ',
    agriculture:
      'مرحبًا ريزيرفيا، أريد عرض سعر لنظام ضخ بالطاقة الشمسية.\nموقع المزرعة: \nقدرة المضخة (حصان): \nعمق البئر أو ارتفاع الرفع (متر، إن كان معروفًا): \nنوع الري (تنقيط أو محوري أو غمر): \nساعات الضخ يوميًا: ',
    industrial:
      'مرحبًا ريزيرفيا، أريد معاينة لموقعنا.\nموقع المنشأة: \nنوع الموقع (مصنع، بترول وغاز، غير ذلك): \nالاستهلاك الشهري من الشبكة (كيلووات ساعة) أو الفاتورة (جنيه)، أو استهلاك الديزل الشهري (لتر): \nالمطلوب (خفض الفاتورة، تقليل الديزل، طاقة احتياطية): ',
    service:
      'مرحبًا ريزيرفيا، أريد معاينة لمبنانا.\nنوع المنشأة (مستشفى، عيادة، فندق، مدرسة، جامعة، مول، مكاتب أو نادٍ): \nالموقع: \nاستهلاك الكهرباء الشهري (كيلووات ساعة) أو الفاتورة (جنيه): ',
    general: 'مرحبًا ريزيرفيا، أريد عرض سعر للطاقة الشمسية.\nالموقع: \nنوع الموقع: \nالفاتورة أو الاستهلاك الشهري: ',
    calc: 'مرحبًا ريزيرفيا، استخدمت حاسبة التوفير في موقعكم. تقديري: ',
  },
};
