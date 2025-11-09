import { describe, expect, it } from 'vitest';

import { formatSceneSummary } from '../summaryFormatter';

describe('formatSceneSummary', () => {
  it('returns an empty string when the input is blank', () => {
    expect(formatSceneSummary('   ')).toBe('');
    expect(formatSceneSummary('\n')).toBe('');
  });

  it('preserves manual line breaks after trimming', () => {
    const input = '  第一行\n第二行  ';
    expect(formatSceneSummary(input)).toBe('第一行\n第二行');
  });

  it('wraps long text and appends an ellipsis when truncating', () => {
    const longText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuv';
    expect(formatSceneSummary(longText)).toBe('ABCDEFGHIJKLMNOPQRST\nUVWXYZ0123456789abcd…');
  });
});
