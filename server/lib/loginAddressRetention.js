// Once a day: the sign-in addresses older than LOGIN_ADDRESS_RETENTION_DAYS
// (default 365) are removed from the accounts, from loginAddresses and from
// shortPasswordLogins. The decisions are models/lib/loginAddressRetention.js.
// The first server to claim today's run does it (models/lib/dailyClaim.js),
// the hourly timer keeps it daily, and nothing here can fail a login.
import { Meteor } from 'meteor/meteor';
import LoginAddresses from '/models/loginAddresses';
import ShortPasswordLogins from '/models/shortPasswordLogins';

const lib = require('/models/lib/loginAddressRetention');
const BATCH = 500;

export async function runLoginAddressRetention(now = Date.now()) {
  const days = lib.retentionDays({ LOGIN_ADDRESS_RETENTION_DAYS: process.env.LOGIN_ADDRESS_RETENTION_DAYS });
  const cutoff = lib.cutoffFor(days, now);
  if (!cutoff) return { users: 0, addresses: 0, shortPasswords: 0 };
  let users = 0;
  const cursor = Meteor.users.rawCollection().find({ 'loginAddresses.entries': { $exists: true } },
    { projection: { loginAddresses: 1 } }).batchSize(BATCH);
  for await (const user of cursor) {
    const unset = lib.userUnset(user, cutoff);
    if (unset) {
      await Meteor.users.rawCollection().updateOne({ _id: user._id }, { $unset: unset });
      users += 1;
    }
  }
  const removed = await LoginAddresses.rawCollection().deleteMany({ at: { $lt: cutoff } });
  let addresses = removed.deletedCount || 0;
  const rows = LoginAddresses.rawCollection().find({}, { projection: { at: 1, users: 1 } }).batchSize(BATCH);
  for await (const row of rows) {
    const decision = lib.addressDecision(row, cutoff);
    if (decision.unset) {
      await LoginAddresses.rawCollection().updateOne({ _id: row._id }, { $unset: decision.unset });
      addresses += 1;
    }
  }
  const short = await ShortPasswordLogins.rawCollection().deleteMany({ at: { $lt: cutoff } });
  return { users, addresses, shortPasswords: short.deletedCount || 0 };
}

if (Meteor.isServer) {
  Meteor.startup(() => {
    const days = lib.retentionDays({ LOGIN_ADDRESS_RETENTION_DAYS: process.env.LOGIN_ADDRESS_RETENTION_DAYS });
    if (days <= 0) return;
    const runClaimed = async () => {
      const { claimDailyJob } = require('/models/lib/dailyClaim');
      if (!(await claimDailyJob(LoginAddresses.rawDatabase(), 'login-address-retention'))) return;
      await runLoginAddressRetention();
    };
    Meteor.defer(() => { runClaimed().catch(error => console.error('Login address retention failed:', error)); });
    Meteor.setInterval(() => {
      runClaimed().catch(error => console.error('Login address retention failed:', error));
    }, 60 * 60 * 1000);
  });
}
