import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Cards from '/models/cards';
import CardComments, { assertCanMutateComment } from '/models/cardComments';
import { allowIsBoardMemberCommentOnly } from '/server/lib/utils';
import { tripCanary } from '/server/lib/canary';
const { assignedOnlyCardScope } = require('/models/lib/boardCardScope');

const MAX_COMMENT_LENGTH = 1024 * 1024;

function cleanCommentText(value) {
  const text = String(value ?? '').trim();
  if (!text) throw new Meteor.Error('comment-required');
  if (text.length > MAX_COMMENT_LENGTH) throw new Meteor.Error('comment-too-long');
  return text;
}

function refuseCommentBoundary(userId, detail) {
  tripCanary('board.write-without-capability', { userId, detail });
  throw new Meteor.Error('not-authorized');
}

async function accessibleCommentCard(userId, boardId, cardId, needsCommentCapability) {
  if (!userId) throw new Meteor.Error('not-authorized');
  const board = await Boards.findOneAsync(String(boardId || ''));
  if (!board || !board.isVisibleBy({ _id: userId })) {
    refuseCommentBoundary(userId, 'comment board was not visible to the actor');
  }
  const assignedScope = assignedOnlyCardScope(board, userId);
  const card = await Cards.findOneAsync({
    _id: String(cardId || ''), boardId: board._id, deletedAt: null,
    ...(assignedScope || {}),
  });
  if (!card) refuseCommentBoundary(userId, 'comment card did not belong to the visible board scope');
  if (needsCommentCapability && !allowIsBoardMemberCommentOnly(userId, board)) {
    refuseCommentBoundary(userId, 'board role did not grant comment capability');
  }
  return { board, card };
}

async function createAccessibleComment(userId, input) {
  const boardId = String(input?.boardId || '');
  const cardId = String(input?.cardId || '');
  await accessibleCommentCard(userId, boardId, cardId, true);
  const text = cleanCommentText(input?.text);
  const parentId = String(input?.parentId || '');
  if (parentId && !(await CardComments.findOneAsync({ _id: parentId, boardId, cardId }))) {
    refuseCommentBoundary(userId, 'reply parent did not belong to the submitted card and board');
  }
  return CardComments.insertAsync({ boardId, cardId, text, userId, parentId });
}

async function existingAccessibleComment(userId, input) {
  const boardId = String(input?.boardId || '');
  const cardId = String(input?.cardId || '');
  await accessibleCommentCard(userId, boardId, cardId, false);
  const comment = await CardComments.findOneAsync({
    _id: String(input?.commentId || ''), boardId, cardId,
  });
  if (!comment) refuseCommentBoundary(userId, 'comment did not belong to the submitted card and board');
  try {
    await assertCanMutateComment(userId, comment);
  } catch (error) {
    tripCanary('comment.foreign-delete', { userId,
      detail: 'tried to edit or delete a comment without author or administrator permission' });
    throw error;
  }
  return comment;
}

async function updateAccessibleComment(userId, input) {
  const comment = await existingAccessibleComment(userId, input);
  await CardComments.updateAsync({ _id: comment._id, boardId: comment.boardId,
    cardId: comment.cardId }, { $set: { text: cleanCommentText(input?.text) } });
  return true;
}

async function removeAccessibleComment(userId, input) {
  const comment = await existingAccessibleComment(userId, input);
  await CardComments.removeAsync({
    _id: comment._id, boardId: comment.boardId, cardId: comment.cardId,
  });
  return true;
}

export {
  MAX_COMMENT_LENGTH,
  accessibleCommentCard,
  cleanCommentText,
  createAccessibleComment,
  removeAccessibleComment,
  updateAccessibleComment,
};
