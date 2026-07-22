'use strict';

// Pure checklist of the KNOWN causes that can make the login page show the text
// "Must be logged in" (a `Meteor.Error('not-authorized', 'Must be logged in')`
// reason surfaced while the user id has not landed yet). Given a snapshot of the
// relevant environment/settings, it returns one entry per cause with a severity
// and whether it currently looks OK. Pure + unit-testable; the server status
// method (server/lib/systemStatus.js) and the `snap run wekan.problems login`
// command both build the snapshot and render this.
//
// Severities: 'error' (likely breaks login), 'warning' (can degrade login),
// 'info' (context only), 'ok' (looks fine).

function loginProblemChecks(env) {
  const e = env || {};
  const checks = [];

  // 1. A migration or repair in progress can slow or stall logins (the DB is busy
  //    and initial subscriptions do not become ready). Two symptoms are reported:
  //    the login page showing "Must be logged in", or — after login — the logo with
  //    "Loading, please wait" ("Läser in, var god vänta.") and a spinner that never
  //    finishes. Both usually clear once the migration/repair completes and CPU
  //    drops, which is why this is surfaced here.
  checks.push({
    id: 'migration-in-progress',
    title: 'A migration or repair is in progress',
    severity: e.migrationActive ? 'warning' : 'ok',
    ok: !e.migrationActive,
    detail: e.migrationActive
      ? `Logins may be slow, show "Must be logged in", or sit on the logo + "Loading, please wait" spinner until this finishes and CPU drops. ${e.migrationMessage || ''}`.trim()
      : 'No migration or repair is currently running.',
  });

  // 2. ROOT_URL must match the address users open, or DDP login never completes.
  const rootUrl = typeof e.rootUrl === 'string' ? e.rootUrl.trim() : '';
  checks.push({
    id: 'root-url',
    title: 'ROOT_URL is set',
    severity: rootUrl ? 'ok' : 'error',
    ok: !!rootUrl,
    detail: rootUrl
      ? `ROOT_URL=${rootUrl} — it must match the exact URL users open, or the DDP login never completes ("Must be logged in").`
      : 'ROOT_URL is not set. Set it to the exact URL users open (e.g. https://boards.example.com), or the DDP login never completes ("Must be logged in").',
  });

  // 3. LDAP connection exhaustion -> slow / intermittently failing logins.
  if (e.ldapEnabled) {
    checks.push({
      id: 'ldap',
      title: 'LDAP is enabled',
      severity: 'info',
      ok: true,
      detail: 'If logins are slow or fail intermittently, check for leaked LDAP connections exhausting the directory server\'s connection limit.',
    });
  }

  // 4. Sandstorm authenticates the grain asynchronously; a wrong base path strands
  //    the user on a "Must be logged in" page.
  if (e.sandstorm) {
    checks.push({
      id: 'sandstorm',
      title: 'Running under Sandstorm',
      severity: 'info',
      ok: true,
      detail: 'The grain authenticates asynchronously; a wrong base path/ROOT_URL strands users on a "Must be logged in" page. Ensure the base path is correct.',
    });
  }

  return checks;
}

module.exports = { loginProblemChecks };
