import { Mongo } from 'meteor/mongo';
import languages from '/imports/i18n/languages';
const { SimpleSchema } = require('/imports/simpleSchema');

const Translation = new Mongo.Collection('translation');

/**
 * A Organization User in wekan
 */
Translation.attachSchema(
  new SimpleSchema({
    language: {
      /**
       * the language
       */
      type: String,
      max: 35,
      allowedValues: [...new Set(Object.values(languages).map(language => language.tag))],
    },
    text: {
      /**
       * the text
       */
      type: String,
    },
    translationText: {
      /**
       * the translation text
       */
      type: String,
      optional: true,
    },
    createdAt: {
      /**
       * creation date of the translation custom string
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
  }),
);

export default Translation;
