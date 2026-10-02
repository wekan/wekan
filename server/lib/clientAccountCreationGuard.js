// SignupBleed, DDP sibling: see models/lib/clientAccountCreation.js. A client
// creates an account through one of two DDP methods: useraccounts'
// ATCreateUserServer (the sign-up form), which picks the profile fields and
// hands the REST of the client's options to Accounts.createUser, and Meteor's
// own createUser (refused while useraccounts forbids client creation, wrapped
// anyway so it cannot become a door). Both are wrapped here so a client cannot
// pass the server-only creation options. Loaded from server/imports.js, after
// the accounts packages registered the methods.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
const { clientCreationOptions } = require('/models/lib/clientAccountCreation');

export const CLIENT_ACCOUNT_CREATION_METHODS = ['ATCreateUserServer', 'createUser'];

function guard(methodName, original) {
  const guarded = async function guardedAccountCreation(options, ...rest) {
    // audit-argument-checks requires every argument the CLIENT sent to be
    // check()ed. The original method checks the copy it is handed, so the
    // client's own object is checked here - or every sign-up fails with
    // "Did not check() all arguments".
    check(options, Match.Any);
    rest.forEach(arg => check(arg, Match.Any));
    const { options: clean, refused } = clientCreationOptions(options);
    if (refused.length) {
      // Nobody signs up with these through the UI: an attempt to bypass
      // "Disable registration". Not logged in yet, so no account to block.
      try {
        require('/server/lib/securityLog').record({
          key: 'authz.register', action: 'blocked', source: `ddp:${methodName}`,
          detail: `client sign-up passed server-only option(s): ${refused.join(', ')}`,
        });
      } catch (e) { /* logging must never break the guard */ }
    }
    return original.call(this, clean, ...rest);
  };
  guarded.__wekanClientOptionsGuard = true;
  return guarded;
}

const handlers = Meteor.server && Meteor.server.method_handlers;
for (const name of CLIENT_ACCOUNT_CREATION_METHODS) {
  const original = handlers && handlers[name];
  if (typeof original === 'function' && !original.__wekanClientOptionsGuard) handlers[name] = guard(name, original);
}
