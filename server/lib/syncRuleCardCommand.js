'use strict';
// Durable rule card-field actions (maintainer decision of 2026-09-30: finish
// the Scrum/Sync handoff; durable adapters for rule actions). One saved command
// per rule invocation that changes ONE field of the rule's card, as the
// ordinary action would:
//
//   setColor                 color       ('white' is stored as null)
//   addLabel / removeLabel   labelIds    ($addToSet / $pull semantics)
//   removeAllLabels          labelIds    set to []
//   markCardComplete / -Incomplete  dueComplete
//   addMember / removeMember members    (the people are resolved at capture,
//                            as performAction resolves them, and saved)
//   setDate / updateDate / setDateRelative / removeDate
//                            the action's dateField (startAt, endAt, dueAt,
//                            receivedAt); setDate only fills an unset date,
//                            and "now" is the command's capture time
//
// The command saves the field's value before and after, and the effects the
// ordinary hooks would have written: one History row for the field, and for
// addLabel/removeLabel the addedLabel/removedLabel activity - only when the
// label really changed, as the ordinary hook does - and for a date the
// a-<field> activity the timing hook writes (no timeValue when unset). Replays apply the saved
// command, never the rule's current configuration.
//
// The card written is the command's `subject`: the rule's card, or for a
// linked card ('cardType-linkedCard') the card it links to, because the
// ordinary setters write through getRealId (models/cards.js). The History row
// and the activities are then the real card's, as the hooks would write them;
// the runner checks again on every replay that the link still points there.
// Pure: tested by tests/syncRuleCardCommand.test.cjs.
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const { prepareCardFieldHistory, RULE_CARD_FIELDS } = require('./syncHistoryBatch');
const { relativeDateOffset } = require('../../models/lib/relativeDateOffset');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = code => { throw new Error(`sync-rule-card-${code}`); };
const text = value => typeof value === 'string' && value.length > 0;

const RULE_CARD_ACTIONS = { setColor: 'color', addLabel: 'labelIds', removeLabel: 'labelIds', removeAllLabels: 'labelIds',
  markCardComplete: 'dueComplete', markCardIncomplete: 'dueComplete',
  setDate: 'date', updateDate: 'date', setDateRelative: 'date', removeDate: 'date',
  addMember: 'members', removeMember: 'members' };
const MEMBER_ACTIONS = ['addMember', 'removeMember'];
function validTargets(targets) {
  return Array.isArray(targets) && targets.length <= 1000 && targets.every(target => target &&
    Object.keys(target).sort().join(',') === 'userId,username' && text(target.userId) &&
    (target.username === null || typeof target.username === 'string'));
}
const DATE_FIELDS = ['startAt', 'endAt', 'dueAt', 'receivedAt'];
function fieldOf(action) {
  const field = RULE_CARD_ACTIONS[action?.actionType];
  if (field !== 'date') return field;
  if (!DATE_FIELDS.includes(action.dateField)) fail('invalid');
  return action.dateField;
}

const commandId = invocationId => sha256(canonical(['sync-rule-card', invocationId]));
const effectIdFor = id => sha256(canonical(['sync-rule-card-effect', id]));

function identity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  const invocation = plan.actions[index];
  const actionType = invocation?.action?.actionType;
  if (!Number.isSafeInteger(index) || index < 0 || !Object.hasOwn(RULE_CARD_ACTIONS, actionType)) fail('invalid');
  return { _id: commandId(invocation.id), version: 1, invocationId: invocation.id, planId: planId(effectId, activity._id),
    planHash: sha256(canonical(plan)), actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId,
    actionType, field: fieldOf(invocation.action) };
}

