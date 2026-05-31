import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Adapter, QuotaResource } from '../types';

const DEMO_PATH = resolve(__dirname, '../../examples/demo-quotas.json');

/** Built-in fake data so the dashboard runs with zero config / zero keys. */
export const demoJsonAdapter: Adapter = {
  name: 'demo-json',
  describe: 'Built-in fake data so the dashboard runs with zero config.',
  async fetch(): Promise<QuotaResource[]> {
    const raw = JSON.parse(readFileSync(DEMO_PATH, 'utf8'));
    const now = new Date().toISOString();
    return (raw.resources ?? []).map((r: QuotaResource) => ({ updatedAt: now, ...r }));
  },
};
