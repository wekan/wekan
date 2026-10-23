#!/usr/bin/env node
// The Sandstorm build profile: what the WeKan .spk is built WITHOUT.
//
//   node releases/sandstorm-slim.mjs list
//   node releases/sandstorm-slim.mjs apply   [.meteor/packages]   # edit in place, keep a backup
//   node releases/sandstorm-slim.mjs restore [.meteor/packages]   # put the backup back
//   node releases/sandstorm-slim.mjs verify  <bundle-dir>         # fail if one got in
//
// Design and numbers: docs/Platforms/FOSS/Container/Sandstorm/Smaller-wekan-spk.md
//
// WHY. A Sandstorm grain has exactly one way in: Sandstorm signs the user in
// and sandstorm-http-bridge hands the identity to the app on every request
// (packages/wekan-accounts-sandstorm). It has one database - FerretDB on SQLite
// in /var, started by sandstorm-src/start.js - and one mailbox, the grain's own
// address (server/sandstormEmail.js). Every other login method WeKan supports
// is a Meteor package that is built into the .spk, loaded on every grain start
// and never once called: passwords and their lockout, 2FA, passwordless e-mail
// links, OAuth2/OIDC, CAS, LDAP, SAML and seven social OAuth services.
//
// HOW. These are removed from a COPY of .meteor/packages for the length of one
// `meteor build`, so the Docker image, the snap and the .zip bundles - which
// share every source file with the .spk - are built from the unchanged list.
// The app code that names one of these packages asks `Package[name]` first
// (server/ldapAdminSettingsBridge.js, server/accounts-lockout-config.js,
// server/methods/lockoutSettings.js), so a missing package is a skipped
// feature, not a server that does not start. tests/sandstormSlim.test.cjs holds
// the list, the code and the workflows to that.

import fs from 'fs';
import path from 'path';

// name -> why the grain does not need it. Order is the order of .meteor/packages.
export const SANDSTORM_EXCLUDED_PACKAGES = Object.freeze({
  'accounts-password': 'password login - Sandstorm is the login; no grain account has a password',
  'accounts-2fa': 'TOTP second factor for password login',
  'wekan-ldap': 'LDAP login and LDAP user/group sync - a grain has no network to a directory',
  'wekan-accounts-cas': 'CAS single sign-on',
  'wekan-accounts-saml': 'SAML single sign-on (and @node-saml, xml-crypto, xmldom)',
  'wekan-accounts-lockout': 'brute-force lockout of password logins',
  'wekan-oidc': 'OAuth2 / OpenID Connect client',
  'wekan-accounts-oidc': 'OAuth2 / OpenID Connect login',
  'accounts-google': 'Google OAuth login',
  'accounts-github': 'GitHub OAuth login',
  'accounts-facebook': 'Facebook OAuth login',
  'accounts-twitter': 'Twitter OAuth login',
  'accounts-meteor-developer': 'Meteor developer account OAuth login',
  'accounts-weibo': 'Weibo OAuth login',
  'accounts-meetup': 'Meetup OAuth login',
  'accounts-passwordless': 'login links sent by e-mail',
});

// What the grain DOES run, and therefore must never be removed by a typo in
// the list above. `verify` also checks that each of these is in the bundle.
export const SANDSTORM_REQUIRED_PACKAGES = Object.freeze([
  'wekan-accounts-sandstorm', // the Sandstorm login itself
  'accounts-express',         // implies accounts-base: Meteor.users, login tokens, the REST API
  'email',                    // server/sandstormEmail.js installs the grain's transport into it
  'service-configuration',    // imported by app code; harmless without a service
  'mongo',                    // FerretDB speaks the MongoDB wire protocol
]);

const BACKUP_SUFFIX = '.sandstorm-slim-orig';

