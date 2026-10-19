// USERS_DISABLE_INACTIVE_AFTER_DAYS: once a day, disable accounts that have not
// used WeKan for that many days. Off unless set. The decisions are in
// models/lib/inactiveUsers.js (pure, tested); this file only reads and writes.
//
// Disabling goes through the same Users.before.update hook as an admin
// disabling a user by hand (server/models/users.js), so the account's login
// tokens are revoked and open sessions closed. Re-enabling it - by an admin in
// Admin Panel > People, or the REST API - restarts its inactivity clock there.
import { Meteor } from 'meteor/meteor';
import { SyncedCron } from '/server/cron/syncedCron';
import { authEnv, authConfigReady } from '/server/lib/authConfig';

const {
  REASON_INACTIVE, normalizeInactiveDays, inactivityAction, inactiveCandidateSelector,
} = require('/models/lib/inactiveUsers');

export async function disableInactiveUsers(days, now = new Date()) {
  if (!days) return { disabled: 0, clocksStarted: 0 };
  const candidates = await Meteor.users.find(inactiveCandidateSelector(days, now), {
    fields: {
      _id: 1, username: 1, isAdmin: 1, loginDisabled: 1, anonymized: 1,
      lastConnectionDate: 1, inactivityClockStart: 1,
    },
  }).fetchAsync();

  let disabled = 0;
  let clocksStarted = 0;
  for (const user of candidates) {
    const action = inactivityAction(user, days, now);
    try {
      if (action === 'start-clock') {
        // eslint-disable-next-line no-await-in-loop
        clocksStarted += await Meteor.users.updateAsync(
          { _id: user._id, lastConnectionDate: { $in: [null] }, inactivityClockStart: { $in: [null] } },
          { $set: { inactivityClockStart: now } },
        );
      } else if (action === 'disable') {
        // Re-check the condition in the write itself: a user who logs in while
        // the job runs must not be disabled on stale data.
        // eslint-disable-next-line no-await-in-loop
        const n = await Meteor.users.updateAsync(
          { _id: user._id, ...inactiveCandidateSelector(days, now) },
          { $set: { loginDisabled: true, loginDisabledReason: REASON_INACTIVE } },
        );
        if (n) {
          disabled += n;
          // eslint-disable-next-line no-console
          console.log(`disableInactiveUsers: disabled ${user.username} (no activity for ${days} days)`);
        }
      }
    } catch (e) {
      // One account that cannot be written must not stop the rest.
      // eslint-disable-next-line no-console
      console.error('disableInactiveUsers: could not update user', user._id, e.message);
    }
  }
  return { disabled, clocksStarted };
}

// The setting is resolved on every run, Admin Panel / People / Login first and
// the environment variable second (models/lib/authConfigCatalog.js), so
// switching it on, off or to another number there needs no restart.
let lastWarned = null;
export function inactiveDaysSetting(env = authEnv) {
  const raw = env('USERS_DISABLE_INACTIVE_AFTER_DAYS');
  const days = normalizeInactiveDays(raw);
  if (!days && raw !== undefined && raw !== null && String(raw).trim() !== '' && String(raw).trim() !== '0') {
    if (lastWarned !== raw) {
      // eslint-disable-next-line no-console
      console.warn(`USERS_DISABLE_INACTIVE_AFTER_DAYS ${JSON.stringify(raw)} is not a positive whole number of days; inactive users are not disabled`);
      lastWarned = raw;
    }
  }
  return days;
}

Meteor.startup(() => {
  try {
    SyncedCron.add({
      name: 'wekan-disable-inactive-users',
      schedule(parser) {
        return parser.text('at 3:15 am');
      },
      async job() {
        await authConfigReady;
        return disableInactiveUsers(inactiveDaysSetting(), new Date());
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('disableInactiveUsers: failed to register cron job', e);
  }
});
