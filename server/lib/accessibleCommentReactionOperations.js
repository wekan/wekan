import { Meteor } from 'meteor/meteor';
import CardComments from '/models/cardComments';
import CardCommentReactions from '/models/cardCommentReactions';
import { accessibleCommentCard } from '/server/lib/accessibleCommentOperations';
import { tripCanary } from '/server/lib/canary';
const { canonicalCommentReactions, commentReaction } = require('/models/lib/commentReactionCatalog');

function refuseReaction(userId, detail) {
  tripCanary('reaction.foreign', { userId, detail });
  throw new Meteor.Error('not-authorized');
}

async function toggleAccessibleCommentReaction(userId, input) {
  const boardId = String(input?.boardId || '');
  const cardId = String(input?.cardId || '');
  const commentId = String(input?.commentId || '');
  const catalogued = commentReaction(input?.reactionCodepoint);
  if (!catalogued) refuseReaction(userId, 'submitted a comment reaction outside the fixed safe catalog');

  // Reacting is commenting: this enforces visibility, assigned-only scope and
  // the Normal / Comment-only capability before looking up any comment.
  await accessibleCommentCard(userId, boardId, cardId, true);
  const comment = await CardComments.findOneAsync({ _id: commentId, boardId, cardId });
  if (!comment) refuseReaction(userId, 'reaction comment did not belong to the submitted card and board');

  const stored = await CardCommentReactions.findOneAsync({ cardCommentId: commentId });
  if (stored && (stored.boardId !== boardId || stored.cardId !== cardId)) {
    refuseReaction(userId, 'stored reaction document crossed its comment card or board boundary');
  }
  const reactions = canonicalCommentReactions(stored?.reactions);
  const reaction = reactions.find(item => item.reactionCodepoint === catalogued.codepoint);
  if (reaction) {
    const index = reaction.userIds.indexOf(userId);
    if (index >= 0) reaction.userIds.splice(index, 1);
    else reaction.userIds.push(userId);
  } else {
    reactions.push({ reactionCodepoint: catalogued.codepoint, userIds: [userId] });
  }
  const canonical = canonicalCommentReactions(reactions);
  if (stored) {
    await CardCommentReactions.updateAsync(
      { _id: stored._id, boardId, cardId, cardCommentId: commentId },
      { $set: { reactions: canonical } },
    );
  } else {
    await CardCommentReactions.insertAsync({ boardId, cardId, cardCommentId: commentId,
      reactions: canonical });
  }
  return true;
}

export { toggleAccessibleCommentReaction };
