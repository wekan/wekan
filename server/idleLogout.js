import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Accounts } from 'meteor/accounts-base';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { authEnv, onAuthConfigChange } from '/server/lib/authConfig';
import { ensureIndex } from '/server/lib/mongoStartup';

// LOGOUT_IDLE_MINUTES: a browser session ends after its user has been idle
// that long. What "idle" means, and why a resumed login is not activity, is in
// models/lib/idleLogout.js.
const { idleLogoutConfig, idleCutoff, TOUCH_INTERVAL_MS } = require('/models/lib/idleLogout');

const SWEEP_MS = 60 * 1000;

function config() {
  return idleLogoutConfig(authEnv);
}

// One document per browser session: _id is the hashed login token, as in
// services.resume.loginTokens. Kept beside the user rather than on the token
// itself, because updating one element of that array needs the positional $
// operator, which not every database WeKan runs on supports.
export const IdleSessions = new Mongo.Collection('idleSessions');

// lastActiveAt of the login token this connection signed in with.
async function stampConnectionToken(userId, connection, onlyIfUnset = false) {
  const hashedToken = connection && Accounts._getLoginToken(connection.id);
  if (!userId || !hashedToken) return 0;
  const now = new Date();
  return IdleSessions.upsertAsync(
    { _id: hashedToken },
    onlyIfUnset
      ? { $setOnInsert: { userId, lastActiveAt: now } }
      : { $set: { userId, lastActiveAt: now } },
  );
}

Accounts.onLogin(async info => {
  try {
    if (!config().enabled || !info || !info.user || !info.connection) return;
    // A new sign-in is activity. A resumed one is a tab reconnecting by itself:
    // it only starts the clock on a token made before the limit was set.
    await stampConnectionToken(info.user._id, info.connection, info.type === 'resume');
  } catch (e) {
    console.error('[idle-logout] could not record the sign-in:', e);
  }
});

Meteor.methods({
  // The browser saw its user do something (client/lib/idleActivity.js).
  async touchActivity() {
    if (!this.userId || !config().enabled) return false;
    const conn = this.connection;
    const now = Date.now();
    // A second report within the interval changes nothing worth a write.
    if (conn && conn._wekanLastTouch && now - conn._wekanLastTouch < TOUCH_INTERVAL_MS / 2) return true;
    if (conn) conn._wekanLastTouch = now;
    await stampConnectionToken(this.userId, conn);
    return true;
  },

  // Whether the browser should report activity at all.
  getIdleLogout() {
    const { enabled, minutes } = config();
    return { enabled, minutes: enabled ? minutes : 0 };
  },
});

DDPRateLimiter.addRule({ type: 'method', name: 'touchActivity' }, 10, 60 * 1000);

let lastReason = null;
export async function sweepIdleLogins(now = new Date()) {
  const current = config();
  if (!current.enabled) {
    if (current.reason && current.reason !== lastReason) console.warn(`[idle-logout] not running: ${current.reason}`);
    lastReason = current.reason || null;
    return 0;
  }
  lastReason = null;
  const cutoff = idleCutoff(now, current);
  const idle = await IdleSessions.find(
    { lastActiveAt: { $lt: cutoff } }, { fields: { userId: 1 }, limit: 1000 },
  ).fetchAsync();
  let signedOut = 0;
  for (const { _id: hashedToken, userId } of idle) {
    // A session that signed out already has no token left; only the record goes.
    signedOut += await Meteor.users.updateAsync(
      { _id: userId },
      { $pull: { 'services.resume.loginTokens': { hashedToken } } },
    );
    await IdleSessions.removeAsync({ _id: hashedToken });
  }
  return signedOut;
}

async function sweep() {
  try {
    const users = await sweepIdleLogins();
    if (users) console.log(`[idle-logout] signed out idle sessions of ${users} user(s)`);
  } catch (error) {
    console.error('[idle-logout] sweep failed:', error);
  }
}

Meteor.startup(async () => {
  await ensureIndex(IdleSessions, { lastActiveAt: 1 });
  Meteor.setInterval(sweep, SWEEP_MS);
});

// Admin Panel / People / Login: a new limit applies at once.
onAuthConfigChange('login', () => { Meteor.defer(sweep); });
