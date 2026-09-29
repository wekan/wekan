'use strict';

// #4294 / #3195 (maintainer decision 2026-09-29): trigger values accept the
// same `{token}` variables as action values - "when a card is moved to the
// list named in its {customField:Stage}", "when one of the card's {assignees}
// is added as a member". The tokens are the action ones
// (models/lib/ruleVarsSubstitute.js): {creator}, {assignees}, {members},
// {customField:Name}, {card}, {list}, {board}, ... resolved for the card the
// activity is about. An unknown token stays literal, as in actions, so it
// matches only text that literally contains it.
//
// Pure: server/rulesHelper.js finds the candidate triggers and builds the
// variables; this decides whether one of them matches.

const { substituteVars } = require('./ruleVarsSubstitute');

const TOKEN = /\{\w+(?::[^{}]+)?\}/;
// Tokens that name several people resolve to "alice, bob"; a trigger value
// that is one of them matches any one of those names.
const LIST_TOKENS = /^\{(?:creator|assignees|members)\}$/i;

function triggerValueHasVars(value) {
  return typeof value === 'string' && TOKEN.test(value);
}

// Does the trigger's value (with variables) match what the activity carries?
function triggerVarMatches(pattern, actual, vars) {
  if (!triggerValueHasVars(pattern)) return false;
  if (actual === undefined || actual === null || actual === '') return false;
  const resolved = substituteVars(pattern, vars);
  const value = String(actual);
  if (LIST_TOKENS.test(pattern.trim())) {
    return resolved.split(',').map(name => name.trim()).filter(Boolean).includes(value);
  }
  return resolved === value;
}

// Every matching field of a trigger document against the activity's values:
// a field with variables is resolved and compared; any other field keeps the
// ordinary rule (its value, '*', or unset matches). `plainMatches(field,
// triggerValue)` supplies that ordinary rule so cardTitle keeps its own.
function triggerMatchesWithVars(trigger, fields, actualValues, vars, plainMatches) {
  let usedVars = false;
  for (const field of fields) {
    const expected = trigger[field];
    if (triggerValueHasVars(expected)) {
      usedVars = true;
      if (!triggerVarMatches(expected, actualValues[field], vars)) return false;
    } else if (!plainMatches(field, expected)) {
      return false;
    }
  }
  return usedVars;
}

module.exports = { triggerValueHasVars, triggerVarMatches, triggerMatchesWithVars };
