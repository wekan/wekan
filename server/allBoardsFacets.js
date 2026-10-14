// #4791: All Boards facets - first characters, organizations, teams and the
// member's own board labels, each with its count (models/lib/allBoardsFacets.js).
// Counted over the boards the member sees in All Boards: the same visibility
// selector as getAllBoardsPage, never more.
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Boards from '/models/boards';
import Org from '/models/org';
import Team from '/models/team';
import { ReactiveCache } from '/imports/reactiveCache';

const { boardVisibilitySelectors } = require('/models/lib/boardVisibilitySelectors');
const { notHelperBoardTitle } = require('/models/lib/helperBoards');
const { boardFacets, cleanLabel, applyBoardLabel } = require('/models/lib/allBoardsFacets');

export async function visibleAllBoards(user, fields) {
  const clauses = boardVisibilitySelectors({ userId: user._id, orgIds: user.orgIds(), teamIds: user.teamIds(),
    emailDomains: user.emailDomains(), includePublic: false });
  const hidden = (user.profile && Array.isArray(user.profile.hiddenBoards)) ? user.profile.hiddenBoards : [];
  return Boards.find({ archived: false, type: 'board', title: notHelperBoardTitle(),
    ...(hidden.length ? { _id: { $nin: hidden } } : {}),
    ...(clauses.length === 1 ? clauses[0] : { $or: clauses }) }, { fields }).fetchAsync();
}

Meteor.methods({
  async allBoardsFacets() {
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const user = await ReactiveCache.getUser(this.userId);
    if (!user) throw new Meteor.Error('not-authorized');
    const boards = await visibleAllBoards(user, { title: 1, orgs: 1, teams: 1 });
    const orgIds = [...new Set(boards.flatMap(b => (b.orgs || []).map(o => o && o.orgId)).filter(Boolean))];
    const teamIds = [...new Set(boards.flatMap(b => (b.teams || []).map(t => t && t.teamId)).filter(Boolean))];
    const orgNames = Object.fromEntries((await Org.find({ _id: { $in: orgIds } }, { fields: { orgDisplayName: 1 } }).fetchAsync())
      .map(o => [o._id, o.orgDisplayName]));
    const teamNames = Object.fromEntries((await Team.find({ _id: { $in: teamIds } }, { fields: { teamDisplayName: 1 } }).fetchAsync())
      .map(t => [t._id, t.teamDisplayName]));
    return boardFacets(boards, { orgNames, teamNames, boardLabels: (user.profile || {}).boardLabels });
  },

  // File every visible board whose name includes `text` under `label`.
  async applyBoardLabel(label, text) {
    check(label, String);
    check(text, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const user = await ReactiveCache.getUser(this.userId);
    if (!cleanLabel(label) || !text.trim()) throw new Meteor.Error('board-label-invalid');
    const boards = await visibleAllBoards(user, { title: 1 });
    const { labels, added } = applyBoardLabel((user.profile || {}).boardLabels, label, boards, text);
    await Meteor.users.updateAsync(this.userId, { $set: { 'profile.boardLabels': labels } });
    return { added };
  },

  async removeBoardLabel(label) {
    check(label, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const user = await ReactiveCache.getUser(this.userId);
    const labels = { ...((user && user.profile && user.profile.boardLabels) || {}) };
    delete labels[label];
    await Meteor.users.updateAsync(this.userId, { $set: { 'profile.boardLabels': labels } });
    return true;
  },
});

for (const name of ['allBoardsFacets', 'applyBoardLabel', 'removeBoardLabel']) {
  DDPRateLimiter.addRule({ type: 'method', name, connectionId: () => true }, 20, 10000);
}
