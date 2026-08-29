#!/usr/bin/env node
// recovery-bridge.mjs — tiny standalone HTTP server that answers EVERY URL with a
// "recovering your data" page (HTTP 503) on the web port. The start scripts run this
// for a short, bounded grace window while a just-restored FerretDB v1 (SQLite) comes
// back up after a #6492 data recovery, so users see a clear maintenance page instead of
// a connection error during the restart gap. It is only a brief bridge: the scripts
// then start WeKan, whose own in-app recovery spinner (driven by the same
// RECOVERY_IN_PROGRESS marker) takes over until the server has health-probed the
// database and cleared the marker. It uses only built-in Node.js modules, so it
// runs even while the database is still coming up.
import http from 'node:http';
import fs from 'node:fs';

const PORT = parseInt(process.env.PORT || '80', 10);
const PRODUCT = (process.env.PRODUCT_NAME || 'WeKan').replace(/[<>&]/g, '').slice(0, 80);
const CUSTOM_PRODUCT = PRODUCT !== 'WeKan';
const DATABASE_PRODUCT = CUSTOM_PRODUCT ? PRODUCT : 'FerretDB';
const STATUS_FILE = process.env.MIGRATION_STATUS_FILE || '';

// #6595: the same bridge answers the other reason a container has nothing on its
// web port - WeKan is waiting for its database. A reverse proxy in front of it
// returned "Gateway timeout", which says nothing about which of the two faults
// it is: WeKan is broken, or the database has not come up yet. The snap already
// serves a page for this (snap-src/bin/wekan-control); this is the container's.
const requestedReason = process.env.WEKAN_BRIDGE_REASON;
const REASON = ['database', 'migration'].includes(requestedReason) ? requestedReason : 'recovery';
const TEXT = REASON === 'migration'
  ? {
    title: `${PRODUCT} Migration Progress`,
    lead: `${DATABASE_PRODUCT} is rebuilding database indexes for faster queries. Your data `
      + 'remains available on disk; the service will start automatically when the '
      + 'transactional upgrade finishes.',
    muted: 'This one-time preparation can take several minutes on a large database. '
      + 'Do not interrupt it. This page refreshes automatically.',
  }
  : REASON === 'database' ? {
    title: `${PRODUCT} is waiting for its database`,
    lead: `${PRODUCT} cannot serve anything until the database answers, and it is not `
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

const formatDuration = value => {
  const seconds = Math.max(0, Math.round(value));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return [hours && `${hours}h`, (hours || minutes) && `${minutes}m`, `${rest}s`]
    .filter(Boolean).join(' ');
};

const migrationProgress = () => {
  if (!STATUS_FILE) return null;
  try {
    const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    const total = Math.max(0, Number(status.total) || 0);
    const completed = Math.min(total, Math.max(0, Number(status.step) || 0));
    const started = Date.parse(status.startedAt);
    const elapsed = Number.isFinite(started) ? Math.max(0, (Date.now() - started) / 1000) : 0;
    const current = status.phase === 'complete' ? total : Math.min(total, completed + 1);
    const percent = total ? Math.min(100, Math.floor(completed * 100 / total)) : 0;
    let eta = 'Calculating…';
    if (status.phase === 'complete') eta = 'Complete';
    else if (completed > 0 && total > completed) eta = formatDuration(elapsed / completed * (total - completed));
    const location = [status.database, status.collection, status.index]
      .filter(Boolean).map(esc).join(' / ');
    return { total, completed, current, percent, elapsed, eta, location, phase: status.phase };
  } catch {
    return null;
  }
};

const progressHTML = () => {
  if (REASON !== 'migration') return '';
  const progress = migrationProgress();
  if (!progress || !progress.total) {
    return '<div class="progress-wait">Preparing the index migration plan…</div>';
  }
  return `<section class="progress" aria-label="Index migration progress">
    <div class="progress-head"><strong>Step ${progress.current}/${progress.total}</strong><strong>${progress.percent}%</strong></div>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent}">
      <div class="fill" style="width:${progress.percent}%"></div>
    </div>
    <div class="stats"><span>Spent <strong>${formatDuration(progress.elapsed)}</strong></span><span>ETA <strong>${progress.eta}</strong></span></div>
    ${progress.location ? `<div class="where"><span>Now rebuilding</span><strong>${progress.location}</strong></div>` : ''}
  </section>`;
};

const renderHTML = () => `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="2">
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
  .progress{margin:1.4em 0;text-align:left}.progress-head,.stats{display:flex;justify-content:space-between}
  .progress-head{font-size:1.05em;margin-bottom:.45em}.bar{height:14px;background:#d9e2e8;border-radius:7px;overflow:hidden}
  .fill{height:100%;background:#2980b9;transition:width .3s ease}.stats{color:#667784;font-size:.9em;margin-top:.45em}
  .where,.progress-wait{margin-top:1em;padding:.7em .8em;background:#f4f6f8;border-radius:6px;font-size:.9em}
  .where span{display:block;color:#7f8c9a;margin-bottom:.2em}.where strong{overflow-wrap:anywhere}
  .detail{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.85em;
    text-align:left;color:#7f8c9a;background:#f4f6f8;border-radius:6px;padding:.6em .8em;
    overflow-wrap:anywhere}
  @media (prefers-color-scheme:dark){.detail,.where,.progress-wait{background:#1b1f23;color:#9aa7b2}.bar{background:#3a444c}}
  .spin{display:inline-block;width:1.1em;height:1.1em;margin-right:.4em;vertical-align:-.15em;
    border:3px solid #d6e4ef;border-top-color:#2980b9;border-radius:50%;animation:s .9s linear infinite}
  @keyframes s{to{transform:rotate(360deg)}}
</style></head><body>
<div class="card">
  <h1><span class="spin"></span>${TEXT.title}</h1>
  <p>${TEXT.lead}</p>
  ${progressHTML()}
  <p class="muted">${TEXT.muted}</p>${DETAIL_HTML}
</div></body></html>`;

http.createServer((req, res) => {
  res.writeHead(503, {
    'Content-Type': 'text/html; charset=utf-8',
    'Retry-After': '60',
    'Cache-Control': 'no-store',
  });
  res.end(renderHTML());
}).listen(PORT, () => console.log(
  `[${REASON}] serving the ${REASON === 'database' ? 'waiting for database' : REASON === 'migration' ? 'migration progress' : 'recovery'} page on port ${PORT} for all URLs`));
