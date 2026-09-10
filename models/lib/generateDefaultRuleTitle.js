// Pure, unit-testable helper: compose a sensible default title for a rule
// from its trigger and action human-readable descriptions (the same
// description strings already shown in the "View rule" details page — see
// Triggers.description()/Actions.description() in models/triggers.js and
// models/actions.js). No DOM, no Mongo, no Meteor globals — safe to call
// from a schema autoValue (client and server) or straight from a test.
//
// #4294: rules had no default title, and leaving the title field empty
// produced a silent no-op instead of a usable rule.
function lowerFirst(value) {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

function generateDefaultRuleTitle(triggerDesc, actionDesc) {
  const trigger = (triggerDesc || '').trim();
  const action = (actionDesc || '').trim();
  if (trigger && action) {
    return `When ${lowerFirst(trigger)}, then ${lowerFirst(action)}`;
  }
  if (trigger) {
    return `When ${lowerFirst(trigger)}`;
  }
  if (action) {
    return `Then ${lowerFirst(action)}`;
  }
  return 'Rule';
}

module.exports = { generateDefaultRuleTitle };
module.exports.default = generateDefaultRuleTitle;
