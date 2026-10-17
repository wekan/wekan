import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Activities from '/models/activities';
import Lists from '/models/lists';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import Users from '/models/users';
import { ReactiveCache } from '/imports/reactiveCache';
import { featureOnFor } from '/server/lib/assistGate';

// Rule suggestions (docs/Features/Rules/Rule-Suggestions.md): the counting is
// models/lib/ruleSuggestions.js; this reads the board's last 30 days for a
// board admin - the only one who may create rules - and remembers what each
// admin dismissed. Creating a suggestion is rules.createRule, unchanged.
const { ruleSuggestions, isSuggestionKey, DAYS } = require('/models/lib/ruleSuggestions');

const TYPES = ['moveCard', 'createCard', 'addedLabel', 'joinMember', 'archivedCard'];
const MAX_ACTIVITIES = 20000;
const ID = /^[A-Za-z0-9_-]{1,64}$/;

async function adminBoard(userId, boardId) {
  if (!userId || !ID.test(boardId)) return null;
  if (!(await featureOnFor(userId, 'rule-suggestions'))) return null;
  const board = await ReactiveCache.getBoard(boardId);
  return board && board.hasAdmin(userId) ? board : null;
}

Meteor.methods({
  async 'rules.suggestions'(boardId) {
    check(boardId, String);
    const board = await adminBoard(this.userId, boardId);
    if (!board) return [];
    const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
    const activities = await Activities.find(
      { boardId, activityType: { $in: TYPES }, createdAt: { $gte: since } },
      { fields: { activityType: 1, cardId: 1, userId: 1, listId: 1, labelId: 1, memberId: 1, createdAt: 1 },
        sort: { createdAt: -1 }, limit: MAX_ACTIVITIES },
    ).fetchAsync();

    const lists = {};
    for (const list of await Lists.find({ boardId, archived: false }, { fields: { title: 1 } }).fetchAsync()) {
      lists[list._id] = list.title;
    }
    const labels = {};
    for (const label of board.labels || []) labels[label._id] = label.name || label.color;
    // Only active members can be added by a rule.
    const memberIds = (board.members || []).filter(m => m.isActive !== false).map(m => m.userId);
    const usernames = {};
    for (const user of await Users.find({ _id: { $in: memberIds } }, { fields: { username: 1 } }).fetchAsync()) {
      usernames[user._id] = user.username;
    }

    const rules = await Rules.find({ boardId }, { fields: { triggerId: 1, actionId: 1 } }).fetchAsync();
    const triggers = new Map((await Triggers.find({ _id: { $in: rules.map(r => r.triggerId) } }).fetchAsync()).map(t => [t._id, t]));
    const actions = new Map((await Actions.find({ _id: { $in: rules.map(r => r.actionId) } }).fetchAsync()).map(a => [a._id, a]));
    const existing = rules.map(r => ({ trigger: triggers.get(r.triggerId), action: actions.get(r.actionId) }));

    const user = await ReactiveCache.getUser(this.userId);
    const dismissed = ((user && user.profile && user.profile.dismissedRuleSuggestions) || {})[boardId] || [];
    return ruleSuggestions(activities, { boardId, lists, labels, usernames }, { existing, dismissed });
  },

  async 'rules.dismissSuggestion'(boardId, key) {
    check(boardId, String);
    check(key, String);
    if (!isSuggestionKey(key)) throw new Meteor.Error('invalid', 'Not a suggestion');
    const board = await adminBoard(this.userId, boardId);
    if (!board) throw new Meteor.Error('not-authorized', 'Must be a board admin');
    await Users.updateAsync(this.userId, { $addToSet: { [`profile.dismissedRuleSuggestions.${boardId}`]: key } });
    return true;
  },
});

DDPRateLimiter.addRule({ type: 'method', name: 'rules.suggestions', connectionId: () => true }, 10, 10000);
DDPRateLimiter.addRule({ type: 'method', name: 'rules.dismissSuggestion', connectionId: () => true }, 20, 10000);
