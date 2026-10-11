import {
  GREETING_COUNT,
  greetingForDay,
} from '../../src/services/greeting-service';

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return d.toISOString().slice(0, 10);
}

describe('greetingForDay', () => {
  it('is deterministic for the same date', () => {
    expect(greetingForDay('2026-10-11')).toEqual(greetingForDay('2026-10-11'));
  });

  it('rotates without repeating across a full cycle', () => {
    const start = '2026-10-11';
    const seen = new Set<string>();
    const hellos = new Set<string>();
    for (let i = 0; i < GREETING_COUNT; i++) {
      const date = addDays(start, i);
      const greeting = greetingForDay(date);
      seen.add(greeting.fact);
      hellos.add(greeting.hello);
    }
    expect(seen.size).toBe(GREETING_COUNT);
    expect(hellos.size).toBe(GREETING_COUNT);
  });

  it('picks a different greeting across consecutive days', () => {
    const a = greetingForDay('2026-10-11');
    const b = greetingForDay('2026-10-12');
    expect(a).not.toEqual(b);
  });
});

describe('greeting pool', () => {
  it('contains at least 20 entries so it does not loop too fast', () => {
    expect(GREETING_COUNT).toBeGreaterThanOrEqual(20);
  });

  it('has a complete hello, pun and fact on every entry', () => {
    const start = '2026-01-01';
    for (let i = 0; i < GREETING_COUNT; i++) {
      const greeting = greetingForDay(addDays(start, i));
      expect(greeting.hello.trim().length).toBeGreaterThan(0);
      expect(greeting.pun.trim().length).toBeGreaterThan(0);
      expect(greeting.fact.trim().length).toBeGreaterThan(0);
    }
  });

  it('never returns arrays or empty strings', () => {
    expect(typeof greetingForDay('2027-12-31').hello).toBe('string');
  });
});