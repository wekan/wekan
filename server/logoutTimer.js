import { Meteor } from 'meteor/meteor';
import { authEnv, onAuthConfigChange } from '/server/lib/authConfig';

// Automatic logout (LOGOUT_WITH_TIMER, LOGOUT_IN, LOGOUT_ON_HOURS,
// LOGOUT_ON_MINUTES; Admin Panel / People / Login overrides each). Once a
// minute, every login token whose deadline has passed is removed; Meteor then
// logs out the connections that used it. The deadline arithmetic is
// models/lib/logoutTimer.js.
const { logoutTimerConfig, expiredBefore } = require('/models/lib/logoutTimer');

const SWEEP_MS = 60 * 1000;
let lastReason = null;

export async function sweepExpiredLogins(now = new Date()) {
  const config = logoutTimerConfig(authEnv);
  if (!config.enabled) {
    // Say once why a timer that was asked for does nothing.
    if (config.reason !== 'off' && config.reason !== lastReason) {
      console.warn(`[logout-timer] not running: ${config.reason}`);
    }
    lastReason = config.reason;
    return 0;
  }
  lastReason = null;
  const cutoff = expiredBefore(now, config);
  return Meteor.users.updateAsync(
    { 'services.resume.loginTokens.when': { $lt: cutoff } },
    { $pull: { 'services.resume.loginTokens': { when: { $lt: cutoff } } } },
    { multi: true },
  );
}

async function sweep() {
  try {
    const users = await sweepExpiredLogins();
    if (users) console.log(`[logout-timer] signed out expired logins of ${users} user(s)`);
  } catch (error) {
    console.error('[logout-timer] sweep failed:', error);
  }
}

Meteor.startup(() => {
  Meteor.setInterval(sweep, SWEEP_MS);
  Meteor.defer(sweep);
});

// A change in Admin Panel / People / Login applies at once, not a minute later.
onAuthConfigChange('login', () => { Meteor.defer(sweep); });
