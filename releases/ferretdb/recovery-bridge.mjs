#!/usr/bin/env node
// recovery-bridge.mjs — tiny standalone HTTP server that answers EVERY URL with a
// "recovering your data" page (HTTP 503) on the web port. The start scripts run this
// for a short, bounded grace window while a just-restored FerretDB v1 (SQLite) comes
// back up after a #6492 data recovery, so users see a clear maintenance page instead of
// a connection error during the restart gap. It is only a brief bridge: the scripts
// then start WeKan, whose own in-app recovery spinner (driven by the same
// RECOVERY_IN_PROGRESS marker) takes over until the server has health-probed the
// database and cleared the marker. No external modules (only node:http), so it runs
// even while the database is still coming up.
import http from 'node:http';

const PORT = parseInt(process.env.PORT || '80', 10);
const PRODUCT = (process.env.PRODUCT_NAME || 'WeKan').replace(/[<>&]/g, '').slice(0, 80);

const HTML = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="10">
<title>${PRODUCT} — Recovering data</title>
<style>
  :root{color-scheme:light dark}
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;
    min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#eceff1;color:#2c3e50}
  @media (prefers-color-scheme:dark){body{background:#1b1f23;color:#e6e6e6}}
  .card{max-width:34em;margin:1.5em;padding:2em 2.4em;border-radius:10px;text-align:center;
    background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.08)}
  @media (prefers-color-scheme:dark){.card{background:#24292e;box-shadow:0 2px 10px rgba(0,0,0,.4)}}
  h1{color:#2980b9;font-size:1.6em;margin:.2em 0 .4em}
  p{font-size:1.1em;line-height:1.5;margin:.6em 0}
  .muted{color:#7f8c9a;font-size:.95em}
  .spin{display:inline-block;width:1.1em;height:1.1em;margin-right:.4em;vertical-align:-.15em;
    border:3px solid #d6e4ef;border-top-color:#2980b9;border-radius:50%;animation:s .9s linear infinite}
  @keyframes s{to{transform:rotate(360deg)}}
</style></head><body>
<div class="card">
  <h1><span class="spin"></span>${PRODUCT} is recovering your data</h1>
  <p>Your data is being restored. The service will return automatically when recovery finishes.</p>
  <p class="muted">This page refreshes automatically. Please try again shortly.</p>
</div></body></html>`;

http.createServer((req, res) => {
  res.writeHead(503, {
    'Content-Type': 'text/html; charset=utf-8',
    'Retry-After': '60',
    'Cache-Control': 'no-store',
  });
  res.end(HTML);
}).listen(PORT, () => console.log(`[recovery] serving the recovery page on port ${PORT} for all URLs`));
