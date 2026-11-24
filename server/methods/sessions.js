// Where an account is signed in, and ending one session (models/lib/sessionList.js).
//
//   getMySessions()          the caller's own sessions
//   endMySession(id)         ends one of the caller's own sessions
//   adminLogoutUser(userId)  a site administrator ends every session of an
//                            account; in the Audit log
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import crypto from 'crypto';

const { sessionRows, tokenFor } = require('/models/lib/sessionList');
const { isSiteAdmin } = require('/models/lib/tenantAdmin');

const idOf = hashed => crypto.createHash('sha256').update(`session:${hashed}`).digest('hex').slice(0, 16);

async function tokensOf(userId) {
  const user = await Meteor.users.findOneAsync(userId, { fields: { 'services.resume.loginTokens': 1 } });
  return (user && user.services && user.services.resume && user.services.resume.loginTokens) || [];
}

Meteor.methods({
  async getMySessions() {
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const tokens = await tokensOf(this.userId);
    const lastActive = {};
    try {
      const { IdleSessions } = require('/server/idleLogout');
      for (const s of await IdleSessions.find({ userId: this.userId }, { fields: { lastActiveAt: 1 } }).fetchAsync()) {
        lastActive[s._id] = s.lastActiveAt;
      }
    } catch (e) { /* last activity is only known while idle logout is on */ }
    const currentHashed = this.connection ? Accounts._getLoginToken(this.connection.id) : null;
    return sessionRows(tokens, { currentHashed, lastActive, idOf });
  },
  async endMySession(id) {
    check(id, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const hashed = tokenFor(await tokensOf(this.userId), id, idOf);
    if (!hashed) throw new Meteor.Error('session-not-found');
    // Only the caller's own account, only that token. Meteor closes the
    // session whose token is gone.
    await Meteor.users.updateAsync(this.userId, { $pull: { 'services.resume.loginTokens': { hashedToken: hashed } } });
    return true;
  },
  async adminLogoutUser(userId) {
    check(userId, String);
    const admin = this.userId ? await Meteor.users.findOneAsync(this.userId, { fields: { isAdmin: 1, loginDisabled: 1, orgs: 1, teams: 1 } }) : null;
    if (!admin || admin.loginDisabled || !isSiteAdmin(admin)) throw new Meteor.Error('not-authorized');
    const n = await Meteor.users.updateAsync(userId, { $set: { 'services.resume.loginTokens': [] } });
    if (!n) throw new Meteor.Error('user-not-found');
    return true;
  },
});
