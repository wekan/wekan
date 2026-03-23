import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
const { SimpleSchema } = require('/imports/simpleSchema');

const TableVisibilityModeSettings = new Mongo.Collection('tableVisibilityModeSettings');

TableVisibilityModeSettings.attachSchema(
  new SimpleSchema({
    _id: {
      type: String,
    },
    booleanValue: {
      type: Boolean,
      optional: true,
    },
    sort: {
      type: Number,
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

TableVisibilityModeSettings.helpers({
  allowPrivateOnly() {
    return TableVisibilityModeSettings.findOne('tableVisibilityMode-allowPrivateOnly').booleanValue;
  },
});

export default TableVisibilityModeSettings;
