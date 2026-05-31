import type { Adapter, QuotaResource, ResourceStatus } from '../types';

/**
 * Health check for any OpenAI-compatible endpoint.
 * - Only calls GET {base}/v1/models.
 * - Reports reachability + latency only. Does NOT compute real quota
 *   unless the upstream explicitly returns usage (MVP does not parse usage).
 * - API key is read ONLY from env (QW_OPENAI_API_KEY). Never from credential stores.
 * - Read-only: performs the health check only and takes no action against the endpoint.
 */
export const openaiCompatibleHealthAdapter: Adapter = {
  name: 'openai-compatible-health',
  describe: 'Reachability/latency health check (/v1/models) for an OpenAI-compatible endpoint.',
  async fetch(ctx): Promise<QuotaResource[]> {
    const base = ctx.env.QW_OPENAI_BASE_URL;
    if (!base) return [];
    const key = ctx.env.QW_OPENAI_API_KEY; // env only
    const url = base.replace(/\/+$/, '') + '/v1/models';

    let host = base;
    try { host = new URL(base).host; } catch { /* keep raw */ }

    const started = Date.now();
    let status: ResourceStatus = 'unknown';
    let note = '';
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, {
        method: 'GET',
        headers: key ? { Authorization: `Bearer ${key}` } : {},
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) { status = 'available'; note = 'reachable'; }
      else if (res.status === 401 || res.status === 403) { status = 'error'; note = 'unauthorized'; }
      else { status = 'error'; note = `http ${res.status}`; }
    } catch (e) {
      status = 'error';
      note = (e as { name?: string })?.name === 'AbortError' ? 'timeout' : 'unreachable';
    }

    return [{
      id: `openai-health-${host}`,
      provider: 'OpenAI-compatible',
      displayName: `Endpoint ${host}`,
      kind: 'endpoint',
      status,
      latencyMs: Date.now() - started,
      updatedAt: new Date().toISOString(),
      note,
    }];
  },
};
