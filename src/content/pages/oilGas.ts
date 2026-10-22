/**
 * Copy for the "Solar hybrid systems for oil and gas sites" page (EN + AR).
 *
 * Content rules (SEO brief, 22 October 2026): no invented Reservia oil and
 * gas projects, customers, certifications or performance guarantees. Every
 * figure reuses a number the site already publishes and sources:
 *  - diesel EGP 20.50/litre (as reported, 10 March 2026; RATES.diesel)
 *  - ~0.3 litres of diesel per kWh (DIESEL_LITRES_PER_KWH)
 *  - => ~EGP 6.15 fuel per kWh (rate board)
 * The worked example is an illustration from those assumptions, labelled as
 * such. The industry example (Esh El Mallaha) reuses the existing,
 * source-linked `i_og_proof` copy, marked "Not a Reservia project".
 */
export interface Section {
  h: string;
  p?: string[];
  ticks?: string[];
  steps?: string[];
}

export interface OilGasCopy {
  eyebrow: string;
  title: string;
  lead: string;
  ctaAssess: string;
  ctaCalc: string;
  sections: Section[];
  example: { h: string; rows: Array<[string, string]>; note: string };
  faq: Array<[string, string]>;
  sizingNote: string;
  backLink: string;
}

export const OIL_GAS: Record<'en' | 'ar', OilGasCopy> = {
  en: {
    eyebrow: 'Industrial Facilities · Oil and gas',
    title: 'Solar hybrid power for oil and gas sites',
    lead: 'Remote camps, wellsites and pump stations in the Western Desert and along the Gulf of Suez often run on diesel generators around the clock. A hybrid system adds solar panels and batteries to the existing generators, so they run fewer hours and burn less fuel. Your generators stay on site as backup.',
    ctaAssess: 'Request a site assessment',
    ctaCalc: 'Estimate your diesel savings',
    sections: [
      {
        h: 'Why diesel power is expensive at remote sites',
        p: [
          'A remote site pays for every litre twice: once to buy it and again to truck it in. At the diesel price used on this site (EGP 20.50 a litre since 10 March 2026, as reported; check the current price) and a typical generator consumption of about 0.3 litres per kWh, fuel alone costs about EGP 6.15 for every kWh, before delivery, servicing and overhauls.',
        ],
        ticks: [
          'Fuel deliveries over long desert roads, with the cost and exposure that brings',
          'Generators running at low load at night, which wastes fuel and wears engines',
          'Fuel price changes that are hard to plan for',
        ],
      },
      {
        h: 'How a solar–diesel hybrid system works',
        p: [
          'Solar panels supply the site during the day. Batteries store surplus energy and cover the evening, cloud and dust. A hybrid controller starts the generators only when solar and batteries cannot meet the load, and runs them at an efficient load when they do run. If any part of the solar system is out of service, the generators carry the site exactly as they do today.',
        ],
      },
      {
        h: 'Where a hybrid system fits',
        ticks: [
          'Accommodation camps and site offices',
          'Wellsites, pump stations and other remote production facilities',
          'Telecoms and monitoring equipment far from the grid',
          'Containerised or skid-mounted systems that can move with the camp',
        ],
      },
      {
        h: 'How we size a hybrid system',
        steps: [
          'Load data: we review generator records and log or estimate the site’s hourly load.',
          'Solar resource and space: we assess irradiation, dust, temperature and the area available for panels.',
          'Reliability: we agree with your team which loads are critical and what backup they need.',
          'Options: we compare solar share, battery size and generator running hours, with the fuel saving of each.',
          'Proposal: design, equipment list, expected fuel saving and payback, with every assumption written down.',
        ],
      },
      {
        h: 'Safety and HSE on industrial sites',
        ticks: [
          'Method statements and risk assessments for every job under our QHSE policy',
          'Work under your permit-to-work system and site HSE rules',
          'Commissioning tests to IEC 62446 with full documentation',
          'Single-line diagrams and as-built drawings handed over with the system',
        ],
      },
      {
        h: 'Delivery, monitoring and maintenance',
        p: [
          'We design, procure, install and commission the system, then monitor solar production and generator hours. Cleaning, inspections and repairs are covered by an O&M plan with response times agreed in writing.',
        ],
      },
    ],
    example: {
      h: 'Illustrative fuel calculation',
      rows: [
        ['Diesel used today', '30,000 litres a month'],
        ['Share of energy supplied by solar', '30%'],
        ['Diesel avoided', 'about 9,000 litres a month (108,000 a year)'],
        ['Fuel value at EGP 20.50 a litre', 'about EGP 2.2 million a year, before servicing savings'],
      ],
      note: 'An illustration using the assumptions above, not a measured result. Real savings depend on the load profile, solar resource, battery size and how the generators are operated. Try your own figures in the calculator.',
    },
    faq: [
      [
        'Can solar replace our diesel generators completely?',
        'Usually not at sites that run around the clock. Most remote sites keep their generators for night loads, long cloudy or dusty spells and maintenance periods. A hybrid system reduces how long they run; how much depends on the solar share and battery size, which we size from your load data.',
      ],
      [
        'Will a hybrid system affect the reliability of the site?',
        'It should not. The generators stay available and the controller starts them automatically when solar and batteries cannot meet the load. We agree the critical loads and backup requirements with your team before design.',
      ],
      [
        'What information do you need for an assessment?',
        'Monthly diesel use, generator sizes and running hours, the daily load pattern if you have it, the site location and the space available for panels. Generator logs or a short metering period make the estimate much more accurate.',
      ],
    ],
    sizingNote: 'Final sizing always depends on the site’s loads, solar resource, environmental conditions and your engineering and HSE requirements.',
    backLink: 'Back to Industrial Facilities',
  },
  ar: {
    eyebrow: 'المنشآت الصناعية · البترول والغاز',
    title: 'طاقة شمسية هجينة لمواقع البترول والغاز',
    lead: 'تعمل معسكرات ومواقع الآبار ومحطات الضخ النائية في الصحراء الغربية وعلى امتداد خليج السويس غالبًا بمولدات ديزل على مدار الساعة. يضيف النظام الهجين ألواحًا شمسية وبطاريات إلى المولدات القائمة، فتعمل ساعات أقل وتستهلك وقودًا أقل، وتبقى المولدات في الموقع احتياطيًا.',
    ctaAssess: 'اطلب معاينة للموقع',
    ctaCalc: 'قدّر توفير الديزل',
    sections: [
      {
        h: 'لماذا كهرباء الديزل مكلفة في المواقع النائية',
        p: [
          'يدفع الموقع النائي ثمن كل لتر مرتين: مرة لشرائه ومرة لنقله إليه. وبسعر الديزل المستخدم على هذا الموقع (20.50 جنيه للتر منذ 10 مارس 2026 كما نُشر؛ راجع السعر الحالي) واستهلاك معتاد للمولد يقارب 0.3 لتر لكل كيلووات ساعة، تبلغ تكلفة الوقود وحده نحو 6.15 جنيه لكل كيلووات ساعة، قبل النقل والصيانة والعمرات.',
        ],
        ticks: [
          'نقل الوقود عبر طرق صحراوية طويلة بما فيه من تكلفة ومخاطر',
          'مولدات تعمل بحمل منخفض ليلًا، فتهدر الوقود وتستهلك المحركات',
          'تغيرات في سعر الوقود يصعب التخطيط لها',
        ],
      },
      {
        h: 'كيف يعمل النظام الهجين بين الطاقة الشمسية والديزل',
        p: [
          'تغذي الألواح الشمسية الموقع نهارًا، وتخزن البطاريات الفائض وتغطي المساء وفترات الغيوم والأتربة. ويشغّل جهاز التحكم الهجين المولدات فقط عندما لا تكفي الطاقة الشمسية والبطاريات لتغطية الحمل، ويشغّلها بحمل اقتصادي عندما تعمل. وإذا توقف أي جزء من النظام الشمسي، تغذي المولدات الموقع كما تفعل اليوم تمامًا.',
        ],
      },
      {
        h: 'أين يناسب النظام الهجين',
        ticks: [
          'معسكرات الإقامة ومكاتب المواقع',
          'مواقع الآبار ومحطات الضخ ومنشآت الإنتاج النائية الأخرى',
          'معدات الاتصالات والمراقبة البعيدة عن الشبكة',
          'أنظمة داخل حاويات أو على قواعد متنقلة تنتقل مع المعسكر',
        ],
      },
      {
        h: 'كيف نحدد حجم النظام الهجين',
        steps: [
          'بيانات الأحمال: نراجع سجلات المولدات ونسجّل أو نقدّر الحمل الساعي للموقع.',
          'الإشعاع الشمسي والمساحة: نقيّم الإشعاع والأتربة ودرجات الحرارة والمساحة المتاحة للألواح.',
          'الاعتمادية: نتفق مع فريقك على الأحمال الحرجة والاحتياطي الذي تحتاجه.',
          'البدائل: نقارن نسبة الطاقة الشمسية وحجم البطاريات وساعات تشغيل المولدات، مع توفير الوقود في كل بديل.',
          'العرض: التصميم وقائمة المعدات والتوفير المتوقع في الوقود وفترة الاسترداد، مع كتابة كل الافتراضات.',
        ],
      },
      {
        h: 'السلامة والصحة المهنية في المواقع الصناعية',
        ticks: [
          'بيان طريقة عمل وتقييم مخاطر لكل مهمة وفق سياسة الجودة والصحة والسلامة لدينا',
          'العمل وفق نظام تصاريح العمل وقواعد السلامة في موقعك',
          'اختبارات التشغيل وفق IEC 62446 مع توثيق كامل',
          'تسليم المخططات أحادية الخط ومخططات التنفيذ الفعلي مع النظام',
        ],
      },
      {
        h: 'التنفيذ والمراقبة والصيانة',
        p: [
          'نصمم النظام ونورّده ونركّبه ونشغّله، ثم نراقب إنتاج الطاقة الشمسية وساعات تشغيل المولدات. ويغطي عقد التشغيل والصيانة التنظيف والفحوص والإصلاحات، مع أزمنة استجابة متفق عليها كتابيًا.',
        ],
      },
    ],
    example: {
      h: 'حساب توضيحي لتوفير الوقود',
      rows: [
        ['استهلاك الديزل الحالي', '30,000 لتر شهريًا'],
        ['نسبة الطاقة من الألواح الشمسية', '30%'],
        ['الديزل الموفَّر', 'نحو 9,000 لتر شهريًا (108,000 لتر سنويًا)'],
        ['قيمة الوقود بسعر 20.50 جنيه للتر', 'نحو 2.2 مليون جنيه سنويًا، قبل توفير الصيانة'],
      ],
      note: 'مثال توضيحي بالافتراضات السابقة وليس نتيجة مقيسة. يعتمد التوفير الفعلي على نمط الأحمال والإشعاع الشمسي وحجم البطاريات وطريقة تشغيل المولدات. جرّب أرقامك في الحاسبة.',
    },
    faq: [
      [
        'هل يمكن أن تحل الطاقة الشمسية محل مولدات الديزل بالكامل؟',
        'غالبًا لا في المواقع التي تعمل على مدار الساعة. تحتفظ معظم المواقع النائية بمولداتها لأحمال الليل وفترات الغيوم والأتربة الطويلة وأوقات الصيانة. يقلل النظام الهجين ساعات تشغيلها، ويتوقف مقدار ذلك على نسبة الطاقة الشمسية وحجم البطاريات، ونحددهما من بيانات أحمالك.',
      ],
      [
        'هل يؤثر النظام الهجين على اعتمادية الموقع؟',
        'لا ينبغي ذلك. تبقى المولدات متاحة، ويشغّلها جهاز التحكم تلقائيًا عندما لا تكفي الطاقة الشمسية والبطاريات. ونتفق مع فريقك على الأحمال الحرجة ومتطلبات الاحتياطي قبل التصميم.',
      ],
      [
        'ما المعلومات التي تحتاجونها للتقييم؟',
        'استهلاك الديزل الشهري، وقدرات المولدات وساعات تشغيلها، ونمط الحمل اليومي إن توفر، وموقع المنشأة والمساحة المتاحة للألواح. سجلات المولدات أو فترة قياس قصيرة تجعل التقدير أدق كثيرًا.',
      ],
    ],
    sizingNote: 'يتوقف التصميم النهائي دائمًا على أحمال الموقع والإشعاع الشمسي والظروف البيئية ومتطلباتكم الهندسية ومتطلبات السلامة.',
    backLink: 'العودة إلى المنشآت الصناعية',
  },
};
