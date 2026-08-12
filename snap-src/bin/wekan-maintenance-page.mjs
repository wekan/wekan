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

// #6492: when wekan-control serves this page during a data recovery it sets
// WEKAN_MAINTENANCE_REASON=recovery, so show a "recovering your data" wording instead
// of the generic "under maintenance".
const IS_RECOVERY = process.env.WEKAN_MAINTENANCE_REASON === 'recovery';

// #6471: the database files were made by a MongoDB this snap carries no reader for.
// It bundles MongoDB 7 (the server) and the MongoDB 3.2 tools (to read a 6.09-era
// database), and NOTHING in between - so data left by a MongoDB 4.x or 5.x snap can
// be opened by neither, mongod exits with "This version of MongoDB is too recent to
// start up on the existing data files", and the snap used to answer 502 with the
// reason only in `snap logs`. This page says it instead, in the browser, with the
// two ways forward. The version mongod itself named as still able to read the data
// is in the marker file, so the page can be specific rather than general.
const IS_DATA_TOO_OLD = process.env.WEKAN_MAINTENANCE_REASON === 'data-too-old';
function readMarker() {
  try {
    return fs.readFileSync((process.env.SNAP_COMMON || '') + '/.mongodb-data-too-old', 'utf8')
      .trim().replace(/[<>&]/g, '').slice(0, 40);
  } catch { return ''; }
}
const CAN_READ = IS_DATA_TOO_OLD ? readMarker() : '';

// #6585: this page is about the OLD MongoDB files, and it is shown while the snap is
// set to MongoDB. But a migrated FerretDB may be sitting right beside them with the
// data in it - the migration never deletes what it copied from - and then the page
// as it stood offered a revert and a mongodump while the one database this snap CAN
// serve went unmentioned: "It somehow tries to access Mongodb again instead of
// Ferretdb. I don't even have an old version, but just this."
//
// So look, and say so. Nothing is switched from here - the page's promise is that
// nothing changes until an admin acts, and #6583 is what choosing between two copies
// on the snap's own initiative costs - but an admin who has a working copy should not
// have to guess that from a page whose whole subject is the unreadable one.
function ferretdbHasData() {
  const dir = (process.env.SNAP_COMMON || '') + '/files/db';
  try {
    return fs.readdirSync(dir).some(f => {
      if (!f.endsWith('.sqlite')) return false;
      try { return fs.statSync(dir + '/' + f).size > 0; } catch { return false; }
    });
  } catch { return false; }
}
const HAS_FERRETDB = IS_DATA_TOO_OLD ? ferretdbHasData() : false;

const TITLE_WORD = IS_RECOVERY ? 'Recovering data'
  : IS_DATA_TOO_OLD ? 'Database needs an upgrade' : 'Maintenance';
const HEADING = IS_RECOVERY ? `${PRODUCT} is recovering your data`
  : IS_DATA_TOO_OLD ? `${PRODUCT} cannot open the existing database`
  : `${PRODUCT} is under maintenance`;
const BODY = IS_RECOVERY
  ? 'Your data is being restored. The service will return automatically when recovery finishes.'
  : IS_DATA_TOO_OLD
  ? `The database files were created by an older MongoDB${CAN_READ ? ` (MongoDB ${CAN_READ} or earlier can still read them)` : ''}. This version can read a MongoDB 6/7 database, a MongoDB 4.0/4.2 one, and a MongoDB 3.2 one - and these files are none of those, so nothing has been changed and your data is untouched.`
  : 'The service is temporarily unavailable while maintenance is in progress.';

// Only the data-too-old page has instructions: the other two are waits, and this one
// is a stop that needs a decision from a person.
const SNAP_NAME = (process.env.SNAP_INSTANCE_NAME || process.env.SNAP_NAME || 'wekan')
  .replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'wekan';
const STEPS = IS_DATA_TOO_OLD ? `
  <p class="muted" style="text-align:start">${HAS_FERRETDB ? 'Three ways forward, all' : 'Two ways forward, both'} keeping your data:</p>
  <ol class="muted" style="text-align:start">${HAS_FERRETDB ? `
    <li><b>Use the FerretDB database that is already here</b> - this snap was migrated
      to FerretDB at some point and that copy holds data, so it can be served right
      now:<br>
      <code>sudo snap set ${SNAP_NAME} database=ferretdb</code><br>
      The MongoDB files are left exactly as they are, so this is reversible with
      <code>sudo snap set ${SNAP_NAME} database=mongodb</code>. Check the boards after
      switching: this copy is as new as the last migration ran, which may be older
      than the MongoDB data beside it.</li>` : ''}
    <li><b>Go back to the revision that worked</b> and stay there for now:<br>
      <code>sudo snap revert ${SNAP_NAME}</code> then <code>sudo snap refresh --hold=forever ${SNAP_NAME}</code></li>
    <li><b>Move the data across</b> with a MongoDB that can read it${CAN_READ ? ` (MongoDB ${CAN_READ} or earlier)` : ''}:
      start that MongoDB on this data directory, <code>mongodump</code> from it, then
      restore into the new version and let it migrate to FerretDB.</li>
  </ol>
  <p class="muted" style="text-align:start">Attachments and avatars are files on disk, not in
    the database, and are unaffected either way.</p>` : '';

const HTML = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
${IS_DATA_TOO_OLD ? "" : '<meta http-equiv="refresh" content="30">'}
<title>${PRODUCT} — ${TITLE_WORD}</title>
<style>
  :root{color-scheme:light dark}
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;
    min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#eceff1;color:#2c3e50}
  @media (prefers-color-scheme:dark){body{background:#1b1f23;color:#e6e6e6}}
  .card{max-width:${IS_DATA_TOO_OLD ? "44" : "34"}em;margin:1.5em;padding:2em 2.4em;border-radius:10px;text-align:center;
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
  <h1>${IS_DATA_TOO_OLD ? "" : '<span class="spin"></span>'}${HEADING}</h1>
  <p>${BODY}</p>${STEPS}
  <p class="muted">${IS_DATA_TOO_OLD
    ? 'This page stays until an admin acts; nothing is retried in the background.'
    : 'This page refreshes automatically. Please try again shortly.'}</p>
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
