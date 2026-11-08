/**
 * Tests der Kontrastprüfung (reine Prüflogik, direkt ohne Mocks).
 */
import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  describeContrastIssue,
  passesWcagAaText,
  suggestReadablePair,
} from '../src/shared/contrast';
import { CURATED_BRAND_PACKAGES } from '../src/shared/brand';

describe('Kontrastprüfung (WCAG AA)', () => {
  it('rechnet bekannte Verhältnisse korrekt', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 1);
  });

  it('erkennt zu schwache Paare', () => {
    expect(passesWcagAaText('#CCCCCC', '#FFFFFF')).toBe(false);
    expect(passesWcagAaText('#445566', '#223344')).toBe(false);
    expect(passesWcagAaText('#FAFAFA', '#F0F0F0')).toBe(false);
  });

  it('erkennt ausreichende Paare', () => {
    expect(passesWcagAaText('#121212', '#FFFFFF')).toBe(true);
    expect(passesWcagAaText('#F2F4F8', '#0B0D12')).toBe(true);
  });

  it('lässt ausreichende Paare unverändert', () => {
    const suggestion = suggestReadablePair('#FFFFFF', '#121212');
    expect(suggestion.backgroundAdjusted).toBe(false);
    expect(suggestion.textColor).toBe('#121212');
    expect(suggestion.ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('schlägt für zu schwache Paare eine lesbare Alternative vor', () => {
    const suggestion = suggestReadablePair('#FFFFFF', '#BBBBBB');
    expect(contrastRatio(suggestion.textColor, suggestion.backgroundColor)).toBeGreaterThanOrEqual(4.5);

    // Sehr schwieriger Mittelton: hier muss auch der Hintergrund angepasst werden
    const hard = suggestReadablePair('#7A7A7A', '#808080');
    expect(contrastRatio(hard.textColor, hard.backgroundColor)).toBeGreaterThanOrEqual(4.5);
  });

  it('formuliert die Warnung verständlich', () => {
    const text = describeContrastIssue(2.34);
    expect(text).toContain('2,3');
    expect(text).toContain('4,5');
  });

  it('alle kuratierten Markenpakete bestehen die Text/Hintergrund-Prüfung', () => {
    for (const pkg of CURATED_BRAND_PACKAGES) {
      expect(
        passesWcagAaText(pkg.values['--brand-text'], pkg.values['--brand-background']),
        `Paket ${pkg.name}`
      ).toBe(true);
    }
  });
});
