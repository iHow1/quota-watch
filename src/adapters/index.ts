import type { Adapter, AdapterContext, QuotaResource } from '../types';
import { demoJsonAdapter } from './demo-json';
import { manualJsonAdapter } from './manual-json';
import { openaiCompatibleHealthAdapter } from './openai-compatible-health';

/** Registry keyed by the value used in QW_SOURCE. */
export const ALL_ADAPTERS: Record<string, Adapter> = {
  demo: demoJsonAdapter,
  manual: manualJsonAdapter,
  'openai-health': openaiCompatibleHealthAdapter,
};

/** Pick adapters from QW_SOURCE (comma-separated). Defaults to demo. */
export function selectAdapters(env: NodeJS.ProcessEnv): Adapter[] {
  const sel = (env.QW_SOURCE ?? 'demo')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const out: Adapter[] = [];
  for (const s of sel) {
    const a = ALL_ADAPTERS[s];
    if (a) out.push(a);
  }
  return out.length ? out : [demoJsonAdapter];
}

/** Run all active adapters and merge results; one failing adapter never breaks the rest. */
export async function collect(ctx: AdapterContext): Promise<QuotaResource[]> {
  const adapters = selectAdapters(ctx.env);
  const settled = await Promise.allSettled(adapters.map((a) => a.fetch(ctx)));
  const all: QuotaResource[] = [];
  for (const r of settled) if (r.status === 'fulfilled') all.push(...r.value);
  return all;
}