function packageName(line) {
  const t = line.replace(/#.*/, '').trim();
  if (!t) return null;
  return t.split('@')[0].trim();
}

// The .meteor/packages text without the excluded packages. Comments and every
// other line are kept exactly; a removed line leaves a comment saying why, so
// a build log that prints the file shows what was taken out.
export function slimPackagesText(text) {
  const out = [];
  const removed = [];
  const present = new Set();
  for (const line of text.split('\n')) {
    const name = packageName(line);
    if (name && Object.prototype.hasOwnProperty.call(SANDSTORM_EXCLUDED_PACKAGES, name)) {
      removed.push(name);
      out.push(`# sandstorm-slim: removed ${name} - ${SANDSTORM_EXCLUDED_PACKAGES[name]}`);
      continue;
    }
    if (name) present.add(name);
    out.push(line);
  }
  const missing = SANDSTORM_REQUIRED_PACKAGES.filter(name => !present.has(name));
  if (missing.length) {
    throw new Error(`sandstorm-slim: .meteor/packages has no ${missing.join(', ')} - the grain needs it`);
  }
  return { text: out.join('\n'), removed };
}

// Every package Meteor put into a built bundle, by architecture.
export function bundlePackages(bundleDir) {
  const found = {};
  for (const arch of ['server', 'web.browser', 'web.browser.legacy']) {
    const program = path.join(bundleDir, 'programs', arch, 'program.json');
    if (!fs.existsSync(program)) continue;
    // The server's program.json lists what it loads as `load`, a client's as
    // `manifest`; both name each package as packages/<name>.js.
    const json = JSON.parse(fs.readFileSync(program, 'utf8'));
    const manifest = json.load || json.manifest || [];
    const names = new Set();
    for (const entry of manifest) {
      // packages/<name>.js, or a file of the package: packages/<name>/x.css.
      const m = /^packages\/([^/]+?)(?:\.js)?(?:\/|$)/.exec(entry.path || '');
      if (m) names.add(m[1].replace(/_/g, ':'));
    }
    found[arch] = names;
  }
  return found;
}

export function verifyBundle(bundleDir) {
  const found = bundlePackages(bundleDir);
  if (!found.server) throw new Error(`sandstorm-slim: ${bundleDir} has no programs/server/program.json`);
  const problems = [];
  for (const [arch, names] of Object.entries(found)) {
    for (const name of Object.keys(SANDSTORM_EXCLUDED_PACKAGES)) {
      if (names.has(name)) problems.push(`${name} is in ${arch}`);
    }
  }
  // oauth/oauth2 come in only through the OAuth login packages; finding them
  // means something still pulls a login method in.
  for (const name of ['oauth', 'oauth1', 'oauth2', 'accounts-oauth']) {
    if (found.server.has(name)) problems.push(`${name} is in server - an OAuth login package is still built in`);
  }
  for (const name of ['wekan-accounts-sandstorm', 'accounts-base', 'email']) {
    if (!found.server.has(name)) problems.push(`${name} is missing from server - the grain needs it`);
  }
  const npmMeteor = path.join(bundleDir, 'programs', 'server', 'npm', 'node_modules', 'meteor');
  for (const name of Object.keys(SANDSTORM_EXCLUDED_PACKAGES)) {
    if (fs.existsSync(path.join(npmMeteor, name))) problems.push(`npm/node_modules/meteor/${name} is in the bundle`);
  }
  return problems;
}

function main(argv) {
  const [command, arg] = argv;
  if (command === 'list') {
    for (const [name, why] of Object.entries(SANDSTORM_EXCLUDED_PACKAGES)) console.log(`${name}\t${why}`);
    return 0;
  }
  if (command === 'apply' || command === 'restore') {
    const file = path.resolve(arg || '.meteor/packages');
    const backup = file + BACKUP_SUFFIX;
    if (command === 'restore') {
      if (!fs.existsSync(backup)) { console.log(`sandstorm-slim: no ${backup}, nothing to restore`); return 0; }
      fs.renameSync(backup, file);
      console.log(`sandstorm-slim: restored ${file}`);
      return 0;
    }
    const original = fs.readFileSync(file, 'utf8');
    // A second apply must not overwrite the real backup with the slimmed file.
    if (!fs.existsSync(backup)) fs.writeFileSync(backup, original);
    const { text, removed } = slimPackagesText(fs.readFileSync(backup, 'utf8'));
    fs.writeFileSync(file, text);
    console.log(`sandstorm-slim: removed ${removed.length} packages from ${file}: ${removed.join(' ')}`);
    return 0;
  }
  if (command === 'verify') {
    if (!arg) { console.error('usage: sandstorm-slim.mjs verify <bundle-dir>'); return 2; }
    const problems = verifyBundle(path.resolve(arg));
    if (problems.length) {
      for (const p of problems) console.error(`sandstorm-slim: ${p}`);
      return 1;
    }
    console.log(`sandstorm-slim: ${arg} has none of the ${Object.keys(SANDSTORM_EXCLUDED_PACKAGES).length} excluded packages`);
    return 0;
  }
  console.error('usage: node releases/sandstorm-slim.mjs list | apply [file] | restore [file] | verify <bundle-dir>');
  return 2;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
