// Every refused sign-in, recorded for Admin Panel / Problems with its precise
// reason (#6942, models/lib/loginRefusals.js). The person signing in still
// gets the same generic message: nothing here changes what is thrown.
//
// One summarised row per reason (the security stream's fold), never a row per
// attempt. The account being tried is the TARGET, never the actor, so a typo -
// or somebody guessing - can never block that account (blocksAccount: false
// in models/lib/securityCategories.js as well).
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

const { sourceFor, reasonOfPasswordFailure } = require('/models/lib/loginRefusals');

const TEXT = {
  'bad-password': 'wrong password',
  'unknown-user': 'no account with that username or e-mail',
  'account-disabled': 'the account is disabled',
  braked: 'too many failed attempts: the account is braked for a while',
  'malformed-credentials': 'an incomplete sign-in request',
  'ldap-bad-credentials': 'the directory (LDAP) refused the username or password',
  'ldap-not-in-allowed-group': 'not in the directory group allowed to use WeKan',
  'ldap-account-not-linked': 'a WeKan account with that name exists but is not linked to the directory',
  'ldap-bound-to-another-entry': 'the matching WeKan account belongs to another directory entry',
};

export function recordLoginRefusal({ reason, method = 'password', username, targetUserId }) {
  try {
    require('/server/lib/securityLog').record({
      key: 'authn.login-refused', action: 'blocked', source: sourceFor(reason),
      username: username ? String(username).slice(0, 100) : undefined,
      targetUserId: targetUserId || undefined,
      detail: `${method} sign-in refused: ${TEXT[reason] || reason}.`,
    });
  } catch (e) { /* the record must never change the sign-in */ }
}

// The LDAP package (packages/wekan-ldap) reports through this, as it cannot
// import the app's modules.
global.__wekanLoginRefused = (reason, username, targetUserId) => recordLoginRefusal({ reason, method: 'LDAP', username, targetUserId });

Meteor.startup(() => {
  Accounts.onLoginFailure(attempt => {
    try {
      if (!attempt || attempt.type !== 'password') return;
      const reason = reasonOfPasswordFailure(attempt.error, attempt.user);
      if (!reason) return;
      const tried = attempt.methodArguments && attempt.methodArguments[0] && attempt.methodArguments[0].user;
      const username = (attempt.user && attempt.user.username)
        || (tried && (tried.username || tried.email)) || '';
      recordLoginRefusal({ reason, username, targetUserId: attempt.user && attempt.user._id });
    } catch (e) { /* never change the sign-in */ }
  });
});

Meteor.methods({
  // Problems / Summary's Sign-in refusals: one row per reason
  // (models/lib/loginRefusals.js summarize). Site administrators only.
  async loginRefusalSummary() {
    const user = this.userId && await Meteor.users.findOneAsync(this.userId, { fields: { isAdmin: 1, loginDisabled: 1 } });
    if (!user || user.isAdmin !== true || user.loginDisabled === true) throw new Meteor.Error('error-notAuthorized');
    const EventLog = require('/models/eventLog').default;
    const rows = await EventLog.find({ stream: 'security', source: /^login:/ },
      { fields: { source: 1, count: 1, firstAt: 1, at: 1, username: 1, ip: 1 } }).fetchAsync();
    return require('/models/lib/loginRefusals').summarize(rows);
  },
});
