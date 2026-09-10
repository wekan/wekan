import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
const { SimpleSchema } = require('/imports/simpleSchema');

const CardTextNotes = new Mongo.Collection('card_text_notes');

/**
 * A markdown text note attached to a card (GitHub issue #595): a small,
 * separate, editable block of markdown text a card can carry in addition to
 * its own description, so a card is not limited to a single description
 * field for everything it needs to say. Modeled on Checklists - a per-card
 * collection of small named sub-documents - rather than on Attachments,
 * because a text note is edited in place, not uploaded/downloaded.
 */
CardTextNotes.attachSchema(
  new SimpleSchema({
    boardId: {
      /**
       * the board ID, denormalized from the card so the board publication
       * can publish text notes with a single reactive cursor filtered by
       * boardId, the same pattern used by Checklists/CardComments/Attachments.
       */
      type: String,
    },
    cardId: {
      /**
       * the ID of the card the text note is on
       */
      type: String,
    },
    title: {
      /**
       * the title of the text note
       */
      type: String,
      defaultValue: '',
    },
    text: {
      /**
       * the markdown text of the note
       */
      type: String,
      optional: true,
      defaultValue: '',
    },
    createdAt: {
      /**
       * creation date of the text note
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
    userId: {
      /**
       * the ID of the user who created the text note
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

CardTextNotes.helpers({
  card() {
    return ReactiveCache.getCard(this.cardId);
  },
  user() {
    return ReactiveCache.getUser(this.userId);
  },
});

CardTextNotes.before.insert((userId, doc) => {
  doc.createdAt = new Date();
  if (!doc.userId) {
    doc.userId = userId;
  }
});

if (Meteor.isServer) {
  const { ensureIndex } = require('/server/lib/mongoStartup');
  Meteor.startup(async () => {
    await ensureIndex(CardTextNotes, { cardId: 1, createdAt: 1 });
    await ensureIndex(CardTextNotes, { boardId: 1 });
  });
}

export default CardTextNotes;
