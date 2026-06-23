import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import escapeForRegex from 'escape-string-regexp';
import Boards from '/models/boards';
import CardCommentReactions from '/models/cardCommentReactions';
const { SimpleSchema } = require('/imports/simpleSchema');

// Server-side text sanitization function
function sanitizeText(text) {
  if (typeof text !== 'string') return text;
  // Strip HTML tags and return only text content.
  // Repeat replacement until stable to avoid incomplete multi-character sanitization.
  let sanitized = text;
  let previous;
  do {
    previous = sanitized;
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  } while (sanitized !== previous);
  return sanitized;
}

const CardComments = new Mongo.Collection('card_comments');

/**
 * Pure permission decision for editing/deleting a comment.
 *
 * Kept as a standalone exported function so it can be unit-tested in isolation
 * and reused by both the collection hooks (server) and the UI (client).
 *
 * @param {Object} opts
 * @param {boolean} opts.isAuthor               is the acting user the comment author?
 * @param {boolean} opts.isBoardAdmin           is the acting user a board admin?
 * @param {boolean} opts.restrictCommentEditing board setting: when true, board
 *                                               admins may NOT edit/delete comments
 *                                               authored by others.
 * @returns {boolean} whether the acting user may edit/delete the comment.
 */
export function canEditComment({ isAuthor, isBoardAdmin, restrictCommentEditing }) {
  // The author may always edit/delete their own comment.
  if (isAuthor) {
    return true;
  }
  // When editing is restricted, admins lose the ability to touch others' comments.
  if (restrictCommentEditing) {
    return false;
  }
  // Default (unrestricted) behaviour: board admins may edit/delete others' comments.
  return !!isBoardAdmin;
}

/**
 * A comment on a card
 */
CardComments.attachSchema(
  new SimpleSchema({
    boardId: {
      /**
       * the board ID
       */
      type: String,
    },
    cardId: {
      /**
       * the card ID
       */
      type: String,
    },
    // XXX Rename in `content`? `text` is a bit vague...
    text: {
      /**
       * the text of the comment
       */
      type: String,
    },
    parentId: {
      /**
       * the _id of the comment this comment is a reply to (threaded replies).
       * Optional: top-level comments have no parentId.
       */
      type: String,
      optional: true,
      defaultValue: '',
    },
    createdAt: {
      /**
       * when was the comment created
       */
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
    },
    modifiedAt: {
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
    // XXX Should probably be called `authorId`
    userId: {
      /**
       * the author ID of the comment
       */
      type: String,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return this.userId;
        }
      },
    },
  }),
);

CardComments.helpers({
  copy(newCardId, newBoardId) {
    this.cardId = newCardId;
    // #5166: when a card is copied to another board, the copied comments must
    // belong to the destination board too. Without this they kept the source
    // board's boardId, so permission checks (which key off the comment's
    // boardId) and any board-scoped queries used the wrong board. The author
    // (userId) is intentionally preserved.
    if (newBoardId) {
      this.boardId = newBoardId;
    }
    delete this._id;
    return CardComments.insertAsync(this);
  },

  user() {
    return ReactiveCache.getUser(this.userId);
  },

  // The comment this one replies to, or undefined for top-level comments.
  parentComment() {
    if (!this.parentId) {
      return undefined;
    }
    return ReactiveCache.getCardComment(this.parentId);
  },

  reactions() {
    const cardCommentReactions = ReactiveCache.getCardCommentReaction({cardCommentId: this._id});
    return !!cardCommentReactions ? cardCommentReactions.reactions : [];
  },

  toggleReaction(reactionCodepoint) {
    if (reactionCodepoint !== sanitizeText(reactionCodepoint)) {
      return false;
    } else {

      const cardCommentReactions = ReactiveCache.getCardCommentReaction({cardCommentId: this._id});
      const reactions = !!cardCommentReactions ? cardCommentReactions.reactions : [];
      const userId = Meteor.userId();
      const reaction = reactions.find(r => r.reactionCodepoint === reactionCodepoint);

      // If no reaction is set for the codepoint, add this
      if (!reaction) {
        reactions.push({ reactionCodepoint, userIds: [userId] });
      } else {

        // toggle user reaction upon previous reaction state
        const userHasReacted = reaction.userIds.includes(userId);
        if (userHasReacted) {
          reaction.userIds.splice(reaction.userIds.indexOf(userId), 1);
          if (reaction.userIds.length === 0) {
            reactions.splice(reactions.indexOf(reaction), 1);
          }
        } else {
          reaction.userIds.push(userId);
        }
      }

      // If no reaction doc exists yet create otherwise update reaction set
      if (!!cardCommentReactions) {
        return CardCommentReactions.updateAsync({ _id: cardCommentReactions._id }, { $set: { reactions } });
      } else {
        return CardCommentReactions.insertAsync({
          boardId: this.boardId,
          cardCommentId: this._id,
          cardId: this.cardId,
          reactions
        });
      }
    }
  }
});

CardComments.hookOptions.after.update = { fetchPrevious: false };

if (Meteor.isServer) {
  // Server-side enforcement of comment edit/delete permissions (issue #5906).
  //
  // The DDP `allow` rule in server/permissions/cardComments.js is the first
  // gate, but the per-board `restrictCommentEditing` setting is enforced here
  // so the rule cannot be bypassed and the decision lives next to the data.
  const assertCanMutateComment = async (userId, doc) => {
    // Server-internal operations (board copy, cleanup, migrations, etc.) run
    // without an authenticated user; do not block those here. User-initiated
    // DDP calls always carry a userId and are still gated by the allow rule.
    if (!userId) {
      return;
    }
    const isAuthor = userId === doc.userId;
    if (isAuthor) {
      return; // Authors may always edit/delete their own comments.
    }
    const board = await Boards.findOneAsync(doc.boardId);
    const isBoardAdmin = !!board && !!userId && board.hasAdmin(userId);
    const restrictCommentEditing = !!board && !!board.restrictCommentEditing;
    if (!canEditComment({ isAuthor, isBoardAdmin, restrictCommentEditing })) {
      throw new Meteor.Error(
        'error-comment-edit-not-allowed',
        "You are not allowed to edit or delete another user's comment on this board.",
      );
    }
  };

  CardComments.before.update(async (userId, doc) => {
    await assertCanMutateComment(userId, doc);
  });

  CardComments.before.remove(async (userId, doc) => {
    await assertCanMutateComment(userId, doc);
  });
}

async function commentCreation(userId, doc) {
  const card = await ReactiveCache.getCard(doc.cardId);
  if (!card) {
    console.warn('[commentCreation] Card not found for cardId:', doc.cardId, '— skipping activity insert.');
    return;
  }
  await Activities.insertAsync({
    userId,
    activityType: 'addComment',
    boardId: doc.boardId,
    cardId: doc.cardId,
    commentId: doc._id,
    listId: card.listId,
    swimlaneId: card.swimlaneId,
  });
}

CardComments.textSearch = async (userId, textArray) => {
  const selector = {
    boardId: { $in: await Boards.userBoardIds(userId) },
    $and: [],
  };

  for (const text of textArray) {
    selector.$and.push({ text: new RegExp(escapeForRegex(text), 'i') });
  }

  // eslint-disable-next-line no-console
  // console.log('cardComments selector:', selector);

  const comments = await ReactiveCache.getCardComments(selector);
  // eslint-disable-next-line no-console
  // console.log('count:', comments.count());
  // eslint-disable-next-line no-console
  // console.log('cards with comments:', comments.map(com => { return com.cardId }));

  return comments;
};

export default CardComments;
