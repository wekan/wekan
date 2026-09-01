import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { ReactiveCache } from '/imports/reactiveCache';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Users from '/models/users';
const {
  normalizeFocusBlock,
  normalizeCardSlot,
  cardIsPlannerRelevant,
} = require('/models/lib/plannerWork');
const {
  isAssignedOnlyMember,
} = require('/models/lib/boardCardScope');

async function visiblePlannerCard(userId, cardId) {
  const card = await Cards.findOneAsync({
    _id: cardId,
    archived: false,
    type: 'cardType-card',
  });
  const board = card ? await Boards.findOneAsync(card.boardId) : null;
  if (
    !card ||
    !board ||
    board.personalInboxOwnerId ||
    !board.isVisibleBy({ _id: userId }) ||
    !cardIsPlannerRelevant(card, userId) ||
    (isAssignedOnlyMember(board, userId) &&
      !(card.assignees || []).includes(userId))
  ) {
    return null;
  }
  return card;
}

Meteor.methods({
  async 'planner.addFocusBlock'(payload) {
    check(payload, Match.ObjectIncluding({}));
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const normalized = normalizeFocusBlock(payload);
    if (normalized.error) throw new Meteor.Error(normalized.error);
    const user = await Users.findOneAsync(this.userId, {
      fields: { 'profile.plannerFocusBlocks': 1 },
    });
    const existing = user?.profile?.plannerFocusBlocks || [];
    if (existing.length >= 200) throw new Meteor.Error('planner-focus-limit');
    const block = {
      _id: Random.id(),
      ...normalized.value,
      createdAt: new Date(),
    };
    await Users.direct.updateAsync(this.userId, {
      $push: { 'profile.plannerFocusBlocks': block },
    });
    return block;
  },

  async 'planner.removeFocusBlock'(blockId) {
    check(blockId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    await Users.direct.updateAsync(this.userId, {
      $pull: { 'profile.plannerFocusBlocks': { _id: blockId } },
    });
    return { blockId };
  },

  async 'planner.assignCardSlot'(cardId, startsAt, durationMinutes = 60) {
    check(cardId, String);
    check(startsAt, Date);
    check(durationMinutes, Match.Integer);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const card = await visiblePlannerCard(this.userId, cardId);
    if (!card) throw new Meteor.Error('not-authorized');
    const normalized = normalizeCardSlot(startsAt, durationMinutes);
    if (normalized.error) throw new Meteor.Error(normalized.error);
    const slot = {
      ...normalized.value,
      updatedAt: new Date(),
    };
    // The slot is personal planning metadata. It deliberately does not update
    // Cards.dueAt/startAt/endAt, so scheduling work cannot change its deadline.
    await Users.direct.updateAsync(this.userId, {
      $set: { [`profile.plannerCardSlots.${cardId}`]: slot },
    });
    return { cardId, slot, dueAt: card.dueAt || null };
  },

  async 'planner.clearCardSlot'(cardId) {
    check(cardId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const card = await visiblePlannerCard(this.userId, cardId);
    if (!card) throw new Meteor.Error('not-authorized');
    await Users.direct.updateAsync(this.userId, {
      $unset: { [`profile.plannerCardSlots.${cardId}`]: 1 },
    });
    return { cardId };
  },
});
