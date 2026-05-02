import { describe, it, expect } from 'vitest';
import { __testables } from './index';

const { isWithinDateWindow } = __testables;

describe('isWithinDateWindow (bundle freshness filter)', () => {
  describe('same-day bundles', () => {
    it('accepts a bundle from the same day', () => {
      expect(isWithinDateWindow('2026-05-02', '2026-05-02', 7)).toBe(true);
    });
  });

  describe('recent bundles within the window', () => {
    it('accepts a 1-day-old bundle with 7-day window', () => {
      expect(isWithinDateWindow('2026-05-01', '2026-05-02', 7)).toBe(true);
    });

    it('accepts a 5-day-old bundle with 7-day window', () => {
      expect(isWithinDateWindow('2026-04-27', '2026-05-02', 7)).toBe(true);
    });

    it('accepts a bundle exactly at the edge of the window (7 days)', () => {
      expect(isWithinDateWindow('2026-04-25', '2026-05-02', 7)).toBe(true);
    });
  });

  describe('stale bundles beyond the window', () => {
    it('rejects an 8-day-old bundle with 7-day window', () => {
      expect(isWithinDateWindow('2026-04-24', '2026-05-02', 7)).toBe(false);
    });

    it('rejects a 30-day-old bundle with 7-day window', () => {
      expect(isWithinDateWindow('2026-04-02', '2026-05-02', 7)).toBe(false);
    });
  });

  describe('future bundles (should never happen but guard anyway)', () => {
    it('rejects a bundle dated in the future', () => {
      expect(isWithinDateWindow('2026-05-03', '2026-05-02', 7)).toBe(false);
    });
  });

  describe('configurable window', () => {
    it('respects a 1-day window (strict)', () => {
      expect(isWithinDateWindow('2026-05-02', '2026-05-02', 1)).toBe(true);
      expect(isWithinDateWindow('2026-05-01', '2026-05-02', 1)).toBe(true);
      expect(isWithinDateWindow('2026-04-30', '2026-05-02', 1)).toBe(false);
    });

    it('respects a 14-day window (loose)', () => {
      expect(isWithinDateWindow('2026-04-18', '2026-05-02', 14)).toBe(true); // exactly 14 days
      expect(isWithinDateWindow('2026-04-17', '2026-05-02', 14)).toBe(false); // 15 days
    });
  });

  describe('cross-month and cross-year boundaries', () => {
    it('handles month boundaries correctly', () => {
      // 3 days back from May 2 is April 29
      expect(isWithinDateWindow('2026-04-29', '2026-05-02', 3)).toBe(true);
      expect(isWithinDateWindow('2026-04-28', '2026-05-02', 3)).toBe(false);
    });

    it('handles year boundaries correctly', () => {
      expect(isWithinDateWindow('2025-12-28', '2026-01-02', 5)).toBe(true);
      expect(isWithinDateWindow('2025-12-27', '2026-01-02', 5)).toBe(false);
    });
  });
});
