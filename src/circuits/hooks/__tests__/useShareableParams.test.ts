import { describe, it, expect } from 'vitest';
import { clampNum, parseEnum } from '@circuits/hooks/useShareableParams';

describe('clampNum', () => {
  it('returns fallback when raw is null', () => {
    expect(clampNum(null, 0, 100, 50)).toBe(50);
  });

  it('returns fallback when raw is not a number', () => {
    expect(clampNum('abc', 0, 100, 50)).toBe(50);
    expect(clampNum('twelve', 0, 100, 50)).toBe(50);
    expect(clampNum('12px', 0, 100, 50)).toBe(50);
  });

  it('returns fallback when raw is NaN or Infinity', () => {
    expect(clampNum('NaN', 0, 100, 50)).toBe(50);
    expect(clampNum('Infinity', 0, 100, 50)).toBe(50);
    expect(clampNum('-Infinity', 0, 100, 50)).toBe(50);
  });

  it('clamps to min when below range', () => {
    expect(clampNum('-10', 0, 100, 50)).toBe(0);
    expect(clampNum('0', 5, 100, 50)).toBe(5);
  });

  it('clamps to max when above range', () => {
    expect(clampNum('200', 0, 100, 50)).toBe(100);
    expect(clampNum('101', 0, 100, 50)).toBe(100);
  });

  it('returns parsed value when within range', () => {
    expect(clampNum('25', 0, 100, 50)).toBe(25);
    expect(clampNum('0', 0, 100, 50)).toBe(0);
    expect(clampNum('100', 0, 100, 50)).toBe(100);
  });

  it('handles decimal numbers correctly', () => {
    expect(clampNum('3.14', 0, 10, 5)).toBe(3.14);
    expect(clampNum('0.001', 0, 1, 0.5)).toBe(0.001);
    expect(clampNum('-0.5', 0, 1, 0.5)).toBe(0);
    expect(clampNum('1.5', 0, 1, 0.5)).toBe(1);
  });
});

describe('parseEnum', () => {
  const colors = ['red', 'green', 'blue'] as const;

  it('returns fallback when raw is null', () => {
    expect(parseEnum(null, colors, 'red')).toBe('red');
  });

  it('returns fallback when raw is not in allowed list', () => {
    expect(parseEnum('yellow', colors, 'red')).toBe('red');
    expect(parseEnum('', colors, 'green')).toBe('green');
    expect(parseEnum('RED', colors, 'blue')).toBe('blue');
  });

  it('returns the value when it is in the allowed list', () => {
    expect(parseEnum('red', colors, 'blue')).toBe('red');
    expect(parseEnum('green', colors, 'red')).toBe('green');
    expect(parseEnum('blue', colors, 'red')).toBe('blue');
  });

  it('works with different enum types', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    expect(parseEnum('medium', sizes, 'small')).toBe('medium');
    expect(parseEnum('xl', sizes, 'small')).toBe('small');

    const modes = ['series', 'parallel'] as const;
    expect(parseEnum('series', modes, 'parallel')).toBe('series');
    expect(parseEnum('mixed', modes, 'parallel')).toBe('parallel');
  });
});
