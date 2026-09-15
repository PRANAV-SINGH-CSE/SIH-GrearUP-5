import { DateDetail } from '../types/extraction';

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export class DateNormalizer {
  /**
   * Parses date declarations on product packaging (DD/MM/YYYY, MM/YYYY, Month YYYY).
   * Flags potential month/day ambiguity when values <= 12.
   */
  static normalizeDate(raw: string): DateDetail | null {
    if (!raw || typeof raw !== 'string') return null;

    const trimmed = raw.trim();

    // 1. Check textual month: e.g. "FEB 2026", "02 FEB 2026"
    const textMonthMatch = trimmed.match(
      /(?:(\d{1,2})[\s\-\/\.]+)?([a-zA-Z]{3,9})[\s\-\/\.]+(\d{4})/i
    );
    if (textMonthMatch) {
      const day = textMonthMatch[1] ? parseInt(textMonthMatch[1], 10) : undefined;
      const monthStr = textMonthMatch[2].toLowerCase();
      const month = MONTH_NAMES[monthStr];
      const year = parseInt(textMonthMatch[3], 10);

      if (month && year > 2000 && year < 2100) {
        return {
          day,
          month,
          year,
          rawText: trimmed,
          isoString: day
            ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            : `${year}-${String(month).padStart(2, '0')}`,
          isAmbiguous: false,
        };
      }
    }

    // 2. Check numeric MM/YYYY: e.g. "03/2026", "03-2026"
    const monthYearMatch = trimmed.match(/(?:^|[\s:])(\d{1,2})[\/\-\.](\d{4})(?:$|[\s,])/);
    if (monthYearMatch) {
      const month = parseInt(monthYearMatch[1], 10);
      const year = parseInt(monthYearMatch[2], 10);
      if (month >= 1 && month <= 12 && year > 2000 && year < 2100) {
        return {
          month,
          year,
          rawText: trimmed,
          isoString: `${year}-${String(month).padStart(2, '0')}`,
          isAmbiguous: false,
        };
      }
    }

    // 3. Check numeric full date: DD/MM/YYYY or MM/DD/YYYY
    const fullDateMatch = trimmed.match(
      /(?:^|[\s:])(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})(?:$|[\s,])/
    );
    if (fullDateMatch) {
      const part1 = parseInt(fullDateMatch[1], 10);
      const part2 = parseInt(fullDateMatch[2], 10);
      const year = parseInt(fullDateMatch[3], 10);

      // In India, standard format is DD/MM/YYYY.
      // If both are <= 12, it is ambiguous.
      const isAmbiguous = part1 <= 12 && part2 <= 12;
      const day = part1;
      const month = part2;

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 2000 && year < 2100) {
        return {
          day,
          month,
          year,
          rawText: trimmed,
          isoString: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          isAmbiguous,
        };
      }
    }

    return null;
  }
}
