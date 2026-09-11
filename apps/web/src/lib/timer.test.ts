import { describe, expect, it } from 'vitest';
import { formatWaitDuration, resolveWaitClock } from './timer';

const NOW = Date.parse('2026-02-01T12:10:00.000Z');

describe('resolveWaitClock', () => {
  it('counts up while an order is still active', () => {
    const clock = resolveWaitClock({
      startedAt: '2026-02-01T12:00:00.000Z',
      status: 'IN_PREPARATION',
      now: NOW
    });

    expect(clock).toEqual({ isRunning: true, label: 'Waiting', seconds: 600, minutes: 10 });
  });

  it('stops counting once the order is completed', () => {
    const clock = resolveWaitClock({
      startedAt: '2026-02-01T12:00:00.000Z',
      status: 'COMPLETED',
      resolvedAt: '2026-02-01T12:04:30.000Z',
      now: NOW + 10 * 60_000
    });

    expect(clock.isRunning).toBe(false);
    expect(clock.label).toBe('Fulfilled in');
    expect(clock.seconds).toBe(270);
  });

  it('falls back to the last update when resolvedAt has not been populated', () => {
    const clock = resolveWaitClock({
      startedAt: '2026-02-01T12:00:00.000Z',
      status: 'COMPLETED',
      resolvedAt: null,
      fallbackEndAt: '2026-02-01T12:06:00.000Z',
      now: NOW + 60 * 60_000
    });

    expect(clock.isRunning).toBe(false);
    expect(clock.seconds).toBe(360);
  });

  it('labels non-completion closures differently but still freezes them', () => {
    const clock = resolveWaitClock({
      startedAt: '2026-02-01T12:00:00.000Z',
      status: 'CANCELLED',
      resolvedAt: '2026-02-01T12:01:00.000Z',
      now: NOW
    });

    expect(clock.label).toBe('Closed after');
    expect(clock.seconds).toBe(60);
    expect(clock.isRunning).toBe(false);
  });

  it('never returns a negative or NaN duration', () => {
    expect(
      resolveWaitClock({ startedAt: 'not-a-date', status: 'PENDING', now: NOW }).seconds
    ).toBe(0);
    expect(
      resolveWaitClock({
        startedAt: '2026-02-01T12:00:00.000Z',
        status: 'PENDING',
        now: Date.parse('2026-02-01T11:00:00.000Z')
      }).seconds
    ).toBe(0);
  });
});

describe('formatWaitDuration', () => {
  it('renders minutes and seconds', () => {
    expect(formatWaitDuration(0)).toBe('00:00');
    expect(formatWaitDuration(42)).toBe('00:42');
    expect(formatWaitDuration(270)).toBe('04:30');
    expect(formatWaitDuration(600)).toBe('10:00');
  });

  it('switches to hours past 60 minutes', () => {
    expect(formatWaitDuration(3600)).toBe('1h 00m');
    expect(formatWaitDuration(3840)).toBe('1h 04m');
  });
});
