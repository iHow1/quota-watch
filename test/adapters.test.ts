import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoJsonAdapter } from '../src/adapters/demo-json';
import { manualJsonAdapter } from '../src/adapters/manual-json';
import { selectAdapters, collect } from '../src/adapters/index';

const emptyCtx = { env: {} as NodeJS.ProcessEnv };
const VALID = ['available', 'warning', 'exhausted', 'error', 'unknown'];

test('demo adapter returns non-empty resources with valid status', async () => {
  const r = await demoJsonAdapter.fetch(emptyCtx);
  assert.ok(r.length > 0, 'demo should not be empty');
  for (const x of r) {
    assert.ok(VALID.includes(x.status), `bad status: ${x.status}`);
    assert.ok(x.id && x.provider && x.displayName, 'core fields present');
  }
});

test('selectAdapters defaults to demo when QW_SOURCE unset', () => {
  const a = selectAdapters({} as NodeJS.ProcessEnv);
  assert.equal(a[0].name, 'demo-json');
});

test('selectAdapters honours QW_SOURCE list', () => {
  const a = selectAdapters({ QW_SOURCE: 'manual,openai-health' } as NodeJS.ProcessEnv);
  assert.deepEqual(a.map((x) => x.name), ['manual-json', 'openai-compatible-health']);
});

test('manual adapter returns [] when no file configured', async () => {
  const r = await manualJsonAdapter.fetch(emptyCtx);
  assert.deepEqual(r, []);
});

test('collect merges and never throws on default ctx', async () => {
  const r = await collect(emptyCtx);
  assert.ok(Array.isArray(r) && r.length > 0);
});
