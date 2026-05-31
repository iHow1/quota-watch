import { createServer, ServerResponse } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { collect } from './adapters';
import { appendSample, readHistory } from './storage';

// Load .env if present (Node 20.12+/21+). Zero-dependency, cross-platform, optional.
try { (process as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.('.env'); } catch { /* no .env / older node */ }

const PORT = Number(process.env.QW_PORT ?? 4319);
const PUBLIC_DIR = resolve(__dirname, '../public');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

function serveStatic(res: ServerResponse, pathname: string): void {
  const rel = pathname === '/' ? '/index.html' : pathname;
  const file = resolve(PUBLIC_DIR, '.' + rel);
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end('forbidden'); return; } // no traversal
  if (!existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  try {
    if (url.pathname === '/api/resources') {
      const resources = await collect({ env: process.env });
      appendSample(resources);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        generatedAt: new Date().toISOString(),
        source: process.env.QW_SOURCE ?? 'demo',
        resources,
      }));
      return;
    }
    if (url.pathname === '/api/history') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(readHistory()));
      return;
    }
    serveStatic(res, url.pathname);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: (e as Error).message }));
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Quota Watch  ->  http://localhost:${PORT}   (source: ${process.env.QW_SOURCE ?? 'demo'})`);
});
