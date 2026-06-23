import { describe, it, expect } from 'vitest';
import { wmoCondition, fmtHour } from '../weather.js';

// Helper: build a local-time timestamp for a given hour of the current day.
// getHours() uses local time, so constructing from local hours is reliable
// regardless of the machine's timezone.
function localTimestamp(hour) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

// ---------------------------------------------------------------------------

describe('wmoCondition', () => {
  it.each([
    [0,  'Clear'],
    [1,  'Clear'],
    [2,  'Partly Cloudy'],
    [3,  'Overcast'],
    [45, 'Foggy'],
    [48, 'Foggy'],
    [51, 'Drizzle'],
    [57, 'Drizzle'],
    [61, 'Rain'],
    [67, 'Rain'],
    [71, 'Snow'],
    [77, 'Snow'],
    [80, 'Showers'],
    [82, 'Showers'],
    [85, 'Snow Showers'],
    [86, 'Snow Showers'],
    [95, 'Thunderstorm'],
    [99, 'Thunderstorm'],
  ])('code %i → label "%s"', (code, label) => {
    expect(wmoCondition(code).label).toBe(label);
  });

  it('returns a bg gradient string for every condition', () => {
    [0, 2, 3, 45, 55, 65, 73, 80, 85, 95].forEach(code => {
      expect(wmoCondition(code).bg).toMatch(/linear-gradient/);
    });
  });
});

// ---------------------------------------------------------------------------

describe('fmtHour', () => {
  it('formats midnight (hour 0) as 12am', () => {
    expect(fmtHour(localTimestamp(0))).toBe('12am');
  });

  it('formats noon (hour 12) as 12pm', () => {
    expect(fmtHour(localTimestamp(12))).toBe('12pm');
  });

  it('formats AM hours correctly (e.g. 1 → 1am)', () => {
    expect(fmtHour(localTimestamp(1))).toBe('1am');
    expect(fmtHour(localTimestamp(9))).toBe('9am');
    expect(fmtHour(localTimestamp(11))).toBe('11am');
  });

  it('formats PM hours correctly (e.g. 13 → 1pm)', () => {
    expect(fmtHour(localTimestamp(13))).toBe('1pm');
    expect(fmtHour(localTimestamp(18))).toBe('6pm');
    expect(fmtHour(localTimestamp(23))).toBe('11pm');
  });
});
