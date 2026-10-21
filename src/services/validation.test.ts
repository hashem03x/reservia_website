import { describe, expect, it } from 'vitest';
import { normalizeDigits, parseOptionalNumber, validateName, validateOptionalNumber, validatePhone } from './validation';

describe('name', () => {
  it('requires non-blank text', () => {
    expect(validateName('')).toBe('required');
    expect(validateName('   ')).toBe('required');
    expect(validateName('Mona')).toBeNull();
    expect(validateName('منى')).toBeNull();
  });
});

describe('phone', () => {
  it.each(['01211892995', '+20 121 189 2995', '(02) 2522-2814', '012.1189.2995', '٠١٢١١٨٩٢٩٩٥'])('accepts %s', (v) => {
    expect(validatePhone(v)).toBeNull();
  });

  it('requires a value', () => {
    expect(validatePhone('')).toBe('required');
  });

  it('needs at least 8 digits after removing formatting', () => {
    expect(validatePhone('1234 567')).toBe('phone_invalid');
    expect(validatePhone('+ ( ) - - -')).toBe('phone_invalid');
    expect(validatePhone('12345678')).toBeNull();
  });

  it('rejects letters and too many digits', () => {
    expect(validatePhone('call 01211892995')).toBe('phone_invalid');
    expect(validatePhone('1234567890123456')).toBe('phone_invalid');
  });

  it('normalizes Arabic-Indic digits', () => {
    expect(normalizeDigits('٠١٢')).toBe('012');
    expect(normalizeDigits('۰۱۲')).toBe('012');
  });
});

describe('optional number', () => {
  it('allows empty, rejects negatives and text', () => {
    expect(validateOptionalNumber('')).toBeNull();
    expect(validateOptionalNumber('40')).toBeNull();
    expect(validateOptionalNumber('-1')).toBe('number_invalid');
    expect(validateOptionalNumber('abc')).toBe('number_invalid');
    expect(parseOptionalNumber('')).toBeUndefined();
    expect(parseOptionalNumber('٤٠')).toBe(40);
    expect(parseOptionalNumber('-3')).toBeUndefined();
  });
});
