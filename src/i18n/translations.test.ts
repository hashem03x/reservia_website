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
