// migration-bridge.js — tiny standalone HTTP server the Sandstorm grain launcher
// (start.js) runs as a CHILD process on the app port (behind sandstorm-http-bridge)
// whenever nothing else is bound there during first-launch migration and the handoff
// to WeKan. Without it the http-bridge gets connection-refused on the app port and the
// browser shows "This page can not be displayed embedded in another page" (the grain
// frame error noted in docs/Platforms/FOSS/Sandstorm/Sandstorm.md). Answering every URL
// with a small "please wait" page (HTTP 503, auto-refresh) keeps the grain framed until
// WeKan is up. It is a separate process so start.js can release the port with a kill
// (a definitive socket close) before the migration importer or Meteor binds the port —
// an in-process server could not release its listening socket while start.js is blocked
// in spawnSync. No external modules (only node:http), so it runs from the deps payload.

const http = require('http');

const PORT = parseInt(process.env.PORT || '4000', 10);
const MESSAGE = (process.env.BRIDGE_MESSAGE || 'WeKan is getting your data ready.')
  .replace(/[<>&]/g, '').slice(0, 200);

const HTML = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="5">
<title>WeKan — Please wait</title>
<style>
  :root{color-scheme:light dark}
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;
    min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#eceff1;color:#2c3e50}
  @media (prefers-color-scheme:dark){body{background:#1b1f23;color:#e6e6e6}}
  .card{max-width:34em;margin:1.5em;padding:2em 2.4em;border-radius:10px;text-align:center;
    background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.08)}
  @media (prefers-color-scheme:dark){.card{background:#24292e;box-shadow:0 2px 10px rgba(0,0,0,.4)}}
  h1{color:#2980b9;font-size:1.5em;margin:.2em 0 .4em}
  p{font-size:1.1em;line-height:1.5;margin:.6em 0}
  .muted{color:#7f8c9a;font-size:.95em}
  .spin{display:inline-block;width:1.1em;height:1.1em;margin-right:.4em;vertical-align:-.15em;
    border:3px solid #d6e4ef;border-top-color:#2980b9;border-radius:50%;animation:s .9s linear infinite}
  @keyframes s{to{transform:rotate(360deg)}}
</style></head><body>
<div class="card">
  <h1><span class="spin"></span>${MESSAGE}</h1>
  <p>This page refreshes automatically and will open WeKan as soon as it is ready.</p>
  <p class="muted">The first launch after an upgrade migrates your data, which can take a while.</p>
</div></body></html>`;

http.createServer((req, res) => {
  res.writeHead(503, {
    'Content-Type': 'text/html; charset=utf-8',
    'Retry-After': '5',
    'Cache-Control': 'no-store',
  });
  res.end(HTML);
}).listen(PORT, '127.0.0.1',
  () => console.log(`[migration-bridge] serving the please-wait page on 127.0.0.1:${PORT}`));
