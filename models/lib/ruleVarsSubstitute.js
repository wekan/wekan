'use strict';

// #2475 / #3304: Trello-Butler-style `{name}` template-variable substitution
// for Rules action text fields (send-email subject/body, created card/
// checklist names, ...). Pure and dependency-free so it can be unit tested
// on its own, like models/lib/cardUrl.js next to it.
//
// Unknown or malformed tokens (no matching var, or not a bare `{word}`
// shape) are left untouched rather than removed or throwing - a user who
// mistypes a token should see their mistake, not lose their text.
//
// #3195 / #4294 (maintainer decision 2026-09-29): `{customField:Name}` reads
// the card's value of the custom field called Name (case-insensitive), from
// `vars.customfield`, a { lowercased name: display value } map. A field the
// card has no value for leaves the token untouched, like any unknown token.
function substituteVars(text, vars) {
  if (typeof text !== 'string') return text;
  const safeVars = vars || {};
  return text.replace(/\{(\w+)(?::([^{}]+))?\}/g, (match, key, arg) => {
    if (arg !== undefined) {
      if (key.toLowerCase() !== 'customfield') return match;
      const fields = safeVars.customfield;
      const value = fields && typeof fields === 'object'
        ? fields[arg.trim().toLowerCase()] : undefined;
      return value !== undefined && value !== null ? String(value) : match;
    }
    const value = safeVars[key.toLowerCase()];
    return value !== undefined && typeof value !== 'object' ? value : match;
  });
}

// The people tokens name people by USERNAME in text, and by EMAIL where the
// value is an address - the send-email recipient. `people` maps a token to
// [{ username, email }] (#4278: {assignees}, {creator}, {members}).
function recipientVars(vars, people) {
  const out = { ...(vars || {}) };
  for (const [token, list] of Object.entries(people || {})) {
    const emails = (Array.isArray(list) ? list : []).map(p => p && p.email).filter(Boolean);
    // Nobody with an address: the token disappears from the recipient list
    // rather than staying as literal text an SMTP server would reject.
    out[token] = emails.join(', ');
  }
  return out;
}

module.exports = { substituteVars, recipientVars };
