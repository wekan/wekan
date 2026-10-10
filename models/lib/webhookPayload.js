'use strict';
// #3695: what an outgoing webhook (Rocket.Chat, Slack, Discord, ...) carries.
//
// A receiver that builds its own message - a Rocket.Chat incoming-webhook
// script, for one - wants the activity's data as properties, and may want as
// little text as possible. Each webhook can choose (models/lib/
// notificationDelivery.js resolves the choice across the webhook, its board,
// the Admin Panel and the built-in default):
//
//   text    - send the translated human sentence (`text`) or not;
//   fields  - which GROUPS of structured properties to send (catalog below).
//
// `standard` is the attribute list WEBHOOKS_ATTRIBUTES (snap:
// webhooks-attributes) selects, or the built-in list in
// server/notifications/outgoing.js when it is not set - it keeps working
// exactly as before. The other groups ADD to it, or replace it when
// `standard` is not ticked. Built in: text on, fields ['standard'] - the
// payload WeKan sent before these settings existed.
//
// Member Settings -> Notifications has the member-level control for webhooks:
// a member can ask that webhooks leave THEIR identity out (as the actor, or as
// the person a join/assignment is about). It only narrows; no board or admin
// setting overrides it. See hideIdentityFields().
//
// Two-way (bidirectional) webhooks keep sending the complete activity
// parameters: their response protocol depends on them. Only the member's
// identity choice applies to them.
//
// Pure (no Meteor/Mongo imports).

const STANDARD = 'standard';

// Every structured property a group can add, by payload name. The value is
// read from the activity parameters under the same name, except where
// PARAM_SOURCE says otherwise. Nothing outside this catalog (and the
// standard list) is ever sent by a group: no e-mail addresses, watchers,
// tokens or other secrets.
const WEBHOOK_PAYLOAD_GROUPS = Object.freeze({
  [STANDARD]: Object.freeze([]),
  ids: Object.freeze([
    'activityId', 'boardId', 'oldBoardId', 'swimlaneId', 'oldSwimlaneId',
    'listId', 'oldListId', 'cardId', 'commentId', 'checklistId',
    'checklistItemId', 'labelId', 'attachmentId', 'customFieldId',
  ]),
  names: Object.freeze([
    'board', 'oldBoard', 'swimlane', 'oldSwimlane', 'list', 'oldList', 'card',
    'checklist', 'checklistItem', 'label', 'attachment', 'customField',
  ]),
  links: Object.freeze(['url', 'cardUrl', 'boardUrl']),
  actor: Object.freeze(['user', 'username', 'userId']),
  people: Object.freeze([
    'member', 'memberUsername', 'memberId',
    'assignee', 'assigneeUsername', 'assigneeId',
  ]),
  details: Object.freeze([
    'comment', 'cardDescription', 'customFieldValue', 'value', 'oldValue',
    'timeKey', 'timeValue', 'timeOldValue',
  ]),
});
const GROUP_KEYS = Object.freeze(Object.keys(WEBHOOK_PAYLOAD_GROUPS));

// `description` is the event name (act-joinMember...) in every payload, so the
// card's own description travels as `cardDescription`.
const PARAM_SOURCE = Object.freeze({ cardDescription: 'description' });

// Values that would reveal a custom field marked admin-only (#3141) - a chat
// room is read by people who are not the board's admins.
const ADMIN_ONLY_VALUE_KEYS = Object.freeze(['customFieldValue', 'value', 'oldValue']);

// Identity fields per person, for the member's own "leave me out" choice.
const IDENTITY_FIELDS = Object.freeze({
  userId: Object.freeze(['user', 'username', 'userId', 'userEmails']),
  memberId: Object.freeze(['member', 'memberUsername', 'memberId']),
  assigneeId: Object.freeze(['assignee', 'assigneeUsername', 'assigneeId']),
});

const BUILT_IN = Object.freeze({ text: true, fields: Object.freeze([STANDARD]) });

class WebhookPayloadSettingsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WebhookPayloadSettingsError';
    this.error = 'invalid-webhook-payload-settings';
  }
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype;
}

