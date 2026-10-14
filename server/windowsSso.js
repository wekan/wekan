// #5758: Windows single sign-on - Kerberos or NTLM, the browser's own
// "Integrated Windows Authentication" - with node-expose-sspi
// (models/lib/windowsSso.js holds the decisions). Off unless WeKan runs on
// Windows with WINDOWS_SSO_ENABLED=true and node-expose-sspi installed in the
// bundle (docs/Features/Login/WindowsSSO.md).
//
// The sign-in page links to /sso/windows. There the browser proves who is
// signed in to Windows; WeKan finds or creates that member and sends the
// browser back to /sign-in?windowsSso=<one-time token>, which the page signs
// in with, through the same login checks as every other way of signing in.
import crypto from 'node:crypto';
import path from 'node:path';
import { createRequire } from 'node:module';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { WebApp } from 'meteor/webapp';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { authEnv } from '/server/lib/authConfig';
import { ensureIndex } from '/server/lib/mongoStartup';

const {
  parseWindowsName, allowedDomains, isDomainAllowed, windowsProfile, resolveMember, moduleSearchBases, windowsSsoEnabled,
} = require('/models/lib/windowsSso');

// { _id: sha256(token), userId, expiresAt } - one minute, used once.
export const WindowsSsoTokens = new Mongo.Collection('windowsSsoTokens');
WindowsSsoTokens.deny({ insert: () => true, update: () => true, remove: () => true });
const TOKEN_MS = 60000;
const hash = value => crypto.createHash('sha256').update(String(value)).digest('hex');

const enabled = () => windowsSsoEnabled({ platform: process.platform, env: { WINDOWS_SSO_ENABLED: authEnv('WINDOWS_SSO_ENABLED') } });

// node-expose-sspi from the bundle, or null with the reason logged once.
let sspi;
function loadSspi() {
  if (sspi !== undefined) return sspi;
  sspi = null;
  for (const base of moduleSearchBases({ cwd: process.cwd(), mainScript: process.argv[1] })) {
    try {
      sspi = createRequire(path.join(base, 'noop.js'))('node-expose-sspi');
      break;
    } catch (e) { /* the next place */ }
  }
  if (!sspi) console.warn('Windows SSO: WINDOWS_SSO_ENABLED=true, but node-expose-sspi is not installed (docs/Features/Login/WindowsSSO.md).');
  return sspi;
}

let middleware = null;
function negotiate() {
  if (!middleware) {
    middleware = loadSspi().sso.auth({
      useActiveDirectory: authEnv('WINDOWS_SSO_ACTIVE_DIRECTORY') === 'true',
      useGroups: false,
    });
  }
  return middleware;
}

const signInUrl = query => `${(process.env.ROOT_URL || Meteor.absoluteUrl()).replace(/\/+$/, '')}/sign-in?${query}`;
function redirect(res, query) {
  res.writeHead(302, { Location: signInUrl(query), 'Cache-Control': 'no-store' });
  res.end();
}

async function memberFor(user) {
  const parsed = parseWindowsName(user && user.name);
  if (!isDomainAllowed(parsed, allowedDomains(authEnv('WINDOWS_SSO_DOMAINS')))) return { refused: 'windows-sso-domain' };
  const profile = windowsProfile(parsed, user.adUser);
  const found = await resolveMember(profile, {
    find: selector => Meteor.users.findOneAsync(selector, { fields: { _id: 1 } }),
    merge: authEnv('WINDOWS_SSO_MERGE_EXISTING_USERS') === 'true',
  });
  if (found.refused) return found;
  if (found.create) {
    const userDoc = { username: found.create, authenticationMethod: 'windows', profile: { fullname: profile.fullname },
      services: { windowsSso: { id: profile.id } } };
    if (profile.email && !(await Meteor.users.findOneAsync({ 'emails.address': profile.email }, { fields: { _id: 1 } }))) {
      userDoc.emails = [{ address: profile.email, verified: true }];
    }
    return { userId: await Accounts.insertUserDoc({}, userDoc) };
  }
  if (found.link) await Meteor.users.updateAsync(found.userId, { $set: { 'services.windowsSso.id': profile.id } });
  return { userId: found.userId };
}

Meteor.startup(async () => {
  Meteor.settings.public.windowsSsoEnabled = enabled() && !!loadSspi();
  await ensureIndex(WindowsSsoTokens, { expiresAt: 1 }, { expireAfterSeconds: 0 });
});

WebApp.handlers.get('/sso/windows', (req, res) => {
  if (!enabled() || !loadSspi() || Meteor.settings?.public?.sandstorm) {
    res.writeHead(404); res.end(); return;
  }
  // The Negotiate handshake answers 401 with a challenge until the browser
  // has proved the account; then it calls on with req.sso.user.
  negotiate()(req, res, async error => {
    try {
      if (error || !req.sso || !req.sso.user) return redirect(res, 'windowsSso=failed');
      const member = await memberFor(req.sso.user);
      if (!member.userId) return redirect(res, 'windowsSso=failed');
      const token = Random.secret(43);
      await WindowsSsoTokens.insertAsync({ _id: hash(token), userId: member.userId, expiresAt: new Date(Date.now() + TOKEN_MS) });
      return redirect(res, `windowsSso=${encodeURIComponent(token)}`);
    } catch (e) {
      if (process.env.DEBUG === 'true') console.warn('Windows SSO failed:', e);
      return redirect(res, 'windowsSso=failed');
    }
  });
});

// Accounts.callLoginMethod({ methodArguments: [{ windowsSso: token }] }).
Accounts.registerLoginHandler('windowsSso', async options => {
  if (!options || options.windowsSso === undefined) return undefined;
  check(options.windowsSso, String);
  const invalid = { error: new Meteor.Error(403, 'windows-sso-failed') };
  if (!enabled()) return invalid;
  const result = await WindowsSsoTokens.rawCollection().findOneAndDelete({ _id: hash(options.windowsSso) });
  const doc = result && 'ok' in result && 'value' in result ? result.value : result;
  if (!doc || doc.expiresAt <= new Date()) return invalid;
  return { userId: doc.userId };
});
