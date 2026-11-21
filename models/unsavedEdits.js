// This collection shouldn't be manipulated directly by instead throw the
// `UnsavedEdits` API on the client.
import { Mongo } from 'meteor/mongo';
import { createdAtAutoValue, modifiedAtAutoValue } from '/models/lib/schemaTimestamps';
const { SimpleSchema } = require('/imports/simpleSchema');

const UnsavedEditCollection = new Mongo.Collection('unsaved-edits');

UnsavedEditCollection.attachSchema(
  new SimpleSchema({
    fieldName: {
      type: String,
    },
    docId: {
      type: String,
    },
    value: {
      type: String,
    },
    userId: {
      type: String,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return this.userId;
        }
      },
    },
    createdAt: {
      type: Date,
      optional: true,
      autoValue: createdAtAutoValue,
    },
    modifiedAt: {
      type: Date,
      autoValue: modifiedAtAutoValue,
    },
  }),
);

export default UnsavedEditCollection;
