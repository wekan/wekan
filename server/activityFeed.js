// #2026 / #1377: the all-boards activity feed (models/lib/activityFeed.js).
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Activities from '/models/activities';
import Cards from '/models/cards';
import Lists from '/models/lists';
import { ReactiveCache } from '/imports/reactiveCache';
import { getFeatureFlags } from '/models/lib/featureFlags';
import { visibleAllBoards } from '/server/allBoardsFacets';

const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');
const { feedEntry, visibleActivities, cleanLimit } = require('/models/lib/activityFeed');

Meteor.methods({
  async allBoardsActivityFeed(options) {
    check(options, Match.Optional({ limit: Match.Optional(Number), before: Match.Optional(Date) }));
    if (!this.userId) throw new Meteor.Error('not-authorized');
    if (getFeatureFlags().disableActivities) return [];
    const setting = await ReactiveCache.getCurrentSetting();
    if (setting && setting.hideBoardActivitiesOnAllBoards) return [];
    const user = await ReactiveCache.getUser(this.userId);
    if (!user) return [];
    const limit = cleanLimit(options && options.limit);
    const boards = await visibleAllBoards(user, { title: 1, slug: 1, members: 1 });
    const boardIds = boards.map(b => b._id);
    const assignedOnlyBoardIds = boards.filter(b => isAssignedOnlyMember(b, this.userId)).map(b => b._id);
    const assignedCardIds = assignedOnlyBoardIds.length
      ? (await Cards.find({ boardId: { $in: assignedOnlyBoardIds }, $or: [{ assignees: this.userId }, { members: this.userId }] },
        { fields: { _id: 1 } }).fetchAsync()).map(c => c._id) : [];
    const selector = { boardId: { $in: boardIds } };
    if (options && options.before) selector.createdAt = { $lt: options.before };
    const raw = await Activities.find(selector, { sort: { createdAt: -1 }, limit: limit * 3,
      fields: { activityType: 1, createdAt: 1, boardId: 1, cardId: 1, listId: 1, userId: 1 } }).fetchAsync();
    const activities = visibleActivities(raw, { assignedOnlyBoardIds, assignedCardIds }).slice(0, limit);
    const cards = new Map((await Cards.find({ _id: { $in: activities.map(a => a.cardId).filter(Boolean) } },
      { fields: { title: 1 } }).fetchAsync()).map(c => [c._id, c]));
    const lists = new Map((await Lists.find({ _id: { $in: activities.map(a => a.listId).filter(Boolean) } },
      { fields: { title: 1 } }).fetchAsync()).map(l => [l._id, l]));
    const users = new Map((await Meteor.users.find({ _id: { $in: activities.map(a => a.userId).filter(Boolean) } },
      { fields: { username: 1 } }).fetchAsync()).map(u => [u._id, u]));
    const byId = new Map(boards.map(b => [b._id, b]));
    return activities.map(a => feedEntry(a, { boards: byId, cards, lists, users })).filter(Boolean);
  },
});

DDPRateLimiter.addRule({ type: 'method', name: 'allBoardsActivityFeed', connectionId: () => true }, 20, 10000);
