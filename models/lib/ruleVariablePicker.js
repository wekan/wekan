'use strict';

// #3195: the rule editor's "Insert variable" picker. Pure, so
// tests/ruleVariablePicker.test.cjs checks it without a browser.
//
// The picker offers the tokens rules resolve (models/lib/ruleVarsSubstitute.js,
// server/rulesHelper.js addCardPeopleAndFields): the card's people, its card,
// list and board names, and one {customField:Name} per custom field of the
// board. Admin-only fields are left out, as the rule engine leaves them out of
// the variables, and so is a field whose name contains a brace, which the
// token syntax cannot spell.

const BASE_TOKENS = ['{creator}', '{assignees}', '{members}', '{card}', '{list}', '{board}'];

function ruleVariableTokens(customFields) {
  const names = (Array.isArray(customFields) ? customFields : [])
    .filter(field => field && !field.adminOnly && typeof field.name === 'string')
    .map(field => field.name.trim())
    .filter(name => name && !/[{}]/.test(name));
  return [...BASE_TOKENS, ...[...new Set(names)].map(name => `{customField:${name}}`)];
}

// Replace the selection [start, end) of `value` with `token`; the caret goes
// after the token. Positions out of range (a field never focused) append.
function insertRuleVariable(value, start, end, token) {
  const text = typeof value === 'string' ? value : '';
  const valid = Number.isInteger(start) && Number.isInteger(end) && start >= 0 && start <= end && end <= text.length;
  const from = valid ? start : text.length;
  const to = valid ? end : text.length;
  return { value: text.slice(0, from) + token + text.slice(to), caret: from + token.length };
}

module.exports = { ruleVariableTokens, insertRuleVariable, BASE_TOKENS };
