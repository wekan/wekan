'use strict';

// #2435: a rule email's To field names board members as `@username`, picked
// from a member list with autocomplete, beside free addresses as before.
// The address is looked up when the rule runs, so the rule (and whoever
// reads it) holds a user name, never somebody's email address, and a member
// who changes their address is still reached.
//
// `lookup(username)` answers that MEMBER's address, or nothing - it is given
// only the board's active members - so a `@name` of somebody outside the
// board, or without an address, is dropped rather than sent as text an SMTP
// server would reject. Everything that is not a `@username` is kept as it
// was. Pure: tests/ruleEmailMembers.test.cjs.

const MENTION = /^@([A-Za-z0-9._-]{1,100})$/;

function mentionedUsernames(to) {
  return String(to || '').split(',').map(s => s.trim())
    .map(s => (s.match(MENTION) || [])[1]).filter(Boolean);
}

function expandMemberMentions(to, lookup) {
  const seen = new Set();
  const out = [];
  for (const part of String(to || '').split(',').map(s => s.trim()).filter(Boolean)) {
    const m = part.match(MENTION);
    const address = m ? lookup(m[1]) : part;
    if (!address) continue;
    const key = String(address).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(address);
  }
  return out.join(', ');
}

// The picker: the board's members, matching what has been typed after `@`.
function memberChoices(members, typed, limit = 20) {
  const q = String(typed || '').replace(/^@/, '').trim().toLowerCase();
  return (Array.isArray(members) ? members : [])
    .filter(m => m && m.username)
    .filter(m => !q || m.username.toLowerCase().includes(q) || String(m.fullname || '').toLowerCase().includes(q))
    .slice(0, limit)
    .map(m => ({ value: `@${m.username}`, label: m.fullname ? `${m.fullname} (@${m.username})` : `@${m.username}` }));
}

// Adds a picked `@username` to the To field's comma list, once.
function addRecipient(current, value) {
  const parts = String(current || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!parts.includes(value)) parts.push(value);
  return parts.join(', ');
}

module.exports = { mentionedUsernames, expandMemberMentions, memberChoices, addRecipient };
