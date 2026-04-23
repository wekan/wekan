// This collection shouldn't be manipulated directly by instead throw the
// `UnsavedEdits` API on the client.
import { Mongo } from 'meteor/mongo';
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

export default UnsavedEditCollection;
