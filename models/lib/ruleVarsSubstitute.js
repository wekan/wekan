'use strict';

// #2475 / #3304: Trello-Butler-style `{name}` template-variable substitution
// for Rules action text fields (send-email subject/body, created card/
// checklist names, ...). Pure and dependency-free so it can be unit tested
// on its own, like models/lib/cardUrl.js next to it.
//
// Unknown or malformed tokens (no matching var, or not a bare `{word}`
// shape) are left untouched rather than removed or throwing - a user who
// mistypes a token should see their mistake, not lose their text.
function substituteVars(text, vars) {
  if (typeof text !== 'string') return text;
  const safeVars = vars || {};
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = safeVars[key.toLowerCase()];
    return value !== undefined ? value : match;
  });
}

module.exports = { substituteVars };
