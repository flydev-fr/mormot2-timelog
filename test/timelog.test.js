/**
 * Unit tests for mORMot2 TTimeLog JavaScript Module
 * Using Jest framework
 */
import { dateTimeToTimeLog, timeLogToDateTime, timeLogToISOString, TTIMELOG_BITS } from '../src/timelog.js'; // Ajustez le chemin et importez TTIMELOG_BITS

describe('mORMot2 TTimeLog Conversions', () => {
  // Test a round-trip at a known date
  test('Round-trip conversion retains exact values', () => {
    // Note: JavaScript Date months are 0-indexed (0 for January)
    const originalDate = new Date(Date.UTC(2025, 4, 13, 15, 30, 45, 0)); // May 13, 2025, 15:30:45 UTC
    const tl = dateTimeToTimeLog(originalDate);
    expect(typeof tl).toBe('bigint');

    const convertedDate = timeLogToDateTime(tl);
    expect(convertedDate.toISOString()).toBe(originalDate.toISOString());
    // Also check individual components to be sure
    expect(convertedDate.getUTCFullYear()).toBe(2025);
    expect(convertedDate.getUTCMonth()).toBe(4); // 0-indexed
    expect(convertedDate.getUTCDate()).toBe(13);
    expect(convertedDate.getUTCHours()).toBe(15);
    expect(convertedDate.getUTCMinutes()).toBe(30);
    expect(convertedDate.getUTCSeconds()).toBe(45);
  });

  test('timeLogToISOString returns correct ISO string without milliseconds', () => {
    const originalDate = new Date(Date.UTC(2025, 11, 31, 23, 59, 59, 0)); // December 31, 2025
    const tl = dateTimeToTimeLog(originalDate);
    const iso = timeLogToISOString(tl);
    expect(iso).toBe('2025-12-31T23:59:59');
  });

  test('Invalid input yields NaN or empty', () => {
    expect(timeLogToDateTime(BigInt(0)).getTime()).toBeNaN(); // Check with getTime() for invalid Date
    expect(timeLogToISOString(BigInt(0))).toBe('');

    const invalidDate = new Date('not a date');
    expect(dateTimeToTimeLog(invalidDate)).toBe(BigInt(0));
    expect(timeLogToDateTime(dateTimeToTimeLog(invalidDate)).getTime()).toBeNaN();
  });

  test('Boundary dates', () => {
    // Early date: Year 1, January 1st, 00:00:00 UTC
    const early = new Date(Date.UTC(1970, 0, 1, 0, 0, 0, 0));
    early.setUTCFullYear(1);
    early.setUTCMonth(0); // January
    early.setUTCDate(1);  // 1st
    expect(early.getUTCFullYear()).toBe(1); // Verify JS Date object

    const tlEarly = dateTimeToTimeLog(early);
    const convEarly = timeLogToDateTime(tlEarly);

    expect(convEarly.getUTCFullYear()).toBe(1);
    expect(convEarly.getUTCMonth()).toBe(0); // JS month 0 = January
    expect(convEarly.getUTCDate()).toBe(1);
    expect(convEarly.getUTCHours()).toBe(0);
    expect(convEarly.getUTCMinutes()).toBe(0);
    expect(convEarly.getUTCSeconds()).toBe(0);

    const yearZeroDate = new Date(Date.UTC(1970, 0, 1));
    yearZeroDate.setUTCFullYear(0);
    const tlYearZero = dateTimeToTimeLog(yearZeroDate);
    expect(tlYearZero).toBe(BigInt(0)); // Our function should return 0 for year 0
    expect(timeLogToDateTime(tlYearZero).getTime()).toBeNaN();

    const future = new Date(Date.UTC(2100, 11, 31, 23, 59, 59, 0)); // December 31, 2100
    const tlFuture = dateTimeToTimeLog(future);
    const convFuture = timeLogToDateTime(tlFuture);
    expect(convFuture.getUTCFullYear()).toBe(2100);
    expect(convFuture.getUTCMonth()).toBe(11);
    expect(convFuture.getUTCDate()).toBe(31);

    const veryFarFuture = new Date(0);
    veryFarFuture.setUTCFullYear(100000);
    veryFarFuture.setUTCMonth(0);
    veryFarFuture.setUTCDate(1);
    veryFarFuture.setUTCHours(0); veryFarFuture.setUTCMinutes(0); veryFarFuture.setUTCSeconds(0);

    const tlVeryFar = dateTimeToTimeLog(veryFarFuture);
    const convVeryFar = timeLogToDateTime(tlVeryFar);
    expect(convVeryFar.getUTCFullYear()).toBe(100000);

    // Smallest positive TTimeLog (Year 1, Month 1 (stored 0), Day 1 (stored 0), 00:00:00 UTC)
    let manualSmallestTL = BigInt(0); // Seconds (0-5)
    manualSmallestTL |= (BigInt(0) << BigInt(TTIMELOG_BITS.SECONDS)); // Minutes (6-11)
    manualSmallestTL |= (BigInt(0) << BigInt(TTIMELOG_BITS.SECONDS + TTIMELOG_BITS.MINUTES)); // Hours (12-16)
    manualSmallestTL |= (BigInt(0) << BigInt(TTIMELOG_BITS.SECONDS + TTIMELOG_BITS.MINUTES + TTIMELOG_BITS.HOURS)); // Day (17-21)
    manualSmallestTL |= (BigInt(0) << BigInt(TTIMELOG_BITS.SECONDS + TTIMELOG_BITS.MINUTES + TTIMELOG_BITS.HOURS + TTIMELOG_BITS.DAY)); // Month (22-25)
    manualSmallestTL |= (BigInt(1) << BigInt(TTIMELOG_BITS.SECONDS + TTIMELOG_BITS.MINUTES + TTIMELOG_BITS.HOURS + TTIMELOG_BITS.DAY + TTIMELOG_BITS.MONTH)); // Year 1 (26+)

    const convSmallest = timeLogToDateTime(manualSmallestTL);
    expect(convSmallest.getUTCFullYear()).toBe(1);
    expect(convSmallest.getUTCMonth()).toBe(0);
    expect(convSmallest.getUTCDate()).toBe(1);
    expect(convSmallest.getUTCHours()).toBe(0);
    expect(convSmallest.getUTCMinutes()).toBe(0);
    expect(convSmallest.getUTCSeconds()).toBe(0);
  });
});