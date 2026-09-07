import CardCommentReactions from '/models/cardCommentReactions';
import Boards from '/models/boards';
import { allowIsBoardMemberCommentOnly } from '/server/lib/utils';
const { denyForeignReactionChange } = require('/models/lib/reactionOwnership');
import { tripCanaryDeny } from '/server/lib/canary';

// Reacting to a comment is a form of commenting, so it follows the same rule as
// CardComments.insert: members who may comment (Normal / Comment-only) are
// allowed, but ReadOnly / No-comments members are not. Previously this used bare
// allowIsBoardMember, letting read-only members add/remove reactions the UI
// hides from them (read-only-write privilege escalation class).
CardCommentReactions.allow({
  async insert(userId, doc) {
    return allowIsBoardMemberCommentOnly(userId, await Boards.findOneAsync(doc.boardId));
  },
  async update(userId, doc) {
    return allowIsBoardMemberCommentOnly(userId, await Boards.findOneAsync(doc.boardId));
  },
  async remove(userId, doc) {
    return allowIsBoardMemberCommentOnly(userId, await Boards.findOneAsync(doc.boardId));
  },
  fetch: ['boardId'],
});

// Being allowed to react is not being allowed to react AS SOMEBODY ELSE.
//
// The rule above is board membership and nothing more, and the whole reaction
// list is one field - so a member could `$set` `reactions` to anything: add a
// colleague's userId to a reaction they never made, or remove one they did.
// Same shape as GHSA-pqr4-rxgp-hv2m (REST comment delete): a per-user object
// gated only by "are you on this board". It is integrity rather than
// confidentiality - reactions are visible to the whole board already - but it
// puts words in another person's mouth.
//
// `toggleReaction()` only ever touches Meteor.userId(), so no legitimate client
// sends anything else. Refuse an update that changes any OTHER user's presence
// in any reaction, and refuse the modifier forms ($push/$pull/dotted paths) that
// cannot be checked this way and that no client uses.
CardCommentReactions.deny({
  update(userId, doc, fieldNames, modifier) {
    if (!denyForeignReactionChange(userId, doc, modifier)) return false;
    return tripCanaryDeny('reaction.foreign', { userId });
  },
  fetch: ['reactions'],
});
