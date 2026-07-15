#!/usr/bin/env node
// wekan-maintenance-page.mjs — tiny standalone HTTP server that answers EVERY URL with an
// "under maintenance" page (HTTP 503) on the WeKan web port. wekan-control execs this instead
// of starting WeKan when $SNAP_COMMON/.wekan-maintenance exists, so end users see a clear
// maintenance message while an admin runs MongoDB or FerretDB by hand (on the DB port 27019)
// to access data over the MongoDB wire protocol. No external modules (only node:http), so it
// runs even when the app bundle / database is unavailable. Toggle with
// `snap run wekan.maintenance on|off`.
import http from 'node:http';
import fs from 'node:fs';

const PORT = parseInt(process.env.PORT || '80', 10);
// Product name for the heading. Prefer the Admin Panel product name (settings.productName) if
// one is set: it is cached to $SNAP_COMMON/.productname.txt while a database IS running (by
// wekan-control on normal startup and by the migration importers), so it is still available
// here in maintenance mode when BOTH MongoDB and FerretDB may be stopped. Order:
// PRODUCT_NAME env -> cached file -> "WeKan".
function resolveProduct() {
  let p = process.env.PRODUCT_NAME;
  if (!p) {
    try { p = fs.readFileSync((process.env.SNAP_COMMON || '') + '/.productname.txt', 'utf8').trim(); } catch {}
  }
  return (p || 'WeKan').replace(/[<>&]/g, '').slice(0, 80);
}
const PRODUCT = resolveProduct();

const HTML = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="30">
<title>${PRODUCT} — Maintenance</title>
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
  <h1><span class="spin"></span>${PRODUCT} is under maintenance</h1>
  <p>The service is temporarily unavailable while maintenance is in progress.</p>
  <p class="muted">This page refreshes automatically. Please try again shortly.</p>
</div></body></html>`;

http.createServer((req, res) => {
  // Every path returns the same maintenance page with 503 so clients/proxies/crawlers treat
  // it as a temporary outage, not a permanent one.
  res.writeHead(503, {
    'Content-Type': 'text/html; charset=utf-8',
    'Retry-After': '120',
    'Cache-Control': 'no-store',
  });
  res.end(HTML);
}).listen(PORT, () => console.log(`[maintenance] serving the maintenance page on port ${PORT} for all URLs`));
