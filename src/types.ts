// Core types for Quota Watch. Intentionally provider-neutral.

export type ResourceStatus =
  | 'available'
  | 'warning'
  | 'exhausted'
  | 'error'
  | 'unknown';

/** A single monitored quota/usage/health resource. All fields are non-sensitive. */
export interface QuotaResource {
  id: string;
  provider: string;
  displayName: string;
  /** api_key | gateway | endpoint | manual ... */
  kind: string;
  status: ResourceStatus;
  /** short rolling window usage %, e.g. last 5h */
  shortWindowPercent?: number;
  /** billing cycle usage %, e.g. weekly/monthly */
  cyclePercent?: number;
  latencyMs?: number;
  resetAt?: string;
  updatedAt?: string;
  note?: string;
}

export interface AdapterContext {
  /**
   * Config is sourced ONLY from environment variables / user-pointed local files.
   * Adapters must never read OAuth credentials, auth stores, CLI login state, or browser session files.
   */
  env: NodeJS.ProcessEnv;
}

export interface Adapter {
  name: string;
  describe: string;
  fetch(ctx: AdapterContext): Promise<QuotaResource[]>;
}