// The field after the action, from the field before it ({} when absent).
// `now` is the command's capture time, so a replay makes the same change.
function targetFields(action, before, field, now, targets = []) {
  const has = Object.hasOwn(before, field), value = before[field];
  switch (action.actionType) {
    // One $addToSet / $pull per person, in order; nothing to do leaves the field as it is.
    case 'addMember': {
      const members = Array.isArray(value) ? [...value] : [];
      for (const { userId } of targets) if (!members.includes(userId)) members.push(userId);
      return has || targets.length ? { members } : {};
    }
    case 'removeMember': {
      if (!has) return {};
      const removed = new Set(targets.map(target => target.userId));
      return { members: (Array.isArray(value) ? value : []).filter(id => !removed.has(id)) };
    }
    case 'setColor': return { color: action.selectedColor === 'white' ? null : (action.selectedColor ?? null) };
    case 'addLabel': {
      if (!text(action.labelId)) fail('invalid');
      const labels = Array.isArray(value) ? value : [];
      return { labelIds: labels.includes(action.labelId) ? labels : [...labels, action.labelId] };
    }
    case 'removeLabel': {
      if (!text(action.labelId)) fail('invalid');
      // $pull on a missing field leaves it missing.
      return has ? { labelIds: (Array.isArray(value) ? value : []).filter(id => id !== action.labelId) } : {};
    }
    case 'removeAllLabels': return { labelIds: [] };
    case 'markCardComplete': return { dueComplete: true };
    case 'markCardIncomplete': return { dueComplete: false };
    // Ordinary setDate only fills a date that is undefined (getStart() etc.).
    case 'setDate': return has && value !== undefined ? { [field]: value } : { [field]: new Date(now) };
    case 'updateDate': return { [field]: new Date(now) };
    case 'setDateRelative': return { [field]: relativeDateOffset(new Date(now), action.days, action.unit) };
    case 'removeDate': return {};
    default: return fail('invalid');
  }
}

function activitiesFor({ base, action, before, after, effectId, createdAt, username, cardTitle, targets = [] }) {
  const receipt = () => sha256(canonical([effectId, 'activity']));
  if (MEMBER_ACTIONS.includes(action.actionType)) {
    // What the members hook writes for each person who really joined or left.
    const had = new Set(before.members || []), rows = [], seen = new Set();
    for (const { userId, username: name } of targets) {
      if (seen.has(userId)) continue;
      seen.add(userId);
      const join = action.actionType === 'addMember';
      if (join === had.has(userId)) continue;
      const receiptId = sha256(canonical([effectId, 'activity', userId]));
      rows.push({ receiptId, activity: { _id: `sync-rule-card-${receiptId}`, userId: base.actorId, username: name,
        activityType: join ? 'joinMember' : 'unjoinMember', boardId: base.boardId, cardId: base.cardId, memberId: userId,
        listId: base.listId, swimlaneId: base.swimlaneId, createdAt, modifiedAt: createdAt } });
    }
    return rows;
  }
  if (DATE_FIELDS.includes(base.field)) {
    if (canonical(before) === canonical(after)) return [];
    const receiptId = receipt(), field = base.field;
    // What the timing hook in server/models/cards.js writes for this write.
    return [{ receiptId, activity: { _id: `sync-rule-card-${receiptId}`, userId: base.actorId, username,
      activityType: `a-${field}`, boardId: base.boardId, cardId: base.cardId, cardTitle, timeKey: field,
      ...(Object.hasOwn(after, field) ? { timeValue: after[field] } : {}), timeOldValue: before[field] || '',
      listId: base.listId, swimlaneId: base.swimlaneId, createdAt, modifiedAt: createdAt } }];
  }
  if (!['addLabel', 'removeLabel'].includes(action.actionType)) return [];
  const had = (before.labelIds || []).includes(action.labelId), has = (after.labelIds || []).includes(action.labelId);
  if (had === has) return [];
  const receiptId = receipt();
  return [{ receiptId, activity: { _id: `sync-rule-card-${receiptId}`, userId: base.actorId, labelId: action.labelId,
    activityType: has ? 'addedLabel' : 'removedLabel', boardId: base.boardId, cardId: base.cardId,
    listId: base.listId, swimlaneId: base.swimlaneId, createdAt, modifiedAt: createdAt } }];
}

// The card an ordinary setter writes for `card`: getRealId's.
function realCardId(card) {
  return card?.type === 'cardType-linkedCard' && text(card.linkedId) ? card.linkedId : card?._id;
}

