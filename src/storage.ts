import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { QuotaResource } from './types';

const HISTORY_PATH = resolve(__dirname, '../data/history.json');

export interface Sample {
  observedAt: string;
  resources: QuotaResource[];
}

/** Append a snapshot to local JSON history. Best-effort: never breaks the dashboard. */
export function appendSample(resources: QuotaResource[], max = 500): void {
  try {
    mkdirSync(dirname(HISTORY_PATH), { recursive: true });
    let hist: Sample[] = [];
    if (existsSync(HISTORY_PATH)) {
      try { hist = JSON.parse(readFileSync(HISTORY_PATH, 'utf8')) as Sample[]; } catch { hist = []; }
    }
    hist.push({ observedAt: new Date().toISOString(), resources });
    if (hist.length > max) hist = hist.slice(-max);
    writeFileSync(HISTORY_PATH, JSON.stringify(hist, null, 2));
  } catch {
    /* history is optional; ignore */
  }
}

export function readHistory(): Sample[] {
  try { return JSON.parse(readFileSync(HISTORY_PATH, 'utf8')) as Sample[]; } catch { return []; }
}
