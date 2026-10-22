/** Kept free of React imports: this file is also read by vite.config.ts at build time. */
type Language = 'en' | 'ar';

export type PageId =
  | 'home'
  | 'residential'
  | 'agriculture'
  | 'industrial'
  | 'service'
  | 'calculator'
  | 'how'
  | 'about'
  | 'contact'
  | 'lp-villas'
  | 'lp-compounds'
  | 'lp-agriculture'
  | 'lp-service'
  | 'lp-industrial'
  | 'notfound'
  | 'oilgas'
  | 'irrigation';

/**
 * [title, description] per page per language. Original entries ported
 * verbatim from the reference template's `SEO` object. A page that exists
 * in only one language (the Arabic irrigation guide) has no entry in the
 * other -- no metadata is invented for a page that does not exist.
 */
export const SEO: Record<Language, Partial<Record<PageId, [string, string]>>> = {
  en: {
    home: ['Solar and storage EPC in Egypt | Reservia', 'Reservia designs, installs and maintains solar and battery systems for homes, farms, oil and gas sites and factories across Egypt. Ask for a free quote.'],
    residential: ['Home solar systems in Egypt | Reservia', 'Rooftop solar for Egyptian homes, sized to your bill and your roof. See the savings and how payback is worked out, then ask for a free quote.'],
    agriculture: ['Solar pumping for farms in Egypt | Reservia', 'Solar pumping systems that replace diesel on Egyptian farms. Check the numbers for your pump size and ask for a free quote.'],
    industrial: ['Solar for factories and diesel sites in Egypt | Reservia', 'Hybrid solar and storage for factories and remote oil and gas sites in Egypt, built to cut diesel use and grid bills. Ask for a site assessment.'],
    service: ['Solar for hospitals, hotels and schools in Egypt | Reservia', 'Solar and battery systems for hospitals, hotels, schools and commercial buildings in Egypt, priced and engineered like industrial sites. Ask for a site assessment.'],
    calculator: ['Solar savings and payback calculator | Reservia', 'Estimate system size, price, yearly saving and payback for a home, farm or industrial site. Sources and assumptions are shown next to the result.'],
    how: ['How a Reservia solar project runs | Reservia', 'Eight steps from your first message to years of maintenance, with milestone payments and handover tests and documents.'],
    about: ['About Reservia | Maadi, Cairo', 'Reservia Integrated Energy Solutions is an Egyptian solar and storage EPC company based in Maadi, Cairo. We design, procure, install and maintain systems.'],
    contact: ['Get a free solar quote | Reservia', 'Send a photo of your latest bill on WhatsApp or use the form. Reservia is based in Maadi, Cairo. Mobile and office numbers are on the page.'],
    'lp-villas': ["Cut your villa's electricity bill with solar | Reservia", 'Cut a villa’s electricity bill with rooftop solar. Free quote from Reservia, with the payback method shown.'],
    'lp-compounds': ['Solar for compound common areas | Reservia', 'Solar for shared compound services such as pools, pumps, lifts and lighting. Free quote from Reservia.'],
    'lp-agriculture': ['Stop buying diesel to pump water | Reservia', 'Stop buying diesel to pump water. Solar pumping quote from Reservia for farms in Egypt.'],
    'lp-service': ['Lower the energy bill of a hospital, hotel or school | Reservia', 'Solar and battery for buildings that run every day. Site assessment from Reservia.'],
    'lp-industrial': ['Cut diesel at remote sites and bills at the plant | Reservia', 'Hybrid solar and storage that cuts diesel at remote sites and bills at the plant. Site assessment from Reservia.'],
    notfound: ['Page not found | Reservia', 'The page you are looking for does not exist or may have moved.'],
    oilgas: ['Solar hybrid systems for oil and gas sites in Egypt | Reservia', 'Solar, battery and generator hybrid systems for remote oil and gas sites in Egypt: how they cut diesel use, how a site is assessed and sized, and how to request an engineering assessment.'],
  },
  ar: {
    home: ['الطاقة الشمسية والتخزين في مصر | ريزيرفيا', 'تصمم ريزيرفيا وتركّب وتصون أنظمة الطاقة الشمسية والبطاريات للمنازل والمزارع ومواقع البترول والمصانع في أنحاء مصر. اطلب عرض سعر مجانيًا.'],
    residential: ['أنظمة شمسية للمنازل في مصر | ريزيرفيا', 'طاقة شمسية على السطح لمنزلك، بحجم يناسب فاتورتك وسطحك. اطلع على التوفير وطريقة حساب الاسترداد ثم اطلب عرض سعر مجانيًا.'],
    agriculture: ['ضخ شمسي للمزارع في مصر | ريزيرفيا', 'أنظمة ضخ بالطاقة الشمسية تغنيك عن الديزل في مزرعتك. راجع الأرقام لحجم مضختك واطلب عرض سعر مجانيًا.'],
    industrial: ['طاقة شمسية للمصانع ومواقع الديزل في مصر | ريزيرفيا', 'أنظمة هجينة شمسية وتخزين للمصانع ومواقع البترول النائية في مصر، لتقليل الديزل وفاتورة الشبكة. اطلب معاينة للموقع.'],
    service: ['طاقة شمسية للمستشفيات والفنادق والمدارس في مصر | ريزيرفيا', 'أنظمة شمسية وبطاريات للمستشفيات والفنادق والمدارس والمباني التجارية في مصر، بتسعير وهندسة المواقع الصناعية. اطلب معاينة للموقع.'],
    calculator: ['حاسبة التوفير والاسترداد للطاقة الشمسية | ريزيرفيا', 'قدّر حجم النظام وسعره والتوفير السنوي وفترة الاسترداد لمنزل أو مزرعة أو موقع صناعي. المصادر والافتراضات معروضة بجوار النتيجة.'],
    how: ['كيف يسير مشروع ريزيرفيا الشمسي | ريزيرفيا', 'ثماني خطوات من أول رسالة حتى سنوات من الصيانة، مع دفعات على مراحل واختبارات ومستندات عند التسليم.'],
    about: ['عن ريزيرفيا | المعادي، القاهرة', 'ريزيرفيا للحلول المتكاملة للطاقة شركة مصرية للطاقة الشمسية والتخزين، مقرها المعادي بالقاهرة. نصمم ونورد ونركّب ونصون الأنظمة.'],
    contact: ['اطلب عرض سعر مجانيًا | ريزيرفيا', 'أرسل صورة آخر فاتورة على واتساب أو استخدم النموذج. مقر ريزيرفيا في المعادي بالقاهرة، وأرقام الموبايل والمكتب في الصفحة.'],
    'lp-villas': ['خفّض فاتورة كهرباء فيلتك بالطاقة الشمسية | ريزيرفيا', 'خفّض فاتورة كهرباء الفيلا بنظام شمسي على السطح. عرض سعر مجاني من ريزيرفيا مع توضيح طريقة حساب الاسترداد.'],
    'lp-compounds': ['طاقة شمسية للمناطق المشتركة في الكمبوند | ريزيرفيا', 'طاقة شمسية لخدمات الكمبوند المشتركة مثل حمامات السباحة والمضخات والمصاعد والإنارة. عرض سعر مجاني من ريزيرفيا.'],
    'lp-agriculture': ['توقف عن شراء الديزل لضخ المياه | ريزيرفيا', 'توقف عن شراء الديزل لضخ المياه. عرض سعر لنظام ضخ شمسي لمزرعتك في مصر من ريزيرفيا.'],
    'lp-service': ['خفّض فاتورة طاقة المستشفى أو الفندق أو المدرسة | ريزيرفيا', 'طاقة شمسية وبطاريات للمباني التي تعمل كل يوم. معاينة للموقع من ريزيرفيا.'],
    'lp-industrial': ['خفّض الديزل في المواقع النائية وفاتورة المصنع | ريزيرفيا', 'أنظمة هجينة شمسية وتخزين تخفض الديزل في المواقع النائية وفاتورة المصنع. معاينة للموقع من ريزيرفيا.'],
    notfound: ['الصفحة غير موجودة | ريزيرفيا', 'الصفحة التي تبحث عنها غير موجودة أو ربما نُقلت.'],
    oilgas: ['أنظمة طاقة شمسية هجينة لمواقع البترول والغاز في مصر | ريزيرفيا', 'أنظمة هجينة تجمع الطاقة الشمسية والبطاريات والمولدات لمواقع البترول والغاز النائية في مصر: كيف تقلل استهلاك الديزل، وكيف نقيّم الموقع ونحدد حجم النظام، وكيف تطلب تقييمًا هندسيًا.'],
    irrigation: ['دليل الري بالطاقة الشمسية للمزارع في مصر | ريزيرفيا', 'كيف يعمل الري بالطاقة الشمسية، وكيف تختار حجم الطلمبة، ومقارنة تكلفة الضخ بالطاقة الشمسية والديزل، وكيف تتحقق من برامج التمويل المتاحة. أمثلة بافتراضات واضحة.'],
  },
};

/** Title and description for a page in a language; throws if the page does not exist in that language. */
export function seoText(lang: Language, page: PageId): [string, string] {
  const entry = SEO[lang][page];
  if (!entry) throw new Error(`No SEO entry for page "${page}" in "${lang}"`);
  return entry;
}
