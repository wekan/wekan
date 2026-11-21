import { Mongo } from 'meteor/mongo';
import languages from '/imports/i18n/languages';
import { createdAtAutoValue, modifiedAtAutoValue } from '/models/lib/schemaTimestamps';
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
      autoValue: createdAtAutoValue,
    },
    modifiedAt: {
      type: Date,
      autoValue: modifiedAtAutoValue,
    },
  }),
);

export default Translation;
