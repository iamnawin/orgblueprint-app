/**
 * Per-IP AI quota enforcement.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * are set; falls back to an in-memory Map for local dev.
 *
 * Limits: max 3 AI runs per day per IP, 30-second cooldown between runs.
 */

const MAX_DAILY = 3;
const COOLDOWN_SECONDS = 30;
const DAY_SECONDS = 86_400;

export interface QuotaStatus {
  allowed: boolean;
  usedToday: number;
  remainingToday: number;
  resetAt: string; // ISO date for next daily reset
  cooldownSeconds?: number; // > 0 when in cooldown
}

// ── In-memory fallback (single serverless instance, dev-only) ─────────────────
const memStore = new Map<string, { count: number; lastRun: number; resetAt: number }>();

function todayResetTimestamp(): number {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

// ── Upstash REST client (zero deps — raw fetch) ───────────────────────────────
async function redisCommand(args: string[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(`${url}/${args.join("/")}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as { result: unknown };
  return json.result;
}

async function redisPipeline(commands: string[][]): Promise<unknown[]> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });
  const json = (await res.json()) as Array<{ result: unknown }>;
  return json.map((r) => r.result);
}

function hasRedis(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// ── Main check & increment ─────────────────────────────────────────────────────
export async function checkAndRecordAiRun(ip: string): Promise<QuotaStatus> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const resetAt = todayResetTimestamp();
  const resetAtIso = new Date(resetAt * 1000).toISOString();

  if (hasRedis()) {
    return redisQuota(ip, nowSeconds, resetAt, resetAtIso);
  } else {
    return memQuota(ip, nowSeconds, resetAt, resetAtIso);
  }
}

// ── Redis implementation ──────────────────────────────────────────────────────
async function redisQuota(
  ip: string,
  now: number,
  resetAt: number,
  resetAtIso: string
): Promise<QuotaStatus> {
  const countKey = `quota:count:${ip}:${resetAt}`;
  const lastKey = `quota:last:${ip}`;

  // Read count and last-run in parallel
  const [rawCount, rawLast] = await redisPipeline([
    ["GET", countKey],
    ["GET", lastKey],
  ]);

  const usedToday = rawCount ? parseInt(String(rawCount), 10) : 0;
  const lastRun = rawLast ? parseInt(String(rawLast), 10) : 0;

  // Cooldown check
  const secsSinceLast = now - lastRun;
  if (lastRun > 0 && secsSinceLast < COOLDOWN_SECONDS) {
    return {
      allowed: false,
      usedToday,
      remainingToday: Math.max(0, MAX_DAILY - usedToday),
      resetAt: resetAtIso,
      cooldownSeconds: COOLDOWN_SECONDS - secsSinceLast,
    };
  }

  // Daily limit check
  if (usedToday >= MAX_DAILY) {
    return {
      allowed: false,
      usedToday,
      remainingToday: 0,
      resetAt: resetAtIso,
    };
  }

  // Increment count (with TTL until midnight) and record last-run
  const ttl = resetAt - now + 60; // +60s buffer
  await redisPipeline([
    ["SET", countKey, String(usedToday + 1), "EX", String(ttl)],
    ["SET", lastKey, String(now), "EX", String(DAY_SECONDS + 60)],
  ]);

  return {
    allowed: true,
    usedToday: usedToday + 1,
    remainingToday: MAX_DAILY - usedToday - 1,
    resetAt: resetAtIso,
  };
}

// ── In-memory fallback ────────────────────────────────────────────────────────
async function memQuota(
  ip: string,
  now: number,
  resetAt: number,
  resetAtIso: string
): Promise<QuotaStatus> {
  const existing = memStore.get(ip);

  // If past reset time, clear the entry
  if (existing && now >= existing.resetAt) {
    memStore.delete(ip);
  }

  const entry = memStore.get(ip) ?? { count: 0, lastRun: 0, resetAt };

  // Cooldown check
  const secsSinceLast = now - entry.lastRun;
  if (entry.lastRun > 0 && secsSinceLast < COOLDOWN_SECONDS) {
    return {
      allowed: false,
      usedToday: entry.count,
      remainingToday: Math.max(0, MAX_DAILY - entry.count),
      resetAt: resetAtIso,
      cooldownSeconds: COOLDOWN_SECONDS - secsSinceLast,
    };
  }

  // Daily limit check
  if (entry.count >= MAX_DAILY) {
    return {
      allowed: false,
      usedToday: entry.count,
      remainingToday: 0,
      resetAt: resetAtIso,
    };
  }

  // Record the run
  memStore.set(ip, { count: entry.count + 1, lastRun: now, resetAt });

  return {
    allowed: true,
    usedToday: entry.count + 1,
    remainingToday: MAX_DAILY - entry.count - 1,
    resetAt: resetAtIso,
  };
}
