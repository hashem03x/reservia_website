import { describe, expect, it } from 'vitest';
import { CROPS, TREES, cropNeedsTree, optionLabel } from './farmCrops';

describe('crop and tree options', () => {
  it('have unique ids and labels in both languages', () => {
    for (const list of [CROPS, TREES]) {
      const ids = list.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const o of list) {
        expect(o.en.trim()).not.toBe('');
        expect(o.ar).toMatch(/[؀-ۿ]/);
      }
    }
  });

  it('include the requested crops and trees, with an Other fallback', () => {
    const crops = CROPS.map((c) => c.id);
    for (const id of ['wheat', 'maize', 'rice', 'sugarcane', 'vegetables', 'orchard', 'other']) expect(crops).toContain(id);
    const trees = TREES.map((t) => t.id);
    for (const id of ['mango', 'olive', 'citrus', 'date_palm', 'grape', 'other']) expect(trees).toContain(id);
  });

  it('reveal the tree field only for tree-based activities', () => {
    expect(cropNeedsTree('orchard')).toBe(true);
    expect(cropNeedsTree('date_palm')).toBe(true);
    expect(cropNeedsTree('wheat')).toBe(false);
    expect(cropNeedsTree('')).toBe(false);
  });

  it('never echoes an unknown id as a label', () => {
    expect(optionLabel(CROPS, 'wheat', 'ar')).toBe('القمح');
    expect(optionLabel(CROPS, '<script>', 'en')).toBeUndefined();
  });
});
