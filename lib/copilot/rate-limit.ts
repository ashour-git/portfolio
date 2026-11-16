type Result = { ok: true } | { ok: false; retryAfterSec: number };

const PRUNE_EVERY = 100;

export class RateLimiter {
  private calls = 0;
  private minute: Map<string, number[]> = new Map();
  private hour: Map<string, number[]> = new Map();
  private readonly now: () => number;

  constructor(
    private readonly opts: {
      limitPerMinute: number;
      limitPerHour: number;
      now?: () => number;
    },
  ) {
    this.now = opts.now ?? Date.now;
  }

  /** Number of tracked IPs (hour window is the superset). */
  get size(): number {
    return this.hour.size;
  }

  /** Drops IPs whose newest request has aged out of the window, so one-off visitors don't accumulate forever. */
  prune(t = this.now()): void {
    for (const [ip, ts] of this.minute) if (!ts.length || t - ts[ts.length - 1] >= 60_000) this.minute.delete(ip);
    for (const [ip, ts] of this.hour) if (!ts.length || t - ts[ts.length - 1] >= 3_600_000) this.hour.delete(ip);
  }

  check(ip: string): Result {
    const t = this.now();
    if (++this.calls % PRUNE_EVERY === 0) this.prune(t);
    const minWindow = this.minute.get(ip)?.filter((ts) => t - ts < 60_000) ?? [];
    const hourWindow = this.hour.get(ip)?.filter((ts) => t - ts < 3_600_000) ?? [];

    if (minWindow.length >= this.opts.limitPerMinute || hourWindow.length >= this.opts.limitPerHour) {
      this.minute.set(ip, minWindow);
      this.hour.set(ip, hourWindow);
      const minuteRetry = minWindow.length >= this.opts.limitPerMinute
        ? Math.ceil((minWindow[0] + 60_000 - t) / 1000)
        : 0;
      const hourRetry = hourWindow.length >= this.opts.limitPerHour
        ? Math.ceil((hourWindow[0] + 3_600_000 - t) / 1000)
        : 0;
      return { ok: false, retryAfterSec: Math.max(minuteRetry, hourRetry, 1) };
    }

    minWindow.push(t);
    hourWindow.push(t);
    this.minute.set(ip, minWindow);
    this.hour.set(ip, hourWindow);
    return { ok: true };
  }

  clear(): void {
    this.minute.clear();
    this.hour.clear();
  }
}