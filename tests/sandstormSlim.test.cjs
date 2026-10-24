'use strict';

// The smaller Sandstorm .spk:
// docs/Platforms/FOSS/Container/Sandstorm/Smaller-wekan-spk.md
//
// A grain has ONE login (Sandstorm's), ONE database (FerretDB on SQLite) and
// ONE mailbox (the grain's own address). So the .spk is built without the
// Meteor packages of every other login method (releases/sandstorm-slim.mjs),
// with a FerretDB that has only the SQLite handler (sandstorm-src/build-deps.sh),
// and the Admin Panel does not offer what the grain cannot use
// (models/lib/sandstormSlim.js). This suite pins all three, and that none of it
// reaches the Docker image, the snap or the .zip bundles, which share the source.
//
// Run: node tests/sandstormSlim.test.cjs

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));
const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const ui = require('../models/lib/sandstormSlim');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

(async () => {
  const slim = await import(pathToFileURL(path.join(ROOT, 'releases/sandstorm-slim.mjs')).href);
  const EXCLUDED = Object.keys(slim.SANDSTORM_EXCLUDED_PACKAGES);

  // ── The build profile ────────────────────────────────────────────────────
  test('the profile removes every login package from .meteor/packages, and only those', () => {
    const original = read('.meteor/packages');
    const { text, removed } = slim.slimPackagesText(original);
    assert.deepStrictEqual([...removed].sort(), [...EXCLUDED].sort(),
      'every excluded package is in .meteor/packages today; a stale entry would hide a typo');
    const names = t => t.split('\n').map(l => l.replace(/#.*/, '').trim()).filter(Boolean).map(l => l.split('@')[0]);
    const kept = names(text);
    for (const name of EXCLUDED) assert.ok(!kept.includes(name), `${name} must not stay in the Sandstorm build`);
    for (const name of slim.SANDSTORM_REQUIRED_PACKAGES) assert.ok(kept.includes(name), `${name} is what a grain runs`);
    assert.strictEqual(kept.length, names(original).length - EXCLUDED.length, 'nothing else is removed');
    assert.ok(/# sandstorm-slim: removed wekan-ldap - /.test(text), 'each removal leaves a line saying why');
  });

  test('the profile keeps the Sandstorm login, accounts-base (via accounts-express) and email', () => {
    for (const name of ['wekan-accounts-sandstorm', 'accounts-express', 'email', 'mongo']) {
      assert.ok(slim.SANDSTORM_REQUIRED_PACKAGES.includes(name), name);
      assert.ok(!EXCLUDED.includes(name), `${name} must never be excluded`);
    }
  });

  test('negative: a .meteor/packages without the Sandstorm login is refused', () => {
    const broken = read('.meteor/packages').replace(/^wekan-accounts-sandstorm.*$/m, '');
    assert.throws(() => slim.slimPackagesText(broken), /wekan-accounts-sandstorm/);
  });

  test('negative: the ordinary builds are NOT slimmed - .meteor/packages keeps every login method', () => {
    const names = read('.meteor/packages').split('\n').map(l => l.replace(/#.*/, '').trim().split('@')[0]);
    for (const name of EXCLUDED) assert.ok(names.includes(name), `${name} must stay for Docker, Snap and the bundles`);
    assert.ok(!/sandstorm-slim/.test(read('.meteor/packages')), 'no slimmed copy was committed');
    assert.ok(!exists('.meteor/packages.sandstorm-slim-orig'), 'no backup left behind');
  });

  test('apply then restore gives back the exact file, and a second apply keeps the real backup', () => {
    const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'sandstorm-slim-'));
    try {
      const file = path.join(dir, 'packages');
      const original = read('.meteor/packages');
      fs.writeFileSync(file, original);
      const { execFileSync } = require('child_process');
      const run = (...args) => execFileSync(process.execPath, [path.join(ROOT, 'releases/sandstorm-slim.mjs'), ...args], { encoding: 'utf8' });
      run('apply', file);
      run('apply', file);
      assert.ok(!/^wekan-ldap$/m.test(fs.readFileSync(file, 'utf8')));
      run('restore', file);
      assert.strictEqual(fs.readFileSync(file, 'utf8'), original);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  // ── The bundle check ─────────────────────────────────────────────────────
  function fakeBundle(serverPackages, clientPaths = []) {
    const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'sandstorm-bundle-'));
    fs.mkdirSync(path.join(dir, 'programs/server'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'programs/web.browser'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'programs/server/program.json'),
      JSON.stringify({ load: serverPackages.map(n => ({ path: `packages/${n}.js` })) }));
    fs.writeFileSync(path.join(dir, 'programs/web.browser/program.json'),
      JSON.stringify({ manifest: clientPaths.map(p => ({ path: p })) }));
    return dir;
  }

  test('verify passes a bundle with the Sandstorm login and none of the excluded packages', () => {
    const dir = fakeBundle(['meteor', 'accounts-base', 'wekan-accounts-sandstorm', 'email', 'mongo']);
    try { assert.deepStrictEqual(slim.verifyBundle(dir), []); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  test('negative: verify names every excluded package, OAuth and missing login that got in', () => {
    const dir = fakeBundle(['accounts-base', 'email', 'accounts-password', 'oauth2'],
      ['packages/wekan-accounts-saml/saml_login_button.css']);
    fs.mkdirSync(path.join(dir, 'programs/server/npm/node_modules/meteor/wekan-ldap'), { recursive: true });
    try {
      const problems = slim.verifyBundle(dir).join('\n');
      assert.match(problems, /accounts-password is in server/);
      assert.match(problems, /oauth2 is in server/);
      assert.match(problems, /wekan-accounts-saml is in web\.browser/);
      assert.match(problems, /npm\/node_modules\/meteor\/wekan-ldap/);
      assert.match(problems, /wekan-accounts-sandstorm is missing/);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });

  // ── App code survives a build without them ───────────────────────────────
  // Search the WHOLE app tree, not just the three files that needed changing:
  // a static import of a package the .spk is built without stops the grain's
  // server at its first line, wherever it is.
  function appFiles() {
    const out = [];
    const skip = new Set(['node_modules', 'packages', 'tests', '.tools', '_build', '_build-local-test',
      '.build', '.meteor', '.git', 'docs', 'public', 'private', 'npm-packages', 'releases', 'old-CHANGELOG']);
    (function walk(dir) {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (skip.has(e.name)) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(js|mjs|cjs|ts)$/.test(e.name)) out.push(p);
      }
    })(ROOT);
    return out;
  }

  test('negative: no app file imports an excluded package statically, anywhere', () => {
    const offenders = [];
    for (const file of appFiles()) {
      const src = stripComments(fs.readFileSync(file, 'utf8'));
      for (const name of EXCLUDED) {
        const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp(`from\\s+['"]meteor/${esc}['"]|import\\s+['"]meteor/${esc}['"]`).test(src)) {
          offenders.push(`${path.relative(ROOT, file)} imports meteor/${name}`);
        }
        // A require() is allowed only behind a Package[name] check.
        const re = new RegExp(`require\\(['"]meteor/${esc}['"]\\)`, 'g');
        let m;
        while ((m = re.exec(src))) {
          const before = src.slice(Math.max(0, m.index - 300), m.index);
          if (!before.includes(`Package['${name}']`)) {
            offenders.push(`${path.relative(ROOT, file)} requires meteor/${name} without asking Package['${name}']`);
          }
        }
      }
    }
    assert.deepStrictEqual(offenders, []);
  });

  test('the three files that use an excluded package ask Package[name] first', () => {
    const bridge = stripComments(read('server/ldapAdminSettingsBridge.js'));
    assert.match(bridge, /if \(Package\['wekan-ldap'\]\) \{[\s\S]*require\('meteor\/wekan-ldap'\)/);
    const lockout = stripComments(read('server/accounts-lockout-config.js'));
    assert.match(lockout, /Package\['wekan-accounts-lockout'\]\s*\?\s*require\('meteor\/wekan-accounts-lockout'\)/);
    assert.match(lockout, /if \(!AccountsLockout\) return;/);
    const method = stripComments(read('server/methods/lockoutSettings.js'));
    assert.match(method, /if \(!AccountsLockout\) return false;/);
  });

  test('negative: no app code uses the Oidc global the OAuth2 package exports', () => {
    for (const file of appFiles()) {
      const src = stripComments(fs.readFileSync(file, 'utf8'));
      assert.ok(!/(^|[^.\w'"])Oidc\./m.test(src), `${path.relative(ROOT, file)} uses Oidc`);
    }
  });

  // Found by the first local grain: config/accounts.js filled in
  // Accounts.emailTemplates.resetPassword at startup, and without
  // accounts-password there is no Accounts.emailTemplates, so the grain
  // crash-looped before it served a page.
  const { ensureEmailTemplates } = require('../server/lib/accountsEmailTemplates');

  test('without accounts-password, Accounts.emailTemplates is made with its defaults', () => {
    const Accounts = {};
    assert.strictEqual(ensureEmailTemplates(Accounts, 'https://www.boards.example.com/'), true);
    assert.strictEqual(Accounts.emailTemplates.siteName, 'boards.example.com');
    assert.match(Accounts.emailTemplates.from, /no-reply@example\.com/);
    for (const t of ['resetPassword', 'verifyEmail', 'enrollAccount']) {
      assert.deepStrictEqual(Accounts.emailTemplates[t], {}, `${t} exists, so config/accounts.js can fill it`);
    }
  });

  test('negative: with accounts-password, its own Accounts.emailTemplates is left alone', () => {
    const own = { from: 'WeKan <wekan@example.org>', resetPassword: { subject: () => 's' } };
    const Accounts = { emailTemplates: own };
    assert.strictEqual(ensureEmailTemplates(Accounts, 'https://x.example/'), false);
    assert.strictEqual(Accounts.emailTemplates, own);
  });

  test('server/main.js makes it before any app code is loaded', () => {
    const main = stripComments(read('server/main.js'));
    const made = main.indexOf("require('/server/lib/accountsEmailTemplates').ensureEmailTemplates(");
    assert.ok(made > -1, 'main.js calls ensureEmailTemplates');
    assert.ok(made < main.indexOf("require('/server/imports')"), 'before /server/imports');
  });

  // Found by the second local grain: a new board opened EMPTY. Collection2's
  // attachSchema lives in its lazy main module, which only aldeed:schema-index
  // loads, asynchronously; built with fewer packages, models/ attached their
  // schemas with the bare shim first and writes were never cleaned. Pinned for
  // EVERY build, because the race was in all of them.
  test('collection2 is loaded synchronously before any model attaches a schema', () => {
    const main = stripComments(read('server/main.js'));
    const c2 = main.indexOf("require('meteor/aldeed:collection2/main');");
    assert.ok(c2 > -1, 'server/main.js loads collection2 main itself');
    assert.ok(c2 < main.indexOf("require('/server/imports')"), 'before the models are loaded');
    assert.ok(main.indexOf("require('/imports/collectionHelpers')") < c2,
      'after the shim, so collection2 replaces the shim attachSchema and not the other way round');
  });

  test('negative: the shim attachSchema never replaces one that is already there', () => {
    const shim = read('imports/collectionHelpers.js');
    assert.match(shim, /!Mongo\.Collection\.prototype\.attachSchema\) \{\s*Mongo\.Collection\.prototype\.attachSchema = function attachSchema/);
  });

  test('without accounts-password, useraccounts does not refuse to start', () => {
    const cfg = stripComments(read('config/accounts.js'));
    assert.match(cfg, /if \(Meteor\.isServer && !Package\['accounts-password'\]\) \{\s*AccountsTemplates\._initialized = true;\s*\}/);
  });

  test('the REST password login and sign-up refuse first thing on Sandstorm', () => {
    const src = read('server/apiAuthRoutes.js');
    assert.match(src, /function refuseOnSandstorm\(res\) \{\s*if \(!Meteor\.settings\?\.public\?\.sandstorm\) return false;/);
    for (const route of ['/users/login', '/users/register']) {
      const at = src.indexOf(`WebApp.handlers.post('${route}', async function (req, res) {`);
      assert.ok(at > -1, route);
      const firstLine = src.slice(at).split('\n')[1].trim();
      assert.strictEqual(firstLine, 'if (refuseOnSandstorm(res)) return;', `${route} refuses before any password work`);
    }
    assert.match(src, /error: 'sandstorm-sso-only'/);
  });

  // ── FerretDB: SQLite only ────────────────────────────────────────────────
  test('build-deps.sh takes the prebuilt SQLite-only FerretDB, and builds the same one from source only on request', () => {
    const deps = read('sandstorm-src/build-deps.sh');
    // The prebuilt ferretdb-sqlite-amd64 is the default (releases/ferretdb-asset.sh);
    // FERRETDB_SOURCE=build is a local option with the same tags.
    assert.match(deps, /FERRETDB_SOURCE="\$\{FERRETDB_SOURCE:-download\}"/, 'the prebuilt binary is the default');
    assert.match(deps, /releases\/ferretdb-asset\.sh" amd64 -o "\$DEPS\/ferretdb"/);
    assert.match(deps, /FERRETDB_TAGS="ferretdb_no_postgresql,ferretdb_no_mysql"/);
    assert.match(deps, /go build -mod=readonly -trimpath -ldflags "-s -w" -tags "\$FERRETDB_TAGS"/);
    assert.match(deps, /grep -q -- '--sqlite-url'/, 'and checks the SQLite handler is still in it');
    const code = deps.replace(/^\s*#.*$/gm, '');
    assert.ok(!/ferretdb_hana/.test(code), 'negative: the SAP HANA handler is never built in');
  });

  test('negative: the grain starts FerretDB with the SQLite handler and no other', () => {
    const start = stripComments(read('sandstorm-src/start.js'));
    assert.match(start, /'--handler=sqlite'/);
    assert.ok(!/--handler=(postgresql|mysql|hana)|--(postgresql|mysql|hana)-url/.test(start));
  });

  test('FerretDB has a build tag for each handler the grain leaves out', () => {
    const ferret = path.join(ROOT, '.tools/FerretDB');
    if (!fs.existsSync(path.join(ferret, 'internal/handler/registry'))) {
      console.log('    (skipped: .tools/FerretDB is not cloned here)');
      return;
    }
    const tag = rel => fs.readFileSync(path.join(ferret, rel), 'utf8');
    assert.match(tag('internal/handler/registry/postgresql.go'), /\/\/go:build !ferretdb_no_postgresql/);
    assert.match(tag('internal/handler/registry/mysql.go'), /\/\/go:build !ferretdb_no_mysql/);
    assert.match(tag('cmd/ferretdb/main_mysql.go'), /\/\/go:build !ferretdb_no_mysql/);
    assert.match(tag('internal/handler/registry/hana.go'), /\/\/go:build ferretdb_hana/);
  });

  // ── The workflows ────────────────────────────────────────────────────────
  function job(wf, name) {
    const start = wf.indexOf(`\n  ${name}:\n`);
    assert.notStrictEqual(start, -1, `no ${name} job`);
    const rest = wf.slice(start + 1);
    const next = rest.search(/\n  [a-z0-9-]+:\n/);
    return next === -1 ? rest : rest.slice(0, next);
  }
  const noComments = s => s.replace(/^\s*#.*$/gm, '');

  test('sandstorm.yml and release-all.yml build the .spk through the slim script', () => {
    for (const [file, name] of [['.github/workflows/sandstorm.yml', 'sandstorm'],
      ['.github/workflows/release-all.yml', 'build-sandstorm']]) {
      const body = noComments(job(read(file), name));
      assert.match(body, /bash releases\/sandstorm-slim-spk\.sh "\$SPK"/, file);
      assert.match(body, /FERRETDB_SOURCE: download/, `${file} takes the prebuilt SQLite-only FerretDB`);
      assert.ok(!/FERRETDB_SOURCE: build/.test(body), `negative: ${file} must not build FerretDB`);
      assert.ok(!/^\s*meteor-spk pack\b/m.test(body), `negative: ${file} must not run meteor-spk pack - it rebuilds and undoes the profile`);
    }
  });

  test('the slim script: profile before the build, verify after the trim, restore always', () => {
    const sh = read('releases/sandstorm-slim-spk.sh');
    const code = noComments(sh);
    const at = s => code.indexOf(s);
    assert.ok(at('trap restore EXIT') > -1 && at('trap restore EXIT') < at('sandstorm-slim.mjs apply'),
      'the restore is armed before .meteor/packages is touched');
    assert.ok(at('sandstorm-slim.mjs apply') < at('build --directory .meteor-spk'));
    assert.ok(at('build --directory .meteor-spk') < at('bundle-trim.mjs'));
    assert.ok(at('prune-unreachable-npm.mjs') < at('sandstorm-slim.mjs verify'));
    assert.ok(at('sandstorm-slim.mjs verify') < at('pack "$@" "$OUT"'));
    assert.match(code, /restore \.meteor\/packages/);
    assert.match(code, /versions\.sandstorm-slim-orig \.meteor\/versions/);
  });

  // ── The Admin Panel ──────────────────────────────────────────────────────
  const peopleItems = ['email-setting', 'notify-setting', 'people-setting', 'registration-setting',
    'ldap-setting', 'saml-setting', 'oidc-setting', 'cas-setting', 'locked-users-setting',
    'header-login-setting', 'oauth-setting', 'passwordless-setting', 'roles-setting']
    .map(id => ({ id })).concat([null]);

  test('on Sandstorm the People menu drops every login pane and E-mail', () => {
    const ids = ui.withoutSandstormPanes(peopleItems, ui.SANDSTORM_HIDDEN_PEOPLE_PANES, true)
      .filter(Boolean).map(i => i.id);
    assert.deepStrictEqual(ids, ['notify-setting', 'people-setting', 'roles-setting']);
  });

  test('negative: off Sandstorm the menu is the very same list', () => {
    assert.strictEqual(ui.withoutSandstormPanes(peopleItems, ui.SANDSTORM_HIDDEN_PEOPLE_PANES, false), peopleItems);
    assert.strictEqual(ui.isSandstormSettings({ public: {} }), false);
    assert.strictEqual(ui.isSandstormSettings(undefined), false);
    assert.strictEqual(ui.isSandstormSettings({ public: { sandstorm: true } }), true);
  });

  test('a hidden pane does not open by its URL on Sandstorm, and does elsewhere', () => {
    assert.strictEqual(ui.sandstormAllowsPane('ldap-setting', ui.SANDSTORM_HIDDEN_PEOPLE_PANES, true), false);
    assert.strictEqual(ui.sandstormAllowsPane('people-setting', ui.SANDSTORM_HIDDEN_PEOPLE_PANES, true), true);
    assert.strictEqual(ui.sandstormAllowsPane('ldap-setting', ui.SANDSTORM_HIDDEN_PEOPLE_PANES, false), true);
    assert.strictEqual(ui.sandstormAllowsPane('database-migration', ui.SANDSTORM_HIDDEN_ATTACHMENTS_PANES, true), false);
  });

  test('every hidden id is a real menu entry, so the list cannot go stale', () => {
    const people = read('client/components/settings/peopleBody.js');
    for (const id of ui.SANDSTORM_HIDDEN_PEOPLE_PANES) assert.ok(people.includes(`{ id: '${id}'`), id);
    const attachments = read('client/components/settings/attachments.js');
    for (const id of ui.SANDSTORM_HIDDEN_ATTACHMENTS_PANES) assert.ok(attachments.includes(`{ id: '${id}'`), id);
  });

  test('both menus filter through it, and both URL paths ask it', () => {
    const people = read('client/components/settings/peopleBody.js');
    assert.match(people, /withoutSandstormPanes\(items, SANDSTORM_HIDDEN_PEOPLE_PANES,/);
    assert.match(people, /this\.openPane = \(targetID\) => \{[\s\S]{0,300}sandstormAllowsPane\(targetID, SANDSTORM_HIDDEN_PEOPLE_PANES,/);
    const attachments = read('client/components/settings/attachments.js');
    assert.match(attachments, /withoutSandstormPanes\(items, SANDSTORM_HIDDEN_ATTACHMENTS_PANES,/);
    assert.match(attachments, /sandstormAllowsPane\(paneId, SANDSTORM_HIDDEN_ATTACHMENTS_PANES,/);
  });

  test('the database migration method refuses on Sandstorm', () => {
    const src = read('server/methods/migrateTextDatabase.js');
    const at = src.indexOf('async migrateTextDatabase(direction)');
    const body = src.slice(at, src.indexOf('copyTextData(direction);', at));
    assert.match(body, /if \(Meteor\.settings\?\.public\?\.sandstorm\) \{\s*throw new Meteor\.Error\('not-on-sandstorm'/);
  });

  test('e-mail to card: no IMAP or webhook settings on Sandstorm, drawn or stored', () => {
    const jade = read('client/components/settings/emailToCardSettings.jade');
    const sandstormAt = jade.indexOf('          if isSandstorm\n');
    const elseAt = jade.indexOf('\n          else\n', sandstormAt);
    const imapAt = jade.indexOf("email-to-card-imap-accounts");
    const webhookAt = jade.indexOf("email-to-card-webhook'");
    assert.ok(sandstormAt > -1 && elseAt > sandstormAt, 'the admin block branches on isSandstorm');
    assert.ok(imapAt > elseAt && webhookAt > elseAt, 'IMAP and the webhook are only in the non-Sandstorm branch');
    const server = read('server/emailToCard.js');
    assert.match(server, /if \(Meteor\.settings\?\.public\?\.sandstorm\) \{\s*input = \{ \.\.\.input, domain: previous\.domain \|\| '', accounts: \[\], passwords: \{\},/);
  });

  test('no password account can be made or set from People on Sandstorm', () => {
    const jade = read('client/components/settings/peopleBody.jade');
    assert.match(jade, /template\(name="newUserRow"\)\n(?:\s*\/\/-.*\n)*\s*unless isSandstorm\n\s*a\.new-user/);
    assert.match(jade, /unless isSandstorm\n\s*hr\n\s*label\n\s*\| \{\{_ 'password'\}\}\n\s*input\.js-profile-password\(type="password"\)/);
    const js = read('client/components/settings/peopleBody.js');
    assert.match(js, /const password = passwordInput \? passwordInput\.value : '';/,
      'the edit form must not read a field that is not drawn');
  });

  test('the design doc names every excluded package and the size result', () => {
    const doc = read('docs/Platforms/FOSS/Container/Sandstorm/Smaller-wekan-spk.md');
    for (const name of EXCLUDED) assert.ok(doc.includes(`\`${name}\``), `${name} missing from the doc`);
    assert.match(doc, /ferretdb_no_mysql/);
    assert.match(doc, /wekan-12\.63-sandstorm\.spk/);
  });

  for (const [name, fn] of tests) {
    fn();
    passed += 1;
    console.log('  ok -', name);
  }
  console.log(`\nsandstormSlim: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
