// #2026 / #1377: the all-boards activity feed (models/lib/activityFeed.js).
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Activities from '/models/activities';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import CardComments from '/models/cardComments';
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
    const boards = await visibleAllBoards(user, { title: 1, slug: 1, members: 1, labels: 1 });
    const boardIds = boards.map(b => b._id);
    const assignedOnlyBoardIds = boards.filter(b => isAssignedOnlyMember(b, this.userId)).map(b => b._id);
    const assignedCardIds = assignedOnlyBoardIds.length
      ? (await Cards.find({ boardId: { $in: assignedOnlyBoardIds }, $or: [{ assignees: this.userId }, { members: this.userId }] },
        { fields: { _id: 1 } }).fetchAsync()).map(c => c._id) : [];
    const selector = { boardId: { $in: boardIds } };
    if (options && options.before) selector.createdAt = { $lt: options.before };
    // What the sentence names (models/lib/activityFeed.js feedParams): ids
    // and a renamed thing's new title - never a field's value.
    const raw = await Activities.find(selector, { sort: { createdAt: -1 }, limit: limit * 3,
      fields: { activityType: 1, createdAt: 1, boardId: 1, cardId: 1, listId: 1, userId: 1, oldListId: 1, swimlaneId: 1,
        oldSwimlaneId: 1, checklistId: 1, checklistItemId: 1, commentId: 1, attachmentName: 1, labelId: 1, memberId: 1,
        assigneeId: 1, oldBoardId: 1, title: 1 } }).fetchAsync();
    const activities = visibleActivities(raw, { assignedOnlyBoardIds, assignedCardIds }).slice(0, limit);
    const ids = (...fields) => [...new Set(activities.flatMap(a => fields.map(field => a[field])).filter(id => typeof id === 'string' && id))];
    const byTitle = async (collection, fields, projection = { title: 1 }) => new Map((await collection.find(
      { _id: { $in: ids(...fields) } }, { fields: projection }).fetchAsync()).map(doc => [doc._id, doc]));
    const cards = await byTitle(Cards, ['cardId']);
    const lists = await byTitle(Lists, ['listId', 'oldListId']);
    const swimlanes = await byTitle(Swimlanes, ['swimlaneId', 'oldSwimlaneId']);
    const checklists = await byTitle(Checklists, ['checklistId']);
    const checklistItems = await byTitle(ChecklistItems, ['checklistItemId']);
    const comments = await byTitle(CardComments, ['commentId'], { text: 1 });
    const users = await byTitle(Meteor.users, ['userId', 'memberId', 'assigneeId'], { username: 1 });
    const byId = new Map(boards.map(b => [b._id, b]));
    return activities.map(a => feedEntry(a, { boards: byId, cards, lists, users, swimlanes, checklists, checklistItems,
      comments, viewerId: this.userId })).filter(Boolean);
  },
});

DDPRateLimiter.addRule({ type: 'method', name: 'allBoardsActivityFeed', connectionId: () => true }, 20, 10000);
