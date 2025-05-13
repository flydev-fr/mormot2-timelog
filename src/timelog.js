/**
 * mORMot2 TTimeLog JavaScript Module
 *
 * This module provides functions to convert between the internal mORMot2 TTimeLog format (Int64)
 * and JavaScript Date objects or ISO 8601 strings.
 * Based on the bit structure:
 *   - Seconds (SS): 6 bits (0-63)
 *   - Minutes (MM): 6 bits (0-63)
 *   - Hours   (HH): 5 bits (0-31)
 *   - Day     (D) : 5 bits (0-31) (stored 0-indexed, e.g., 1st of month is 0)
 *   - Month   (M) : 4 bits (0-15) (stored 0-indexed, e.g., January is 0)
 *   - Year    (Y) : Remaining bits (up to 38 for Int64)
 */

// Constants for TTimeLog bit field sizes
export const TTIMELOG_BITS = Object.freeze({
  SECONDS: 6,
  MINUTES: 6,
  HOURS:   5,
  DAY:     5,
  MONTH:   4,
  // YEAR: 38 (calculated as remaining for a 64-bit integer)
});

// Masks for extracting each field
export const TTIMELOG_MASKS = Object.freeze({
  SECONDS: 0x3F,  // (1 << 6) - 1
  MINUTES: 0x3F,  // (1 << 6) - 1
  HOURS:   0x1F,  // (1 << 5) - 1
  DAY:     0x1F,  // (1 << 5) - 1
  MONTH:   0x0F   // (1 << 4) - 1
});

/**
 * Converts a JavaScript Date or ISO string to a mORMot TTimeLog (Int64 as BigInt).
 * The TTimeLog will represent the date and time in UTC.
 * @param {Date|string} dateInput - JavaScript Date instance or ISO-compatible string.
 * @returns {BigInt} TTimeLog value (Int64), or BigInt(0) for invalid input.
 */
export function dateTimeToTimeLog(dateInput) {
  const date = (typeof dateInput === 'string')
    ? new Date(dateInput)
    : (dateInput instanceof Date)
      ? dateInput
      : null;

  // Check for invalid date after parsing or if null was passed
  if (!date || isNaN(date.getTime())) return BigInt(0);

  const year  = date.getUTCFullYear();
  const month = date.getUTCMonth(); // JS UTC months are 0-indexed (0-11)
  const day   = date.getUTCDate() - 1; // JS UTC days are 1-indexed, TTimeLog stores 0-indexed
  const hours = date.getUTCHours();
  const mins  = date.getUTCMinutes();
  const secs  = date.getUTCSeconds();

  // mORMot TTimeLog considers year/month/day 0 as invalid for actual date representation
  // (even though internally it stores month/day 0-indexed).
  // DateTimeToTimeLog would return 0 if any of these are invalid from a TDateTime.
  if (year === 0 || (date.getUTCMonth() + 1) === 0 || date.getUTCDate() === 0) return BigInt(0);

  // Calculate bit shifts dynamically for clarity and maintainability
  let shift = 0n;
  let tl = BigInt(secs);

  shift += BigInt(TTIMELOG_BITS.SECONDS);
  tl |= BigInt(mins)  << shift;

  shift += BigInt(TTIMELOG_BITS.MINUTES);
  tl |= BigInt(hours) << shift;

  shift += BigInt(TTIMELOG_BITS.HOURS);
  tl |= BigInt(day)   << shift; // day is already 0-indexed

  shift += BigInt(TTIMELOG_BITS.DAY);
  tl |= BigInt(month) << shift; // month is already 0-indexed

  shift += BigInt(TTIMELOG_BITS.MONTH);
  tl |= BigInt(year)  << shift;

  return tl;
}

/**
 * Converts a mORMot TTimeLog (BigInt or number, assumed to be UTC) to a JavaScript Date object (in UTC).
 * @param {BigInt|number} timeLogValue
 * @returns {Date} JavaScript Date object (UTC). Returns an invalid Date (getTime() === NaN) for invalid or zero TTimeLog.
 */
