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
  // Strip HTML tags and return only text content
  return text.replace(/<[^>]*>/g, '');
}

const CardComments = new Mongo.Collection('card_comments');

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
  copy(newCardId) {
    this.cardId = newCardId;
    delete this._id;
    return CardComments.insertAsync(this);
  },

  user() {
    return ReactiveCache.getUser(this.userId);
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

async function commentCreation(userId, doc) {
  const card = await ReactiveCache.getCard(doc.cardId);
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
