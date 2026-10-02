// SignupBleed, DDP sibling: see models/lib/clientAccountCreation.js. Wraps the
// accounts-password `createUser` DDP method - the only way a client creates an
// account - so a client cannot pass the server-only creation options. Loaded
// from server/imports.js, after the accounts packages registered the method.
import { Meteor } from 'meteor/meteor';
const { clientCreationOptions } = require('/models/lib/clientAccountCreation');

const handlers = Meteor.server && Meteor.server.method_handlers;
const original = handlers && handlers.createUser;
if (typeof original === 'function' && !original.__wekanClientOptionsGuard) {
  const guarded = async function createUser(options, ...rest) {
    const { options: clean, refused } = clientCreationOptions(options);
    if (refused.length) {
      // Nobody signs up with these through the UI: an attempt to bypass
      // "Disable registration". Not logged in yet, so no account to block.
      try {
        require('/server/lib/securityLog').record({
          key: 'authz.register', action: 'blocked', source: 'ddp:createUser',
          detail: `client sign-up passed server-only option(s): ${refused.join(', ')}`,
        });
      } catch (e) { /* logging must never break the guard */ }
    }
    return original.call(this, clean, ...rest);
  };
  guarded.__wekanClientOptionsGuard = true;
  handlers.createUser = guarded;
}