export function timeLogToDateTime(timeLogValue) {
  const tl = BigInt(timeLogValue);
  if (tl === BigInt(0)) return new Date(NaN);

  let shift = 0n;
  const secs  = Number((tl >> shift) & BigInt(TTIMELOG_MASKS.SECONDS));
  shift += BigInt(TTIMELOG_BITS.SECONDS);
  const mins  = Number((tl >> shift) & BigInt(TTIMELOG_MASKS.MINUTES));
  shift += BigInt(TTIMELOG_BITS.MINUTES);
  const hours = Number((tl >> shift) & BigInt(TTIMELOG_MASKS.HOURS));
  shift += BigInt(TTIMELOG_BITS.HOURS);
  const dayStored = Number((tl >> shift) & BigInt(TTIMELOG_MASKS.DAY)); // 0-indexed
  shift += BigInt(TTIMELOG_BITS.DAY);
  const monthStored = Number((tl >> shift) & BigInt(TTIMELOG_MASKS.MONTH)); // 0-indexed
  shift += BigInt(TTIMELOG_BITS.MONTH);
  const year  = Number(tl >> shift);

  // For JavaScript Date, month is 0-indexed, day is 1-indexed.
  const jsMonth = monthStored; // Already 0-indexed
  const jsDay = dayStored + 1;   // Convert 0-indexed day to 1-indexed

  // mORMot TTimeLog convention: year 0 or month 0 or day 0 (after adding 1) is invalid.
  if (year === 0 || (monthStored + 1) === 0 || (dayStored + 1) === 0) return new Date(NaN);

  // Create date in UTC.
  // For years 0-99, JavaScript's Date constructor (and Date.UTC)
  // will interpret them as 1900-1999.
  // We construct with a "safe" year if year is in 0-99 range,
  // then explicitly set the correct full year using setUTCFullYear.
  let tempConstructionYear = year;
  if (year >= 0 && year < 100) {
    tempConstructionYear = year + 2000; // Use a year that won't be misinterpreted during construction
  }

  const date = new Date(Date.UTC(tempConstructionYear, jsMonth, jsDay, hours, mins, secs, 0));

  // Explicitly set the full year if it was originally in the 0-99 range.
  // This overrides JavaScript's 19xx interpretation for those small years.
  if (year >= 0 && year < 100) {
    date.setUTCFullYear(year);
  }

  // Final validation to ensure the created JS Date components match the extracted ones.
  // This catches cases where TTimeLog might have held out-of-range values for day/month
  // that Date.UTC() might have "corrected" by rolling over.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== jsMonth || // jsMonth is 0-indexed
    date.getUTCDate() !== jsDay ||     // jsDay is 1-indexed
    date.getUTCHours() !== hours ||
    date.getUTCMinutes() !== mins ||
    date.getUTCSeconds() !== secs
  ) {
    return new Date(NaN); // Indicates an invalid input TTimeLog that couldn't form a valid date
  }

  return date;
}

/**
 * Converts a mORMot TTimeLog to an ISO 8601 string (YYYY-MM-DDTHH:MM:SS).
 * The output string will be in UTC.
 * @param {BigInt|number} timeLogValue
 * @returns {string} ISO 8601 string without milliseconds, or empty string for invalid TTimeLog.
 */
export function timeLogToISOString(timeLogValue) {
  const date = timeLogToDateTime(timeLogValue);
  if (isNaN(date.getTime())) return '';
  // date.toISOString() returns YYYY-MM-DDTHH:mm:ss.sssZ
  // We remove the milliseconds and the 'Z' for a simpler ISO string.
  return date.toISOString().replace(/\.\d{3}Z$/, '');
}

// Optional helper for zero-padding (not used by timeLogToISOString above as toISOString handles it)
/*
function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}
*/