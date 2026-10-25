/**
 * Company-profile slides for the About page carousel, from the official
 * "Company Profile.pptx" (15 slides, 16:9), in the deck's order.
 *
 * Images: src/assets/profile/slide-01.webp ... slide-15.webp -- one
 * full-slide export per slide (client-supplied JPG exports, October 2026,
 * resized to 1920 x 1080 WebP), picked up automatically by filename. A slide
 * without an image is not rendered (no slide is recreated or invented).
 *
 * Alt text: each slide's own heading and key points, taken from the deck's
 * text (English as written in the deck; Arabic is a translation of it).
 */
const files = import.meta.glob<string>('../assets/profile/slide-*.webp', { eager: true, import: 'default' });

/** [English, Arabic] description per slide, from the slide's own text. */
const DESCRIPTIONS: Array<[string, string]> = [
  ['Reservia Integrated Energy Solutions: Generate, Store, Optimize, Sustain', 'ريزيرفيا للحلول المتكاملة للطاقة: توليد، تخزين، ترشيد، استدامة'],
  ['Company profile: an Egyptian energy-infrastructure company with a technology-enabled, customer-focused approach. Values: safety first, customer value, quality and engineering excellence', 'ملف الشركة: شركة مصرية للبنية التحتية للطاقة بنهج قائم على التكنولوجيا ويركز على العميل. القيم: السلامة أولًا، وقيمة العميل، والجودة والتميز الهندسي'],
  ['Vision, mission and ambition: our direction', 'الرؤية والرسالة والطموح: اتجاهنا'],
  ['Our 2030 ambition: a leading integrated energy and energy-infrastructure company in Egypt, with a growing regional presence', 'طموحنا لعام 2030: شركة رائدة في الطاقة المتكاملة والبنية التحتية للطاقة في مصر مع حضور إقليمي متنامٍ'],
  ['The Reservia model: generation, storage, smart controls and lifecycle support around each customer', 'نموذج ريزيرفيا: التوليد والتخزين والتحكم الذكي ودعم دورة حياة النظام حول احتياجات كل عميل'],
  ['One connected model: Generate, Store, Optimize, Sustain', 'نموذج واحد مترابط: توليد، تخزين، ترشيد، استدامة'],
  ['Five pillars, one platform: renewable energy, storage and resilience, smart energy, EPC and energy infrastructure, sustainability and lifecycle services', 'خمس ركائز ومنصة واحدة: الطاقة المتجددة، والتخزين والمرونة، والطاقة الذكية، والتصميم والتوريد والتنفيذ والبنية التحتية للطاقة، والاستدامة وخدمات دورة الحياة'],
  ['The delivery path: from the first question to a delivered asset', 'مسار التنفيذ: من أول سؤال حتى تسليم المشروع'],
  ['Services that start with the site: needs assessment, site survey, engineering, yield modelling and evaluation', 'خدمات تبدأ من الموقع: تقييم الاحتياجات ومعاينة الموقع والتصميم الهندسي ونمذجة الإنتاج والتقييم'],
  ['Delivery to handover: procurement, construction, integration, testing, commissioning and handover', 'من التنفيذ إلى التسليم: التوريد والإنشاء والربط والاختبار والتشغيل والتسليم'],
  ['Energy that works beyond daylight: align, protect, see, decide', 'طاقة تعمل بعد غروب الشمس: المواءمة والحماية والرؤية والقرار'],
  ['Solutions across sectors: residential, hospitality, commercial, industrial, agriculture and public facilities', 'حلول لكل القطاعات: السكني والفندقي والتجاري والصناعي والزراعي والمرافق العامة'],
  ['Why integrated energy creates value: costs, emissions, resilience, visibility and long-term value', 'لماذا تخلق الطاقة المتكاملة قيمة: التكاليف والانبعاثات والمرونة ووضوح البيانات والقيمة طويلة الأجل'],
  ['Our quality commitment: QHSE embedded across design, procurement, construction, commissioning and operation', 'التزامنا بالجودة: الجودة والصحة والسلامة والبيئة في التصميم والتوريد والإنشاء والتشغيل'],
  ['Contact Reservia: let’s plan your next energy step', 'تواصل مع ريزيرفيا: لنخطط خطوتك التالية في الطاقة'],
];

export interface ProfileSlide {
  src: string;
  alt: { en: string; ar: string };
}

/** Slides whose exported image exists, in deck order. */
export const PROFILE_SLIDES: ProfileSlide[] = DESCRIPTIONS.flatMap(([en, ar], i) => {
  const src = files[`../assets/profile/slide-${String(i + 1).padStart(2, '0')}.webp`];
  return src ? [{ src, alt: { en, ar } }] : [];
});

export const PROFILE_SLIDE_COUNT = DESCRIPTIONS.length;
