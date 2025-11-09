/**
 * Format a scene summary for compact display.
 *
 * - Trims leading and trailing whitespace before processing.
 * - Breaks long lines every 20 characters while preserving manual line breaks.
 * - Returns at most two lines; excess content is truncated with an ellipsis (`…`).
 */
export const formatSceneSummary = (summary: string): string => {
  const trimmed = summary.trim();
  if (trimmed.length === 0) {
    return '';
  }

  const MAX_LINE_LENGTH = 20;
  const MAX_DISPLAY_LINES = 2;

  const wrappedLines: string[] = [];
  trimmed.split('\n').forEach((line) => {
    if (line.length === 0) {
      wrappedLines.push('');
      return;
    }

    const characters = Array.from(line);
    for (let index = 0; index < characters.length; index += MAX_LINE_LENGTH) {
      wrappedLines.push(characters.slice(index, index + MAX_LINE_LENGTH).join(''));
    }
  });

  if (wrappedLines.length <= MAX_DISPLAY_LINES) {
    return wrappedLines.join('\n');
  }

  const truncatedLines = wrappedLines.slice(0, MAX_DISPLAY_LINES);
  const lastLineIndex = truncatedLines.length - 1;
  truncatedLines[lastLineIndex] = `${truncatedLines[lastLineIndex]}…`;
  return truncatedLines.join('\n');
};
