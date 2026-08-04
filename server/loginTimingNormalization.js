import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

// GHSA-2g94-9x3m-hv37: close the bcrypt timing side-channel on the DDP `login`
// method (user enumeration). See server/lib/loginTimingDefense.js for the why.
const {
  hasLocalPassword,
  equalizeMissingUserTiming,
} = require('/server/lib/loginTimingDefense');

Meteor.startup(() => {
  // A password login handler that runs BEFORE the built-in accounts-password
  // one. When the requested user does not exist (or has no local password) —
  // the case where accounts-password would throw immediately with no bcrypt —
  // it performs one dummy bcrypt comparison so the response time matches an
  // existing user's. It ALWAYS returns undefined, i.e. never authenticates and
  // never short-circuits: the built-in handler still does all the real work.
  Accounts.registerLoginHandler('password', async function (options) {
    // Only password logins carry `password` + `user`; resume/oauth/etc. skip
    // this untouched.
    if (!options || !options.password || !options.user) return undefined;

    let user;
    try {
      user = await Accounts._findUserByQuery(options.user, {
        fields: { services: 1, _id: 1 },
      });
    } catch (e) {
      // A malformed selector: let the built-in handler reject it as it always
      // did; don't add timing work for an obviously invalid request.
      return undefined;
    }

    if (!hasLocalPassword(user)) {
      await equalizeMissingUserTiming(Accounts._checkPasswordAsync);
    }
    return undefined;
  });

  // registerLoginHandler appends, but the built-in 'password' handler is already
  // registered (and throws for a missing user before any bcrypt), so ours must
  // run FIRST to add the compensating delay. Move it to the front of the list.
  // Guarded so a future Meteor that renames this internal simply disables the
  // normalization instead of crashing at startup.
  const handlers = Accounts._loginHandlers;
  if (Array.isArray(handlers) && handlers.length) {
    const mine = handlers.pop();
    handlers.unshift(mine);
  }
});
