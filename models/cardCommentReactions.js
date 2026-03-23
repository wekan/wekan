import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
const { SimpleSchema } = require('/imports/simpleSchema');

const commentReactionSchema = new SimpleSchema({
  reactionCodepoint: {
    type: String,
    optional: false,
    max: 9, // max length of reaction code
    custom() {
      if (!this.value.match(/^&#\d{4,6};$/)) { // regex for only valid reactions
        return "incorrectReactionCode";
      }
    },
  },
  userIds: { type: Array, defaultValue: [] },
  'userIds.$': { type: String }
});

const CardCommentReactions = new Mongo.Collection('card_comment_reactions');
export default CardCommentReactions;

/**
 * All reactions of a card comment
 */
CardCommentReactions.attachSchema(
  new SimpleSchema({
    boardId: {
      /**
       * the board ID
       */
      type: String,
      optional: false
    },
    cardId: {
      /**
       * the card ID
       */
      type: String,
      optional: false
    },
    cardCommentId: {
      /**
       * the card comment ID
       */
      type: String,
      optional: false
    },
    reactions: {
      type: Array,
      defaultValue: []
    },
    'reactions.$': {
      type: commentReactionSchema,
    }
  }),
);
