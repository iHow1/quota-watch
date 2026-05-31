import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Adapter, QuotaResource, ResourceStatus } from '../types';

const STATUSES: ResourceStatus[] = ['available', 'warning', 'exhausted', 'error', 'unknown'];

function coerceStatus(s: unknown): ResourceStatus {
  const v = String(s ?? '').toLowerCase();
  return (STATUSES as string[]).includes(v) ? (v as ResourceStatus) : 'unknown';
}
function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Map any tool-exported usage JSON into the dashboard. Path via QW_MANUAL_FILE. */
export const manualJsonAdapter: Adapter = {
  name: 'manual-json',
  describe: 'Map any tool-exported usage JSON (QW_MANUAL_FILE) into the dashboard.',
  async fetch(ctx): Promise<QuotaResource[]> {
    const file = ctx.env.QW_MANUAL_FILE;
    if (!file) return [];
    const raw = JSON.parse(readFileSync(resolve(file), 'utf8'));
    const list: Record<string, unknown>[] = Array.isArray(raw) ? raw : (raw.resources ?? []);
    const now = new Date().toISOString();
    return list.map((r, i) => ({
      id: String(r.id ?? `manual-${i}`),
      provider: String(r.provider ?? 'Manual'),
      displayName: String(r.displayName ?? r.name ?? `Resource ${i + 1}`),
      kind: String(r.kind ?? 'manual'),
      status: coerceStatus(r.status),
      shortWindowPercent: num(r.shortWindowPercent ?? r.short_pct),
      weekPercent: num(r.weekPercent ?? r.week_pct ?? r.weeklyPercent ?? r.weekly_pct),
      cyclePercent: num(r.cyclePercent ?? r.cycle_pct),
      latencyMs: num(r.latencyMs ?? r.latency_ms),
      resetAt: r.resetAt ? String(r.resetAt) : undefined,
      updatedAt: r.updatedAt ? String(r.updatedAt) : now,
      note: r.note ? String(r.note) : undefined,
    }));
  },
};
