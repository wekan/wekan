'use strict';

// Rule suggestions from what people keep doing by hand
// (docs/Features/Rules/Rule-Suggestions.md). Trello's Butler calls these
// automation suggestions; they are a count.
//
// When the same person does one thing to a card and then, within WINDOW_MS,
// another thing to the same card, that pair is counted once per card. A pair
// counted on MIN_CARDS cards or more is a suggestion, unless a rule of the
// board already does it. Each suggestion carries the trigger and the action
// documents the Rules wizard itself would build (client/components/rules/),
// so creating one goes through rules.createRule like any other rule.
//
// Pure, no Meteor. Tests: tests/ruleSuggestions.test.cjs.

const WINDOW_MS = 2 * 60 * 1000;
const MIN_CARDS = 3;
const LIMIT = 5;
const DAYS = 30;

// What can start a pair, and what can follow it.
function triggerOf(activity) {
  if (activity.activityType === 'moveCard' && activity.listId) return { kind: 'moved', listId: activity.listId };
  if (activity.activityType === 'createCard' && activity.listId) return { kind: 'created', listId: activity.listId };
  if (activity.activityType === 'addedLabel' && activity.labelId) return { kind: 'label', labelId: activity.labelId };
  return null;
}

function actionOf(activity) {
  if (activity.activityType === 'addedLabel' && activity.labelId) return { kind: 'addLabel', labelId: activity.labelId };
  if (activity.activityType === 'joinMember' && activity.memberId) return { kind: 'addMember', memberId: activity.memberId };
  if (activity.activityType === 'archivedCard') return { kind: 'archive' };
  return null;
}

const ALLOWED = {
  moved: ['addLabel', 'addMember', 'archive'],
  created: ['addLabel', 'addMember'],
  label: ['addMember'],
};

const time = activity => new Date(activity.createdAt).getTime();

// The pairs in a board's activities: Map key -> { trigger, action, cards:Set }.
function countPairs(activities, windowMs = WINDOW_MS) {
  const byCardAndUser = new Map();
  for (const activity of activities || []) {
    if (!activity || !activity.cardId || !activity.userId || Number.isNaN(time(activity))) continue;
    const key = `${activity.cardId}\u0000${activity.userId}`;
    if (!byCardAndUser.has(key)) byCardAndUser.set(key, []);
    byCardAndUser.get(key).push(activity);
  }
  const pairs = new Map();
  for (const list of byCardAndUser.values()) {
    list.sort((a, b) => time(a) - time(b));
    for (let i = 0; i < list.length; i += 1) {
      const trigger = triggerOf(list[i]);
      if (!trigger) continue;
      for (let j = i + 1; j < list.length && time(list[j]) - time(list[i]) <= windowMs; j += 1) {
        const action = actionOf(list[j]);
        if (!action || !ALLOWED[trigger.kind].includes(action.kind)) continue;
        // "Label X added, then label X added" is the same click twice.
        if (trigger.kind === 'label' && action.kind === 'addLabel') continue;
        const key = JSON.stringify([trigger, action]);
        if (!pairs.has(key)) pairs.set(key, { key, trigger, action, cards: new Set() });
        pairs.get(key).cards.add(list[i].cardId);
      }
    }
  }
  return pairs;
}

// The trigger and action documents, as the Rules wizard stores them, or null
// when a list, label or member is gone.
function ruleDocs(pair, board) {
  const { lists = {}, labels = {}, usernames = {}, boardId } = board;
  let trigger;
  if (pair.trigger.kind === 'moved') {
    const listName = lists[pair.trigger.listId];
    if (!listName) return null;
    trigger = { activityType: 'moveCard', boardId, listName, cardTitle: '*', swimlaneName: '*', oldListName: '*' };
  } else if (pair.trigger.kind === 'created') {
    const listName = lists[pair.trigger.listId];
    if (!listName) return null;
    trigger = { activityType: 'createCard', boardId, listName, cardTitle: '*', swimlaneName: '*' };
  } else {
    if (!labels[pair.trigger.labelId]) return null;
    trigger = { activityType: 'addedLabel', boardId, labelId: pair.trigger.labelId };
  }
  let action;
  if (pair.action.kind === 'addLabel') {
    if (!labels[pair.action.labelId]) return null;
    action = { actionType: 'addLabel', boardId, labelId: pair.action.labelId };
  } else if (pair.action.kind === 'addMember') {
    const username = usernames[pair.action.memberId];
    if (!username) return null;
    action = { actionType: 'addMember', boardId, username };
  } else {
    action = { actionType: 'archive', boardId };
  }
  return { trigger, action };
}

// Does a rule of the board already do this? A trigger with '*' for the list
// or label covers every list or label.
function sameOrAny(stored, wanted) {
  return stored === '*' || stored === wanted;
}

function alreadyARule(docs, existing) {
  return (existing || []).some(({ trigger, action }) => {
    if (!trigger || !action) return false;
    if (trigger.activityType !== docs.trigger.activityType) return false;
    if (docs.trigger.listName && !sameOrAny(trigger.listName, docs.trigger.listName)) return false;
    if (docs.trigger.labelId && !sameOrAny(trigger.labelId, docs.trigger.labelId)) return false;
    if (action.actionType !== docs.action.actionType) return false;
    if (docs.action.labelId && action.labelId !== docs.action.labelId) return false;
    if (docs.action.username && action.username !== docs.action.username) return false;
    return true;
  });
}

// board: { boardId, lists: {id: title}, labels: {id: name or color},
//          usernames: {id: username} }; existing: [{ trigger, action }];
// dismissed: [key]. Returns the suggestions, most cards first.
function ruleSuggestions(activities, board, { existing = [], dismissed = [], minCards = MIN_CARDS, limit = LIMIT, windowMs = WINDOW_MS } = {}) {
  const out = [];
  for (const pair of countPairs(activities, windowMs).values()) {
    if (pair.cards.size < minCards || dismissed.includes(pair.key)) continue;
    const docs = ruleDocs(pair, board);
    if (!docs || alreadyARule(docs, existing)) continue;
    out.push({
      key: pair.key,
      count: pair.cards.size,
      trigger: docs.trigger,
      action: docs.action,
      // For the sentence: which list, label or member, by name.
      triggerKind: pair.trigger.kind,
      actionKind: pair.action.kind,
      triggerName: pair.trigger.listId ? board.lists[pair.trigger.listId] : board.labels[pair.trigger.labelId],
      actionName: pair.action.labelId ? board.labels[pair.action.labelId]
        : pair.action.memberId ? board.usernames[pair.action.memberId] : '',
    });
  }
  out.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  return out.slice(0, limit);
}

// A dismissed key as stored: the same string ruleSuggestions() returns, and
// nothing longer than a pair of small objects can be.
function isSuggestionKey(key) {
  if (typeof key !== 'string' || key.length > 300) return false;
  try {
    const value = JSON.parse(key);
    return Array.isArray(value) && value.length === 2 && !!ALLOWED[value[0] && value[0].kind];
  } catch (e) {
    return false;
  }
}

module.exports = { WINDOW_MS, MIN_CARDS, LIMIT, DAYS, countPairs, ruleDocs, alreadyARule, ruleSuggestions, isSuggestionKey };
