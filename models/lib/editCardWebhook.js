'use strict';
// #4912: the consolidated `act-editCard` webhook event.
//
// Card text edits already reach webhooks as one event per field
// (`act-a-changedTitle`, `act-a-changedDescription`). `act-editCard` is an
// OPT-IN alternative to those, decided on 2026-10-02: a webhook receives it
// only when its own activity list names `act-editCard` explicitly. A webhook
// subscribed to `all` or to the per-field events keeps receiving exactly what
// it received before, and every webhook still gets ONE delivery per activity,
// so a receiver never sees the same edit twice.
const EDIT_CARD_EVENT = 'act-editCard';
// Which per-field events count as an edit of the card, and the field each one
// reports in the `field` parameter.
const EDIT_CARD_FIELDS = Object.freeze({
  'act-a-changedTitle': 'title',
  'act-a-changedDescription': 'description',
});

function isEditCardSource(description) {
  return Object.hasOwn(EDIT_CARD_FIELDS, description);
}

// The activity names to select webhooks by for one activity description.
function webhookActivitySelection(description) {
  return isEditCardSource(description) ? [description, 'all', EDIT_CARD_EVENT] : [description, 'all'];
}

// The event one webhook receives for one activity. A webhook that also names
// the per-field event or `all` asked for that event, so it keeps it.
function webhookDescriptionFor(integration, description) {
  const activities = Array.isArray(integration?.activities) ? integration.activities : [];
  if (!isEditCardSource(description) || !activities.includes(EDIT_CARD_EVENT) ||
      activities.includes(description) || activities.includes('all')) return description;
  return EDIT_CARD_EVENT;
}

function webhookParamsFor(params, description, deliveredDescription) {
  if (deliveredDescription !== EDIT_CARD_EVENT) return params;
  return { ...params, field: EDIT_CARD_FIELDS[description] };
}

module.exports = {
  EDIT_CARD_EVENT,
  EDIT_CARD_FIELDS,
  isEditCardSource,
  webhookActivitySelection,
  webhookDescriptionFor,
  webhookParamsFor,
};
