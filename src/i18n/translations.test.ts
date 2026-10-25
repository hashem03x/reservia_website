import { describe, expect, it } from 'vitest';
import en from './translations/en';
import ar from './translations/ar';

const all = (d: Record<string, string>) => Object.values(d).join('\n');

describe('dictionaries', () => {
  it('have identical keys in English and Arabic, none empty', () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
    for (const [k, v] of [...Object.entries(en), ...Object.entries(ar)]) expect(v.trim(), k).not.toBe('');
  });

  it('keep {token} placeholders in sync', () => {
    for (const k of Object.keys(en)) {
      const tokens = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
      expect(tokens(ar[k]), k).toEqual(tokens(en[k]));
    }
  });
});

describe('claims policy', () => {
  it('makes no NREA certification claim', () => {
    for (const text of [all(en), all(ar)]) {
      expect(text).not.toMatch(/NREA|certified|معتمد من|هيئة الطاقة الجديدة والمتجددة/i);
    }
  });

  it('promises no response time', () => {
    expect(all(en)).not.toMatch(/working day|within (24|48) hours|same day/i);
    expect(all(ar)).not.toMatch(/يوم عمل|خلال 24 ساعة|خلال 48 ساعة/);
  });

  it('labels every third-party example as not a Reservia project', () => {
    for (const k of ['s_g1_ex', 's_g2_ex', 's_g3_ex', 's_g4_ex', 'i_og_proof']) {
      expect(en[k], k).toMatch(/not a Reservia project/i);
      expect(ar[k], k).toMatch(/ليست? مشروعًا لريزيرفيا/);
    }
  });

  it('discloses the 2.55 EGP/kWh service-sector figure as an assumption', () => {
    expect(en.s_note).toMatch(/2\.55/);
    expect(en.s_note).toMatch(/2\.79/);
    expect(ar.s_note).toMatch(/2\.55/);
    expect(en.s_faq_a1).toMatch(/assumes EGP 2\.55/);
  });

  it('qualifies the Egypt Today permits reference as a press report', () => {
    expect(en.a_perm).toMatch(/Egypt Today reported on 18 May 2026/);
    expect(ar.a_perm).toMatch(/18 مايو 2026/);
  });
});

describe('required content', () => {
  it('has the trust section with six points', () => {
    expect(en.trust_t).toBe('What you can check before you sign');
    for (let i = 1; i <= 6; i++) {
      expect(en[`tk${i}_t`]).toBeTruthy();
      expect(ar[`tk${i}_t`]).toBeTruthy();
    }
  });

  it('keeps the reference villa figures consistent with the calculator', () => {
    expect(en.r_ex1).toBe('6 kWp');
    expect(en.r_ex3).toMatch(/36,800/);
    expect(ar.r_ex3).toMatch(/36,800/);
    expect(en.r_ex4).toMatch(/184,000/);
    expect(en.r_ex5).toMatch(/5\.3 years.*4\.8/);
    expect(en.lpv_stat).toBe('EGP 36,800');
  });
});

describe('October 2026 brief, part 2', () => {
  it('uses the four solution category names everywhere', () => {
    const names = { en: ['Residential & Commercial', 'Agricultural Farms', 'Industrial Facilities', 'Services Sector'], ar: ['سكني وتجاري', 'المزارع الزراعية', 'المنشآت الصناعية', 'قطاع الخدمات'] };
    for (const [lang, dict] of [['en', en], ['ar', ar]] as const) {
      const n = names[lang];
      expect([dict.nav_res, dict.nav_agri, dict.nav_ind, dict.nav_svc]).toEqual(n);
      expect([dict.seg_res_t, dict.seg_agri_t, dict.seg_ind_t, dict.seg_svc_t]).toEqual(n);
      expect([dict.tab_home, dict.tab_farm, dict.tab_ind, dict.tab_svc]).toEqual(n);
      expect([dict.r_eyebrow, dict.a_eyebrow, dict.i_eyebrow, dict.s_eyebrow]).toEqual(n);
    }
  });

  it('has no payment-terms-by-project-type content left', () => {
    for (const text of [all(en), all(ar)]) {
      expect(text).not.toMatch(/payment terms by project type|شروط الدفع حسب نوع المشروع/i);
      expect(text).not.toMatch(/70 ?\/ ?30|50 ?\/ ?30 ?\/ ?20|80 ?\/ ?20|70% (when you sign|عند)|50% (when you sign|عند)|80% (when you sign|عند)/);
    }
    for (const k of ['pay_title', 'terms_title', 'r_terms', 'a_terms', 'i_terms', 'c_terms', 's_faq_q3']) expect(en[k], k).toBeUndefined();
  });

  it('keeps flexible financing in the homepage and footer descriptions', () => {
    expect(en.h_lead).toBe(
      'Reservia is an integrated energy partner helping Egyptian homes, farms, industrial facilities and the services sector ensure business continuity and reduce electricity costs through tailored engineered solar systems, intelligent energy management and flexible financing.',
    );
    expect(ar.h_lead).toMatch(/تمويل مرن/);
    expect(en.foot_desc).toBe(
      'Reservia designs, finances, installs and maintains tailored energy solutions that help Egyptian homes and businesses reduce electricity costs and achieve reliable, sustainable power.',
    );
  });

  it('renames Common questions to FAQ', () => {
    expect(en.faq_t).toBe('FAQ');
    expect(all(en)).not.toMatch(/Common questions/);
  });

  it('shows the LLC company name in the footer identity', () => {
    expect(en.brand_legal).toBe('Reservia Integrated Energy Solutions LLC');
    expect(en.foot1).toContain('Reservia Integrated Energy Solutions LLC');
    expect(ar.foot1).toContain('ش.ذ.م.م');
  });

  it('has the four slogan words', () => {
    expect([en.slogan_1, en.slogan_2, en.slogan_3, en.slogan_4]).toEqual(['Generate', 'Store', 'Optimize', 'Sustain']);
  });
});

describe('October 2026 brief, part 4', () => {
  it('shows no Managing Director name or title', () => {
    for (const text of [all(en), all(ar)]) expect(text).not.toMatch(/Fattah|عبد الفتاح|Managing Director|العضو المنتدب/);
    expect(en.ab_md).toBeUndefined();
  });

  it('shows no named source citations next to figures', () => {
    for (const text of [all(en), all(ar)]) {
      expect(text).not.toMatch(/\((?:[^()]*?)(IFC|UICC|Afrik21|Egypt Independent|UNDP|Zawya|مؤسسة التمويل|أفريك|إيجيبت إنديبندنت|زاوية|برنامج الأمم)[^()]*\)/);
      expect(text).not.toMatch(/Sources on the About page|links are on the About page|المصادر في صفحة من نحن/);
    }
  });

  it('has the new About description (two paragraphs)', () => {
    expect(en.ab_lead).toBe(en.h_lead);
    expect(en.ab_lead2).toBe('We design, install, maintain and facilitate financing for tailored energy solutions that deliver cost-efficient, reliable and sustainable power.');
  });
});
