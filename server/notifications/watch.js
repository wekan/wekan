import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import { getFeatureFlags } from '/models/lib/featureFlags';
import Boards from '/models/boards';
const { boardVisibilitySelectors } = require('/models/lib/boardVisibilitySelectors');

// True when this user may see this board: public, a member, or an ACTIVE
// organisation / team / email-domain share. Built from the same selectors the
// board publication uses, so the two cannot drift apart.
async function canSeeBoard(userId, board) {
  if (!board) return false;
  if (board.permission === 'public') return true;
  if (!userId) return false;
  if (typeof board.hasMember === 'function' && board.hasMember(userId)) return true;

  const user = await ReactiveCache.getUser(userId);
  if (!user) return false;
  const listOf = value => (typeof value === 'string' && value.length ? value.split(',') : []);
  const orgIds = typeof user.orgIdsUserBelongs === 'function' ? listOf(user.orgIdsUserBelongs()) : [];
  const teamIds = typeof user.teamIdsUserBelongs === 'function' ? listOf(user.teamIdsUserBelongs()) : [];
  const emailDomains = typeof user.emailDomains === 'function' ? user.emailDomains() : [];

  const visible = await Boards.findOneAsync({
    _id: board._id,
    $or: boardVisibilitySelectors({ userId, orgIds, teamIds, emailDomains, includePublic: true }),
  }, { fields: { _id: 1 } });
  return Boolean(visible);
}

Meteor.methods({
  async watch(watchableType, id, level) {
    check(watchableType, String);
    check(id, String);
    check(level, Match.OneOf(String, null));

    // Admin Panel / Features / Notifications (#5820): the watch feature is
    // disabled, so ignore any request to change a watch level.
    if (getFeatureFlags().disableWatch) {
      throw new Meteor.Error('error-watch-disabled');
    }

    const userId = this.userId;

    let watchableObj = null;
    let board = null;
    if (watchableType === 'board') {
      watchableObj = await ReactiveCache.getBoard(id);
      if (!watchableObj) throw new Meteor.Error('error-board-doesNotExist');
      board = watchableObj;
    } else if (watchableType === 'list') {
      watchableObj = await ReactiveCache.getList(id);
      if (!watchableObj) throw new Meteor.Error('error-list-doesNotExist');
      board = await watchableObj.board();
    } else if (watchableType === 'card') {
      watchableObj = await ReactiveCache.getCard(id);
      if (!watchableObj) throw new Meteor.Error('error-card-doesNotExist');
      board = await watchableObj.board();
    } else {
      throw new Meteor.Error('error-json-schema');
    }

    // MAY THIS USER SEE THE BOARD - which is not the same question as "is this
    // user in board.members", and answering the second one is the bug behind
    // "Silent does not respond. If we try to change it does not change. Nothing
    // happens."
    //
    // A board is shared with people four ways: membership, an organisation, a
    // team, and (since #5850) an email domain. Only the first puts anybody in
    // `members`. Everyone reaching a board through one of the other three could
    // open it, see the watch button, choose a level - and have this line throw
    // error-board-notAMember, which the popup swallowed (see
    // client/components/boards/boardHeader.js). Nothing changed and nothing was
    // said, which is exactly how it was reported.
    //
    // The publications answer the same question with one shared builder
    // (models/lib/boardVisibilitySelectors), and so does this: ask the database
    // whether this board is among the ones this user may see. It is the same
    // rule, so a watch can never be granted where the board itself is not.
    if (!(await canSeeBoard(userId, board))) {
      throw new Meteor.Error('error-board-notAMember');
    }

    await watchableObj.setWatcher(userId, level);
    return true;
  },
});
