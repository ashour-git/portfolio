type Result = { ok: true } | { ok: false; retryAfterSec: number };

export class RateLimiter {
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

  check(ip: string): Result {
    const t = this.now();
    const minWindow = this.minute.get(ip)?.filter((ts) => t - ts < 60_000) ?? [];
    const hourWindow = this.hour.get(ip)?.filter((ts) => t - ts < 3_600_000) ?? [];

    if (minWindow.length >= this.opts.limitPerMinute || hourWindow.length >= this.opts.limitPerHour) {
      this.minute.set(ip, minWindow);
      this.hour.set(ip, hourWindow);
      const oldest = hourWindow[0] ?? minWindow[0] ?? t;
      return { ok: false, retryAfterSec: Math.ceil((oldest + 60_000 - t) / 1000) };
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