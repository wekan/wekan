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

// #6595: the same bridge answers the other reason a container has nothing on its
// web port - WeKan is waiting for its database. A reverse proxy in front of it
// returned "Gateway timeout", which says nothing about which of the two faults
// it is: WeKan is broken, or the database has not come up yet. The snap already
// serves a page for this (snap-src/bin/wekan-control); this is the container's.
const REASON = process.env.WEKAN_BRIDGE_REASON === 'database' ? 'database' : 'recovery';
const TEXT = REASON === 'database'
  ? {
    title: `${PRODUCT} is waiting for its database`,
    lead: 'WeKan cannot serve anything until the database answers, and it is not '
      + 'answering yet. Nothing is lost; this page is here so the wait is visible '
      + 'instead of a timeout.',
    muted: 'If it stays here, look at the database container\'s log - '
      + '`docker logs` on the database, or `docker compose logs`. '
      + 'This page refreshes automatically.',
  }
  : {
    title: `${PRODUCT} is recovering your data`,
    lead: 'Your data is being restored. The service will return automatically when '
      + 'recovery finishes.',
    muted: 'This page refreshes automatically. Please try again shortly.',
  };

// What the readiness probe last said, if the caller passed it on. The person
// looking at this page is looking at a browser, not at `docker logs`, and
// "MongoServerSelectionError: connect ECONNREFUSED wekan-db:27017" names the
// fault where they are. Escaped: it is a driver message, not markup.
const esc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DETAIL = (process.env.WEKAN_BRIDGE_DETAIL || '').trim();
const DETAIL_HTML = DETAIL
  ? `\n  <p class="detail">${esc(DETAIL.slice(0, 400))}</p>`
  : '';

const HTML = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="10">
<title>${TEXT.title}</title>
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
  .detail{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.85em;
    text-align:left;color:#7f8c9a;background:#f4f6f8;border-radius:6px;padding:.6em .8em;
    overflow-wrap:anywhere}
  @media (prefers-color-scheme:dark){.detail{background:#1b1f23;color:#9aa7b2}}
  .spin{display:inline-block;width:1.1em;height:1.1em;margin-right:.4em;vertical-align:-.15em;
    border:3px solid #d6e4ef;border-top-color:#2980b9;border-radius:50%;animation:s .9s linear infinite}
  @keyframes s{to{transform:rotate(360deg)}}
</style></head><body>
<div class="card">
  <h1><span class="spin"></span>${TEXT.title}</h1>
  <p>${TEXT.lead}</p>
  <p class="muted">${TEXT.muted}</p>${DETAIL_HTML}
</div></body></html>`;

http.createServer((req, res) => {
  res.writeHead(503, {
    'Content-Type': 'text/html; charset=utf-8',
    'Retry-After': '60',
    'Cache-Control': 'no-store',
  });
  res.end(HTML);
}).listen(PORT, () => console.log(
  `[${REASON}] serving the ${REASON === 'database' ? 'waiting for database' : 'recovery'} page on port ${PORT} for all URLs`));
