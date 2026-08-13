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

// #6592: "a reload of wekan got a timeout (loading forever)" after a snap refresh.
// WeKan does not open its web port until the database answers, and the wait has no
// end - correctly, because a database can take minutes to come up and giving up
// would be worse. But nothing was listening while it waited, so the browser got a
// timeout and the reason was in `snap logs`, which is exactly where somebody who
// cannot open WeKan does not think to look. wekan-control serves this page during
// that wait instead, and the page names the database being waited for and the
// command that says why it is not there.
const IS_WAITING_DB = process.env.WEKAN_MAINTENANCE_REASON === 'waiting-for-database';
const WAITING_DB = process.env.WEKAN_WAITING_DB === 'mongodb' ? 'MongoDB' : 'FerretDB';
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
  : IS_DATA_TOO_OLD ? 'Database needs an upgrade'
  : IS_WAITING_DB ? 'Starting' : 'Maintenance';
const HEADING = IS_RECOVERY ? `${PRODUCT} is recovering your data`
  : IS_DATA_TOO_OLD ? `${PRODUCT} cannot open the existing database`
  : IS_WAITING_DB ? `${PRODUCT} is waiting for its database`
  : `${PRODUCT} is under maintenance`;
const BODY = IS_RECOVERY
  ? 'Your data is being restored. The service will return automatically when recovery finishes.'
  : IS_DATA_TOO_OLD
  ? `The database files were created by an older MongoDB${CAN_READ ? ` (MongoDB ${CAN_READ} or earlier can still read them)` : ''}. This version can read a MongoDB 6/7 database, a MongoDB 4.0/4.2 one, and a MongoDB 3.2 one - and these files are none of those, so nothing has been changed and your data is untouched.`
  : IS_WAITING_DB
  ? `${PRODUCT} does not open its web port until ${WAITING_DB} answers, and ${WAITING_DB} has not answered yet. This page is that wait - it goes away by itself the moment the database is up. A large database can take minutes after an update; longer than that means something is wrong with the database, and nothing has been changed or lost while this page is showing.`
  : 'The service is temporarily unavailable while maintenance is in progress.';

// Only the data-too-old page has instructions: the other two are waits, and this one
// is a stop that needs a decision from a person.
const SNAP_NAME = (process.env.SNAP_INSTANCE_NAME || process.env.SNAP_NAME || 'wekan')
  .replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'wekan';