// Capture from the card as it is now. `redoRows` are the actor's undone rows
// this change supersedes, as for any ordinary edit; `real` is the card a linked
// card links to (the rule's card itself otherwise).
// `cardBoardId` is the board the rule's card is on: the plan's, unless the
// runner verified a cross-board move of this same plan put it elsewhere
// (2026-10-03); the write and its records follow the card there.
function prepareRuleCardCommand({ plan, activity, effectId, index, card: ruleCard, real = ruleCard, createdAt, redoRows = [],
  username = '', targets = [], cardBoardId = plan?.boardId }) {
  const base = identity({ plan, activity, effectId, index });
  if (!ruleCard || ruleCard._id !== base.cardId || !text(cardBoardId) || ruleCard.boardId !== cardBoardId || !real ||
      real._id !== realCardId(ruleCard) || !text(real.boardId) || real.type === 'cardType-linkedCard') fail('card-invalid');
  const card = real;
  if (!text(card.listId) || !text(card.swimlaneId) ||
      !(createdAt instanceof Date) || !Number.isFinite(createdAt.getTime())) fail('card-invalid');
  const subject = { cardId: card._id, boardId: card.boardId };
  const action = plan.actions[index].action, field = base.field;
  const before = Object.hasOwn(card, field) ? { [field]: copy(card[field]) } : {};
  const members = MEMBER_ACTIONS.includes(action.actionType);
  if (typeof username !== 'string' || !validTargets(targets) || (!members && targets.length)) fail('invalid');
  const after = targetFields(action, before, field, createdAt, targets);
  const located = { ...base, listId: card.listId, swimlaneId: card.swimlaneId };
  const changeId = effectIdFor(base._id);
  const ids = { _id: subject.cardId, boardId: subject.boardId, listId: card.listId, swimlaneId: card.swimlaneId };
  const history = prepareCardFieldHistory({ before: { ...ids, ...before }, after: { ...ids, ...after },
    effectId: changeId, userId: base.actorId, createdAt, redoRows, fields: RULE_CARD_FIELDS });
  const command = { ...located, subject, ...(members ? { targets: copy(targets) } : {}), before, after,
    createdAt: new Date(createdAt),
    effects: { history, activities: activitiesFor({ base: { ...located, ...subject }, action, before, after,
      effectId: changeId, createdAt, username, cardTitle: card.title, targets }) } };
  command.checksum = sha256(canonical(command));
  return validateRuleCardCommand(command, { plan, activity, effectId, index });
}

function validateRuleCardCommand(row, context) {
  const base = identity(context);
  const members = MEMBER_ACTIONS.includes(base.actionType);
  const keys = [...Object.keys(base), 'listId', 'swimlaneId', 'subject', 'before', 'after', 'createdAt', 'effects', 'checksum',
    ...(members ? ['targets'] : [])].sort().join(',');
  if (!row || Object.keys(row).sort().join(',') !== keys ||
      Object.entries(base).some(([key, value]) => canonical(row[key]) !== canonical(value)) ||
      !text(row.listId) || !text(row.swimlaneId) || !(row.createdAt instanceof Date) || !row.subject ||
      Object.keys(row.subject).sort().join(',') !== 'boardId,cardId' || !text(row.subject.cardId) ||
      !text(row.subject.boardId) ||
      !row.before || !row.after || Object.keys(row.before).some(key => key !== base.field) ||
      Object.keys(row.after).some(key => key !== base.field) ||
      !row.effects || Object.keys(row.effects).sort().join(',') !== 'activities,history') fail('command-invalid');
  const { checksum, ...content } = row;
  if (checksum !== sha256(canonical(content))) fail('command-invalid');
  // The saved after-value is what this action makes of the saved before-value.
  const action = context.plan.actions[context.index].action;
  if ((members && !validTargets(row.targets)) ||
      canonical(targetFields(action, row.before, base.field, row.createdAt, row.targets)) !== canonical(row.after)) fail('command-invalid');
  return copy(row);
}

// Storage predicates: an absent field must stay absent, not match null.
function fieldSelector(command, fields) {
  const selector = { _id: command.subject.cardId, boardId: command.subject.boardId };
  if (Object.hasOwn(fields, command.field)) selector[command.field] = { $eq: fields[command.field] };
  else selector[command.field] = { $exists: false };
  return selector;
}

module.exports = { RULE_CARD_ACTIONS, DATE_FIELDS, MEMBER_ACTIONS, commandId, effectIdFor, realCardId, prepareRuleCardCommand,
  validateRuleCardCommand, fieldSelector };
