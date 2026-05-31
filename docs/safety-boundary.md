# Safety Boundary

Quota Watch is a **local-first, read-only** monitoring tool. It is deliberately scoped so it can only *observe* — never act.

## It only observes

- It reads status that you provide, or that an endpoint openly returns from a simple reachability check. It performs **no writes** and takes **no action** against any provider.
- It **never reads credential stores**: no OAuth credentials, no auth files, no CLI login state, no browser session files. There is no code path that touches them.
- It does not change how you authenticate to, or connect with, any provider.
- It is **not in the request path** — it does not forward or relay model traffic.
- It changes nothing about your provider plans, billing, or limits; it simply surfaces what you could already see yourself.
- It uploads nothing. Everything stays on your machine.

## How it gets data

Adapters may obtain data **only** through inputs the user explicitly provides:

- A local JSON file the user points to (`demo-json`, `manual-json`).
- An API endpoint + API key supplied **via environment variables** (`openai-compatible-health`), used solely for a reachability/latency health check (`GET /v1/models`).

Adapters never discover credentials on their own. If you don't configure an endpoint, that adapter returns nothing.

## Data handling

- Demo data (`examples/demo-quotas.json`) is entirely fake.
- Any history is written to a local, gitignored `data/` directory.
- `.env` is gitignored. Credentials stay local and are never committed.

## Intended use

A personal or small-team **AI usage radar**: see at a glance which of *your own* keys/endpoints are healthy, near a budget threshold, or unreachable — for planning and awareness.
