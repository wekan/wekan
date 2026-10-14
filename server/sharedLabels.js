import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import SharedLabels from '/models/sharedLabels';
import { LABEL_COLORS } from '/models/metadata/colors';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';

// Shared labels (#2761, #4698), the server half: who sees which catalog, the
// site admin's edits (which reach every board copy), and using one on a board.
const { availableOn, boardCopyOf, cleanSharedLabel } = require('/models/lib/sharedLabels');

const isHexColor = v => /^#[0-9a-fA-F]{6}$/.test(v);
const isAllowedColor = v => LABEL_COLORS.includes(v) || isHexColor(v);

// A user sees the instance catalog and those of their own organizations and
// teams - never another organization's label names (tenant isolation).
Meteor.publish('sharedLabels', async function () {
  if (!this.userId) return this.ready();
  const user = await Meteor.users.findOneAsync(this.userId, { fields: { isAdmin: 1, orgs: 1, teams: 1 } });
  if (!user) return this.ready();
  if (user.isAdmin) return SharedLabels.find();
  const orgIds = (user.orgs || []).map(o => o && o.orgId).filter(Boolean);
  const teamIds = (user.teams || []).map(t => t && t.teamId).filter(Boolean);
  return SharedLabels.find({ $or: [
    { scope: 'instance' },
    { scope: 'org', scopeId: { $in: orgIds } },
    { scope: 'team', scopeId: { $in: teamIds } },
  ] });
});

async function requireSiteAdmin(userId) {
  const user = userId && (await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1 } }));
  if (!user || !user.isAdmin) throw new Meteor.Error('not-authorized');
}

// Every board copy of a shared label follows its name and colour.
async function updateCopies(labelId, name, color) {
  const boards = await Boards.find({ 'labels.sharedLabelId': labelId }, { fields: { labels: 1 } }).fetchAsync();
  for (const board of boards) {
    const $set = {};
    board.labels.forEach((l, i) => {
      if (l && l.sharedLabelId === labelId) {
        $set[`labels.${i}.name`] = name;
        $set[`labels.${i}.color`] = color;
      }
    });
    if (Object.keys($set).length) await Boards.direct.updateAsync(board._id, { $set });
  }
}

Meteor.methods({
  async 'sharedLabels.save'(labelId, input) {
    check(labelId, Match.OneOf(String, null));
    check(input, Object);
    await requireSiteAdmin(this.userId);
    let clean;
    try {
      clean = cleanSharedLabel(input, isAllowedColor);
    } catch (error) {
      throw new Meteor.Error(error.message);
    }
    if (labelId) {
      if (!(await SharedLabels.findOneAsync(labelId))) throw new Meteor.Error('not-found');
      await SharedLabels.updateAsync(labelId, { $set: clean });
      await updateCopies(labelId, clean.name, clean.color);
      return labelId;
    }
    return SharedLabels.insertAsync({ ...clean, sort: await SharedLabels.find().countAsync() });
  },

  async 'sharedLabels.remove'(labelId) {
    check(labelId, String);
    await requireSiteAdmin(this.userId);
    // The copies stay, as the boards' own labels.
    const boards = await Boards.find({ 'labels.sharedLabelId': labelId }, { fields: { labels: 1 } }).fetchAsync();
    for (const board of boards) {
      const $unset = {};
      board.labels.forEach((l, i) => { if (l && l.sharedLabelId === labelId) $unset[`labels.${i}.sharedLabelId`] = ''; });
      if (Object.keys($unset).length) await Boards.direct.updateAsync(board._id, { $unset });
    }
    await SharedLabels.removeAsync(labelId);
    return true;
  },

  // Use a shared label on a board: its copy is added once, and the copy's id
  // is returned so the caller can put it on a card.
  async 'boards.useSharedLabel'(boardId, labelId) {
    check(boardId, String);
    check(labelId, String);
    const board = await Boards.findOneAsync(boardId);
    if (!board || !allowIsBoardMemberWithWriteAccess(this.userId, board)) throw new Meteor.Error('not-authorized');
    const label = await SharedLabels.findOneAsync(labelId);
    if (!label || !availableOn(label, board)) throw new Meteor.Error('not-found');
    const existing = (board.labels || []).find(l => l && l.sharedLabelId === labelId);
    if (existing) return existing._id;
    const copy = boardCopyOf(label, Random.id(6));
    await Boards.updateAsync({ _id: boardId, 'labels.sharedLabelId': { $ne: labelId } }, { $push: { labels: copy } });
    const after = await Boards.findOneAsync(boardId, { fields: { labels: 1 } });
    return (after.labels || []).find(l => l && l.sharedLabelId === labelId)._id;
  },
});

export { updateCopies };
