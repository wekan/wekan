// ============================================================================
// Startup schema upgrade (#6473 follow-up): on start, check that data from
// every old WeKan version is migrated to the newest database structure and
// migrate only what is missing — all platforms (Snap, Docker, Sandstorm,
// source), both databases (MongoDB and FerretDB).
//
// VERSION-GATED: the `_wekan_migration` marker stores the WeKan version and
// datetime of the previous successful re-check. While the version is
// unchanged a boot costs ONE findOne; a full re-check is mandatory only after
// a new WeKan release. Force one with WEKAN_FORCE_SCHEMA_UPGRADE=true; opt
// out entirely with WEKAN_SKIP_SCHEMA_UPGRADE=true.
//
// The upgrade runs in the BACKGROUND (WeKan serves immediately) and publishes
// live progress at /schema-upgrade-status (HTML dashboard, ?json for raw
// state). The dashboard shows the Admin Panel product name when one is set.
//
// The actual steps live in server/lib/schemaUpgradeSteps.js (pure, driver-
// based, unit-tested by tests/schemaUpgradeSteps.test.cjs, batched
// updateMany/distinct queries so big databases stay fast).
// ============================================================================
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';
import { WebApp } from 'meteor/webapp';
import { runSchemaUpgrade, getUpgradeState } from '/server/lib/schemaUpgradeSteps';

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Live migration dashboard — same spirit as the MongoDB→FerretDB importer
// dashboards, available on every platform while WeKan runs.
WebApp.handlers.get('/schema-upgrade-status', (req, res) => {
  const state = getUpgradeState();
  if ('json' in (req.query || {})) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state, null, 2));
    return;
  }
  const rows = Object.entries(state.steps).map(([name, s]) => {
    const color = s.status === 'error' ? '#f77' : s.status === 'running' || s.status === 'checking' ? '#fb7' : s.status === 'done' ? '#7f7' : '#aaa';
    return `<tr><td>${escHtml(name)}</td><td style="color:${color}">${escHtml(s.status)}</td>`
      + `<td>${s.fixed || 0}</td><td class="${s.unresolved ? 'fail' : ''}">${s.unresolved || 0}</td>`
      + `<td>${s.error ? escHtml(s.error) : ''}</td></tr>`;
  }).join('');
  const product = escHtml(state.product || 'WeKan');
  const phase = state.running
    ? `Checking / migrating… (${escHtml(state.currentStep || '')})`
    : state.gated
      ? `Already re-checked for version ${escHtml(state.appVersion)} — nothing to do`
      : state.finishedAt ? 'Completed' : 'Not started yet';
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">${state.running ? '<meta http-equiv="refresh" content="3">' : ''}
<title>${product} Schema Upgrade</title>
<style>body{font-family:monospace;background:#111;color:#ddd;padding:1em 2em}h1{color:#7bf}
table{border-collapse:collapse}td,th{padding:4px 10px;border-bottom:1px solid #333;text-align:left}
th{color:#aaa;font-size:.85em}.fail{color:#f77}</style></head><body>
<h1>${product} Schema Upgrade</h1>
<p>Status: <strong>${phase}</strong></p>
<p style="color:#aaa">WeKan version: ${escHtml(state.appVersion || '?')}
${state.lastCheck ? ` &nbsp;·&nbsp; previous re-check: ${escHtml(state.lastCheck.version)} at ${escHtml(String(state.lastCheck.at))}` : ''}
${state.startedAt ? ` &nbsp;·&nbsp; started: ${escHtml(String(state.startedAt))}` : ''}
${state.finishedAt ? ` &nbsp;·&nbsp; finished: ${escHtml(String(state.finishedAt))}` : ''}</p>
<table><tr><th>Step</th><th>Status</th><th>Fixed</th><th>Unresolved</th><th>Error</th></tr>${rows}</table>
<p style="color:#aaa">A re-check is mandatory only after a new ${product} release; while the version
is unchanged, startup costs a single database read. Raw state: <a href="/schema-upgrade-status?json" style="color:#7bf">JSON</a></p>
</body></html>`);
});

Meteor.startup(() => {
  if (process.env.WEKAN_SKIP_SCHEMA_UPGRADE === 'true') {
    console.log('[schema-upgrade] skipped (WEKAN_SKIP_SCHEMA_UPGRADE=true)');
    return;
  }
  // Deliberately NOT awaited: WeKan starts serving immediately; the upgrade
  // runs in the background and reports at /schema-upgrade-status.
  (async () => {
    try {
      const db = MongoInternals.defaultRemoteCollectionDriver()?.mongo?.db;
      if (!db) {
        console.warn('[schema-upgrade] no database handle at startup; skipping (will retry next start)');
        return;
      }
      let appVersion = '';
      try { appVersion = require('/package.json').version || ''; } catch { /* keep '' */ }
      const { ran, gated } = await runSchemaUpgrade(db, {
        appVersion,
        log: (...args) => console.log('[schema-upgrade]', ...args),
      });
      if (!gated && ran.length > 0) {
        console.log(`[schema-upgrade] upgraded old-version data: ${ran.join(', ')}`);
      }
    } catch (error) {
      console.error('[schema-upgrade] failed (WeKan continues; retried next start):', error.message);
    }
  })();
});