// #6471, comment 5264028470: the reporter got here with a MongoDB 3.2 database and
// had to work the way out for themselves - dump it with a MongoDB of that vintage,
// clear the data directory, restore. The page said "move the data across" and left
// the rest to them, so it says the steps now, in this snap's own paths and with this
// snap's own restore command. The third step is the one that is easy to get wrong and
// expensive to get wrong: an admin who copies the old database files back into a
// RUNNING database directory loses the database they just restored (mongod aborts).
const SNAP_COMMON_PATH = (process.env.SNAP_COMMON || `/var/snap/${SNAP_NAME}/common`)
  .replace(/[<>&"]/g, '').slice(0, 120);
const STEPS = IS_DATA_TOO_OLD ? `
  <p class="muted" style="text-align:start">The snap keeps trying by itself - every WeKan
    release may carry a reader for an older MongoDB than the last one did, and a new
    revision retries immediately. ${HAS_FERRETDB ? 'Meanwhile:' : 'If you would rather not wait, two ways forward, both keeping your data:'}</p>
  <ol class="muted" style="text-align:start">${HAS_FERRETDB ? `
    <li><b>The FerretDB database that is already here is being served</b> - this snap
      was migrated to FerretDB at some point and that copy holds data, so WeKan uses
      it rather than showing you this page. Nothing to type. Check the boards: this
      copy is as new as the last migration ran, which may be older than the MongoDB
      data beside it, and the snap keeps trying to bring the rest across.</li>` : ''}
    <li><b>Go back to the revision that worked</b> and stay there for now:<br>
      <code>sudo snap revert ${SNAP_NAME}</code> then <code>sudo snap refresh --hold=forever ${SNAP_NAME}</code></li>
    <li><b>Move the data across</b> with a MongoDB that can read it${CAN_READ ? ` (MongoDB ${CAN_READ} or earlier)` : ''}.
      This is the way that ends on the current version, and it is four steps:
      <ol>
        <li>Copy <code>${SNAP_COMMON_PATH}</code> somewhere safe first.</li>
        <li>Run a MongoDB${CAN_READ ? ` ${CAN_READ}` : ''} of your own on that copy and dump it. Every
          version is still published, so this is a download rather than a hunt
          (asked for in <a href="https://github.com/wekan/wekan/issues/6585">#6585</a>):<br>
          <a href="https://www.mongodb.com/try/download/community">mongodb.com/try/download/community</a>
          — pick the version, platform Linux, package <b>Archive</b> — or straight from
          <code>https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2004-${CAN_READ ? `${CAN_READ}.x` : '&lt;version&gt;'}.tgz</code>,
          and <code>docker run --rm -v /path/to/copy:/data/db mongo:${CAN_READ || '&lt;version&gt;'}</code> does the same thing
          without installing anything.<br>
          <code>mongodump --archive=wekan.archive --gzip</code><br>
          If it refuses to start, run it once with <code>--repair</code> <b>on the copy</b> — the
          error this snap's own readers printed is in <code>snap logs ${SNAP_NAME}.mongodb</code>, and it is
          the thing to read first.</li>
        <li><b>Move the old database files OUT of ${SNAP_COMMON_PATH}</b> so this
          version starts on an empty database: <code>*.wt</code>,
          <code>WiredTiger*</code>, <code>_mdb_catalog.wt</code>,
          <code>sizeStorer.wt</code>, <code>storage.bson</code>,
          <code>mongod.lock</code> and <code>journal/</code>. Leave
          <code>files/</code> where it is - that is your attachments and avatars.
          Do NOT copy those database files back afterwards: dropping them into a
          running database is what destroys it.</li>
        <li>Start ${PRODUCT} and restore into it:<br>
          <code>sudo snap run ${SNAP_NAME}.database-restore /path/to/wekan.archive</code></li>
      </ol></li>
  </ol>
  <p class="muted" style="text-align:start">Attachments and avatars are files on disk, not in
    the database, and are unaffected either way.</p>` : '';

// #6592: the same guidance wekan-control prints to the log after two minutes of
// waiting - put where the person who cannot open WeKan is actually looking. The
// service name is the one to ask, because "WeKan is down" and "FerretDB did not
// start" produce the same blank browser and only one of them is true here.
const WAIT_SVC = process.env.WEKAN_WAITING_DB === 'mongodb' ? 'mongodb' : 'ferretdb';
const WAIT_STEPS = IS_WAITING_DB ? `
  <p class="muted" style="text-align:start">If this page does not go away, ${WAITING_DB}
    is not starting. It says why in its own log - a snap service can show as
    <code>active</code> and still have exited:</p>
  <ol class="muted" style="text-align:start">
    <li><code>sudo snap logs ${SNAP_NAME}.${WAIT_SVC}</code> — the real reason. An
      <code>exec format error</code> means the bundled binary cannot run on this
      CPU; report it with your <code>snap version</code> and architecture.</li>
    <li><code>sudo snap run ${SNAP_NAME}.problems</code> — which copy of the data
      this snap is serving, and whether there is a second one.</li>
    <li><code>sudo snap start --enable ${SNAP_NAME}.${WAIT_SVC}</code> — if the
      service was left stopped or disabled by a failed migration.</li>
    <li>If this started right after an update:
      <code>sudo snap revert ${SNAP_NAME}</code> goes back to the revision that
      worked. Your data stays where it is; <code>snap revert</code> does not roll
      back <code>${SNAP_COMMON_PATH}</code>.</li>
  </ol>
  <p class="muted" style="text-align:start">Attachments and avatars are files on disk,
    not in the database, so they are unaffected either way.</p>` : '';

const HTML = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
${IS_DATA_TOO_OLD ? "" : '<meta http-equiv="refresh" content="30">'}
<title>${PRODUCT} — ${TITLE_WORD}</title>
<style>
  /* The schema-upgrade dashboard's palette (server/startupSchemaUpgrade.js):
     #111 ground, #ddd text, #7bf blue for the heading, monospace. These pages
     and that one are the same thing to a reader - the product saying what it is
     doing while it cannot show them the app - so they look like each other and
     not like two different products. Dark only, as the dashboard is. */
  :root{color-scheme:dark}
  body{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;margin:0;
    min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#111;color:#ddd}
  .card{max-width:${IS_DATA_TOO_OLD || IS_WAITING_DB ? "46" : "36"}em;margin:1.5em;padding:2em 2.4em;border-radius:10px;text-align:center;
    background:#181818;border:1px solid #333}
  h1{color:#7bf;font-size:1.5em;margin:.2em 0 .5em;font-weight:600}
  p{font-size:1.05em;line-height:1.55;margin:.6em 0}
  .muted{color:#aaa;font-size:.95em}
  ol{line-height:1.6}
  li{margin:.45em 0}
  code{color:#7bf;background:#0c0c0c;border:1px solid #2b2b2b;border-radius:4px;
    padding:.05em .35em;word-break:break-word}
  a{color:#7bf}
  b{color:#eee}
  .spin{display:inline-block;width:1.1em;height:1.1em;margin-right:.4em;vertical-align:-.15em;
    border:3px solid #2b3b4a;border-top-color:#7bf;border-radius:50%;animation:s .9s linear infinite}
  @keyframes s{to{transform:rotate(360deg)}}
</style></head><body>
<div class="card">
  <h1>${IS_DATA_TOO_OLD ? "" : '<span class="spin"></span>'}${HEADING}</h1>
  <p>${BODY}</p>${STEPS}${WAIT_STEPS}
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
