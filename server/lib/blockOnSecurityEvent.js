// A logged-in account that attempts a vulnerability is blocked from logging in.
//
// THE ACCOUNT, NEVER THE ADDRESS. Blocking the address is the obvious reflex and
// it is wrong: an address that several accounts use is an office, a VPN, a
// university or a carrier's NAT, and blocking it takes everyone behind it off
// WeKan at once - including, if HTTP_FORWARDED_COUNT is misconfigured, the
// reverse proxy, which is every user there is. models/loginAddresses.js exists
// so an admin can see that shape; this module is why it matters.
//
// An account is the right unit anyway. A security event that names a userId is
// somebody ALREADY AUTHENTICATED reaching for something the guards refuse -
// a far stronger signal than a failed password, and one that belongs to a person
// rather than to a place. Whoever it is keeps their address; what they lose is
// that account.
//
// WHAT IS NOT BLOCKED: an event with no userId. An unauthenticated attempt has
// nobody to block, and guessing from the address is exactly the mistake above.
// Those are counted in Admin Panel -> Problems and left to the lockout.

import { Meteor } from 'meteor/meteor';

const { categoryFor } = require('/models/lib/securityCategories');

// Only a refusal that names a person. `action` tells a block from a mere
// detection: a sanitised input is not an attempt to be punished for.
const BLOCKING_ACTIONS = ['blocked'];

// A block is a serious step, so only a serious finding causes one. `info` and
// `low` are noise by definition, and `medium` covers guards that fire on
// borderline-but-legitimate use.
const BLOCKING_SEVERITIES = ['high', 'critical'];

export function shouldBlockAccount(evt = {}) {
  if (!evt.userId) return false;
  if (!BLOCKING_ACTIONS.includes(evt.action)) return false;
  const severity = evt.severity || (evt.key ? categoryFor(evt.key).severity : '');
  return BLOCKING_SEVERITIES.includes(severity);
}

// Why it was blocked, in one line an admin reads in Admin Panel / People.
export function blockReason(evt = {}) {
  const cat = evt.key ? categoryFor(evt.key) : {};
  const name = evt.bleed || cat.bleed || evt.category || cat.category || 'a security guard';
  const where = evt.source ? ` at ${evt.source}` : '';
  return `Attempted ${name}${where} while logged in`;
}

// Block the account. Uses the SAME field the Admin Panel already toggles -
// loginDisabled - so an admin unblocks from the People table they already know,
// and no second notion of "blocked" appears beside the one that exists.
export async function blockAccountForSecurityEvent(evt = {}) {
  if (!shouldBlockAccount(evt)) return false;
  const reason = blockReason(evt);
  await Meteor.users.updateAsync({ _id: evt.userId }, {
    $set: {
      loginDisabled: true,
      // WHY, and when. Admin Panel / People shows this beside the account, so
      // "why was this blocked" is answerable without reading a log.
      'services.securityBlock': {
        at: new Date(),
        reason,
        bleed: evt.bleed || '',
        source: evt.source || '',
        // The address it came from is RECORDED, not acted on.
        ip: evt.ip || '',
      },
    },
  });
  return true;
}