// The member-level choice: does this member want webhooks to leave their
// identity out? Only an explicit `true` hides.
function memberHidesIdentity(user) {
  return !!(user && user.profile && user.profile.webhookHideIdentity === true);
}

function normalizeMemberWebhookSettings(input) {
  if (!isPlainObject(input)) throw new WebhookPayloadSettingsError('settings must be an object');
  for (const key of Object.keys(input)) {
    if (key !== 'hideIdentity') throw new WebhookPayloadSettingsError(`unknown setting ${String(key).slice(0, 40)}`);
  }
  const value = input.hideIdentity;
  if (value !== true && value !== false && value !== null && value !== undefined) {
    throw new WebhookPayloadSettingsError('hideIdentity must be true, false or null');
  }
  return { hideIdentity: value === true };
}

// Remove the identity of every person in `hiddenUserIds` from a payload
// object (in place), and return it.
function hideIdentityFields(payload, params, hiddenUserIds) {
  const hidden = new Set(hiddenUserIds || []);
  if (!hidden.size || !params) return payload;
  for (const [idKey, fields] of Object.entries(IDENTITY_FIELDS)) {
    if (params[idKey] && hidden.has(params[idKey])) {
      for (const field of fields) delete payload[field];
    }
  }
  return payload;
}

// Build the one-way webhook body.
//   description     the event name (act-...), always sent
//   params          the activity parameters (server/models/activities.js)
//   text            the rendered human sentence
//   settings        resolveWebhookPayloadSettings() result
//   legacyAttributes the `standard` list (WEBHOOKS_ATTRIBUTES or built-in)
//   hiddenUserIds   members who asked to be left out
function buildWebhookBody({ description, params = {}, text, settings = BUILT_IN,
  legacyAttributes = [], hiddenUserIds = [] }) {
  const value = {};
  if (settings.text !== false && typeof text === 'string') value.text = text;
  const fields = Array.isArray(settings.fields) ? settings.fields : BUILT_IN.fields;
  if (fields.includes(STANDARD)) {
    for (const key of legacyAttributes) {
      if (params[key] !== undefined) value[key] = params[key];
    }
  }
  for (const group of GROUP_KEYS) {
    if (group === STANDARD || !fields.includes(group)) continue;
    for (const key of WEBHOOK_PAYLOAD_GROUPS[group]) {
      const source = PARAM_SOURCE[key] || key;
      if (params[source] !== undefined) value[key] = params[source];
    }
  }
  if (params.customFieldAdminOnly === true) {
    for (const key of ADMIN_ONLY_VALUE_KEYS) delete value[key];
  }
  // The flag itself is internal, never a payload property.
  delete value.customFieldAdminOnly;
  hideIdentityFields(value, params, hiddenUserIds);
  value.description = description;
  // #4912: the consolidated edit event always says which field changed.
  if (description === 'act-editCard' && typeof params.field === 'string') value.field = params.field;
  return value;
}

// #3695: several queued webhook bodies in one POST (grouping, or a batch from
// a schedule). One body is sent unchanged, so a batch of one is exactly the
// payload an immediate delivery sends. Several become
//   { text?, description: 'act-batch', count, items: [ ...bodies ] }
// with `text` the items' texts, one per line, when the items carry text.
function combineWebhookBodies(bodies) {
  if (!Array.isArray(bodies) || bodies.length === 0) throw new Error('webhook-batch-empty');
  if (bodies.length === 1) return bodies[0];
  const texts = bodies.map(body => body && body.text).filter(text => typeof text === 'string' && text);
  return {
    ...(texts.length ? { text: texts.join('\n\n') } : {}),
    description: 'act-batch',
    count: bodies.length,
    items: bodies,
  };
}

module.exports = {
  STANDARD,
  GROUP_KEYS,
  WEBHOOK_PAYLOAD_GROUPS,
  IDENTITY_FIELDS,
  ADMIN_ONLY_VALUE_KEYS,
  BUILT_IN,
  WebhookPayloadSettingsError,
  normalizeMemberWebhookSettings,
  memberHidesIdentity,
  hideIdentityFields,
  buildWebhookBody,
  combineWebhookBodies,
};
